/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
    WebSocketGateway,
    SubscribeMessage,
    WebSocketServer,
    ConnectedSocket,
    MessageBody,
    OnGatewayDisconnect,
    OnGatewayConnection,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { UserPresenceService } from './services/user-presence.service';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';
import { Message } from './entities/messages.entity';
import { message_status } from 'src/common/enums/message-status.enum';

@WebSocketGateway({
    cors: {
        origin: '*',
        credentials: true,
    },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private static online_users = new Map<string, Set<string>>();

    constructor(
        @InjectRepository(User)
        private readonly userRepo: Repository<User>,

        @InjectRepository(Message)
        private readonly messageRepo: Repository<Message>,

        private readonly chatService: ChatService,

        private readonly userPresenceService: UserPresenceService,
    ) { }

    // 🔹 when client connects
    async handleConnection(client: Socket) {
        try {
            console.log('🔥 socket connected:', client.id);
            const token = client.handshake.auth?.token;
            // console.log('token: ', token)

            const user = await this.chatService.validateSocketUser(token);
            console.log('user: ', user)


            client.data.user = user;

            this.userPresenceService.addSocket(user.id, client.id);

            // notify others
            this.server.emit('user_online', { user_id: user.id, });
        } catch {
            client.disconnect();
        }
    }

    async handleDisconnect(client: Socket) {
        const user = client.data.user;
        if (!user) return;

        const isNowOffline = this.userPresenceService.removeSocket(user.id, client.id);

        if (isNowOffline) {
            this.server.emit('user_offline', { user_id: user.id });
            await this.userRepo.update(
                { id: user.id },
                { last_seen_at: new Date() },
            );
        }
    }

    // 🔹 join conversation room
    @SubscribeMessage('join_conversation')
    async handleJoinConversation(@MessageBody() data: { conversation_id: string }, @ConnectedSocket() client: Socket) {
        console.log('client.data.user: ', client.data)
        const token = client.handshake.auth?.token;
        // console.log('token: ', token)

        const user = await this.chatService.validateSocketUser(token);

        // const user_id = client.data.user.id;
        const user_id = user.id;
        console.log('user_id: ', user_id)

        await this.chatService.validateConversationAccess(
            data.conversation_id,
            user_id,
        );

        await client.join(`conversation_${data.conversation_id}`);
    }

    @SubscribeMessage('is_user_online')
    handleIsUserOnline(@MessageBody() data: { user_id: string }, @ConnectedSocket() client: Socket,) {
        client.emit('user_online_status', {
            user_id: data.user_id,
            is_online: this.userPresenceService.isUserOnline(data.user_id),
        });
    }




    // 🔹 send message
    @SubscribeMessage('send_message')
    async handleSendMessage(
        @MessageBody() data: { conversation_id: string; text: string },
        @ConnectedSocket() client: Socket,
    ) {
        // const sender_id = client.data.user.id;
        const token = client.handshake.auth?.token;
        const user = await this.chatService.validateSocketUser(token);
        const sender_id = user.id;


        // 1️⃣ save message (DB is source of truth)
        const message = await this.chatService.send_message(
            {
                conversation_id: data.conversation_id,
                text: data.text,
            },
            sender_id,
        );

        // update chat list order- updatedAt
        await this.chatService.touchConversation(data.conversation_id);

        // emit to room
        this.server
            .to(`conversation_${data.conversation_id}`)
            .emit('new_message', message);

        // 4️⃣ 🔔 PUSH NOTIFICATION LOGIC (HERE 👇)
        // await this.handlePushNotification(message, sender_id);
    }

    private async handlePushNotification(
        message: Message,
        sender_id: string,
    ) {
        const { conversation_id } = message;

        // get receiver
        const receiver_id =
            await this.chatService.getOtherUserId(
                conversation_id,
                sender_id,
            );

        // check online
        const is_online = this.userPresenceService.isUserOnline(receiver_id);

        // check room presence
        const is_in_room = this.userPresenceService.isUserInRoom(
            receiver_id,
            `conversation_${conversation_id}`,
            this.server.sockets.adapter.rooms,
        );

        // 🚨 THIS IS YOUR CONDITION
        if (!is_online || !is_in_room) {
            // check mute
            const muted = await this.chatService.isMuted(
                conversation_id,
                receiver_id,
            );

            if (!muted) {
                console.log('Sending push notification');
                // await this.notificationService.sendPushNotification(
                //     receiver_id,
                //     message,
                // );
            }
        }
    }

    @SubscribeMessage('typing_start')
    async handleTypingStart(
        @MessageBody() data: { conversation_id: string },
        @ConnectedSocket() client: Socket,
    ) {
        // const user_id = client.data.user.id;
        const token = client.handshake.auth?.token;
        const user = await this.chatService.validateSocketUser(token);
        const user_id = user.id;

        await this.chatService.validateConversationAccess(
            data.conversation_id,
            user_id,
        );

        client
            .to(`conversation_${data.conversation_id}`)
            .emit('user_typing', {
                conversation_id: data.conversation_id,
                user_id,
                typing: true,
            });
    }

    @SubscribeMessage('typing_stop')
    async handleTypingStop(
        @MessageBody() data: { conversation_id: string },
        @ConnectedSocket() client: Socket,
    ) {
        // const user_id = client.data.user.id;
        const token = client.handshake.auth?.token;
        const user = await this.chatService.validateSocketUser(token);
        const user_id = user.id;

        await this.chatService.validateConversationAccess(
            data.conversation_id,
            user_id,
        );

        client
            .to(`conversation_${data.conversation_id}`)
            .emit('user_typing', {
                conversation_id: data.conversation_id,
                user_id,
                typing: false,
            });
    }


    @SubscribeMessage('message_delivered')
    async handleMessageDelivered(
        @MessageBody() data: { message_id: string },
        @ConnectedSocket() client: Socket,
    ) {
        console.log('message_delivered id', data.message_id)
        // const user_id = client.data.user.id;
        const token = client.handshake.auth?.token;
        const user = await this.chatService.validateSocketUser(token);
        const user_id = user.id;

        const message = await this.messageRepo.findOneBy({
            id: data.message_id,
        });
        console.log('message', message)
        if (!message) {
            console.log('Message not found')
            return;
        }
        if (message.sender_id === user_id) return;  //user-2 will tigger this event only
        if (message.status !== message_status.sent) return;

        await this.messageRepo.update(
            { id: message.id },
            { status: message_status.delivered },
        );
        console.log('message delivered');

        this.server
            .to(`conversation_${message.conversation_id}`)
            .emit('message_status_update', {
                message_id: message.id,
                status: message_status.delivered,
            });
    }


    @SubscribeMessage('mark_read')
    async handleMarkRead(
        @MessageBody() data: { conversation_id: string },
        @ConnectedSocket() client: Socket,
    ) {
        // const user_id = client.data.user.id;
        const token = client.handshake.auth?.token;
        const user = await this.chatService.validateSocketUser(token);
        const user_id = user.id;

        await this.chatService.validateConversationAccess(
            data.conversation_id,
            user_id,
        );

        await this.chatService.markConversationAsRead(
            data.conversation_id,
            user_id,
        );

        await this.chatService.markMessagesAsRead(
            data.conversation_id,
            user_id,
        );

        this.server
            .to(`conversation_${data.conversation_id}`)
            .emit('message_status_update', {
                conversation_id: data.conversation_id,
                status: 'read',
                reader_id: user_id,
            });
    }



}
