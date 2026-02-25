export enum NotificationType {
  PushNotifications = 'Push Notifications',
  Email = 'Email',
  Both = 'Both',
}

export const NotificationTypeData = [
  {
    value: NotificationType.PushNotifications,
    label: NotificationType.PushNotifications,
  },
  { value: NotificationType.Email, label: NotificationType.Email },
  { value: NotificationType.Both, label: NotificationType.Both },
];
