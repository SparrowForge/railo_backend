const { io } = require('socket.io-client');

const socket = io('http://localhost:3000', {
  transports: ['polling', 'websocket'],
  auth: {
    token:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImFkbWluQHJpbGxvLmNvbSIsInN1YiI6IjE4OGRmOTFkLWY4ZjMtNDhmOS1iYjdiLWYyNTlkMzIyNTc2ZCIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc3NDI4MzYyOCwiZXhwIjoxNzc0ODg4NDI4fQ.dqWb3dTferNjVOY9GXDGFqIA5AjhGKh3Lgv-XO0ZjZ8',
  },
});

const conversation_id = 'c85a4c30-cb55-46dd-9298-f5fdf719bec1';

socket.on('connect', () => {
  console.log('✅ connected', socket.id);

  // ✅ MUST MATCH SERVER EVENT + PAYLOAD
  socket.emit('join_conversation', {
    conversation_id,
  });

  // ✅ send message (correct payload)
  // by user-1
  socket.emit('send_message', {
    conversation_id,
    text: 'Hello from Node client!',
  });

  // test loop
  // setInterval(() => {
  //   socket.emit('send_message', {
  //     conversation_id,
  //     text: `Ping at ${new Date().toISOString()}`,
  //   });
  // }, 3000);
});

// ✅ receive message
// by user-2
socket.on('new_message', (message) => {
  console.log('📩 new_message', message);

  // delivery ACK
  socket.emit('message_delivered', {
    message_id: message.id,
  });
});

// message_status_update
// by user-1
// socket.on('message_status_update', (message) => {
//   console.log('📩 message_status_update', message);
// });

// debug all events
// socket.onAny((event, ...args) => {
//   console.log('📡 debug-all-event:', event, args);
// });

// user_online
socket.on('user_online', (message) => {
  console.log('📩 user_online', message);
});

// error visibility
socket.on('connect_error', (err) => {
  console.error('❌ connect_error:', err.message);
});

socket.on('disconnect', (reason) => {
  console.log('❌ disconnected:', reason);
});
