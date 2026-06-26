<script setup>
import { ref, reactive, computed } from 'vue'
import { useRoute } from 'vue-router'
import { 
  Bell, Sparkles, X, Trash2, Check, User, 
  Wallet, HeartPulse, Calendar, BellRing
} from 'lucide-vue-next'
import { user, getGreeting, updateUser } from '../../data/user'
import { notifications, markAllAsRead, deleteNotification } from '../../data/notifications'

const route = useRoute()
const pageTitle = computed(() => route.meta.title || 'Dashboard')
const greeting = getGreeting()

// Modal visibility states
const showNotificationsModal = ref(false)
const showProfileModal = ref(false)

// Unread count
const unreadCount = computed(() => notifications.value.filter(n => n.unread).length)

// Profile Form state
const profileForm = reactive({
  name: '',
  fullName: '',
  university: '',
  major: '',
  semester: 4
})

function openNotifications() {
  showNotificationsModal.value = true
}

function handleMarkAllAsRead() {
  markAllAsRead()
}

function handleDeleteNotification(id) {
  deleteNotification(id)
}

function getNotificationIcon(category) {
  switch(category) {
    case 'finance': return Wallet
    case 'health': return HeartPulse
    case 'calendar': return Calendar
    default: return BellRing
  }
}

function getNotificationColor(type) {
  switch(type) {
    case 'success': return 'text-success-400 bg-success-500/10'
    case 'warning': return 'text-warning-400 bg-warning-500/10'
    case 'error': return 'text-danger-400 bg-danger-500/10'
    default: return 'text-primary-400 bg-primary-500/10'
  }
}

function openProfile() {
  profileForm.name = user.name
  profileForm.fullName = user.fullName
  profileForm.university = user.university
  profileForm.major = user.major
  profileForm.semester = user.semester
  showProfileModal.value = true
}

function handleProfileSubmit() {
  updateUser({
    name: profileForm.name,
    fullName: profileForm.fullName,
    university: profileForm.university,
    major: profileForm.major,
    semester: Number(profileForm.semester)
  })
  showProfileModal.value = false
}
</script>

<template>
  <header class="fixed top-0 left-0 right-0 z-40 bg-surface-900/80 backdrop-blur-xl border-b border-white/5">
    <div class="flex items-center justify-between px-4 h-16 max-w-lg mx-auto">
      <!-- Left: Page Title -->
      <div class="flex items-center gap-2 min-w-0">
        <div class="flex items-center gap-1.5">
          <Sparkles class="w-4 h-4 text-primary-400 animate-pulse" />
          <h1 class="text-base font-semibold text-white truncate">{{ pageTitle }}</h1>
        </div>
      </div>

      <!-- Right: Notification + Avatar -->
      <div class="flex items-center gap-3">
        <!-- Notification Bell -->
        <button
          @click="openNotifications"
          class="relative p-2 rounded-xl bg-surface-800/50 hover:bg-surface-700/50 transition-colors"
          id="btn-notifications"
        >
          <Bell class="w-5 h-5 text-surface-400" />
          <span v-if="unreadCount > 0" class="absolute -top-0.5 -right-0.5 w-4 h-4 bg-danger-500 rounded-full flex items-center justify-center">
            <span class="text-[10px] font-bold text-white">{{ unreadCount }}</span>
          </span>
        </button>

        <!-- Avatar -->
        <button
          @click="openProfile"
          class="relative w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center ring-2 ring-primary-500/20 hover:ring-primary-500/40 transition-all"
          id="btn-profile"
        >
          <span class="text-xs font-bold text-white">{{ user.initials }}</span>
          <span class="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-success-500 rounded-full border-2 border-surface-900"></span>
        </button>
      </div>
    </div>
  </header>

  <!-- Modal Backdrop -->
  <transition name="fade">
    <div
      v-if="showNotificationsModal || showProfileModal"
      class="fixed inset-0 bg-black/60 backdrop-blur-sm z-[65]"
      @click="() => { showNotificationsModal = false; showProfileModal = false; }"
    ></div>
  </transition>

  <!-- Modal: Notifikasi -->
  <transition name="modal-scale">
    <div
      v-if="showNotificationsModal"
      class="fixed inset-x-4 top-[10%] bottom-[10%] max-w-md mx-auto z-[70] surface-card p-5 border border-white/5 shadow-2xl flex flex-col overflow-hidden text-left"
    >
      <!-- Modal Header -->
      <div class="flex items-center justify-between border-b border-surface-700/50 pb-3 mb-4 shrink-0">
        <div class="flex items-center gap-2">
          <div class="w-9 h-9 rounded-xl bg-primary-500/10 flex items-center justify-center">
            <Bell class="w-5 h-5 text-primary-400" />
          </div>
          <div>
            <h3 class="text-base font-bold text-white">Notifikasi</h3>
            <p class="text-[10px] text-surface-400 mt-0.5">Update dan analisis aktivitas Anda</p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <button
            v-if="unreadCount > 0"
            @click="handleMarkAllAsRead"
            class="text-[10px] font-semibold text-primary-400 bg-primary-500/10 px-2.5 py-1.5 rounded-lg hover:bg-primary-500/20 transition-colors"
          >
            Baca Semua
          </button>
          <button
            @click="showNotificationsModal = false"
            class="p-1.5 rounded-lg bg-surface-800 text-surface-400 hover:text-white"
          >
            <X class="w-4 h-4" />
          </button>
        </div>
      </div>

      <!-- Notification List -->
      <div class="flex-1 overflow-y-auto pr-1 space-y-2.5 pb-2">
        <div v-if="notifications.length === 0" class="flex flex-col items-center justify-center py-10 text-center gap-3">
          <div class="w-12 h-12 rounded-full bg-surface-800 flex items-center justify-center text-surface-400">
            <Bell class="w-6 h-6" />
          </div>
          <p class="text-sm text-surface-400">Tidak ada notifikasi baru</p>
        </div>
        <div
          v-else
          v-for="notif in notifications"
          :key="notif.id"
          class="surface-card-sm p-3.5 border border-white/5 bg-surface-800/20 backdrop-blur-md rounded-2xl flex gap-3 relative transition-all group"
          :class="notif.unread ? 'border-primary-500/15 bg-primary-500/5' : ''"
        >
          <!-- Unread indicator dot -->
          <div v-if="notif.unread" class="absolute top-3.5 right-3.5 w-2 h-2 bg-primary-500 rounded-full"></div>

          <!-- Icon container -->
          <div
            class="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            :class="getNotificationColor(notif.type)"
          >
            <component :is="getNotificationIcon(notif.category)" class="w-4.5 h-4.5" />
          </div>

          <!-- Details -->
          <div class="flex-1 min-w-0 pr-4">
            <h4 class="text-xs font-bold text-white leading-snug">{{ notif.title }}</h4>
            <p class="text-[11px] text-surface-400 mt-1 leading-relaxed">{{ notif.message }}</p>
            <span class="text-[9px] text-surface-500 mt-1.5 block font-medium">{{ notif.time }}</span>
          </div>

          <!-- Delete action -->
          <button
            @click="handleDeleteNotification(notif.id)"
            class="opacity-0 group-hover:opacity-100 absolute bottom-3.5 right-3.5 p-1 rounded-md text-surface-500 hover:text-danger-400 hover:bg-danger-500/10 transition-all"
            title="Hapus Notifikasi"
          >
            <Trash2 class="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  </transition>

  <!-- Modal: Edit Profil -->
  <transition name="modal-scale">
    <div
      v-if="showProfileModal"
      class="fixed inset-x-4 top-[10%] bottom-[10%] max-w-md mx-auto z-[70] surface-card p-5 border border-white/5 shadow-2xl flex flex-col overflow-hidden text-left"
    >
      <!-- Modal Header -->
      <div class="flex items-center justify-between border-b border-surface-700/50 pb-3 mb-4 shrink-0">
        <div class="flex items-center gap-2">
          <div class="w-9 h-9 rounded-xl bg-primary-500/10 flex items-center justify-center">
            <User class="w-5 h-5 text-primary-400" />
          </div>
          <div>
            <h3 class="text-base font-bold text-white">Ubah Profil Pengguna</h3>
            <p class="text-[10px] text-surface-400 mt-0.5">Ubah data identitas lokal Anda</p>
          </div>
        </div>
        <button
          @click="showProfileModal = false"
          class="p-1.5 rounded-lg bg-surface-800 text-surface-400 hover:text-white"
        >
          <X class="w-4 h-4" />
        </button>
      </div>

      <!-- Scrollable Form Content -->
      <form @submit.prevent="handleProfileSubmit" class="flex-1 overflow-y-auto pr-1 space-y-4 pb-2">
        <!-- Call Sign / Nickname -->
        <div>
          <label class="block text-xs font-semibold text-surface-400 mb-1.5 uppercase tracking-wider">Nama Panggilan</label>
          <input
            v-model="profileForm.name"
            type="text"
            required
            class="w-full bg-surface-800/50 border border-surface-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary-500 transition-colors"
            placeholder="Farhan"
          />
        </div>

        <!-- Full Name -->
        <div>
          <label class="block text-xs font-semibold text-surface-400 mb-1.5 uppercase tracking-wider">Nama Lengkap</label>
          <input
            v-model="profileForm.fullName"
            type="text"
            required
            class="w-full bg-surface-800/50 border border-surface-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary-500 transition-colors"
            placeholder="Farhan Rizky"
          />
        </div>

        <!-- University -->
        <div>
          <label class="block text-xs font-semibold text-surface-400 mb-1.5 uppercase tracking-wider">Universitas</label>
          <input
            v-model="profileForm.university"
            type="text"
            required
            class="w-full bg-surface-800/50 border border-surface-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary-500 transition-colors"
            placeholder="Universitas Brawijaya"
          />
        </div>

        <!-- Major & Semester -->
        <div class="grid grid-cols-3 gap-3">
          <!-- Major -->
          <div class="col-span-2">
            <label class="block text-xs font-semibold text-surface-400 mb-1.5 uppercase tracking-wider">Jurusan</label>
            <input
              v-model="profileForm.major"
              type="text"
              required
              class="w-full bg-surface-800/50 border border-surface-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary-500 transition-colors"
              placeholder="Teknik Informatika"
            />
          </div>
          
          <!-- Semester -->
          <div>
            <label class="block text-xs font-semibold text-surface-400 mb-1.5 uppercase tracking-wider">Semester</label>
            <input
              v-model.number="profileForm.semester"
              type="number"
              min="1"
              max="14"
              required
              class="w-full bg-surface-800/50 border border-surface-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary-500 transition-colors"
              placeholder="4"
            />
          </div>
        </div>

        <!-- Submit Button -->
        <button
          type="submit"
          class="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-xs font-bold text-white tracking-wider uppercase shadow-lg shadow-blue-500/20 active:scale-98 transition-all flex items-center justify-center gap-2"
        >
          <Check class="w-4 h-4" />
          Simpan Profil
        </button>
      </form>
    </div>
  </transition>
</template>
