import { Injectable } from '@angular/core';
import mqtt from 'mqtt';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'

})
export class MqttService {
  private client: mqtt.MqttClient;
  private subscriptions: Map<string, (topic: string, message: string) => void> = new Map();
  private connectCallbacks: (() => void)[] = [];
  private disconnectCallbacks: (() => void)[] = [];

  constructor() {
    this.client = mqtt.connect(environment.mqtt.brokerUrl, {
      username: environment.mqtt.username,
      password: environment.mqtt.password,
      protocol: environment.mqtt.protocol
    });

    this.client.on('connect', () => {
      console.log('✅ Connected to HiveMQ Cloud');
      // เรียก callbacks ทั้งหมดที่ลงทะเบียนไว้
      this.connectCallbacks.forEach(callback => callback());
    });

    this.client.on('error', (err: Error) => {
      console.error('❌ MQTT Error:', err);
    });

    this.client.on('disconnect', () => {
      console.log('🔌 Disconnected from MQTT');
      // เรียก disconnect callbacks
      this.disconnectCallbacks.forEach(callback => callback());
    });

    this.client.on('message', (topic: string, message: Buffer) => {
      const messageStr = message.toString();
      console.log(`📥 Received from ${topic}: ${messageStr}`);

      // Call subscription callback if exists
      const callback = this.subscriptions.get(topic);
      if (callback) {
        callback(topic, messageStr);
      }
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

  subscribe(topic: string, callback: (topic: string, message: string) => void) {
    if (this.client.connected) {
      this.client.subscribe(topic, (err) => {
        if (err) {
          console.error(`❌ Subscribe error for ${topic}:`, err);
        } else {
          console.log(`📬 Subscribed to ${topic}`);
          this.subscriptions.set(topic, callback);
        }
      });
    } else {
      // If not connected yet, wait for connection
      this.client.on('connect', () => {
        this.client.subscribe(topic, (err) => {
          if (err) {
            console.error(`❌ Subscribe error for ${topic}:`, err);
          } else {
            console.log(`📬 Subscribed to ${topic}`);
            this.subscriptions.set(topic, callback);
          }
        });
      });
    }
  }

  unsubscribe(topic: string) {
    this.client.unsubscribe(topic, (err) => {
      if (err) {
        console.error(`❌ Unsubscribe error for ${topic}:`, err);
      } else {
        console.log(`📭 Unsubscribed from ${topic}`);
        this.subscriptions.delete(topic);
      }
    });
  }

  onConnect(callback: () => void) {
    // เพิ่ม callback ลงใน array
    this.connectCallbacks.push(callback);

    // ถ้าเชื่อมต่ออยู่แล้ว ให้เรียก callback ทันที
    if (this.client.connected) {
      callback();
    }
  }

  onDisconnect(callback: () => void) {
    // เพิ่ม callback ลงใน array
    this.disconnectCallbacks.push(callback);
  }

  isConnected(): boolean {
    return this.client.connected;
  }
}
