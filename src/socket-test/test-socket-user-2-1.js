const { io } = require('socket.io-client');
const axios = require('axios');
const readline = require('readline');

require('dotenv').config();

const userName = 'admin@rillo.com';
const password = 'p@ssword';
const chatWithUserId = 'b3965e77-3c11-491d-b783-23ca4125125d'; //a.mamun.dev@gmail.com
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function safeLog(...args) {
  process.stdout.clearLine(0);
  process.stdout.cursorTo(0);
  console.log(...args);
  rl.prompt(true);
}

async function main() {
  try {
    // Login to get token
    const loginResponse = await axios.post(
      `${process.env.WS_URL}/api/v1/auth/login`,
      {
        email: userName,
        password: password,
      },
    );
    const token = loginResponse.data.data.access_token;
    const loggedInUserId = loginResponse.data.data.user.id;
    console.log('✅ Logged in, token:', token.substring(0, 20) + '...');
    console.log('✅ Logged in, user_id:', loggedInUserId);

    // Get conversation_id
    const convResponse = await axios.post(
      `${process.env.WS_URL}/api/v1/chat/get-or-create-conversation`,
      {
        user_id: chatWithUserId,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    const conversation_id = convResponse.data.data.id;
    console.log('✅ conversation_id:', conversation_id);

    const socket = io(process.env.WS_URL, {
      transports: ['polling', 'websocket'],
      auth: {
        token: token,
      },
    });

    socket.on('connect', () => {
      console.log('✅ connected', socket.id);

      // ✅ MUST MATCH SERVER EVENT + PAYLOAD
      socket.emit('join_conversation', {
        conversation_id,
      });

      // listen for user input
      rl.setPrompt('You: ');
      rl.prompt();

      rl.on('line', (input) => {
        socket.emit('send_message', {
          conversation_id,
          text: input,
        });

        rl.prompt();
      });

      rl.on('close', () => {
        console.log('👋 exiting...');
        socket.disconnect();
        process.exit(0);
      });

      // // ✅ send message (correct payload)
      // // by user-1
      // socket.emit('send_message', {
      //   conversation_id,
      //   text: 'Hello from Node client!',
      // });

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
      safeLog('📩 new_message', message);

      // delivery ACK
      socket.emit('message_delivered', {
        message_id: message.id,
      });
    });

    // message_status_update
    // by user-1
    socket.on('message_status_update', (message) => {
      safeLog('✅', 'message_status_update', message);
    });

    // debug all events
    // socket.onAny((event, ...args) => {
    //   safeLog('📡', event, args);
    // });

    // user_online
    socket.on('user_online', (message) => {
      if (message.user_id !== loggedInUserId) {
        safeLog('📡', message);
      }
    });

    // error visibility
    socket.on('connect_error', (err) => {
      console.error('❌ connect_error:', err.message);
    });
  } catch (error) {
    console.error(error.message);
  }
}

main();
