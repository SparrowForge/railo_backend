import { Message } from "../entities/messages.entity";
import { chat_request_status } from "src/common/enums/chat-request.enum";

export class ChatListItem {
    conversation_id: string;
    other_user_id: string;
    username: string;
    full_name: string;
    last_message: Message | null;
    unread_count: number;
    is_active: boolean;
    request_id?: string;
    request_status?: chat_request_status;
    location: string;
    area: string;
    city: string;
    state: string;
    country: string;
    profile_image: string;
}

