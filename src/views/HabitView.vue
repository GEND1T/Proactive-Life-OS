<script setup>
import { ref, computed, onMounted, reactive } from 'vue'
import { 
  Sparkles, Plus, Search, ChevronRight, Edit3, Trash2, X, Loader2,
  TrendingUp, Award, Clock, ArrowRight, Minus, AlertTriangle, ArrowUpRight
} from 'lucide-vue-next'
import { useHabitDB } from '../composables/useHabitDB'
import AIInsightCard from '../components/shared/AIInsightCard.vue'

const { 
  habits, isLoading, error, fetchHabits, addHabit, updateHabit, deleteHabit, adjustPoints 
} = useHabitDB()

// State
const searchQuery = ref('')
const activeTab = ref('SUGGESTION') // 'SUGGESTION' | 'ROUTINE'
const expandedHabitId = ref(null)

// Modals State
const showAddModal = ref(false)
const showEditModal = ref(false)
const showDeleteConfirm = ref(false)
const habitToDelete = ref(null)
const isSubmitting = ref(false)

// Toast Alert
const toast = reactive({
  show: false,
  message: '',
  type: 'info' // 'info' | 'success' | 'error' | 'evolution'
})

// Form States
const addForm = reactive({
  activity_name: '',
  time_start: '07:00',
  time_end: '08:00',
  points: 0,
  status: 'SUGGESTION'
})

const editForm = reactive({
  id: '',
  activity_name: '',
  time_start: '',
  time_end: '',
  points: 0,
  status: 'SUGGESTION'
})

onMounted(() => {
  fetchHabits()
})

// Toast function
function showToast(message, type = 'info') {
  toast.message = message
  toast.type = type
  toast.show = true
  setTimeout(() => {
    toast.show = false
  }, 4000)
}

// Stats computations
const totalHabits = computed(() => habits.value.length)
const suggestionCount = computed(() => habits.value.filter(h => h.status === 'SUGGESTION').length)
const routineCount = computed(() => habits.value.filter(h => h.status === 'ROUTINE').length)
const avgPoints = computed(() => {
  if (habits.value.length === 0) return 0
  const totalPoints = habits.value.reduce((sum, h) => sum + (h.points || 0), 0)
  return Number((totalPoints / habits.value.length).toFixed(1))
})

// Filtered habits
const filteredHabits = computed(() => {
  return habits.value.filter(h => {
    const matchesStatus = h.status === activeTab.value
    const matchesSearch = h.activity_name.toLowerCase().includes(searchQuery.value.toLowerCase())
    return matchesStatus && matchesSearch
  }).sort((a, b) => (a.time_start || '').localeCompare(b.time_start || ''))
})

// AI Insight message based on current habits state
const aiInsightMessage = computed(() => {
  if (habits.value.length === 0) {
    return 'Belum ada data kebiasaan yang tercatat. AI menyarankan untuk menambahkan minimal 1 kebiasaan SUGGESTION pagi (seperti meditasi atau membaca) untuk memulai hari Anda dengan produktif.'
  }
  
  const closingSuggestions = habits.value.filter(h => h.status === 'SUGGESTION' && h.points >= 7)
  if (closingSuggestions.length > 0) {
    return `Hebat! Kebiasaan '${closingSuggestions[0].activity_name}' sudah mencapai ${closingSuggestions[0].points} poin. Butuh sedikit lagi konsistensi untuk berevolusi menjadi ROUTINE otomatis.`
  }
  
  if (routineCount.value > 0) {
    return `Anda memiliki ${routineCount.value} ROUTINE aktif. Data menunjukkan konsistensi kebiasaan rutin Anda meningkatkan skor produktivitas harian hingga 24%. Pertahankan rutinitas Anda!`
  }
  
  return 'Lakukan kebiasaan SUGGESTION Anda tepat waktu untuk menambahkan poin. Poin kebiasaan akan berubah menjadi ROUTINE secara otomatis ketika mencapai 10 poin.'
})

function toggleExpand(id) {
  expandedHabitId.value = expandedHabitId.value === id ? null : id
}

// Quick adjust points (+ / -)
async function handleAdjustPoints(id, increment) {
  const result = await adjustPoints(id, increment)
  if (result.success) {
    if (result.evolved) {
      if (increment > 0) {
        showToast('🎉 Selamat! Kebiasaan Anda berhasil berevolusi menjadi ROUTINE!', 'evolution')
        // Automatically switch tab to ROUTINE to show the evolved habit
        setTimeout(() => {
          activeTab.value = 'ROUTINE'
        }, 1200)
      } else {
        showToast('Kebiasaan diturunkan statusnya menjadi SUGGESTION.', 'info')
        setTimeout(() => {
          activeTab.value = 'SUGGESTION'
        }, 1200)
      }
    } else {
      showToast(increment > 0 ? 'Poin bertambah!' : 'Poin berkurang.', 'success')
    }
  } else {
    showToast(result.error || 'Gagal mengubah poin.', 'error')
  }
}

// Modal open helpers
function openAddModal() {
  addForm.activity_name = ''
  addForm.time_start = '07:00'
  addForm.time_end = '08:00'
  addForm.points = 0
  addForm.status = 'SUGGESTION'
  showAddModal.value = true
}

function openEditModal(habit) {
  Object.assign(editForm, {
    id: habit.id,
    activity_name: habit.activity_name,
    time_start: habit.time_start ? habit.time_start.slice(0, 5) : '07:00',
    time_end: habit.time_end ? habit.time_end.slice(0, 5) : '08:00',
    points: habit.points || 0,
    status: habit.status || 'SUGGESTION'
  })
  showEditModal.value = true
  expandedHabitId.value = null
}

function openDeleteConfirm(habit) {
  habitToDelete.value = habit
  showDeleteConfirm.value = true
  expandedHabitId.value = null
}

// Form submissions
async function handleAddSubmit() {
  if (!addForm.activity_name || !addForm.time_start || !addForm.time_end) {
    showToast('Harap lengkapi semua field wajib.', 'error')
    return
  }
  isSubmitting.value = true
  const res = await addHabit({
    activity_name: addForm.activity_name,
    time_start: addForm.time_start,
    time_end: addForm.time_end,
    points: addForm.points,
    status: addForm.status
  })
  isSubmitting.value = false
  if (res.success) {
    showAddModal.value = false
    showToast('Kebiasaan baru berhasil ditambahkan!', 'success')
  } else {
    showToast(res.error || 'Gagal menambahkan kebiasaan.', 'error')
  }
}

async function handleEditSubmit() {
  if (!editForm.activity_name || !editForm.time_start || !editForm.time_end) {
    showToast('Harap lengkapi semua field wajib.', 'error')
    return
  }
  isSubmitting.value = true
  const res = await updateHabit(editForm.id, {
    activity_name: editForm.activity_name,
    time_start: editForm.time_start,
    time_end: editForm.time_end,
    points: editForm.points,
    status: editForm.status
  })
  isSubmitting.value = false
  if (res.success) {
    showEditModal.value = false
    showToast('Kebiasaan berhasil diperbarui!', 'success')
    fetchHabits() // reload state
  } else {
    showToast(res.error || 'Gagal memperbarui kebiasaan.', 'error')
  }
}

async function handleDeleteSubmit() {
  if (!habitToDelete.value) return
  isSubmitting.value = true
  const res = await deleteHabit(habitToDelete.value.id)
  isSubmitting.value = false
  showDeleteConfirm.value = false
  if (res.success) {
    showToast('Kebiasaan berhasil dihapus.', 'success')
    habitToDelete.value = null
  } else {
    showToast(res.error || 'Gagal menghapus kebiasaan.', 'error')
  }
}

// UI styling utilities
function getProgressBarColor(points) {
  if (points < 4) return 'bg-gradient-to-r from-red-500 to-orange-400'
  if (points < 8) return 'bg-gradient-to-r from-orange-400 to-indigo-500'
  return 'bg-gradient-to-r from-indigo-500 to-success-400'
}

function getProgressBarShadow(points) {
  if (points < 4) return 'shadow-red-500/20'
  if (points < 8) return 'shadow-indigo-500/20'
  return 'shadow-success-500/20'
}

function formatTime(timeStr) {
  if (!timeStr) return ''
  return timeStr.slice(0, 5) // convert "07:00:00" to "07:00"
}
</script>

<template>
  <div class="stagger-children min-h-screen">
    
    <!-- Custom Toast Overlay -->
    <transition name="toast-slide">
      <div
        v-if="toast.show"
        class="fixed top-5 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-sm p-4 rounded-2xl shadow-2xl border flex items-center gap-3 backdrop-blur-xl transition-all"
        :class="{
          'bg-surface-850/90 border-blue-500/30 text-blue-400': toast.type === 'info',
          'bg-success-500/15 border-success-500/30 text-success-400': toast.type === 'success',
          'bg-danger-500/15 border-danger-500/30 text-danger-400': toast.type === 'error',
          'bg-purple-500/15 border-purple-500/30 text-purple-400 animate-bounce': toast.type === 'evolution',
        }"
      >
        <div class="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
          <Sparkles v-if="toast.type === 'evolution'" class="w-4 h-4 text-purple-400 animate-spin" />
          <Loader2 v-else-if="toast.type === 'info'" class="w-4 h-4 animate-spin text-primary-400" />
          <span v-else>{{ toast.type === 'success' ? '✔' : '⚠' }}</span>
        </div>
        <span class="text-xs font-semibold text-surface-200">{{ toast.message }}</span>
      </div>
    </transition>

    <!-- AI Habit Analysis Header -->
    <AIInsightCard
      title="AI Habit Intelligence"
      :message="aiInsightMessage"
      timestamp="2 menit lalu"
      :icon="Sparkles"
    />

    <!-- Statistics Widget Grid -->
    <div class="grid grid-cols-3 gap-3 mx-4 mb-4">
      <div class="surface-card-sm p-3 flex flex-col justify-between border border-white/5 bg-surface-800/20 backdrop-blur-md rounded-2xl">
        <p class="text-[10px] text-surface-500 font-semibold uppercase tracking-wider">Total Habit</p>
        <div class="flex items-baseline gap-1.5 mt-1">
          <span class="text-xl font-bold text-white">{{ totalHabits }}</span>
          <span class="text-[10px] text-surface-400">kebiasaan</span>
        </div>
      </div>
      <div class="surface-card-sm p-3 flex flex-col justify-between border border-white/5 bg-surface-800/20 backdrop-blur-md rounded-2xl">
        <p class="text-[10px] text-surface-500 font-semibold uppercase tracking-wider">Routine</p>
        <div class="flex items-baseline gap-1.5 mt-1">
          <span class="text-xl font-bold text-success-400">{{ routineCount }}</span>
          <span class="text-[10px] text-surface-400">aktif</span>
        </div>
      </div>
      <div class="surface-card-sm p-3 flex flex-col justify-between border border-white/5 bg-surface-800/20 backdrop-blur-md rounded-2xl">
        <p class="text-[10px] text-surface-500 font-semibold uppercase tracking-wider">Rata-rata Poin</p>
        <div class="flex items-baseline gap-1.5 mt-1">
          <span class="text-xl font-bold text-primary-400">{{ avgPoints }}</span>
          <span class="text-[10px] text-surface-400">/10</span>
        </div>
      </div>
    </div>

    <!-- Search and Actions Bar -->
    <div class="mx-4 mb-4 flex gap-3 items-center">
      <!-- Search Input -->
      <div class="relative flex-1">
        <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
          <Search class="w-4 h-4 text-surface-500" />
        </span>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Cari kebiasaan..."
          class="w-full bg-surface-800/50 border border-surface-700/50 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-surface-500 focus:outline-none focus:border-primary-500 transition-colors"
        />
      </div>

      <!-- Add New Habit Trigger -->
      <button
        @click="openAddModal"
        class="py-2.5 px-4 rounded-2xl bg-gradient-to-r from-primary-500 to-indigo-600 hover:from-primary-600 hover:to-indigo-700 text-xs font-bold text-white tracking-wider flex items-center gap-1.5 active:scale-95 transition-all shrink-0"
      >
        <Plus class="w-4 h-4" />
        <span>Tambah</span>
      </button>
    </div>

    <!-- Segmented Tab Controls (Suggestion vs Routine) -->
    <div class="mx-4 mb-4">
      <div class="grid grid-cols-2 gap-2 bg-surface-800/50 p-1 rounded-2xl border border-surface-700/50">
        <button
          type="button"
          @click="activeTab = 'SUGGESTION'"
          class="flex items-center justify-center gap-2 py-2.5 text-xs font-semibold rounded-xl transition-all"
          :class="activeTab === 'SUGGESTION' ? 'bg-primary-500/20 border border-primary-500/30 text-primary-400 shadow-sm' : 'text-surface-400 hover:text-white'"
        >
          <span>Suggestion</span>
          <span 
            class="text-[9px] px-1.5 py-0.5 rounded-full font-bold" 
            :class="activeTab === 'SUGGESTION' ? 'bg-primary-500/20 text-primary-400' : 'bg-surface-800 text-surface-500'"
          >
            {{ suggestionCount }}
          </span>
        </button>
        <button
          type="button"
          @click="activeTab = 'ROUTINE'"
          class="flex items-center justify-center gap-2 py-2.5 text-xs font-semibold rounded-xl transition-all"
          :class="activeTab === 'ROUTINE' ? 'bg-success-500/10 border border-success-500/20 text-success-400 shadow-sm' : 'text-surface-400 hover:text-white'"
        >
          <span>Routine</span>
          <span 
            class="text-[9px] px-1.5 py-0.5 rounded-full font-bold" 
            :class="activeTab === 'ROUTINE' ? 'bg-success-500/25 text-success-400' : 'bg-surface-800 text-surface-500'"
          >
            {{ routineCount }}
          </span>
        </button>
      </div>
    </div>

    <!-- Loading Skeletons -->
    <div v-if="isLoading" class="mx-4 space-y-2.5 pb-20 animate-pulse">
      <div v-for="i in 3" :key="i" class="surface-card-sm p-4 border border-white/5 bg-surface-800/20 backdrop-blur-md rounded-2xl">
        <div class="flex items-center justify-between gap-3 w-full mb-3">
          <div class="flex items-center gap-3 flex-1">
            <div class="w-10 h-10 bg-surface-700/40 rounded-xl shrink-0"></div>
            <div class="space-y-2 flex-1">
              <div class="h-3.5 bg-surface-700/40 rounded-lg w-2/3"></div>
              <div class="h-2.5 bg-surface-700/30 rounded-lg w-1/3"></div>
            </div>
          </div>
          <div class="w-16 h-8 bg-surface-700/30 rounded-2xl shrink-0"></div>
        </div>
        <div v-if="activeTab === 'SUGGESTION'" class="space-y-1.5 mt-2">
          <div class="flex justify-between w-full">
            <div class="w-20 h-2 bg-surface-700/30 rounded-lg"></div>
            <div class="w-8 h-2.5 bg-surface-700/30 rounded-lg"></div>
          </div>
          <div class="h-2 bg-surface-700/30 rounded-full w-full"></div>
        </div>
      </div>
    </div>

    <!-- Empty States -->
    <div v-else-if="filteredHabits.length === 0" class="mx-4 mb-4 text-center py-10 surface-card p-6 border border-white/5">
      <div class="w-12 h-12 rounded-full bg-surface-800 flex items-center justify-center text-surface-500 mx-auto mb-3">
        <Award class="w-6 h-6" />
      </div>
      <h3 class="text-sm font-semibold text-white mb-1">Tidak Ada Kebiasaan</h3>
      <p class="text-xs text-surface-500 max-w-[240px] mx-auto leading-relaxed">
        {{ searchQuery ? 'Tidak ada kebiasaan mencocokkan kata kunci pencarian Anda.' : (activeTab === 'SUGGESTION' ? 'Semua kebiasaan suggestion telah berevolusi menjadi ROUTINE!' : 'Belum ada kebiasaan ROUTINE. Kumpulkan 10 poin pada kebiasaan suggestion untuk berevolusi.') }}
      </p>
    </div>

    <!-- Habit List -->
    <div v-else class="mx-4 space-y-2.5 pb-20">
      <div
        v-for="habit in filteredHabits"
        :key="habit.id"
        class="surface-card-sm overflow-hidden transition-all duration-300"
        :class="expandedHabitId === habit.id ? 'ring-1 ring-primary-500/30' : ''"
      >
        <!-- Card Header Info -->
        <div class="flex items-center gap-3 p-3.5 text-left w-full">
          <!-- Icon Indicator based on Points/Status -->
          <button 
            @click="toggleExpand(habit.id)" 
            class="w-10 h-10 rounded-xl flex items-center justify-center text-base shrink-0 transition-transform active:scale-95"
            :class="habit.status === 'ROUTINE' ? 'bg-success-500/10 text-success-400 border border-success-500/10' : 'bg-surface-800 text-surface-400'"
          >
            <Award v-if="habit.status === 'ROUTINE'" class="w-5 h-5 animate-pulse" />
            <Clock v-else class="w-5 h-5" />
          </button>

          <!-- Habit Details -->
          <div class="flex-1 min-w-0 cursor-pointer" @click="toggleExpand(habit.id)">
            <h4 class="text-sm font-bold text-white truncate">{{ habit.activity_name }}</h4>
            <div class="flex items-center gap-2 mt-0.5">
              <span class="text-[10px] font-medium text-surface-500 flex items-center gap-1">
                <Clock class="w-3 h-3" />
                {{ formatTime(habit.time_start) }} - {{ formatTime(habit.time_end) }}
              </span>
              <span 
                class="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full tracking-wider border"
                :class="habit.status === 'ROUTINE' ? 'bg-success-500/10 text-success-400 border-success-500/20' : 'bg-surface-800 text-surface-400 border-white/5'"
              >
                {{ habit.status }}
              </span>
            </div>
          </div>

          <!-- Points Adjuster Controls -->
          <div class="flex items-center gap-1.5 shrink-0 bg-surface-900/60 border border-white/5 px-2 py-1.5 rounded-2xl">
            <button
              @click="handleAdjustPoints(habit.id, -1)"
              class="w-6.5 h-6.5 rounded-lg bg-surface-800 hover:bg-surface-700 active:scale-90 text-surface-400 hover:text-white flex items-center justify-center transition-all"
              title="Kurang 1 Poin"
              :disabled="habit.points <= 0"
              :class="habit.points <= 0 ? 'opacity-30 cursor-not-allowed' : ''"
            >
              <Minus class="w-3.5 h-3.5" />
            </button>
            
            <span class="text-xs font-bold text-white min-w-[18px] text-center">
              {{ habit.points }}
            </span>
            
            <button
              @click="handleAdjustPoints(habit.id, 1)"
              class="w-6.5 h-6.5 rounded-lg bg-surface-800 hover:bg-surface-700 active:scale-90 text-surface-400 hover:text-white flex items-center justify-center transition-all"
              title="Tambah 1 Poin"
              :disabled="habit.points >= 10"
              :class="habit.points >= 10 ? 'opacity-30 cursor-not-allowed' : ''"
            >
              <Plus class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <!-- Custom Gamified Evolution Progress Bar (Only for SUGGESTION) -->
        <div v-if="habit.status === 'SUGGESTION'" class="px-3.5 pb-3">
          <div class="flex justify-between items-center mb-1">
            <span class="text-[9px] font-bold text-surface-500 uppercase tracking-wider">Evolution Progress</span>
            <span class="text-[10px] font-bold text-surface-300">{{ habit.points * 10 }}% ({{ habit.points }}/10 Poin)</span>
          </div>
          <div class="h-2 bg-surface-700/50 rounded-full overflow-hidden relative">
            <div
              class="h-full rounded-full transition-all duration-500 ease-out shadow-sm"
              :class="[getProgressBarColor(habit.points), getProgressBarShadow(habit.points)]"
              :style="{ width: (habit.points * 10) + '%' }"
            ></div>
          </div>
        </div>

        <!-- Expandable Detail Actions Accordion -->
        <div
          class="accordion-body"
          :class="expandedHabitId === habit.id ? 'open' : ''"
        >
          <div class="px-3.5 pb-3 pt-1 border-t border-surface-700/50 flex gap-2">
            <button
              @click="openEditModal(habit)"
              class="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-primary-500/10 text-primary-400 text-xs font-semibold hover:bg-primary-500/20 active:scale-98 transition-colors"
            >
              <Edit3 class="w-3.5 h-3.5" />
              Edit
            </button>
            <button
              @click="openDeleteConfirm(habit)"
              class="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-danger-500/10 text-danger-400 text-xs font-semibold hover:bg-danger-500/20 active:scale-98 transition-colors"
            >
              <Trash2 class="w-3.5 h-3.5" />
              Hapus
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modals Teleported to Body -->
    <Teleport to="body">
      
      <!-- Backdrop -->
      <transition name="fade">
        <div
          v-if="showAddModal || showEditModal || showDeleteConfirm"
          class="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          @click="() => { showAddModal = false; showEditModal = false; showDeleteConfirm = false; }"
        ></div>
      </transition>

      <!-- Modal: Tambah Kebiasaan -->
      <transition name="modal-scale">
        <div
          v-if="showAddModal"
          class="fixed inset-x-4 top-[10%] bottom-[10%] max-w-md mx-auto z-[45] bg-surface-900 border border-surface-700/50 rounded-[28px] shadow-2xl flex flex-col overflow-hidden p-5 text-left"
        >
          <!-- Modal Header -->
          <div class="flex items-center justify-between border-b border-surface-700/50 pb-3 mb-4 shrink-0">
            <div class="flex items-center gap-2">
              <div class="w-9 h-9 rounded-xl bg-primary-500/10 flex items-center justify-center">
                <Plus class="w-5 h-5 text-primary-400" />
              </div>
              <div>
                <h3 class="text-base font-bold text-white">Tambah Kebiasaan</h3>
                <p class="text-[10px] text-surface-400 mt-0.5">Tambah target kebiasaan baru Anda</p>
              </div>
            </div>
            <button
              @click="showAddModal = false"
              class="p-1.5 rounded-lg bg-surface-800 text-surface-400 hover:text-white"
            >
              <X class="w-4 h-4" />
            </button>
          </div>

          <!-- Add Form -->
          <form @submit.prevent="handleAddSubmit" class="flex-1 overflow-y-auto pr-1 space-y-4 pb-2">
            <!-- Activity Name -->
            <div>
              <label class="block text-xs font-semibold text-surface-400 mb-1.5 uppercase tracking-wider">Nama Aktivitas / Kebiasaan</label>
              <input
                v-model="addForm.activity_name"
                type="text"
                placeholder="Membaca buku, Olahraga pagi, dsb."
                required
                class="w-full bg-surface-800/50 border border-surface-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary-500 transition-colors"
              />
            </div>

            <!-- Time Start & End -->
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-semibold text-surface-400 mb-1.5 uppercase tracking-wider">Jam Mulai</label>
                <input
                  v-model="addForm.time_start"
                  type="time"
                  required
                  class="w-full bg-surface-800/50 border border-surface-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary-500 transition-colors"
                />
              </div>
              <div>
                <label class="block text-xs font-semibold text-surface-400 mb-1.5 uppercase tracking-wider">Jam Selesai</label>
                <input
                  v-model="addForm.time_end"
                  type="time"
                  required
                  class="w-full bg-surface-800/50 border border-surface-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary-500 transition-colors"
                />
              </div>
            </div>

            <!-- Initial Points -->
            <div>
              <label class="block text-xs font-semibold text-surface-400 mb-1.5 uppercase tracking-wider">Poin Awal (0 - 10)</label>
              <div class="flex items-center gap-3">
                <input
                  v-model.number="addForm.points"
                  type="range"
                  min="0"
                  max="10"
                  class="flex-1 accent-primary-500"
                />
                <span class="text-sm font-bold text-white bg-surface-800 px-3 py-1 rounded-lg min-w-[36px] text-center border border-white/5">
                  {{ addForm.points }}
                </span>
              </div>
            </div>

            <!-- Status Choice -->
            <div>
              <label class="block text-xs font-semibold text-surface-400 mb-1.5 uppercase tracking-wider">Status Awal</label>
              <select
                v-model="addForm.status"
                class="w-full bg-surface-800/50 border border-surface-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-primary-500 transition-colors"
              >
                <option value="SUGGESTION">SUGGESTION (Rekomendasi / Belum Rutin)</option>
                <option value="ROUTINE">ROUTINE (Rutinitas / Sudah Konsisten)</option>
              </select>
            </div>

            <!-- Submit Button -->
            <button
              type="submit"
              :disabled="isSubmitting"
              class="w-full py-3.5 rounded-xl bg-gradient-to-r from-primary-500 to-indigo-600 hover:from-primary-600 hover:to-indigo-700 text-xs font-bold text-white tracking-wider uppercase active:scale-98 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-primary-500/20"
            >
              <Loader2 v-if="isSubmitting" class="w-4 h-4 animate-spin" />
              <span>{{ isSubmitting ? 'Menyimpan...' : 'Simpan Kebiasaan' }}</span>
            </button>
          </form>
        </div>
      </transition>

      <!-- Modal: Edit Kebiasaan -->
      <transition name="modal-scale">
        <div
          v-if="showEditModal"
          class="fixed inset-x-4 top-[10%] bottom-[10%] max-w-md mx-auto z-[45] bg-surface-900 border border-surface-700/50 rounded-[28px] shadow-2xl flex flex-col overflow-hidden p-5 text-left"
        >
          <!-- Modal Header -->
          <div class="flex items-center justify-between border-b border-surface-700/50 pb-3 mb-4 shrink-0">
            <div class="flex items-center gap-2">
              <div class="w-9 h-9 rounded-xl bg-primary-500/10 flex items-center justify-center">
                <Edit3 class="w-5 h-5 text-primary-400" />
              </div>
              <div>
                <h3 class="text-base font-bold text-white">Edit Kebiasaan</h3>
                <p class="text-[10px] text-surface-400 mt-0.5">Ubah data kebiasaan</p>
              </div>
            </div>
            <button
              @click="showEditModal = false"
              class="p-1.5 rounded-lg bg-surface-800 text-surface-400 hover:text-white"
            >
              <X class="w-4 h-4" />
            </button>
          </div>

          <!-- Edit Form -->
          <form @submit.prevent="handleEditSubmit" class="flex-1 overflow-y-auto pr-1 space-y-4 pb-2">
            <!-- Activity Name -->
            <div>
              <label class="block text-xs font-semibold text-surface-400 mb-1.5 uppercase tracking-wider">Nama Aktivitas / Kebiasaan</label>
              <input
                v-model="editForm.activity_name"
                type="text"
                required
                class="w-full bg-surface-800/50 border border-surface-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary-500 transition-colors"
              />
            </div>

            <!-- Time Start & End -->
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-semibold text-surface-400 mb-1.5 uppercase tracking-wider">Jam Mulai</label>
                <input
                  v-model="editForm.time_start"
                  type="time"
                  required
                  class="w-full bg-surface-800/50 border border-surface-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary-500 transition-colors"
                />
              </div>
              <div>
                <label class="block text-xs font-semibold text-surface-400 mb-1.5 uppercase tracking-wider">Jam Selesai</label>
                <input
                  v-model="editForm.time_end"
                  type="time"
                  required
                  class="w-full bg-surface-800/50 border border-surface-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary-500 transition-colors"
                />
              </div>
            </div>

            <!-- Points Range -->
            <div>
              <label class="block text-xs font-semibold text-surface-400 mb-1.5 uppercase tracking-wider">Poin Saat Ini (0 - 10)</label>
              <div class="flex items-center gap-3">
                <input
                  v-model.number="editForm.points"
                  type="range"
                  min="0"
                  max="10"
                  class="flex-1 accent-primary-500"
                />
                <span class="text-sm font-bold text-white bg-surface-800 px-3 py-1 rounded-lg min-w-[36px] text-center border border-white/5">
                  {{ editForm.points }}
                </span>
              </div>
            </div>

            <!-- Status Choice -->
            <div>
              <label class="block text-xs font-semibold text-surface-400 mb-1.5 uppercase tracking-wider">Status</label>
              <select
                v-model="editForm.status"
                class="w-full bg-surface-800/50 border border-surface-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none"
              >
                <option value="SUGGESTION">SUGGESTION</option>
                <option value="ROUTINE">ROUTINE</option>
              </select>
            </div>

            <!-- Submit Button -->
            <button
              type="submit"
              :disabled="isSubmitting"
              class="w-full py-3.5 rounded-xl bg-gradient-to-r from-primary-500 to-indigo-600 hover:from-primary-600 hover:to-indigo-700 text-xs font-bold text-white tracking-wider uppercase active:scale-98 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-primary-500/20"
            >
              <Loader2 v-if="isSubmitting" class="w-4 h-4 animate-spin" />
              <span>{{ isSubmitting ? 'Menyimpan Perubahan...' : 'Simpan Perubahan' }}</span>
            </button>
          </form>
        </div>
      </transition>

      <!-- Modal: Konfirmasi Hapus -->
      <transition name="modal-scale">
        <div
          v-if="showDeleteConfirm"
          class="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-sm mx-auto z-[50] bg-surface-900 border border-surface-700/50 rounded-[28px] p-5 shadow-2xl flex flex-col items-center text-center"
        >
          <div class="w-12 h-12 rounded-full bg-danger-500/15 flex items-center justify-center mb-4">
            <Trash2 class="w-6 h-6 text-danger-400" />
          </div>
          <h3 class="text-base font-bold text-white mb-2">Hapus Kebiasaan?</h3>
          <p class="text-xs text-surface-400 mb-6 leading-relaxed">
            Apakah Anda yakin ingin menghapus kebiasaan <span class="font-bold text-white">"{{ habitToDelete?.activity_name }}"</span>? Tindakan ini akan menghapus data permanen dari database.
          </p>
          <div class="flex items-center gap-3 w-full">
            <button
              type="button"
              @click="showDeleteConfirm = false"
              class="flex-1 py-2.5 rounded-xl bg-surface-800 border border-white/5 text-xs font-semibold text-surface-300 hover:bg-surface-700 active:scale-95 transition-all"
            >
              Batal
            </button>
            <button
              type="button"
              @click="handleDeleteSubmit"
              :disabled="isSubmitting"
              class="flex-1 py-2.5 rounded-xl bg-danger-500 hover:bg-danger-600 text-xs font-semibold text-white active:scale-95 transition-all shadow-lg shadow-danger-500/20 disabled:opacity-50 flex items-center justify-center gap-1"
            >
              <Loader2 v-if="isSubmitting" class="w-3.5 h-3.5 animate-spin" />
              <span>Hapus</span>
            </button>
          </div>
        </div>
      </transition>
    </Teleport>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.modal-scale-enter-active,
.modal-scale-leave-active {
  transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
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
