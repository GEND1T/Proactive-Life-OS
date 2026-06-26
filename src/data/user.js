import { reactive } from 'vue'

const defaultUser = {
  name: 'Farhan',
  fullName: 'Farhan Rizky',
  avatar: null,
  initials: 'FR',
  greeting: 'Selamat Pagi',
  status: 'online',
  university: 'Universitas Brawijaya',
  semester: 4,
  major: 'Teknik Informatika',
}

const storedUser = localStorage.getItem('life_os_user_data')
const parsedUser = storedUser ? JSON.parse(storedUser) : defaultUser

export const user = reactive({ ...parsedUser })

export function updateUser(newData) {
  Object.assign(user, newData)
  
  // Recalculate initials
  if (newData.fullName) {
    const parts = newData.fullName.trim().split(/\s+/)
    user.initials = parts.map(p => p[0]).join('').substring(0, 2).toUpperCase()
  } else if (newData.name) {
    user.initials = newData.name.substring(0, 2).toUpperCase()
  }
  
  localStorage.setItem('life_os_user_data', JSON.stringify(user))
}

export function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 5) return 'Selamat Malam'
  if (hour < 11) return 'Selamat Pagi'
  if (hour < 15) return 'Selamat Siang'
  if (hour < 18) return 'Selamat Sore'
  return 'Selamat Malam'
}
