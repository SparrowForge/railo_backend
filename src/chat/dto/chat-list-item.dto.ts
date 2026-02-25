import { Message } from "../entities/messages.entity";

export class ChatListItem {
    conversation_id: string;
    other_user_id: string;
    username: string;
    full_name: string;
    last_message: Message | null;
    unread_count: number;
    is_active: boolean;
}

