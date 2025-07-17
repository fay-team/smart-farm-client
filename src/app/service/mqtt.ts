import { Injectable } from '@angular/core';
import mqtt from 'mqtt';

@Injectable({
  providedIn: 'root'

})
export class MqttService {
  private client: mqtt.MqttClient;

  constructor() {
    this.client = mqtt.connect('wss://80785adbebb340c589cfbfb887da3259.s1.eu.hivemq.cloud:8884/mqtt', {
      username: 'rajuraju',
      password: 'Raju19857',
      protocol: 'wss'
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
