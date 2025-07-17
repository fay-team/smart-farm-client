# Smart Farm

โปรเจค Smart Farm ควบคุมอุปกรณ์ผ่าน MQTT

## Setup การพัฒนา

1. Clone repository
2. ติดตั้ง dependencies: `npm install`
3. สร้างไฟล์ environment configuration

### Environment Configuration

คัดลอกไฟล์ template และแก้ไขค่าต่างๆ:

```bash
cp src/environments/environment.template.ts src/environments/environment.ts
cp src/environments/environment.template.ts src/environments/environment.prod.ts
```

แก้ไขไฟล์ `src/environments/environment.ts` และใส่ข้อมูล HiveMQ ของคุณ:

```typescript
export const environment = {
  production: false,
  mqtt: {
    brokerUrl: 'wss://your-hivemq-cluster.s1.eu.hivemq.cloud:8884/mqtt',
    username: 'your-username',
    password: 'your-password',
    protocol: 'wss' as const
  }
};
```

## การรัน

```bash
npm start
```

## รูปแบบคำสั่ง MQTT

- เวลา: `08:30 on`, `20:45 off`
- วินาที: `5s on`, `30s off`
- นาที: `5m on`, `30m off`
- ชั่วโมง: `2h on`, `8h off`
