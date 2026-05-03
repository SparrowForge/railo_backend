import { NotificationTypeEnum } from "./notification-type.enum";

export const NotificationOptions:
    Record<NotificationTypeEnum,
        {
            title: (context?: string) => string,
            body: (context?: string) => string,
            payload: (record?: Record<string, string>) => Record<string, string>,
        }> = {
    [NotificationTypeEnum.NewPost]: {
        title: (context?: string) => context ?? 'New Post',
        body: (context?: string) => `New post form ${context ?? ''}`,
        payload: (record?: Record<string, string>) => ({ type: 'post', ...record }),
    },
    [NotificationTypeEnum.PostLike]: {
        title: (context?: string) => context ?? 'Post like',
        body: (context?: string) => `Post liked by ${context ?? ''}`,
        payload: (record?: Record<string, string>) => ({ type: 'post', ...record }),
    },
    [NotificationTypeEnum.PostComment]: {
        title: (context?: string) => context ?? 'New Comments',
        body: (context?: string) => `New comments on this post ${context ?? ''}`,
        payload: (record?: Record<string, string>) => ({ type: 'post', ...record }),
    },
    [NotificationTypeEnum.NewMessage]: {
        title: (context?: string) => context ?? 'New Message',
        body: (context?: string) => `New message form ${context ?? ''}`,
        payload: (record?: Record<string, string>) => ({ type: 'message', ...record }),
    },
    [NotificationTypeEnum.PostShare]: {
        title: (context?: string) => context ?? 'Post shared',
        body: (context?: string) => `Post shared by ${context ?? ''}`,
        payload: (record?: Record<string, string>) => ({ type: 'post', ...record }),
    }
}