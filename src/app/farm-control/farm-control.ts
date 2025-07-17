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
  selectedAction: 'on' | 'off' = 'on';
  selectedDate = '';
  selectedTime = '';
  showNotification = false;
  notificationMessage = '';
  notificationType: 'success' | 'error' = 'success';

  constructor(private mqttService: MqttService) {
    // ตั้งค่า default วันที่เป็นวันปัจจุบัน
    const today = new Date();
    this.selectedDate = today.toISOString().split('T')[0]; // YYYY-MM-DD format
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
    if (this.selectedDate && this.selectedTime && this.selectedAction) {
      const formattedDateTime = this.formatDateTime();
      return `${formattedDateTime} ${this.selectedAction}`;
    }
    return '';
  }

  private showPopup(message: string, type: 'success' | 'error') {
    this.notificationMessage = message;
    this.notificationType = type;
    this.showNotification = true;

    // ซ่อน popup หลังจาก 3 วินาที
    setTimeout(() => {
      this.showNotification = false;
    }, 3000);
  }

  send() {
    if (!this.isValidDateTime()) {
      this.showPopup('กรุณาเลือกวันที่และเวลา', 'error');
      return;
    }

    try {
      const formattedDateTime = this.formatDateTime();
      const fullCommand = `${formattedDateTime} ${this.selectedAction}`;
      this.mqttService.publish('myhome/led', fullCommand);
      this.showPopup('ส่งคำสั่งสำเร็จ! 📡', 'success');
      this.selectedTime = '';
    } catch (error) {
      this.showPopup('เกิดข้อผิดพลาดในการส่งคำสั่ง', 'error');
    }
  }
}
