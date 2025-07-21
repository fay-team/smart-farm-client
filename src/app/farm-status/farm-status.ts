import { Component, OnInit, OnDestroy } from '@angular/core';
import { MqttService } from '../service/mqtt';
import { CommonModule } from '@angular/common';

interface DeviceStatus {
  device: string;
  status: 'online' | 'offline' | 'unknown';
  lastUpdate: string;
}

@Component({
  selector: 'app-farm-status',
  imports: [CommonModule],
  templateUrl: './farm-status.html',
  styleUrl: './farm-status.scss',
  standalone: true
})
export class FarmStatus implements OnInit, OnDestroy {
  devices: DeviceStatus[] = [
    { device: 'pump01', status: 'unknown', lastUpdate: '' },
    { device: 'pump02', status: 'unknown', lastUpdate: '' }
  ];
  lastUpdate = '';
  isConnected = false;
  private connectionCheckInterval: any;
  private statusSubscription: any;
  private requestStatusSubscription: any;

  constructor(private mqttService: MqttService) {}

  ngOnInit() {
    console.log('🔄 FarmStatus component initialized');

    // ตรวจสอบสถานะเชื่อมต่อเริ่มต้น
    this.isConnected = this.mqttService.isConnected();

    // ขอ status ปัจจุบันจาก service (ถ้ามี cache)
    this.loadCachedStatus();

    this.subscribeToStatus();

    // ขอ status ปัจจุบันจาก ESP
    setTimeout(() => {
      if (this.isConnected) {
        this.requestCurrentStatus();
      }
    }, 1000);

    // ตรวจสอบสถานะการเชื่อมต่อทุกๆ 2 วินาที
    this.connectionCheckInterval = setInterval(() => {
      const currentStatus = this.mqttService.isConnected();
      if (this.isConnected !== currentStatus) {
        this.isConnected = currentStatus;
        console.log('🔄 MQTT connection status updated:', this.isConnected ? 'Connected' : 'Disconnected');

        // ถ้าเชื่อมต่อใหม่ให้ subscribe อีกครั้ง
        if (this.isConnected) {
          this.subscribeToStatus();
        }
      }
    }, 2000);
  }

  ngOnDestroy() {
    console.log('🔄 FarmStatus component destroyed');

    if (this.statusSubscription) {
      this.statusSubscription.unsubscribe();
    }
    if (this.requestStatusSubscription) {
      this.requestStatusSubscription.unsubscribe();
    }

    // ล้าง interval
    if (this.connectionCheckInterval) {
      clearInterval(this.connectionCheckInterval);
    }
  }

  private loadCachedStatus() {
    // ลองดึงข้อมูล status ล่าสุดจาก localStorage หรือ service
    const cachedStatus = localStorage.getItem('pump-status');
    if (cachedStatus) {
      try {
        const status = JSON.parse(cachedStatus);
        this.devices = status.devices || this.devices;
        this.lastUpdate = status.lastUpdate || '';
        console.log('📱 Loaded cached pump status:', this.devices);
      } catch (error) {
        console.log('⚠️ Failed to load cached status');
      }
    }
  }

  private requestCurrentStatus() {
    // ส่งคำขอให้ ESP ส่ง status ปัจจุบัน
    console.log('📤 Requesting current pump status...');
    this.mqttService.publish('myhome/request/status', JSON.stringify({
      action: 'get_status',
      timestamp: new Date().toISOString()
    }));
  }

  private subscribeToStatus() {
    // ยกเลิก subscription เก่าก่อน
    if (this.statusSubscription) {
      this.statusSubscription.unsubscribe();
    }
    if (this.requestStatusSubscription) {
      this.requestStatusSubscription.unsubscribe();
    }

    // Subscribe to regular status updates
    this.statusSubscription = this.mqttService.subscribe('myhome/status', (topic: string, message: string) => {
      console.log("📥 Received status message:", message);
      this.handleStatusMessage(message);
    });

    this.mqttService.onConnect(() => {
      this.isConnected = true;
      console.log('🔗 MQTT Connected - requesting current status');
      // เมื่อเชื่อมต่อใหม่ให้ขอ status ปัจจุบัน
      setTimeout(() => this.requestCurrentStatus(), 500);
    });

    this.mqttService.onDisconnect(() => {
      this.isConnected = false;
      console.log('📵 MQTT Disconnected');
    });
  }

  private handleStatusMessage(message: string) {
    try {
      const data = JSON.parse(message);

      // รับข้อมูล status ของปั้ม
      if (data.name && data.status) {
        console.log(`📊 Status update: ${data.name} -> ${data.status}`);
        this.updatePumpStatus(data.name, data.status);
      } else if (data.device && data.status) {
        // รองรับ format เดิม
        console.log(`📊 Status update: ${data.device} -> ${data.status}`);
        this.updatePumpStatus(data.device, data.status);
      }
    } catch (error) {
      console.log('📋 Raw message (not JSON):', message);

      // ถ้าเป็น format ธรรมดา เช่น "pump01 status online"
      const parts = message.split(' ');
      if (parts.length >= 3 && parts[1] === 'status') {
        const pumpName = parts[0];
        const status = parts[2];
        console.log(`📊 Raw status update: ${pumpName} -> ${status}`);
        this.updatePumpStatus(pumpName, status);
      }
    }
  }

  private updatePumpStatus(pumpName: string, status: string) {
    // รองรับเฉพาะ pump01 และ pump02
    if (pumpName !== 'pump01' && pumpName !== 'pump02') {
      console.log(`⚠️ Unknown pump: ${pumpName}`);
      return;
    }

    const pumpStatus: 'online' | 'offline' | 'unknown' =
      status === 'online' ? 'online' :
      status === 'offline' ? 'offline' : 'unknown';

    const pumpIndex = this.devices.findIndex(d => d.device === pumpName);

    if (pumpIndex >= 0) {
      // อัปเดตสถานะปั้ม
      this.devices[pumpIndex].status = pumpStatus;
      this.devices[pumpIndex].lastUpdate = new Date().toLocaleString('th-TH');

      console.log(`🔄 Updated ${pumpName} status to: ${pumpStatus}`);
    }

    // อัปเดต lastUpdate ทั่วไป
    this.lastUpdate = new Date().toLocaleString('th-TH');

    // บันทึกลง localStorage
    this.saveStatusToCache();
  }

  private saveStatusToCache() {
    const statusData = {
      devices: this.devices,
      lastUpdate: this.lastUpdate
    };
    localStorage.setItem('pump-status', JSON.stringify(statusData));
  }

  getConnectionIcon(): string {
    return this.isConnected ? '📡' : '📵';
  }

  getConnectionText(): string {
    return this.isConnected ? 'เชื่อมต่อ MQTT' : 'ขาดการเชื่อมต่อ';
  }

  getDeviceIcon(status: 'online' | 'offline' | 'unknown'): string {
    switch (status) {
      case 'online': return '🟢';
      case 'offline': return '🔴';
      default: return '🟡';
    }
  }

  getDeviceStatusText(status: 'online' | 'offline' | 'unknown'): string {
    switch (status) {
      case 'online': return 'ออนไลน์';
      case 'offline': return 'ออฟไลน์';
      default: return 'ไม่ทราบสถานะ';
    }
  }

  getDeviceDisplayName(device: string): string {
    // แสดงชื่อปั้มเป็นภาษาไทย
    const deviceNames: { [key: string]: string } = {
      'pump01': 'ปั๊มน้ำ 1',
      'pump02': 'ปั๊มน้ำ 2'
    };

    return deviceNames[device] || device;
  }
}
