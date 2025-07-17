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
  timeInput = '';
  selectedAction: 'on' | 'off' = 'on';
  selectedDate = '';
  selectedTime = '';
  inputMode: 'duration' | 'datetime' = 'duration';
  showNotification = false;
  notificationMessage = '';
  notificationType: 'success' | 'error' = 'success';

  constructor(private mqttService: MqttService) {}

  private isValidTimeFormat(time: string): boolean {
    // รูปแบบที่ยอมรับ:
    // 1. เวลา (HH:MM)
    // 2. จำนวน + s/m/h
    // 3. ตัวเลขเปล่าๆ (จะถือเป็นนาที)
    const timePattern = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    const durationPattern = /^\d+[smh]$/i;
    const numberOnlyPattern = /^\d+$/;

    return timePattern.test(time.trim()) ||
           durationPattern.test(time.trim()) ||
           numberOnlyPattern.test(time.trim());
  }

  private isValidDateTime(): boolean {
    return this.selectedDate !== '' && this.selectedTime !== '';
  }

  private formatDateTime(): string {
    if (!this.selectedDate || !this.selectedTime) return '';
    
    // แปลงจาก YYYY-MM-DD เป็น DD/MM/YYYY
    const dateParts = this.selectedDate.split('-');
    const formattedDate = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;
    
    return `${formattedDate} ${this.selectedTime}`;
  }

  getPreviewCommand(): string {
    if (this.inputMode === 'duration' && this.timeInput && this.selectedAction) {
      let processedTime = this.timeInput.trim();
      if (/^\d+$/.test(processedTime)) {
        processedTime = processedTime + 'm';
      }
      return `${processedTime} ${this.selectedAction}`;
    } else if (this.inputMode === 'datetime' && this.selectedDate && this.selectedTime && this.selectedAction) {
      const formattedDateTime = this.formatDateTime();
      return `${formattedDateTime} ${this.selectedAction}`;
    }
    return '';
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
    if (this.inputMode === 'duration') {
      this.sendDurationCommand();
    } else {
      this.sendDateTimeCommand();
    }
  }

  private sendDurationCommand() {
    const trimmedTime = this.timeInput.trim();

    if (!trimmedTime) {
      this.showPopup('กรุณาใส่เวลาหรือระยะเวลา', 'error');
      return;
    }

    if (!this.isValidTimeFormat(trimmedTime)) {
      this.showPopup('รูปแบบไม่ถูกต้อง! ใช้: HH:MM หรือ 5s/5m/5h หรือ 5 (นาที)', 'error');
      return;
    }

    try {
      // ถ้าเป็นตัวเลขเปล่าๆ ให้เพิ่ม 'm' (นาที) ให้อัตโนมัติ
      let processedTime = trimmedTime;
      if (/^\d+$/.test(trimmedTime)) {
        processedTime = trimmedTime + 'm';
      }

      const fullCommand = `${processedTime} ${this.selectedAction}`;
      this.mqttService.publish('myhome/led', fullCommand);
      this.showPopup('ส่งคำสั่งสำเร็จ! 📡', 'success');
      this.timeInput = '';
    } catch (error) {
      this.showPopup('เกิดข้อผิดพลาดในการส่งคำสั่ง', 'error');
    }
  }

  private sendDateTimeCommand() {
    if (!this.isValidDateTime()) {
      this.showPopup('กรุณาเลือกวันที่และเวลา', 'error');
      return;
    }

    try {
      const formattedDateTime = this.formatDateTime();
      const fullCommand = `${formattedDateTime} ${this.selectedAction}`;
      this.mqttService.publish('myhome/led', fullCommand);
      this.showPopup('ส่งคำสั่งสำเร็จ! 📡', 'success');
      this.selectedDate = '';
      this.selectedTime = '';
    } catch (error) {
      this.showPopup('เกิดข้อผิดพลาดในการส่งคำสั่ง', 'error');
    }
  }
}
