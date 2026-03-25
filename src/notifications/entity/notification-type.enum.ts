export enum NotificationTypeEnum {
    NewPost = "NewPost",
    PostLike = "PostLike",
    PostShare = "PostShare",
    PostComment = "PostComment",
    NewMessage = "NewMessage"
}

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
        payload: (record?: Record<string, string>) => ({ onPress: 'handleNewPostOnPress', ...record }),
    },
    [NotificationTypeEnum.PostLike]: {
        title: (context?: string) => context ?? 'Post like',
        body: (context?: string) => `Post liked by ${context ?? ''}`,
        payload: (record?: Record<string, string>) => ({ onPress: 'handlePostLikeOnPress', ...record }),
    },
    [NotificationTypeEnum.PostComment]: {
        title: (context?: string) => context ?? 'New Comments',
        body: (context?: string) => `New comments on this post ${context ?? ''}`,
        payload: (record?: Record<string, string>) => ({ onPress: 'handlePostCommentOnPress', ...record }),
    },
    [NotificationTypeEnum.NewMessage]: {
        title: (context?: string) => context ?? 'New Message',
        body: (context?: string) => `New message form ${context ?? ''}`,
        payload: (record?: Record<string, string>) => ({ onPress: 'handleNewMessageOnPress', ...record }),
    },
    [NotificationTypeEnum.PostShare]: {
        title: (context?: string) => context ?? 'Post shared',
        body: (context?: string) => `Post shared by ${context ?? ''}`,
        payload: (record?: Record<string, string>) => ({ onPress: 'handlePostShareOnPress', ...record }),
    }
}