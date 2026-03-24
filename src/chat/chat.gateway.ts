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
import { NotificationService } from 'src/notifications/notifications.service';

@WebSocketGateway({
    cors: {
        origin: '*',
    },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    constructor(
        @InjectRepository(User)
        private readonly userRepo: Repository<User>,

        @InjectRepository(Message)
        private readonly messageRepo: Repository<Message>,

        private readonly chatService: ChatService,

        private readonly userPresenceService: UserPresenceService,
        private readonly notificationService: NotificationService,
    ) { }

    private getSocketToken(client: Socket): string | undefined {
        const authToken = client.handshake.auth?.token;
        if (typeof authToken === 'string' && authToken.trim()) {
            return authToken;
        }

        const authorization = client.handshake.headers.authorization;
        if (typeof authorization === 'string' && authorization.startsWith('Bearer ')) {
            return authorization.slice(7).trim();
        }

        const accessTokenHeader = client.handshake.headers['x-access-token'];
        if (typeof accessTokenHeader === 'string' && accessTokenHeader.trim()) {
            return accessTokenHeader.trim();
        }

        const queryToken = client.handshake.query.token;
        if (typeof queryToken === 'string' && queryToken.trim()) {
            return queryToken.trim();
        }

        return undefined;
    }

    async handleConnection(client: Socket) {
        try {
            const token = this.getSocketToken(client);
            const user = await this.chatService.validateSocketUser(token);

            client.data.user = user;
            this.userPresenceService.addSocket(user.id, client.id);
            this.server.emit('user_online', { user_id: user.id });
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

    @SubscribeMessage('join_conversation')
    async handleJoinConversation(
        @MessageBody() data: { conversation_id: string },
        @ConnectedSocket() client: Socket,
    ) {
        const token = this.getSocketToken(client);
        const user = await this.chatService.validateSocketUser(token);

        await this.chatService.validateConversationAccess(
            data.conversation_id,
            user.id,
        );

        await client.join(`conversation_${data.conversation_id}`);
        client.emit('socket_response', data);
    }

    @SubscribeMessage('is_user_online')
    handleIsUserOnline(
        @MessageBody() data: { user_id: string },
        @ConnectedSocket() client: Socket,
    ) {
        client.emit('socket_response', data);
        client.emit('user_online_status', {
            user_id: data.user_id,
            is_online: this.userPresenceService.isUserOnline(data.user_id),
        });
    }

    @SubscribeMessage('send_message')
    async handleSendMessage(
        @MessageBody() data: { conversation_id: string; text: string; reply_to_message_id?: string; file_ids?: number[] },
        @ConnectedSocket() client: Socket,
    ) {
        const token = this.getSocketToken(client);
        const user = await this.chatService.validateSocketUser(token);
        const sender_id = user.id;

        const message = await this.chatService.send_message(
            {
                conversation_id: data.conversation_id,
                text: data.text,
                reply_to_message_id: data.reply_to_message_id,
                file_ids: data.file_ids,
            },
            sender_id,
        );

        await this.chatService.touchConversation(message.conversation_id);

        client.emit('socket_response', message);
        client
            .to(`conversation_${message.conversation_id}`)
            .emit('new_message', message);

        this.handlePushNotification(message, sender_id).catch(console.error);
    }

    private async handlePushNotification(
        message: Message,
        sender_id: string,
    ) {
        const recipientIds = await this.chatService.getConversationRecipientIds(
            message.conversation_id,
            sender_id,
        );

        for (const recipientId of recipientIds) {
            const is_online = this.userPresenceService.isUserOnline(recipientId);
            const is_in_room = this.userPresenceService.isUserInRoom(
                recipientId,
                `conversation_${message.conversation_id}`,
                this.server.sockets.adapter.rooms,
            );

            if (is_online && is_in_room) {
                continue;
            }

            const muted = await this.chatService.isMuted(
                message.conversation_id,
                recipientId,
            );

            if (muted) {
                continue;
            }

            await this.notificationService.sendNotificationToUser({
                userId: recipientId,
                title: 'New message',
                body: message.text,
                payload: {
                    conversation_id: message.conversation_id,
                    message_id: message.id,
                    sender_id,
                },
            });
        }
    }

    @SubscribeMessage('typing_start')
    async handleTypingStart(
        @MessageBody() data: { conversation_id: string },
        @ConnectedSocket() client: Socket,
    ) {
        const token = this.getSocketToken(client);
        const user = await this.chatService.validateSocketUser(token);

        await this.chatService.validateConversationAccess(
            data.conversation_id,
            user.id,
        );

        client
            .to(`conversation_${data.conversation_id}`)
            .emit('user_typing', {
                conversation_id: data.conversation_id,
                user_id: user.id,
                typing: true,
            });
        client.emit('socket_response', {
            conversation_id: data.conversation_id,
            user_id: user.id,
            typing: true,
        });
    }

    @SubscribeMessage('typing_stop')
    async handleTypingStop(
        @MessageBody() data: { conversation_id: string },
        @ConnectedSocket() client: Socket,
    ) {
        const token = this.getSocketToken(client);
        const user = await this.chatService.validateSocketUser(token);

        await this.chatService.validateConversationAccess(
            data.conversation_id,
            user.id,
        );

        client
            .to(`conversation_${data.conversation_id}`)
            .emit('user_typing', {
                conversation_id: data.conversation_id,
                user_id: user.id,
                typing: false,
            });
        client.emit('socket_response', {
            conversation_id: data.conversation_id,
            user_id: user.id,
            typing: false,
        });
    }

    @SubscribeMessage('message_delivered')
    async handleMessageDelivered(
        @MessageBody() data: { message_id: string },
        @ConnectedSocket() client: Socket,
    ) {
        const token = this.getSocketToken(client);
        const user = await this.chatService.validateSocketUser(token);
        const user_id = user.id;

        const message = await this.messageRepo.findOneBy({
            id: data.message_id,
        });
        if (!message) {
            return;
        }

        if (message.sender_id === user_id) return;
        if (message.status !== message_status.sent) return;

        await this.messageRepo.update(
            { id: message.id },
            { status: message_status.delivered },
        );

        this.server
            .to(`conversation_${message.conversation_id}`)
            .emit('message_status_update', {
                message_id: message.id,
                status: message_status.delivered,
            });
        client.emit('socket_response', {
            message_id: message.id,
            status: message_status.delivered,
        });
    }

    @SubscribeMessage('mark_read')
    async handleMarkRead(
        @MessageBody() data: { conversation_id: string },
        @ConnectedSocket() client: Socket,
    ) {
        const token = this.getSocketToken(client);
        const user = await this.chatService.validateSocketUser(token);

        await this.chatService.validateConversationAccess(
            data.conversation_id,
            user.id,
        );

        await this.chatService.markConversationAsRead(
            data.conversation_id,
            user.id,
        );

        await this.chatService.markMessagesAsRead(
            data.conversation_id,
            user.id,
        );

        this.server
            .to(`conversation_${data.conversation_id}`)
            .emit('message_status_update', {
                conversation_id: data.conversation_id,
                status: 'read',
                reader_id: user.id,
            });

        client.emit('socket_response', {
            conversation_id: data.conversation_id,
            status: 'read',
            reader_id: user.id,
        });
    }
}
