const { io } = require('socket.io-client');

const socket = io('http://localhost:3000', {
  transports: ['polling', 'websocket'],
  auth: {
    token:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImFkbWluQHJpbGxvLmNvbSIsInN1YiI6ImZlZWZmMjAxLTI3YTQtNDY3My04NTAxLWE5YTI5YWU0NzdhNSIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzY5Nzc3MTU3LCJleHAiOjE3NzAzODE5NTd9.sHPTbhKZImp8dFG2tf2p6uZeh75e9VVmwGkXnhK1Z8E',
  },
});

const conversation_id = '1e30a1cf-5c3f-408c-aca6-20a442921990';

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

  // // test loop
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
socket.on('message_status_update', (message) => {
  console.log('📩 message_status_update', message);
});

// debug all events
socket.onAny((event, ...args) => {
  console.log('📡 debug-all-event:', event, args);
});

// user_online
socket.on('user_online', (message) => {
  console.log('📩 user_online', message);
});

// error visibility
socket.on('connect_error', (err) => {
  console.error('❌ connect_error:', err.message);
});
