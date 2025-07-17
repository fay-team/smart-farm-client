export const environment = {
  production: false,
  mqtt: {
    brokerUrl: 'wss://your-hivemq-url:8884/mqtt',
    username: 'your-username',
    password: 'your-password',
    protocol: 'wss' as const
  }
};
