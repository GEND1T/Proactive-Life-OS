<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../services/supabase'
import AIInsightCard from '../components/shared/AIInsightCard.vue'
import WebhookToggles from '../components/control/WebhookToggles.vue'
import SyncStatus from '../components/control/SyncStatus.vue'
import AIPersona from '../components/control/AIPersona.vue'
import { useTheme } from '../composables/useTheme'
import { Moon, Sun, Clock, LogOut, Settings, Calendar, KeyRound } from 'lucide-vue-next'
import { getValidToken, initTokenClient, clearToken } from '../services/googleCalendar'

const { themeMode, setThemeMode } = useTheme()
const router = useRouter()

const isConnected = ref(false)

onMounted(() => {
  isConnected.value = !!localStorage.getItem('google_refresh_token')
})

function handleConnect() {
  initTokenClient((token) => {
    if (token) {
      isConnected.value = true
    }
  })
}

function handleDisconnect() {
  clearToken()
  isConnected.value = false
}

async function handleLogout() {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    router.push('/login')
  } catch (error) {
    console.error('Error logging out:', error.message)
  }
}
</script>

<template>
  <div class="stagger-children">
    <!-- AI Insight -->
    <AIInsightCard
      title="AI System Health"
      message="Semua 4 koneksi aktif dan stabil. Webhook Morning Routine berhasil trigger jam 06:00 tadi. Ping ke Supabase normal 24ms. Tidak ada anomali terdeteksi dalam 24 jam terakhir."
      timestamp="1 menit lalu"
      :icon="Settings"
    />

    <!-- Theme Settings -->
    <div class="mb-4">
      <div class="px-4 mb-3">
        <h3 class="text-sm font-semibold text-surface-300">🎨 Tampilan</h3>
      </div>
      <div class="mx-4">
        <div class="surface-card-sm p-4">
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-surface-800 flex items-center justify-center">
                <component 
                  :is="themeMode === 'dark' ? Moon : (themeMode === 'light' ? Sun : Clock)" 
                  class="w-5 h-5" 
                  :class="themeMode === 'dark' ? 'text-indigo-400' : (themeMode === 'light' ? 'text-warning-500' : 'text-primary-400')" 
                />
              </div>
              <div>
                <h4 class="text-sm font-semibold text-white">Mode Tema</h4>
                <p class="text-[10px] text-surface-500 mt-0.5">
                  {{ themeMode === 'dark' ? 'Menggunakan tema gelap premium' : (themeMode === 'light' ? 'Menggunakan tema terang hangat & nyaman' : 'Berganti tema otomatis berdasarkan waktu') }}
                </p>
              </div>
            </div>
          </div>
          
          <!-- Segmented Controls -->
          <div class="grid grid-cols-3 gap-2 bg-surface-800/50 p-1 rounded-xl border border-surface-700/50">
            <button
              type="button"
              @click="setThemeMode('dark')"
              class="flex flex-col items-center gap-1.5 py-2.5 text-xs font-semibold rounded-lg transition-all"
              :class="themeMode === 'dark' ? 'bg-primary-500/20 border border-primary-500/30 text-primary-400 shadow-sm' : 'text-surface-400 hover:text-white'"
            >
              <Moon class="w-4 h-4" />
              <span>Gelap</span>
            </button>
            <button
              type="button"
              @click="setThemeMode('light')"
              class="flex flex-col items-center gap-1.5 py-2.5 text-xs font-semibold rounded-lg transition-all"
              :class="themeMode === 'light' ? 'bg-primary-500/20 border border-primary-500/30 text-primary-400 shadow-sm' : 'text-surface-400 hover:text-white'"
            >
              <Sun class="w-4 h-4" />
              <span>Terang</span>
            </button>
            <button
              type="button"
              @click="setThemeMode('auto')"
              class="flex flex-col items-center gap-1.5 py-2.5 text-xs font-semibold rounded-lg transition-all"
              :class="themeMode === 'auto' ? 'bg-primary-500/20 border border-primary-500/30 text-primary-400 shadow-sm' : 'text-surface-400 hover:text-white'"
            >
              <Clock class="w-4 h-4" />
              <span>Otomatis</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Connection Status -->
    <div class="mb-4">
      <div class="px-4 mb-3">
        <h3 class="text-sm font-semibold text-surface-300">🔗 Status Koneksi</h3>
      </div>
      <SyncStatus />

      <!-- Google Calendar Integration Banner -->
      <div class="mx-4 mt-3">
        <div class="surface-card-sm p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border border-white/5 bg-gradient-to-r from-surface-800/40 via-surface-800/20 to-surface-800/10 rounded-2xl">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl flex items-center justify-center border shadow-inner transition-colors duration-300"
              :class="isConnected ? 'bg-success-500/15 border-success-500/20 text-success-400' : 'bg-surface-800 border-white/5 text-surface-400'"
            >
              <Calendar class="w-5 h-5 animate-pulse" v-if="isConnected" />
              <KeyRound class="w-5 h-5" v-else />
            </div>
            <div>
              <div class="flex items-center gap-1.5 flex-wrap">
                <span class="text-xs font-bold text-white uppercase tracking-wider">Google Calendar API</span>
                <span v-if="isConnected" class="text-[9px] font-bold text-success-400 bg-success-500/10 px-2 py-0.5 rounded-full border border-success-500/20 flex items-center gap-1">
                  <span class="w-1.5 h-1.5 bg-success-400 rounded-full animate-ping"></span>
                  Connected
                </span>
                <span v-else class="text-[9px] font-bold text-warning-400 bg-warning-500/10 px-2 py-0.5 rounded-full border border-warning-500/20">
                  Disconnected
                </span>
              </div>
              <p class="text-[10px] text-surface-500 mt-1 max-w-[280px]">
                {{ isConnected ? 'Jadwal Google Calendar disinkronkan secara real-time ke Time Orchestrator.' : 'Integrasikan jadwal Google Calendar Anda ke dalam aplikasi.' }}
              </p>
            </div>
          </div>

          <div class="flex items-center gap-2 w-full sm:w-auto shrink-0 mt-1 sm:mt-0">
            <button v-if="isConnected" @click="handleDisconnect" 
              class="w-full sm:w-auto px-4 py-2 text-[10px] font-bold uppercase tracking-wider rounded-xl bg-danger-500/10 hover:bg-danger-500/20 text-danger-400 border border-danger-500/20 active:scale-95 transition-all flex items-center justify-center gap-1.5"
            >
              <LogOut class="w-3.5 h-3.5" />
              Disconnect
            </button>
            <button v-else @click="handleConnect"
              class="w-full sm:w-auto px-4 py-2 text-[10px] font-bold uppercase tracking-wider rounded-xl bg-gradient-to-r from-primary-500 to-indigo-600 hover:shadow-lg hover:shadow-primary-500/15 text-white active:scale-95 transition-all flex items-center justify-center gap-1.5"
            >
              <KeyRound class="w-3.5 h-3.5" />
              Hubungkan
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Webhook Triggers -->
    <div class="mb-4">
      <div class="px-4 mb-3">
        <h3 class="text-sm font-semibold text-surface-300">⚡ Webhook Automations</h3>
      </div>
      <WebhookToggles />
    </div>

    <!-- AI Persona -->
    <div class="mb-4">
      <div class="px-4 mb-3">
        <h3 class="text-sm font-semibold text-surface-300">🤖 AI Persona Settings</h3>
      </div>
      <AIPersona />
    </div>

    <!-- Sign Out Button -->
    <div class="mx-4 mb-8">
      <button
        @click="handleLogout"
        class="w-full py-3.5 rounded-2xl bg-danger-500/10 border border-danger-500/20 text-danger-400 hover:bg-danger-500/20 transition-all font-semibold flex items-center justify-center gap-2"
      >
        <LogOut class="w-4 h-4" />
        Keluar dari Sesi (Logout)
      </button>
    </div>
  </div>
</template>
