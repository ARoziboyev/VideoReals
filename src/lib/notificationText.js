export const NOTIFICATION_TYPES = {
  follow: 'started following you',
  like: 'liked your post',
  comment: 'commented on your post',
  reply: 'replied to your comment',
  mention: 'mentioned you',
  message: 'sent you a message',
  story_like: 'liked your story',
  live: 'started a live video',
}

export function notificationLink(n, sender) {
  switch (n.type) {
    case 'follow':
    case 'story_like': return `/u/${sender?.username}`
    case 'message': return `/messages/${n.reference_id}`
    case 'live': return `/live/${n.reference_id}`
    default: return `/p/${n.reference_id}`
  }
}
