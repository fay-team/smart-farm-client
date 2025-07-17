import { Component } from '@angular/core';
import { MqttService } from '../service/mqtt';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-farm-control',
  imports: [FormsModule, CommonModule],
  templateUrl: './farm-control.html',
  styleUrl: './farm-control.scss',
  standalone: true,
  providers: [MqttService]
})
export class FarmControl {
  command = '';
  showNotification = false;
  notificationMessage = '';
  notificationType: 'success' | 'error' = 'success';

  constructor(private mqttService: MqttService) {}

  private isValidFormat(command: string): boolean {
    // รูปแบบที่ยอมรับ:
    // 1. เวลา (HH:MM) + on/off
    // 2. จำนวน + s/m/h + on/off
    // 3. จำนวน + s/m/h (โดยไม่ต้องมี on/off)
    const timePattern = /^([01]?[0-9]|2[0-3]):[0-5][0-9]\s+(on|off)$/i;
    const durationWithStatePattern = /^\d+[smh]\s+(on|off)$/i;
    const durationOnlyPattern = /^\d+[smh]$/i;

    return timePattern.test(command.trim()) ||
           durationWithStatePattern.test(command.trim()) ||
           durationOnlyPattern.test(command.trim());
  }  private showPopup(message: string, type: 'success' | 'error') {
    this.notificationMessage = message;
    this.notificationType = type;
    this.showNotification = true;

    // ซ่อน popup หลังจาก 3 วินาที
    setTimeout(() => {
      this.showNotification = false;
    }, 3000);
  }

  send() {
    const trimmedCommand = this.command.trim();

    if (!trimmedCommand) {
      this.showPopup('กรุณาใส่คำสั่ง', 'error');
      return;
    }

    if (!this.isValidFormat(trimmedCommand)) {
      this.showPopup('รูปแบบไม่ถูกต้อง! ใช้: HH:MM on/off หรือ 5s/5m/5h หรือ 5s on/off', 'error');
      return;
    }

    try {
      this.mqttService.publish('myhome/led', trimmedCommand);
      this.showPopup('ส่งคำสั่งสำเร็จ! 📡', 'success');
      this.command = '';
    } catch (error) {
      this.showPopup('เกิดข้อผิดพลาดในการส่งคำสั่ง', 'error');
    }
  }
}
