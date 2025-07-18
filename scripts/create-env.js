const fs = require('fs');
const path = require('path');

// Create environments directory if it doesn't exist
const envDir = path.join(__dirname, '..', 'src', 'environments');
if (!fs.existsSync(envDir)) {
  fs.mkdirSync(envDir, { recursive: true });
}

// Get environment variables from Vercel or use defaults
const brokerUrl = process.env.MQTT_BROKER_URL || 'wss://broker.hivemq.com:8884/mqtt';
const username = process.env.MQTT_USERNAME || 'your_username';
const password = process.env.MQTT_PASSWORD || 'your_password';

// Create environment.ts content
const envContent = `export const environment = {
  production: true,
  mqtt: {
    brokerUrl: '${brokerUrl}',
    username: '${username}',
    password: '${password}',
    protocol: 'wss' as const
  }
};`;

// Write environment files
fs.writeFileSync(path.join(envDir, 'environment.ts'), envContent);
fs.writeFileSync(path.join(envDir, 'environment.development.ts'), envContent.replace('production: true', 'production: false'));

console.log('Environment files created successfully');
