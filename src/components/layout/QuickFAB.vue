<script setup>
import { ref, reactive } from 'vue'
import { addEvent } from '../../services/localCalendar'
import { createGoogleEvent, getValidToken } from '../../services/googleCalendar'
import { useRouter } from 'vue-router'
import { supabase } from '../../services/supabase'
import { useFinanceDB } from '../../composables/useFinanceDB'
import { useActivityDB } from '../../composables/useActivityDB'
import {
  Plus,
  LayoutGrid,
  X,
  Wallet,
  Activity,
  CalendarPlus,
  Loader2,
  CheckCircle,
  AlertCircle,
  Clock,
  TrendingDown,
  ChevronDown,
  Smartphone,
  CreditCard,
  Banknote,
  Utensils,
  Car,
  Gamepad2,
  ShoppingBag,
  Briefcase,
  Send,
  CircleDollarSign,
  GraduationCap,
  Code,
  Target,
  Receipt,
  HeartPulse,
  BookOpen,
  TrendingUp,
  Heart,
  Users,
  PiggyBank,
  CheckSquare
} from 'lucide-vue-next'

const router = useRouter()
const { fetchTransactions } = useFinanceDB()
const { fetchActivityLogs } = useActivityDB()

const isOpen = ref(false)
const showFinanceModal = ref(false)
const showActivityModal = ref(false)
const showCalendarModal = ref(false)

// Webhook status states
const isSubmitting = ref(false)
const toast = reactive({
  show: false,
  message: '',
  type: 'info', // 'info' | 'success' | 'error'
})

// Finance Form State
const financeForm = reactive({
  transaction_type: 'EXPENSE',
  amount: null,
  category: 'Makanan',
  payment_method: 'dana',
  description: '',
  is_impulsive: false,
  transaction_date: new Date().toISOString().split('T')[0],
  note: '',
})

// Activity Form State
const activityForm = reactive({
  logged_date: new Date().toISOString().split('T')[0],
  session_start: '',
  session_end: '',
  deep_sleep_minutes: null,
  sleep_type: 'Tidur Utama',
  steps_count: null,
  screen_time_minutes: null,
  wakatime_coding_hours: null,
  resting_heart_rate: null,
  stress_level_score: 30,
})

// Calendar Form State
const calendarForm = reactive({
  title: '',
  start: '',
  end: '',
  category: 'personal',
  color: 'yellow',
  location: '',
  description: '',
  rrule: false
})

const showCalendarCategoryDropdown = ref(false)

const calendarCategories = [
  { id: 'akademik', label: 'Akademik', icon: GraduationCap, colorClass: 'text-blue-400' },
  { id: 'coding', label: 'Coding', icon: Code, colorClass: 'text-green-400' },
  { id: 'meeting', label: 'Meeting', icon: Users, colorClass: 'text-purple-400' },
  { id: 'deadline', label: 'Deadline', icon: AlertCircle, colorClass: 'text-red-400' },
  { id: 'personal', label: 'Personal', icon: Target, colorClass: 'text-yellow-400' },
]

const categories = [
  'Makanan',
  'Transportasi',
  'Hiburan',
  'Belanja',
  'Tagihan',
  'Kesehatan',
  'Pendidikan',
  'Keluarga',
  'Sedekah',
  'Investasi',
  'Gaji',
  'Freelance',
  'Transfer'
]
const walletsList = ['dana', 'gopay', 'ovo', 'shopeepay', 'linkaja', 'bca', 'mandiri', 'bni', 'bri', 'tunai']

// Toggle states untuk custom select di modal tambah transaksi
const showCategoryDropdown = ref(false)
const showWalletDropdown = ref(false)

function selectCategory(cat) {
  financeForm.category = cat
  showCategoryDropdown.value = false
}

function selectWallet(walletId) {
  financeForm.payment_method = walletId
  showWalletDropdown.value = false
}

// Map ikon menggunakan komponen Lucide (key menggunakan huruf kecil semua)
const walletIcons = {
  dana: Smartphone,
  gopay: Smartphone,
  ovo: Smartphone,
  shopeepay: Smartphone,
  linkaja: Smartphone,
  bca: CreditCard,
  mandiri: CreditCard,
  bni: CreditCard,
  bri: CreditCard,
  tunai: Banknote,
}

const walletNames = {
  dana: 'DANA',
  gopay: 'GoPay',
  ovo: 'OVO',
  shopeepay: 'ShopeePay',
  linkaja: 'LinkAja',
  bca: 'Bank BCA',
  mandiri: 'Bank Mandiri',
  bni: 'Bank BNI',
  bri: 'Bank BRI',
  tunai: 'Tunai',
}

const categoryIcons = {
  makanan: Utensils,
  transportasi: Car,
  hiburan: Gamepad2,
  belanja: ShoppingBag,
  tagihan: Receipt,
  kesehatan: HeartPulse,
  pendidikan: BookOpen,
  keluarga: Users,
  sedekah: Heart,
  investasi: TrendingUp,
  gaji: PiggyBank,
  freelance: Briefcase,
  transfer: Send,
}

function normalizeText(text) {
  if (!text) return ''
  
  let normalized = String(text)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '') 
    .replace(/\s+/g, ' ')        
    .trim()
  
  // Deteksi Kata Kunci Metode Pembayaran
  if (/cash|tunai|uang/.test(normalized)) return 'tunai'
  if (/gopay|go pay|gojek/.test(normalized)) return 'gopay'
  if (/shopee|spay/.test(normalized)) return 'shopeepay'
  if (/link aja|linkaja/.test(normalized)) return 'linkaja'
  if (/dana/.test(normalized)) return 'dana'
  if (/ovo/.test(normalized)) return 'ovo'
  if (/bca/.test(normalized)) return 'bca'
  if (/mandiri/.test(normalized)) return 'mandiri'
  if (/bni/.test(normalized)) return 'bni'
  if (/bri/.test(normalized)) return 'bri'

  // Deteksi Kata Kunci Kategori Transaksi (Diperluas)
  if (/makan|minum|konsumsi|jajan|food|kuliner|resto|kopi|cafe/.test(normalized)) return 'makanan'
  if (/transport|gojek|grab|maxim|bensin|parkir|tol|krl|mrt|tiket|pesawat|kereta/.test(normalized)) return 'transportasi'
  if (/hibur|main|game|nonton|bioskop|netflix|spotify|langganan|rekreasi|liburan/.test(normalized)) return 'hiburan'
  if (/belanja|shop|beli|pakaian|baju|sepatu|skincare|kebutuhan|groceries|pasar|supermarket/.test(normalized)) return 'belanja'
  
  // Kategori Baru
  if (/tagihan|listrik|token|air|pdam|internet|wifi|pulsa|paket data|kuota|cicilan|bpjs|komunikasi/.test(normalized)) return 'tagihan'
  if (/sehat|sakit|dokter|obat|apotek|rs|rumah sakit|klinik|medis/.test(normalized)) return 'kesehatan'
  if (/didik|sekolah|kuliah|spp|buku|kursus|les|training/.test(normalized)) return 'pendidikan'
  if (/invest|saham|reksadana|crypto|emas|tabung|deposito/.test(normalized)) return 'investasi'
  if (/sedekah|zakat|infaq|donasi|amal|masjid|gereja|sumbangan/.test(normalized)) return 'sedekah'
  if (/keluarga|anak|istri|suami|ortu|rumah tangga/.test(normalized)) return 'keluarga'
  
  // Kategori Income
  if (/gaji|upah|salary|pendapatan|payday/.test(normalized)) return 'gaji'
  if (/freelance|project|proyek|bonus|kerja|sampingan/.test(normalized)) return 'freelance'
  
  if (/transfer|tf|kirim/.test(normalized)) return 'transfer'

  return normalized.replace(/\s/g, '')
}

function getWalletIcon(method) {
  const key = normalizeText(method)
  return walletIcons[key] || Wallet
}

function getCategoryIcon(category) {
  const key = normalizeText(category)
  return categoryIcons[key] || CircleDollarSign
}

function toggle() {
  isOpen.value = !isOpen.value
}

function close() {
  isOpen.value = false
}

function showToast(message, type = 'info') {
  toast.message = message
  toast.type = type
  toast.show = true
  setTimeout(() => {
    toast.show = false
  }, 4000)
}

function openFinance() {
  // Reset form
  Object.assign(financeForm, {
    transaction_type: 'EXPENSE',
    amount: null,
    category: 'Makanan',
    payment_method: 'dana',
    description: '',
    is_impulsive: false,
    transaction_date: new Date().toISOString().split('T')[0],
    note: '',
  })
  showCategoryDropdown.value = false
  showWalletDropdown.value = false
  showFinanceModal.value = true
  close()
}

function openActivity() {
  // Reset form
  Object.assign(activityForm, {
    logged_date: new Date().toISOString().split('T')[0],
    session_start: '',
    session_end: '',
    deep_sleep_minutes: null,
    sleep_type: 'Tidur Utama',
    steps_count: null,
    screen_time_minutes: null,
    wakatime_coding_hours: null,
    resting_heart_rate: null,
    stress_level_score: 30,
  })
  showActivityModal.value = true
  close()
}

async function handleFinanceSubmit() {
  if (!financeForm.amount || !financeForm.description) {
    showToast('Harap lengkapi nominal dan deskripsi.', 'error')
    return
  }

  isSubmitting.value = true
  showToast('Menyimpan ke Supabase...', 'info')

  try {
    const { error: dbError } = await supabase
      .from('financial_logs')
      .insert([
        {
          amount: Number(financeForm.amount),
          description: financeForm.description,
          category: financeForm.category,
          payment_method: financeForm.payment_method,
          transaction_type: financeForm.transaction_type,
          is_impulsive: financeForm.is_impulsive,
          transaction_date: financeForm.transaction_date,
        }
      ])

    if (dbError) throw dbError

    showToast('Catatan keuangan berhasil disimpan ke Supabase!', 'success')
    showFinanceModal.value = false
    fetchTransactions()
  } catch (err) {
    console.error('Error adding transaction:', err)
    showToast(err.message || 'Gagal menyimpan data.', 'error')
  } finally {
    isSubmitting.value = false
  }
}

async function handleActivitySubmit() {
  isSubmitting.value = true
  showToast('Menyimpan ke Supabase...', 'info')

  try {
    let sleepDuration = null
    let startISO = null
    let endISO = null

    if (activityForm.session_start && activityForm.session_end) {
      const start = new Date(activityForm.session_start)
      const end = new Date(activityForm.session_end)
      const diffMs = end.getTime() - start.getTime()
      if (!isNaN(diffMs) && diffMs > 0) {
        sleepDuration = Math.round(diffMs / 60000)
      }
      startISO = start.toISOString()
      endISO = end.toISOString()
    }

    const { error: dbError } = await supabase
      .from('activity_logs')
      .insert([
        {
          logged_date: activityForm.logged_date,
          session_start: startISO,
          session_end: endISO,
          sleep_duration_minutes: sleepDuration,
          deep_sleep_minutes: activityForm.deep_sleep_minutes ? Number(activityForm.deep_sleep_minutes) : null,
          sleep_type: activityForm.sleep_type,
          steps_count: activityForm.steps_count ? Number(activityForm.steps_count) : null,
          screen_time_minutes: activityForm.screen_time_minutes ? Number(activityForm.screen_time_minutes) : null,
          wakatime_coding_hours: activityForm.wakatime_coding_hours ? Number(activityForm.wakatime_coding_hours) : null,
          resting_heart_rate: activityForm.resting_heart_rate ? Number(activityForm.resting_heart_rate) : null,
          stress_level_score: activityForm.stress_level_score ? Number(activityForm.stress_level_score) : null,
        }
      ])

    if (dbError) throw dbError

    showToast('Log aktivitas berhasil disimpan ke Supabase!', 'success')
    showActivityModal.value = false
    fetchActivityLogs()
  } catch (err) {
    console.error('Error adding activity:', err)
    showToast(err.message || 'Gagal menyimpan data.', 'error')
  } finally {
    isSubmitting.value = false
  }
}

function openCalendar() {
  const now = new Date()
  const localOffset = now.getTimezoneOffset() * 60000
  const localNow = new Date(now.getTime() - localOffset)
  const nowISO = localNow.toISOString().slice(0, 16) // Format: YYYY-MM-DDTHH:mm
  
  const nextHour = new Date(localNow.getTime() + 3600000)
  const nextHourISO = nextHour.toISOString().slice(0, 16)

  Object.assign(calendarForm, {
    title: '',
    start: nowISO,
    end: nextHourISO,
    category: 'personal',
    color: 'yellow',
    location: '',
    description: '',
    rrule: false
  })
  
  showCalendarModal.value = true
  close()
}

async function handleCalendarSubmit() {
  if (!calendarForm.title || !calendarForm.start) {
    showToast('Harap lengkapi judul dan waktu mulai.', 'error')
    return
  }

  isSubmitting.value = true
  
  const token = await getValidToken()
  const isGoogleConnected = !!token
  showToast(isGoogleConnected ? 'Menyimpan ke Google Calendar...' : 'Menyimpan jadwal lokal...', 'info')

  try {
    const payload = {
      title: calendarForm.title,
      start: new Date(calendarForm.start).toISOString(),
      end: calendarForm.end ? new Date(calendarForm.end).toISOString() : new Date(calendarForm.start).toISOString(),
      category: calendarForm.category,
      color: calendarForm.color,
      location: calendarForm.location,
      description: calendarForm.description,
      rrule: calendarForm.rrule
    }

    if (isGoogleConnected) {
      await createGoogleEvent(payload)
      showToast('Jadwal berhasil disimpan ke Google Calendar!', 'success')
    } else {
      addEvent(payload)
      showToast('Jadwal lokal berhasil ditambahkan!', 'success')
    }

    // Picu pembaruan data reaktif di CalendarView
    window.dispatchEvent(new CustomEvent('local-events-updated'))
    showCalendarModal.value = false
  } catch (err) {
    console.error('Error saving calendar event:', err)
    showToast(err.message || 'Gagal menyimpan jadwal.', 'error')
  } finally {
    isSubmitting.value = false
  }
}

const actions = [
  { label: 'Catat Keuangan', icon: Plus, color: 'from-emerald-500 to-teal-600', action: openFinance },
  { label: 'Buku Kas Vault', icon: Wallet, color: 'from-blue-600 to-cyan-500', action: () => { router.push('/finance'); close() } },
  { label: 'Log Aktivitas', icon: Activity, color: 'from-purple-500 to-pink-600', action: openActivity },
  { label: 'Tambah Jadwal', icon: CalendarPlus, color: 'from-blue-500 to-indigo-600', action: openCalendar },
  { label: 'Kelola Habit', icon: CheckSquare, color: 'from-indigo-500 to-purple-600', action: () => { router.push('/habit'); close() } },
]
</script>

<template>
  <!-- Toast Notification Overlay -->
  <transition name="toast-slide">
    <div
      v-if="toast.show"
      class="fixed top-5 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-sm p-3.5 rounded-2xl shadow-2xl border flex items-center gap-3 backdrop-blur-xl transition-all"
      :class="{
        'bg-surface-850/90 border-blue-500/30 text-blue-400': toast.type === 'info',
        'bg-success-500/15 border-success-500/30 text-success-400': toast.type === 'success',
        'bg-danger-500/15 border-danger-500/30 text-danger-400': toast.type === 'error',
      }"
    >
      <Loader2 v-if="toast.type === 'info'" class="w-5 h-5 animate-spin shrink-0 text-primary-400" />
      <CheckCircle v-else-if="toast.type === 'success'" class="w-5 h-5 shrink-0 text-success-400" />
      <AlertCircle v-else class="w-5 h-5 shrink-0 text-danger-400" />
      <span class="text-xs font-semibold text-surface-200">{{ toast.message }}</span>
    </div>
  </transition>

  <!-- FAB Backdrop -->
  <transition name="fade">
    <div
      v-if="isOpen || showFinanceModal || showActivityModal || showCalendarModal"
      class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
      @click="() => { close(); showFinanceModal = false; showActivityModal = false; showCalendarModal = false; }"
    ></div>
  </transition>

  <!-- FAB Menu & Button Container -->
  <div class="fixed bottom-5 left-1/2 -translate-x-1/2 z-[60]" id="quick-fab">
    <!-- Mini Action Buttons (Grid Layout) -->
    <transition name="scale">
      <div v-if="isOpen" class="absolute bottom-16 left-1/2 -translate-x-1/2 w-[290px] bg-surface-900/95 backdrop-blur-xl border border-surface-700/50 p-4 rounded-[24px] shadow-2xl animate-scale-in">
        <!-- Header / Title inside FAB menu -->
        <div class="text-[10px] font-bold text-surface-400 uppercase tracking-wider mb-2.5 px-1">Aksi Cepat</div>
        
        <!-- Grid list of actions -->
        <div class="grid grid-cols-3 gap-2">
          <template v-for="(action, index) in actions" :key="index">
            <button
              @click="action.action"
              class="flex flex-col items-center justify-center text-center gap-2 p-2.5 rounded-2xl bg-surface-800/40 border border-white/5 hover:bg-surface-800/80 active:scale-95 transition-all group animate-slide-up"
              :style="{ animationDelay: `${index * 0.04}s` }"
            >
              <div
                class="w-11 h-11 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-md shadow-black/20 group-hover:scale-105 transition-transform duration-200"
                :class="action.color"
              >
                <component :is="action.icon" class="w-5 h-5 text-white" />
              </div>
              <span class="text-[10px] font-semibold text-surface-200 group-hover:text-white transition-colors leading-tight">{{ action.label }}</span>
            </button>
          </template>
        </div>
      </div>
    </transition>

    <!-- Main FAB Button -->
    <button
      @click="toggle"
      class="w-14 h-14 rounded-2xl fab-gradient shadow-lg shadow-primary-500/25 flex items-center justify-center transition-all duration-300 hover:shadow-primary-500/40 active:scale-95"
      :class="isOpen ? 'rotate-90 scale-90' : 'animate-pulse-glow'"
      id="fab-main"
    >
      <component
        :is="isOpen ? X : LayoutGrid"
        class="w-6 h-6 text-white transition-all duration-300"
      />
    </button>
  </div>

  <!-- Modal: Catat Keuangan -->
  <transition name="modal-scale">
    <div
      v-if="showFinanceModal"
      class="fixed inset-x-4 top-[10%] bottom-[10%] max-w-md mx-auto z-[70] surface-card p-5 border border-white/5 shadow-2xl flex flex-col overflow-hidden"
    >
      <!-- Modal Header -->
      <div class="flex items-center justify-between border-b border-surface-700/50 pb-3 mb-4 shrink-0">
        <div class="flex items-center gap-2">
          <div class="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center">
            <Wallet class="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h3 class="text-base font-bold text-white">Catat Keuangan</h3>
            <p class="text-[10px] text-surface-400 mt-0.5">Simpan log transaksi langsung ke Supabase</p>
          </div>
        </div>
        <button
          @click="showFinanceModal = false"
          class="p-1.5 rounded-lg bg-surface-800 text-surface-400 hover:text-white"
        >
          <X class="w-4 h-4" />
        </button>
      </div>

      <!-- Scrollable Form Content -->
      <form @submit.prevent="handleFinanceSubmit" class="flex-1 overflow-y-auto pr-1 space-y-4 pb-2">
        <!-- Transaction Type Switcher -->
        <div>
          <label class="block text-xs font-semibold text-surface-400 mb-1.5 uppercase tracking-wider">Jenis Transaksi</label>
          <div class="grid grid-cols-2 gap-2 bg-surface-800/50 p-1.5 rounded-xl border border-surface-700/50">
            <button
              type="button"
              @click="financeForm.transaction_type = 'EXPENSE'"
              class="py-2 text-xs font-bold rounded-lg transition-all"
              :class="financeForm.transaction_type === 'EXPENSE' ? 'bg-danger-500/20 border border-danger-500/30 text-danger-400' : 'text-surface-400 hover:text-white'"
            >
              EXPENSE (Pengeluaran)
            </button>
            <button
              type="button"
              @click="financeForm.transaction_type = 'INCOME'"
              class="py-2 text-xs font-bold rounded-lg transition-all"
              :class="financeForm.transaction_type === 'INCOME' ? 'bg-success-500/20 border border-success-500/30 text-success-400' : 'text-surface-400 hover:text-white'"
            >
              INCOME (Pemasukan)
            </button>
          </div>
        </div>

        <!-- Amount (Nominal) -->
        <div>
          <label class="block text-xs font-semibold text-surface-400 mb-1.5 uppercase tracking-wider">Nominal (Rupiah)</label>
          <input
            v-model.number="financeForm.amount"
            type="number"
            placeholder="Contoh: 25000"
            required
            :disabled="isSubmitting"
            class="w-full bg-surface-800/50 border border-surface-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary-500 transition-colors disabled:opacity-50"
          />
        </div>

        <!-- Description -->
        <div>
          <label class="block text-xs font-semibold text-surface-400 mb-1.5 uppercase tracking-wider">Deskripsi Singkat</label>
          <input
            v-model="financeForm.description"
            type="text"
            placeholder="Grab ke kampus, Nasi goreng, dsb."
            required
            :disabled="isSubmitting"
            class="w-full bg-surface-800/50 border border-surface-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary-500 transition-colors disabled:opacity-50"
          />
        </div>

        <!-- Category & Payment Method (Custom Dropdowns with Icons) -->
        <div class="grid grid-cols-2 gap-3">
          <!-- Custom Kategori Dropdown -->
          <div class="relative">
            <label class="block text-xs font-semibold text-surface-400 mb-1.5 uppercase tracking-wider">Kategori</label>
            <button
              type="button"
              @click="showCategoryDropdown = !showCategoryDropdown; showWalletDropdown = false"
              :disabled="isSubmitting"
              class="w-full flex items-center justify-between bg-surface-800/50 border border-surface-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-primary-500 transition-colors disabled:opacity-50"
            >
              <div class="flex items-center gap-2">
                <component :is="getCategoryIcon(financeForm.category)" class="w-4 h-4 text-surface-400" />
                <span>{{ financeForm.category }}</span>
              </div>
              <ChevronDown class="w-4 h-4 text-surface-400 transition-transform duration-200" :class="showCategoryDropdown ? 'rotate-180' : ''" />
            </button>
            
            <div
              v-if="showCategoryDropdown"
              class="absolute z-50 left-0 right-0 mt-1 bg-surface-900 border border-surface-700/80 rounded-xl shadow-2xl max-h-48 overflow-y-auto p-1"
            >
              <button
                v-for="cat in categories"
                :key="cat"
                type="button"
                @click="selectCategory(cat)"
                class="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-left rounded-lg hover:bg-surface-800 transition-colors text-white"
              >
                <component :is="getCategoryIcon(cat)" class="w-4 h-4 text-surface-400" />
                <span>{{ cat }}</span>
              </button>
            </div>
          </div>

          <!-- Custom Wallet Dropdown -->
          <div class="relative">
            <label class="block text-xs font-semibold text-surface-400 mb-1.5 uppercase tracking-wider">E-Wallet / Metode</label>
            <button
              type="button"
              @click="showWalletDropdown = !showWalletDropdown; showCategoryDropdown = false"
              :disabled="isSubmitting"
              class="w-full flex items-center justify-between bg-surface-800/50 border border-surface-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-primary-500 transition-colors disabled:opacity-50"
            >
              <div class="flex items-center gap-2">
                <component :is="getWalletIcon(financeForm.payment_method)" class="w-4 h-4 text-surface-400" />
                <span>{{ walletNames[normalizeText(financeForm.payment_method)] || financeForm.payment_method }}</span>
              </div>
              <ChevronDown class="w-4 h-4 text-surface-400 transition-transform duration-200" :class="showWalletDropdown ? 'rotate-180' : ''" />
            </button>

            <div
              v-if="showWalletDropdown"
              class="absolute z-50 left-0 right-0 mt-1 bg-surface-900 border border-surface-700/80 rounded-xl shadow-2xl max-h-48 overflow-y-auto p-1"
            >
              <button
                v-for="walletId in walletsList"
                :key="walletId"
                type="button"
                @click="selectWallet(walletId)"
                class="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-left rounded-lg hover:bg-surface-800 transition-colors text-white"
              >
                <component :is="getWalletIcon(walletId)" class="w-4 h-4 text-surface-400" />
                <span>{{ walletNames[walletId] }}</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Impulsive Toggle (Only for Expense) -->
        <div
          v-if="financeForm.transaction_type === 'EXPENSE'"
          class="flex items-center justify-between p-3.5 rounded-xl bg-surface-800/30 border border-surface-700/50"
        >
          <div class="flex items-center gap-2">
            <TrendingDown class="w-4 h-4 text-warning-400" />
            <div>
              <h4 class="text-xs font-bold text-white">Pembelian Impulsif?</h4>
              <p class="text-[9px] text-surface-500 mt-0.5">Centang jika ini belanja spontan/keinginan</p>
            </div>
          </div>
          <input
            v-model="financeForm.is_impulsive"
            type="checkbox"
            :disabled="isSubmitting"
            class="w-5 h-5 rounded-lg border-surface-700 bg-surface-800/50 checked:bg-primary-500 focus:ring-primary-500 focus:ring-opacity-25"
          />
        </div>

        <!-- Transaction Date -->
        <div>
          <label class="block text-xs font-semibold text-surface-400 mb-1.5 uppercase tracking-wider">Tanggal Transaksi</label>
          <input
            v-model="financeForm.transaction_date"
            type="date"
            required
            :disabled="isSubmitting"
            class="w-full bg-surface-800/50 border border-surface-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary-500 transition-colors disabled:opacity-50"
          />
        </div>

        <!-- Note (Catatan Detail) -->
        <div>
          <label class="block text-xs font-semibold text-surface-400 mb-1.5 uppercase tracking-wider">Catatan Detail (Opsional)</label>
          <textarea
            v-model="financeForm.note"
            rows="3"
            placeholder="Tulis detail belanjaan..."
            :disabled="isSubmitting"
            class="w-full bg-surface-800/50 border border-surface-700 rounded-xl px-4 py-2 text-sm text-white placeholder-surface-500 focus:outline-none focus:border-primary-500 transition-colors disabled:opacity-50"
          ></textarea>
        </div>

        <!-- Form Submit -->
        <button
          type="submit"
          :disabled="isSubmitting"
          class="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-xs font-bold text-white tracking-wider uppercase shadow-lg shadow-emerald-500/20 active:scale-98 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <Loader2 v-if="isSubmitting" class="w-4 h-4 animate-spin" />
          {{ isSubmitting ? 'Menyimpan...' : 'Simpan Transaksi' }}
        </button>
      </form>
    </div>
  </transition>

  <!-- Modal: Log Aktivitas -->
  <transition name="modal-scale">
    <div
      v-if="showActivityModal"
      class="fixed inset-x-4 top-[10%] bottom-[10%] max-w-md mx-auto z-[70] surface-card p-5 border border-white/5 shadow-2xl flex flex-col overflow-hidden"
    >
      <!-- Modal Header -->
      <div class="flex items-center justify-between border-b border-surface-700/50 pb-3 mb-4 shrink-0">
        <div class="flex items-center gap-2">
          <div class="w-9 h-9 rounded-xl bg-purple-500/10 flex items-center justify-center">
            <Activity class="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h3 class="text-base font-bold text-white">Log Aktivitas Harian</h3>
            <p class="text-[10px] text-surface-400 mt-0.5">Simpan aktivitas langsung ke Supabase</p>
          </div>
        </div>
        <button
          @click="showActivityModal = false"
          class="p-1.5 rounded-lg bg-surface-800 text-surface-400 hover:text-white"
        >
          <X class="w-4 h-4" />
        </button>
      </div>

      <!-- Scrollable Form Content -->
      <form @submit.prevent="handleActivitySubmit" class="flex-1 overflow-y-auto pr-1 space-y-4 pb-2">
        <!-- Date -->
        <div>
          <label class="block text-xs font-semibold text-surface-400 mb-1.5 uppercase tracking-wider">Tanggal Log</label>
          <input
            v-model="activityForm.logged_date"
            type="date"
            required
            :disabled="isSubmitting"
            class="w-full bg-surface-800/50 border border-surface-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary-500 transition-colors disabled:opacity-50"
          />
        </div>

        <!-- Sleep Stats Group -->
        <div class="p-3.5 rounded-xl bg-surface-850/40 border border-surface-700/50 space-y-3">
          <h4 class="text-xs font-bold text-purple-400 flex items-center gap-1.5 uppercase tracking-wider">
            <Clock class="w-4 h-4 text-purple-400" />
            Data Tidur
          </h4>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-[10px] font-semibold text-surface-400 mb-1">Waktu Mulai Tidur</label>
              <input
                v-model="activityForm.session_start"
                type="datetime-local"
                :disabled="isSubmitting"
                class="w-full bg-surface-800/50 border border-surface-700 rounded-xl px-3 py-2 text-[11px] text-white focus:outline-none focus:border-primary-500 transition-colors"
              />
            </div>
            <div>
              <label class="block text-[10px] font-semibold text-surface-400 mb-1">Waktu Selesai Tidur</label>
              <input
                v-model="activityForm.session_end"
                type="datetime-local"
                :disabled="isSubmitting"
                class="w-full bg-surface-800/50 border border-surface-700 rounded-xl px-3 py-2 text-[11px] text-white focus:outline-none focus:border-primary-500 transition-colors"
              />
            </div>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-[10px] font-semibold text-surface-400 mb-1">Deep Sleep (Menit)</label>
              <input
                v-model.number="activityForm.deep_sleep_minutes"
                type="number"
                placeholder="90"
                :disabled="isSubmitting"
                class="w-full bg-surface-800/50 border border-surface-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-primary-500 transition-colors"
              />
            </div>
            <div>
              <label class="block text-[10px] font-semibold text-surface-400 mb-1">Tipe Sesi Tidur</label>
              <select
                v-model="activityForm.sleep_type"
                :disabled="isSubmitting"
                class="w-full bg-surface-800/50 border border-surface-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
              >
                <option value="Tidur Utama">😴 Tidur Utama</option>
                <option value="Tidur Siang / Ekstra">🌸 Tidur Siang / Ekstra</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Health / Heart Rate Group -->
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-semibold text-surface-400 mb-1.5 uppercase tracking-wider">Langkah Kaki</label>
            <input
              v-model.number="activityForm.steps_count"
              type="number"
              placeholder="10000"
              :disabled="isSubmitting"
              class="w-full bg-surface-800/50 border border-surface-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary-500 transition-colors"
            />
          </div>
          <div>
            <label class="block text-xs font-semibold text-surface-400 mb-1.5 uppercase tracking-wider">BPM Istirahat</label>
            <input
              v-model.number="activityForm.resting_heart_rate"
              type="number"
              placeholder="65"
              :disabled="isSubmitting"
              class="w-full bg-surface-800/50 border border-surface-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary-500 transition-colors"
            />
          </div>
        </div>

        <!-- Productivity / Coding Stats -->
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-semibold text-surface-400 mb-1.5 uppercase tracking-wider">Screen Time (Menit)</label>
            <input
              v-model.number="activityForm.screen_time_minutes"
              type="number"
              placeholder="360"
              :disabled="isSubmitting"
              class="w-full bg-surface-800/50 border border-surface-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary-500 transition-colors"
            />
          </div>
          <div>
            <label class="block text-xs font-semibold text-surface-400 mb-1.5 uppercase tracking-wider">Coding (WakaTime Jam)</label>
            <input
              v-model.number="activityForm.wakatime_coding_hours"
              type="number"
              step="0.1"
              placeholder="4.5"
              :disabled="isSubmitting"
              class="w-full bg-surface-800/50 border border-surface-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary-500 transition-colors"
            />
          </div>
        </div>

        <!-- Stress Score Slider -->
        <div>
          <div class="flex justify-between items-center mb-1">
            <label class="text-xs font-semibold text-surface-400 uppercase tracking-wider">Tingkat Stres</label>
            <span
              class="text-xs font-bold font-mono px-2 py-0.5 rounded-lg"
              :class="activityForm.stress_level_score > 60 ? 'bg-danger-500/20 text-danger-400' : activityForm.stress_level_score > 30 ? 'bg-warning-500/20 text-warning-400' : 'bg-success-500/20 text-success-400'"
            >
              {{ activityForm.stress_level_score }}/100
            </span>
          </div>
          <input
            v-model.number="activityForm.stress_level_score"
            type="range"
            min="1"
            max="100"
            :disabled="isSubmitting"
            class="w-full h-1.5 bg-surface-700 rounded-lg appearance-none cursor-pointer accent-primary-500 disabled:opacity-50"
          />
        </div>

        <!-- Form Submit -->
        <button
          type="submit"
          :disabled="isSubmitting"
          class="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-xs font-bold text-white tracking-wider uppercase shadow-lg shadow-purple-500/20 active:scale-98 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <Loader2 v-if="isSubmitting" class="w-4 h-4 animate-spin" />
          {{ isSubmitting ? 'Menyimpan...' : 'Simpan Log Aktivitas' }}
        </button>
      </form>
    </div>
  </transition>

  <!-- Modal: Tambah Jadwal -->
  <transition name="modal-scale">
    <div
      v-if="showCalendarModal"
      class="fixed inset-x-4 top-[10%] bottom-[10%] max-w-md mx-auto z-[70] surface-card p-5 border border-white/5 shadow-2xl flex flex-col overflow-hidden"
    >
      <!-- Modal Header -->
      <div class="flex items-center justify-between border-b border-surface-700/50 pb-3 mb-4 shrink-0">
        <div class="flex items-center gap-2">
          <div class="w-9 h-9 rounded-xl bg-primary-500/10 flex items-center justify-center">
            <CalendarPlus class="w-5 h-5 text-primary-400" />
          </div>
          <div>
            <h3 class="text-base font-bold text-white">Tambah Jadwal</h3>
            <p class="text-[10px] text-surface-400 mt-0.5">Buat agenda baru untuk Time Orchestrator</p>
          </div>
        </div>
        <button
          @click="showCalendarModal = false"
          class="p-1.5 rounded-lg bg-surface-800 text-surface-400 hover:text-white"
        >
          <X class="w-4 h-4" />
        </button>
      </div>

      <!-- Scrollable Form Content -->
      <form @submit.prevent="handleCalendarSubmit" class="flex-1 overflow-y-auto pr-1 space-y-4 pb-2">
        <!-- Title -->
        <div>
          <label class="block text-xs font-semibold text-surface-400 mb-1.5 uppercase tracking-wider">Judul Agenda</label>
          <input
            v-model="calendarForm.title"
            type="text"
            placeholder="Kuliah, Meeting, Coding, dll."
            required
            :disabled="isSubmitting"
            class="w-full bg-surface-800/50 border border-surface-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary-500 transition-colors disabled:opacity-50"
          />
        </div>

        <!-- Date Time Inputs -->
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-semibold text-surface-400 mb-1.5 uppercase tracking-wider">Waktu Mulai</label>
            <input
              v-model="calendarForm.start"
              type="datetime-local"
              required
              :disabled="isSubmitting"
              class="w-full bg-surface-800/50 border border-surface-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary-500 transition-colors disabled:opacity-50"
            />
          </div>
          <div>
            <label class="block text-xs font-semibold text-surface-400 mb-1.5 uppercase tracking-wider">Waktu Selesai</label>
            <input
              v-model="calendarForm.end"
              type="datetime-local"
              required
              :disabled="isSubmitting"
              class="w-full bg-surface-800/50 border border-surface-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary-500 transition-colors disabled:opacity-50"
            />
          </div>
        </div>

        <!-- Category & Color Picker -->
        <div class="grid grid-cols-2 gap-3">
          <!-- Category -->
          <div class="relative">
            <label class="block text-xs font-semibold text-surface-400 mb-1.5 uppercase tracking-wider">Kategori</label>
            <button
              type="button"
              @click="showCalendarCategoryDropdown = !showCalendarCategoryDropdown"
              :disabled="isSubmitting"
              class="w-full flex items-center justify-between bg-surface-800/50 border border-surface-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-primary-500 transition-colors disabled:opacity-50"
            >
              <div class="flex items-center gap-2">
                <component 
                  :is="calendarCategories.find(c => c.id === calendarForm.category)?.icon || Target" 
                  class="w-4 h-4" 
                  :class="calendarCategories.find(c => c.id === calendarForm.category)?.colorClass || 'text-surface-400'" 
                />
                <span>{{ calendarCategories.find(c => c.id === calendarForm.category)?.label || 'Personal' }}</span>
              </div>
              <ChevronDown class="w-4 h-4 text-surface-400 transition-transform duration-200" :class="showCalendarCategoryDropdown ? 'rotate-180' : ''" />
            </button>
            
            <div
              v-if="showCalendarCategoryDropdown"
              class="absolute z-50 left-0 right-0 mt-1 bg-surface-900 border border-surface-700/80 rounded-xl shadow-2xl max-h-48 overflow-y-auto p-1"
            >
              <button
                v-for="cat in calendarCategories"
                :key="cat.id"
                type="button"
                @click="calendarForm.category = cat.id; showCalendarCategoryDropdown = false"
                class="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-left rounded-lg hover:bg-surface-800 transition-colors text-white"
              >
                <component :is="cat.icon" class="w-4 h-4" :class="cat.colorClass" />
                <span>{{ cat.label }}</span>
              </button>
            </div>
          </div>

          <!-- Color -->
          <div>
            <label class="block text-xs font-semibold text-surface-400 mb-1.5 uppercase tracking-wider">Aksen Warna</label>
            <select
              v-model="calendarForm.color"
              :disabled="isSubmitting"
              class="w-full bg-surface-800/50 border border-surface-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary-500 transition-colors disabled:opacity-50"
            >
              <option value="blue">Biru (Akademik)</option>
              <option value="green">Hijau (Coding)</option>
              <option value="purple">Ungu (Meeting)</option>
              <option value="red">Merah (Deadline)</option>
              <option value="yellow">Kuning (Personal)</option>
              <option value="pink">Pink (Hiburan)</option>
              <option value="cyan">Sian (Kesehatan)</option>
            </select>
          </div>
        </div>

        <!-- Location -->
        <div>
          <label class="block text-xs font-semibold text-surface-400 mb-1.5 uppercase tracking-wider">Lokasi / Tautan</label>
          <input
            v-model="calendarForm.location"
            type="text"
            placeholder="Ruangan, Zoom Link, Kafe, dll."
            :disabled="isSubmitting"
            class="w-full bg-surface-800/50 border border-surface-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary-500 transition-colors disabled:opacity-50"
          />
        </div>

        <!-- Description -->
        <div>
          <label class="block text-xs font-semibold text-surface-400 mb-1.5 uppercase tracking-wider">Deskripsi Detail</label>
          <textarea
            v-model="calendarForm.description"
            rows="3"
            placeholder="Rincian agenda atau catatan tambahan..."
            :disabled="isSubmitting"
            class="w-full bg-surface-800/50 border border-surface-700 rounded-xl px-4 py-2 text-sm text-white placeholder-surface-500 focus:outline-none focus:border-primary-500 transition-colors disabled:opacity-50"
          ></textarea>
        </div>

        <!-- Submit Button -->
        <button
          type="submit"
          :disabled="isSubmitting"
          class="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-xs font-bold text-white tracking-wider uppercase shadow-lg shadow-blue-500/20 active:scale-98 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <Loader2 v-if="isSubmitting" class="w-4 h-4 animate-spin" />
          {{ isSubmitting ? 'Menyimpan...' : 'Simpan Agenda' }}
        </button>
      </form>
    </div>
  </transition>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.toast-slide-enter-active,
.toast-slide-leave-active {
  transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}
.toast-slide-enter-from {
  transform: translate(-50%, -20px);
  opacity: 0;
}
.toast-slide-leave-to {
  transform: translate(-50%, -20px);
  opacity: 0;
}

.modal-scale-enter-active,
.modal-scale-leave-active {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.modal-scale-enter-from {
  opacity: 0;
  transform: scale(0.92) translate3d(0, 20px, 0);
}
.modal-scale-leave-to {
  opacity: 0;
  transform: scale(0.95) translate3d(0, 10px, 0);
}
</style>
