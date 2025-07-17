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
  devices: DeviceStatus[] = [];
  boardStatus: 'online' | 'offline' | 'unknown' = 'unknown';
  lastUpdate = '';
  isConnected = false;
  private connectionCheckInterval: any;

  constructor(private mqttService: MqttService) {}

  ngOnInit() {
    // ตรวจสอบสถานะเชื่อมต่อเริ่มต้น
    this.isConnected = this.mqttService.isConnected();
    
    this.subscribeToStatus();
    
    // ตรวจสอบสถานะการเชื่อมต่อทุกๆ 2 วินาที
    this.connectionCheckInterval = setInterval(() => {
      const currentStatus = this.mqttService.isConnected();
      if (this.isConnected !== currentStatus) {
        this.isConnected = currentStatus;
        console.log('🔄 MQTT connection status updated:', this.isConnected ? 'Connected' : 'Disconnected');
      }
    }, 2000);
  }

  ngOnDestroy() {
    this.mqttService.unsubscribe('myhome/status');
    
    // ล้าง interval
    if (this.connectionCheckInterval) {
      clearInterval(this.connectionCheckInterval);
    }
  }

  private subscribeToStatus() {
    this.mqttService.subscribe('myhome/status', (topic: string, message: string) => {
      console.log("📥 Received status message:", message);

      this.handleStatusMessage(message);
    });

    this.mqttService.onConnect(() => {
      this.isConnected = true;
    });

    this.mqttService.onDisconnect(() => {
      this.isConnected = false;
      this.boardStatus = 'offline';
    });
  }

  private handleStatusMessage(message: string) {
    try {
      const data = JSON.parse(message);

      // ถ้ามี device ระบุมาด้วย
      if (data.device && data.status) {
        this.updateDeviceStatus(data.device, data.status);
      } else if (data.status) {
        // ถ้าไม่มี device ให้ถือว่าเป็น board status
        this.boardStatus = data.status === 'online' ? 'online' : 'offline';
        this.lastUpdate = new Date().toLocaleString('th-TH');
      }
    } catch (error) {
      // ถ้าไม่ใช่ JSON ให้ใช้ message โดยตรง
      if (message.toLowerCase().includes('online')) {
        this.boardStatus = 'online';
      } else if (message.toLowerCase().includes('offline')) {
        this.boardStatus = 'offline';
      }
      this.lastUpdate = new Date().toLocaleString('th-TH');
    }
  }

  private updateDeviceStatus(deviceName: string, status: string) {
    const deviceStatus: 'online' | 'offline' | 'unknown' =
      status === 'online' ? 'online' :
      status === 'offline' ? 'offline' : 'unknown';

    const existingDeviceIndex = this.devices.findIndex(d => d.device === deviceName);

    if (existingDeviceIndex >= 0) {
      // อัปเดตอุปกรณ์ที่มีอยู่
      this.devices[existingDeviceIndex].status = deviceStatus;
      this.devices[existingDeviceIndex].lastUpdate = new Date().toLocaleString('th-TH');
    } else {
      // เพิ่มอุปกรณ์ใหม่
      this.devices.push({
        device: deviceName,
        status: deviceStatus,
        lastUpdate: new Date().toLocaleString('th-TH')
      });
    }

    // อัปเดต lastUpdate ทั่วไป
    this.lastUpdate = new Date().toLocaleString('th-TH');
  }

  getStatusIcon(): string {
    switch (this.boardStatus) {
      case 'online': return '🟢';
      case 'offline': return '🔴';
      default: return '🟡';
    }
  }

  getStatusText(): string {
    switch (this.boardStatus) {
      case 'online': return 'ออนไลน์';
      case 'offline': return 'ออฟไลน์';
      default: return 'ไม่ทราบสถานะ';
    }
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
    // แปลงชื่ออุปกรณ์เป็นภาษาไทยหรือชื่อที่อ่านง่าย
    const deviceNames: { [key: string]: string } = {
      'pump01': 'ปั๊มน้ำ 1',
      'pump02': 'ปั๊มน้ำ 2',
      'pump03': 'ปั๊มน้ำ 3',
      'sensor01': 'เซ็นเซอร์ 1',
      'sensor02': 'เซ็นเซอร์ 2',
      'fan01': 'พัดลม 1',
      'fan02': 'พัดลม 2',
      'light01': 'ไฟ 1',
      'light02': 'ไฟ 2'
    };

    return deviceNames[device] || device;
  }
}
