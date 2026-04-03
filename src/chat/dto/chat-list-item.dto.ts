import { Message } from "../entities/messages.entity";
import { chat_request_status } from "src/common/enums/chat-request.enum";
import { Point } from "typeorm";

export class ChatListItem {
    conversation_id: string;
    is_pinned: boolean;
    type: string;
    title: string | null;
    image_url: string | null;
    other_user_id: string | null;
    username: string | null;
    full_name: string | null;
    participant_count: number;
    last_message: Message | null;
    unread_count: number;
    is_read: boolean;
    is_active: boolean;
    request_id: string | null;
    request_status: chat_request_status;
    location: Point | null;
    area: string | null;
    city: string | null;
    state: string | null;
    country: string | null;
    profile_image: string | null;
}

