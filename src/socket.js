// src/socket.js
import { io } from 'socket.io-client';

const socket = io('https://payment.kediritechnopark.com', {
  transports: ['websocket'], // pastikan pakai websocket saja
  secure: true,
  reconnection: true
});

export default socket;
