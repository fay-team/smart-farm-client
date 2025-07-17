import { Injectable } from '@angular/core';
import mqtt from 'mqtt';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'

})
export class MqttService {
  private client: mqtt.MqttClient;

  constructor() {
    this.client = mqtt.connect(environment.mqtt.brokerUrl, {
      username: environment.mqtt.username,
      password: environment.mqtt.password,
      protocol: environment.mqtt.protocol
    });

    this.client.on('connect', () => {
      console.log('✅ Connected to HiveMQ Cloud');
    });

    this.client.on('error', (err: Error) => {
      console.error('❌ MQTT Error:', err);
    });
  }

  publish(topic: string, message: string) {
    if (this.client.connected) {
      this.client.publish(topic, message);
      console.log(`📤 Sent to ${topic}: ${message}`);
    } else {
      console.error('🚫 MQTT not connected');
    }
  }
}
