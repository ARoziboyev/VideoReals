import { useUIStore } from '../store/uiStore'

const dict = {
  uz: {
    home: 'Bosh sahifa', reels: 'Reels', messages: 'Xabarlar', explore: 'Kashf etish', notifications: 'Bildirishnomalar',
    create: 'Yaratish', profile: 'Profil', settings: 'Sozlamalar', live: 'Jonli efir', search: 'Qidirish',
    account: 'Hisob', privacy: 'Maxfiylik', appearance: 'Ko‘rinish', security: 'Xavfsizlik', language: 'Til',
    addAccount: 'Hisob qo‘shish', logout: 'Chiqish', uploadVideo: 'Video yuklash', createStory: 'Story yaratish',
    startLive: 'Efirni boshlash', uploadImage: 'Rasm yuklash', yourStory: 'Sizning story', following: 'Kuzatilmoqda',
    follow: 'Kuzatish', followers: 'Kuzatuvchilar', followingCount: 'Kuzatadi', posts: 'Postlar', videos: 'Videolar',
    saved: 'Saqlangan', editProfile: 'Profilni tahrirlash', message: 'Xabar yozish', dark: 'Qorong‘i', light: 'Yorug‘',
    system: 'Tizim', markAllRead: 'Hammasini o‘qish', newChat: 'Yangi chat', typeMessage: 'Xabar yozing…',
  },
  en: {
    home: 'Home', reels: 'Reels', messages: 'Messages', explore: 'Explore', notifications: 'Notifications',
    create: 'Create', profile: 'Profile', settings: 'Settings', live: 'Live', search: 'Search',
    account: 'Account', privacy: 'Privacy', appearance: 'Appearance', security: 'Security', language: 'Language',
    addAccount: 'Add account', logout: 'Log out', uploadVideo: 'Upload video', createStory: 'Create story',
    startLive: 'Start live', uploadImage: 'Upload image', yourStory: 'Your story', following: 'Following',
    follow: 'Follow', followers: 'Followers', followingCount: 'Following', posts: 'Posts', videos: 'Videos',
    saved: 'Saved', editProfile: 'Edit profile', message: 'Message', dark: 'Dark', light: 'Light',
    system: 'System', markAllRead: 'Mark all as read', newChat: 'New chat', typeMessage: 'Type a message…',
  },
  ru: {
    home: 'Главная', reels: 'Reels', messages: 'Сообщения', explore: 'Интересное', notifications: 'Уведомления',
    create: 'Создать', profile: 'Профиль', settings: 'Настройки', live: 'Эфир', search: 'Поиск',
    account: 'Аккаунт', privacy: 'Конфиденциальность', appearance: 'Оформление', security: 'Безопасность', language: 'Язык',
    addAccount: 'Добавить аккаунт', logout: 'Выйти', uploadVideo: 'Загрузить видео', createStory: 'Создать историю',
    startLive: 'Начать эфир', uploadImage: 'Загрузить фото', yourStory: 'Ваша история', following: 'Подписки',
    follow: 'Подписаться', followers: 'Подписчики', followingCount: 'Подписки', posts: 'Публикации', videos: 'Видео',
    saved: 'Сохранённое', editProfile: 'Редактировать', message: 'Написать', dark: 'Тёмная', light: 'Светлая',
    system: 'Системная', markAllRead: 'Прочитать все', newChat: 'Новый чат', typeMessage: 'Сообщение…',
  },
}

export const LANGUAGES = [
  { code: 'uz', label: 'O‘zbekcha' },
  { code: 'en', label: 'English' },
  { code: 'ru', label: 'Русский' },
]

export function useT() {
  const lang = useUIStore((s) => s.lang)
  return (key) => dict[lang]?.[key] ?? dict.en[key] ?? key
}
