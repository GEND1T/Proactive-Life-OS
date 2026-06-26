import { ref, watch } from 'vue'

const defaultNotifications = [
  {
    id: 'notif-001',
    title: 'Keuangan Melebihi Budget',
    message: 'Pengeluaran Makanan hari ini sudah mencapai Rp 85.000 (85% dari budget harian Rp 100.000).',
    time: '10 menit lalu',
    unread: true,
    type: 'warning',
    category: 'finance'
  },
  {
    id: 'notif-002',
    title: 'Mi Band Sync Sukses',
    message: 'Data tidur semalam berhasil disinkronisasi: 7 jam 15 menit (Deep sleep: 2 jam 5 menit).',
    time: '2 jam lalu',
    unread: true,
    type: 'success',
    category: 'health'
  },
  {
    id: 'notif-003',
    title: 'Jadwal Hari Ini',
    message: 'Anda memiliki 3 agenda hari ini. Agenda terdekat: "Praktikum AI" pukul 13:00.',
    time: '4 jam lalu',
    unread: false,
    type: 'info',
    category: 'calendar'
  },
  {
    id: 'notif-004',
    title: 'Evaluasi Mingguan AI',
    message: 'Laporan mingguan AI Anda sudah siap. Waktu produktif coding Anda naik 15% minggu ini!',
    time: '1 hari lalu',
    unread: false,
    type: 'success',
    category: 'system'
  }
]

const stored = localStorage.getItem('life_os_notifications')
export const notifications = ref(stored ? JSON.parse(stored) : defaultNotifications)

watch(notifications, (newVal) => {
  localStorage.setItem('life_os_notifications', JSON.stringify(newVal))
}, { deep: true })

export function markAllAsRead() {
  notifications.value = notifications.value.map(n => ({ ...n, unread: false }))
}

export function deleteNotification(id) {
  notifications.value = notifications.value.filter(n => n.id !== id)
}

export function addNotification(title, message, type = 'info', category = 'system') {
  notifications.value.unshift({
    id: 'notif-' + Date.now(),
    title,
    message,
    time: 'Baru saja',
    unread: true,
    type,
    category
  })
}
