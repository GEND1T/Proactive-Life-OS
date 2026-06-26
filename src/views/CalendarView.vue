<script setup>
import { ref, onMounted, onUnmounted, watch, reactive } from 'vue'
import { 
  Calendar, AlertCircle, RefreshCw, X, Trash2, Save,
  GraduationCap, Code, Target, Users, ChevronDown 
} from 'lucide-vue-next'
import AIInsightCard from '../components/shared/AIInsightCard.vue'
import WeekStrip from '../components/calendar/WeekStrip.vue'
import TimelineView from '../components/calendar/TimelineView.vue'
import { getValidToken, fetchEventsForDate, initTokenClient, updateGoogleEvent, deleteGoogleEvent } from '../services/googleCalendar'
import { getLocalEvents, updateEvent, deleteEvent } from '../services/localCalendar'

const selectedDate = ref(new Date())
const events = ref([])
const isLoading = ref(false)
const errorMsg = ref('')

const isConnected = ref(false)

// Edit Modal State
const selectedEventForEdit = ref(null)
const showEditModal = ref(false)
const editForm = reactive({
  id: '',
  title: '',
  start: '',
  end: '',
  category: 'personal',
  color: 'yellow',
  location: '',
  description: ''
})
const isSavingEdit = ref(false)
const isDeletingEvent = ref(false)

const showEditCategoryDropdown = ref(false)

const calendarCategories = [
  { id: 'akademik', label: 'Akademik', icon: GraduationCap, colorClass: 'text-blue-400' },
  { id: 'coding', label: 'Coding', icon: Code, colorClass: 'text-green-400' },
  { id: 'meeting', label: 'Meeting', icon: Users, colorClass: 'text-purple-400' },
  { id: 'deadline', label: 'Deadline', icon: AlertCircle, colorClass: 'text-red-400' },
  { id: 'personal', label: 'Personal', icon: Target, colorClass: 'text-yellow-400' },
]

onMounted(() => {
  checkConnectionAndLoad()
  window.addEventListener('local-events-updated', checkConnectionAndLoad)
})

onUnmounted(() => {
  window.removeEventListener('local-events-updated', checkConnectionAndLoad)
})

watch(selectedDate, () => {
  checkConnectionAndLoad()
})

function checkConnectionAndLoad() {
  const token = getValidToken()
  isConnected.value = !!token
  if (isConnected.value) {
    loadEvents()
  } else {
    events.value = getLocalEvents()
    errorMsg.value = ''
  }
}

function getLocalDateString(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

async function loadEvents() {
  isLoading.value = true
  errorMsg.value = ''
  try {
    const googleEvents = await fetchEventsForDate(selectedDate.value)
    // Gabungkan data dari Google Calendar dan data lokal buatan user
    const allLocal = getLocalEvents()
    events.value = [...googleEvents, ...allLocal]
  } catch (err) {
    console.error('Failed to load Google events:', err)
    errorMsg.value = err.message || 'Gagal memuat jadwal dari Google Calendar'
    // Fallback ke local events saja jika google calendar gagal
    events.value = getLocalEvents()
  } finally {
    isLoading.value = false
  }
}

function handleReconnect() {
  initTokenClient((token) => {
    if (token) {
      isConnected.value = true
      loadEvents()
    }
  })
}

function onDateSelect(date) {
  selectedDate.value = date
}

// Edit Event Logic
function toLocalDateTimeString(date) {
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

function openEditModal(event) {
  selectedEventForEdit.value = event
  
  const startLocal = toLocalDateTimeString(event.start)
  const endLocal = toLocalDateTimeString(event.end)

  Object.assign(editForm, {
    id: event.id,
    title: event.title,
    start: startLocal,
    end: endLocal,
    category: event.category || 'personal',
    color: event.color || 'yellow',
    location: event.location || '',
    description: event.description || ''
  })
  
  showEditModal.value = true
}

function handleUpdateSubmit() {
  if (!editForm.title || !editForm.start) return
  
  const isGoogleEvent = isConnected.value && !String(editForm.id).startsWith('evt-local-') && !String(editForm.id).startsWith('evt-')
  
  isSavingEdit.value = true
  try {
    const payload = {
      title: editForm.title,
      start: new Date(editForm.start).toISOString(),
      end: editForm.end ? new Date(editForm.end).toISOString() : new Date(editForm.start).toISOString(),
      category: editForm.category,
      color: editForm.color,
      location: editForm.location,
      description: editForm.description
    }

    if (isGoogleEvent) {
      updateGoogleEvent(editForm.id, payload).then(() => {
        showEditModal.value = false
        checkConnectionAndLoad()
      }).catch(err => {
        console.error('Error updating Google event:', err)
        alert(err.message || 'Gagal memperbarui jadwal di Google Calendar.')
      }).finally(() => {
        isSavingEdit.value = false
      })
    } else {
      const success = updateEvent(editForm.id, payload)
      if (success) {
        showEditModal.value = false
        checkConnectionAndLoad()
      } else {
        alert('Gagal memperbarui jadwal lokal.')
      }
      isSavingEdit.value = false
    }
  } catch (err) {
    console.error('Error updating event:', err)
    alert('Terjadi kesalahan saat mengupdate jadwal.')
    isSavingEdit.value = false
  }
}

function handleDeleteEvent() {
  if (!editForm.id) return

  const isGoogleEvent = isConnected.value && !String(editForm.id).startsWith('evt-local-') && !String(editForm.id).startsWith('evt-')
  
  if (!confirm(isGoogleEvent ? 'Apakah Anda yakin ingin menghapus jadwal ini dari Google Calendar?' : 'Apakah Anda yakin ingin menghapus jadwal lokal ini?')) return

  isDeletingEvent.value = true
  try {
    if (isGoogleEvent) {
      deleteGoogleEvent(editForm.id).then(() => {
        showEditModal.value = false
        checkConnectionAndLoad()
      }).catch(err => {
        console.error('Error deleting Google event:', err)
        alert(err.message || 'Gagal menghapus jadwal di Google Calendar.')
      }).finally(() => {
        isDeletingEvent.value = false
      })
    } else {
      const success = deleteEvent(editForm.id)
      if (success) {
        showEditModal.value = false
        checkConnectionAndLoad()
      } else {
        alert('Gagal menghapus jadwal lokal.')
      }
      isDeletingEvent.value = false
    }
  } catch (err) {
    console.error('Error deleting event:', err)
    alert('Terjadi kesalahan saat menghapus jadwal.')
    isDeletingEvent.value = false
  }
}
</script>

<template>
  <div>
    <!-- AI Insight -->
    <AIInsightCard
      title="AI Schedule Analysis"
      message="Ada jeda 2 jam kosong di siang hari (12:30-14:00), cocok untuk istirahat atau coding project web. Deadline tugas AI malam ini — pastikan submit sebelum 23:59!"
      timestamp="3 menit lalu"
      :icon="Calendar"
    />

    <!-- Week Strip Calendar -->
    <WeekStrip
      :selected-date="selectedDate"
      @select="onDateSelect"
    />

    <!-- Selected Date Label -->
    <div class="px-4 mb-3">
      <h3 class="text-sm font-semibold text-surface-300">
        {{ selectedDate.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' }) }}
      </h3>
    </div>

    <!-- Timeline & Loaders -->
    <div class="relative min-h-[150px]">
      <div v-if="isLoading" class="absolute inset-0 bg-background/50 backdrop-blur-[1px] flex flex-col items-center justify-center z-10 py-10">
        <RefreshCw class="w-8 h-8 text-primary-400 animate-spin mb-3" />
        <p class="text-xs font-semibold text-surface-400 uppercase tracking-widest">Sinkronisasi Google API...</p>
      </div>

      <div v-if="errorMsg" class="mx-4 mb-4 p-4 rounded-2xl bg-danger-500/10 border border-danger-500/20 text-danger-400 flex items-start gap-3">
        <AlertCircle class="w-5 h-5 shrink-0 mt-0.5" />
        <div class="flex-1">
          <h4 class="text-xs font-bold uppercase tracking-wider mb-1">Gagal Sinkronisasi</h4>
          <p class="text-[11px] text-surface-400 leading-relaxed">{{ errorMsg }}</p>
          <button @click="handleReconnect" class="mt-2.5 px-3 py-1.5 text-[9px] font-bold text-white bg-danger-500/20 rounded-lg hover:bg-danger-500/30 border border-danger-500/30 transition-colors uppercase">
            Login Ulang
          </button>
        </div>
      </div>

      <TimelineView
        v-if="!isLoading"
        :events="events"
        :selected-date="selectedDate"
        @edit-event="openEditModal"
      />
    </div>

    <!-- Modal: Edit/Detail Jadwal -->
    <transition name="modal-scale">
      <div
        v-if="showEditModal"
        class="fixed inset-x-4 top-[10%] bottom-[10%] max-w-md mx-auto z-[70] surface-card p-5 border border-white/5 shadow-2xl flex flex-col overflow-hidden text-left"
      >
        <!-- Modal Header -->
        <div class="flex items-center justify-between border-b border-surface-700/50 pb-3 mb-4 shrink-0">
          <div class="flex items-center gap-2">
            <div class="w-9 h-9 rounded-xl bg-primary-500/10 flex items-center justify-center">
              <Calendar class="w-5 h-5 text-primary-400" />
            </div>
            <div>
              <h3 class="text-base font-bold text-white">Rincian Jadwal</h3>
              <p class="text-[10px] text-surface-400 mt-0.5">Ubah detail atau hapus agenda terpilih</p>
            </div>
          </div>
          <button
            @click="showEditModal = false"
            class="p-1.5 rounded-lg bg-surface-800 text-surface-400 hover:text-white"
          >
            <X class="w-4 h-4" />
          </button>
        </div>

        <!-- Scrollable Form Content -->
        <form @submit.prevent="handleUpdateSubmit" class="flex-1 overflow-y-auto pr-1 space-y-4 pb-2">
          <!-- Google Calendar Sync Banner -->
          <div v-if="isConnected && !String(editForm.id).startsWith('evt-local-') && !String(editForm.id).startsWith('evt-')" class="p-3.5 rounded-xl bg-success-500/10 border border-success-500/20 text-success-400 text-[10px] leading-relaxed">
            ✨ Agenda disinkronkan dari Google Calendar Anda. Perubahan akan disimpan langsung ke Google Calendar secara real-time.
          </div>

          <!-- Title -->
          <div>
            <label class="block text-xs font-semibold text-surface-400 mb-1.5 uppercase tracking-wider">Judul Agenda</label>
            <input
              v-model="editForm.title"
              type="text"
              required
              :disabled="isSavingEdit || isDeletingEvent"
              class="w-full bg-surface-800/50 border border-surface-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary-500 transition-colors disabled:opacity-50"
            />
          </div>

          <!-- Date Time Inputs -->
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-semibold text-surface-400 mb-1.5 uppercase tracking-wider">Waktu Mulai</label>
              <input
                v-model="editForm.start"
                type="datetime-local"
                required
                :disabled="isSavingEdit || isDeletingEvent"
                class="w-full bg-surface-800/50 border border-surface-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary-500 transition-colors disabled:opacity-50"
              />
            </div>
            <div>
              <label class="block text-xs font-semibold text-surface-400 mb-1.5 uppercase tracking-wider">Waktu Selesai</label>
              <input
                v-model="editForm.end"
                type="datetime-local"
                required
                :disabled="isSavingEdit || isDeletingEvent"
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
                @click="showEditCategoryDropdown = !showEditCategoryDropdown"
                :disabled="isSavingEdit || isDeletingEvent"
                class="w-full flex items-center justify-between bg-surface-800/50 border border-surface-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-primary-500 transition-colors disabled:opacity-50"
              >
                <div class="flex items-center gap-2">
                  <component 
                    :is="calendarCategories.find(c => c.id === editForm.category)?.icon || Target" 
                    class="w-4 h-4" 
                    :class="calendarCategories.find(c => c.id === editForm.category)?.colorClass || 'text-surface-400'" 
                  />
                  <span>{{ calendarCategories.find(c => c.id === editForm.category)?.label || 'Personal' }}</span>
                </div>
                <ChevronDown class="w-4 h-4 text-surface-400 transition-transform duration-200" :class="showEditCategoryDropdown ? 'rotate-180' : ''" />
              </button>
              
              <div
                v-if="showEditCategoryDropdown"
                class="absolute z-50 left-0 right-0 mt-1 bg-surface-900 border border-surface-700/80 rounded-xl shadow-2xl max-h-48 overflow-y-auto p-1"
              >
                <button
                  v-for="cat in calendarCategories"
                  :key="cat.id"
                  type="button"
                  @click="editForm.category = cat.id; showEditCategoryDropdown = false"
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
                v-model="editForm.color"
                :disabled="isSavingEdit || isDeletingEvent"
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
              v-model="editForm.location"
              type="text"
              placeholder="Ruangan, Zoom Link, Kafe, dll."
              :disabled="isSavingEdit || isDeletingEvent"
              class="w-full bg-surface-800/50 border border-surface-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary-500 transition-colors disabled:opacity-50"
            />
          </div>

          <!-- Description -->
          <div>
            <label class="block text-xs font-semibold text-surface-400 mb-1.5 uppercase tracking-wider">Deskripsi Detail</label>
            <textarea
              v-model="editForm.description"
              rows="3"
              placeholder="Detail kegiatan..."
              :disabled="isSavingEdit || isDeletingEvent"
              class="w-full bg-surface-800/50 border border-surface-700 rounded-xl px-4 py-2 text-sm text-white placeholder-surface-500 focus:outline-none focus:border-primary-500 transition-colors disabled:opacity-50"
            ></textarea>
          </div>

          <!-- Submit / Delete Buttons -->
          <div class="flex gap-3 pt-2">
            <!-- Delete Button -->
            <button
              type="button"
              @click="handleDeleteEvent"
              :disabled="isDeletingEvent || isSavingEdit"
              class="flex-1 py-3.5 rounded-xl bg-danger-500/10 hover:bg-danger-500/20 text-danger-400 border border-danger-500/20 text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 active:scale-95"
            >
              <Trash2 class="w-4 h-4" />
              Hapus
            </button>

            <!-- Save Button -->
            <button
              type="submit"
              :disabled="isSavingEdit || isDeletingEvent"
              class="flex-[2] py-3.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-xs font-bold text-white tracking-wider uppercase shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 active:scale-95"
            >
              <Save class="w-4 h-4" />
              Simpan
            </button>
          </div>
        </form>
      </div>
    </transition>

    <!-- Backdrop for Edit Modal -->
    <transition name="fade">
      <div
        v-if="showEditModal"
        class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
        @click="showEditModal = false"
      ></div>
    </transition>
  </div>
</template>
