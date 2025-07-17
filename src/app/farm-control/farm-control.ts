import { Component } from '@angular/core';
import { MqttService } from '../service/mqtt';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-farm-control',
  imports: [FormsModule],
  templateUrl: './farm-control.html',
  styleUrl: './farm-control.scss',
  standalone: true,
  providers: [MqttService]
})
export class FarmControl {
  command = '';

  constructor(private mqttService: MqttService) {}

  send() {
    if (this.command.trim()) {
      this.mqttService.publish('myhome/led', this.command.trim());
      this.command = '';
    }
  }
}
