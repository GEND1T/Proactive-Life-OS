<script setup>
import { ref, reactive, computed } from 'vue'
import {
  Plus, X, Loader2, Moon, Footprints, Smartphone, Code, Brain, Heart, Smile
} from 'lucide-vue-next'
import { useActivityDB } from '../../composables/useActivityDB'

const props = defineProps({
  show: Boolean,
})
const emit = defineEmits(['close', 'saved'])

const { addActivityLog } = useActivityDB()

const isSubmitting = ref(false)

const form = reactive({
  logged_date: new Date().toISOString().split('T')[0],
  sleep_hours: 7,
  sleep_minutes: 0,
  deep_sleep_minutes: 90,
  screen_time_hours: 3,
  screen_time_minutes: 0,
  wakatime_coding_hours: 2,
  steps_count: 5000,
  resting_heart_rate: 68,
  stress_level_score: 30,
  mood_score: 7,
})

// Toast
const toast = reactive({ show: false, message: '', type: 'info' })
function showToast(message, type = 'info') {
  toast.message = message
  toast.type = type
  toast.show = true
  setTimeout(() => { toast.show = false }, 3500)
}

const moodEmojis = [  
  { value: 1, emoji: '😞', label: 'Sangat Buruk' },
  { value: 3, emoji: '😔', label: 'Buruk' },
  { value: 5, emoji: '😐', label: 'Biasa' },
  { value: 7, emoji: '😊', label: 'Baik' },
  { value: 9, emoji: '😄', label: 'Sangat Baik' },
  { value: 10, emoji: '🤩', label: 'Luar Biasa' },
]

const sleepTotalMinutes = computed(() => (form.sleep_hours * 60) + form.sleep_minutes)
const screenTotalMinutes = computed(() => (form.screen_time_hours * 60) + form.screen_time_minutes)

function resetForm() {
  form.logged_date = new Date().toISOString().split('T')[0]
  form.sleep_hours = 7
  form.sleep_minutes = 0
  form.deep_sleep_minutes = 90
  form.screen_time_hours = 3
  form.screen_time_minutes = 0
  form.wakatime_coding_hours = 2
  form.steps_count = 5000
  form.resting_heart_rate = 68
  form.stress_level_score = 30
  form.mood_score = 7
}

async function handleSubmit() {
  isSubmitting.value = true

  const payload = {
    logged_date: form.logged_date,
    sleep_duration_minutes: sleepTotalMinutes.value,
    deep_sleep_minutes: form.deep_sleep_minutes,
    screen_time_minutes: screenTotalMinutes.value,
    wakatime_coding_hours: form.wakatime_coding_hours,
    steps_count: form.steps_count,
    resting_heart_rate: form.resting_heart_rate,
    stress_level_score: form.stress_level_score,
    mood_score: form.mood_score,
  }

  const res = await addActivityLog(payload)
  isSubmitting.value = false

  if (res.success) {
    showToast('Log aktivitas berhasil disimpan!', 'success')
    emit('saved')
    setTimeout(() => {
      resetForm()
      emit('close')
    }, 800)
  } else {
    showToast(res.error || 'Gagal menyimpan log aktivitas.', 'error')
  }
}

function handleClose() {
  resetForm()
  emit('close')
}
</script>

<template>
  <Teleport to="body">
    <!-- Backdrop -->
    <transition name="fade">
      <div
        v-if="show"
        class="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
        @click="handleClose"
      ></div>
    </transition>

    <!-- Toast -->
    <transition name="toast-slide">
      <div
        v-if="toast.show"
        class="fixed top-5 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-sm p-4 rounded-2xl shadow-2xl border flex items-center gap-3 backdrop-blur-xl"
        :class="{
          'bg-success-500/15 border-success-500/30 text-success-400': toast.type === 'success',
          'bg-danger-500/15 border-danger-500/30 text-danger-400': toast.type === 'error',
        }"
      >
        <span class="text-xs font-semibold text-surface-200">{{ toast.message }}</span>
      </div>
    </transition>

    <!-- Modal -->
    <transition name="modal-scale">
      <div
        v-if="show"
        class="fixed inset-x-4 top-[6%] bottom-[6%] max-w-md mx-auto z-[45] bg-surface-900 border border-surface-700/50 rounded-[28px] shadow-2xl flex flex-col overflow-hidden p-5 text-left"
      >
        <!-- Header -->
        <div class="flex items-center justify-between border-b border-surface-700/50 pb-3 mb-4 shrink-0">
          <div class="flex items-center gap-2">
            <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500/20 to-indigo-500/10 flex items-center justify-center">
              <Plus class="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h3 class="text-base font-bold text-white">Log Aktivitas Harian</h3>
              <p class="text-[10px] text-surface-400 mt-0.5">Catat data kesehatan & produktivitas hari ini</p>
            </div>
          </div>
          <button @click="handleClose" class="p-1.5 rounded-lg bg-surface-800 text-surface-400 hover:text-white transition-colors">
            <X class="w-4 h-4" />
          </button>
        </div>

        <!-- Form -->
        <form @submit.prevent="handleSubmit" class="flex-1 overflow-y-auto pr-1 space-y-4 pb-2">
          <!-- Date -->
          <div>
            <label class="block text-xs font-semibold text-surface-400 mb-1.5 uppercase tracking-wider">Tanggal</label>
            <input
              v-model="form.logged_date"
              type="date"
              required
              :disabled="isSubmitting"
              class="w-full bg-surface-800/50 border border-surface-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary-500 transition-colors disabled:opacity-50"
            />
          </div>

          <!-- Sleep Duration -->
          <div class="surface-card-sm p-4 border border-purple-500/10 bg-purple-500/5 rounded-2xl">
            <div class="flex items-center gap-2 mb-3">
              <Moon class="w-4 h-4 text-purple-400" />
              <span class="text-xs font-bold text-white uppercase tracking-wider">Durasi Tidur</span>
              <span class="text-[10px] text-purple-400 font-semibold ml-auto">{{ form.sleep_hours }}j {{ form.sleep_minutes }}m</span>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-[10px] text-surface-500 mb-1">Jam</label>
                <input
                  v-model.number="form.sleep_hours"
                  type="range" min="0" max="14" step="1"
                  class="w-full accent-purple-500"
                  :disabled="isSubmitting"
                />
              </div>
              <div>
                <label class="block text-[10px] text-surface-500 mb-1">Menit</label>
                <input
                  v-model.number="form.sleep_minutes"
                  type="range" min="0" max="55" step="5"
                  class="w-full accent-purple-500"
                  :disabled="isSubmitting"
                />
              </div>
            </div>
            <div class="mt-3">
              <label class="block text-[10px] text-surface-500 mb-1">Deep Sleep (menit): {{ form.deep_sleep_minutes }}</label>
              <input
                v-model.number="form.deep_sleep_minutes"
                type="range" min="0" max="300" step="5"
                class="w-full accent-indigo-500"
                :disabled="isSubmitting"
              />
            </div>
          </div>

          <!-- Steps & Coding Row -->
          <div class="grid grid-cols-2 gap-3">
            <!-- Steps -->
            <div class="surface-card-sm p-3 border border-success-500/10 bg-success-500/5 rounded-2xl">
              <div class="flex items-center gap-1.5 mb-2">
                <Footprints class="w-3.5 h-3.5 text-success-400" />
                <span class="text-[10px] font-bold text-white uppercase tracking-wider">Langkah</span>
              </div>
              <input
                v-model.number="form.steps_count"
                type="number" min="0" max="50000" step="100"
                :disabled="isSubmitting"
                class="w-full bg-surface-800/50 border border-surface-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-success-500 transition-colors disabled:opacity-50"
              />
              <p class="text-[9px] text-surface-500 mt-1">Target: 10.000</p>
            </div>

            <!-- Coding Hours -->
            <div class="surface-card-sm p-3 border border-cyan-500/10 bg-cyan-500/5 rounded-2xl">
              <div class="flex items-center gap-1.5 mb-2">
                <Code class="w-3.5 h-3.5 text-cyan-400" />
                <span class="text-[10px] font-bold text-white uppercase tracking-wider">Coding</span>
              </div>
              <input
                v-model.number="form.wakatime_coding_hours"
                type="number" min="0" max="24" step="0.5"
                :disabled="isSubmitting"
                class="w-full bg-surface-800/50 border border-surface-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors disabled:opacity-50"
              />
              <p class="text-[9px] text-surface-500 mt-1">Jam (WakaTime)</p>
            </div>
          </div>

          <!-- Screen Time -->
          <div class="surface-card-sm p-4 border border-warning-500/10 bg-warning-500/5 rounded-2xl">
            <div class="flex items-center gap-2 mb-3">
              <Smartphone class="w-4 h-4 text-warning-400" />
              <span class="text-xs font-bold text-white uppercase tracking-wider">Screen Time</span>
              <span class="text-[10px] font-semibold ml-auto" :class="screenTotalMinutes > 360 ? 'text-danger-400' : 'text-warning-400'">
                {{ form.screen_time_hours }}j {{ form.screen_time_minutes }}m
              </span>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-[10px] text-surface-500 mb-1">Jam</label>
                <input
                  v-model.number="form.screen_time_hours"
                  type="range" min="0" max="16" step="1"
                  class="w-full accent-warning-500"
                  :disabled="isSubmitting"
                />
              </div>
              <div>
                <label class="block text-[10px] text-surface-500 mb-1">Menit</label>
                <input
                  v-model.number="form.screen_time_minutes"
                  type="range" min="0" max="55" step="5"
                  class="w-full accent-warning-500"
                  :disabled="isSubmitting"
                />
              </div>
            </div>
          </div>

          <!-- Heart Rate & Stress Row -->
          <div class="grid grid-cols-2 gap-3">
            <div>
              <div class="flex items-center gap-1.5 mb-1.5">
                <Heart class="w-3.5 h-3.5 text-danger-400" />
                <label class="text-[10px] font-bold text-surface-400 uppercase tracking-wider">Heart Rate</label>
              </div>
              <div class="flex items-center gap-2">
                <input
                  v-model.number="form.resting_heart_rate"
                  type="range" min="40" max="120" step="1"
                  class="flex-1 accent-danger-500"
                  :disabled="isSubmitting"
                />
                <span class="text-xs font-bold text-white bg-surface-800 px-2.5 py-1 rounded-lg min-w-[40px] text-center border border-white/5">
                  {{ form.resting_heart_rate }}
                </span>
              </div>
            </div>
            <div>
              <div class="flex items-center gap-1.5 mb-1.5">
                <Brain class="w-3.5 h-3.5 text-indigo-400" />
                <label class="text-[10px] font-bold text-surface-400 uppercase tracking-wider">Stres</label>
              </div>
              <div class="flex items-center gap-2">
                <input
                  v-model.number="form.stress_level_score"
                  type="range" min="0" max="100" step="5"
                  class="flex-1 accent-indigo-500"
                  :disabled="isSubmitting"
                />
                <span
                  class="text-xs font-bold px-2.5 py-1 rounded-lg min-w-[40px] text-center border border-white/5"
                  :class="form.stress_level_score > 60 ? 'text-danger-400 bg-danger-500/10' : form.stress_level_score > 30 ? 'text-warning-400 bg-warning-500/10' : 'text-success-400 bg-success-500/10'"
                >
                  {{ form.stress_level_score }}
                </span>
              </div>
            </div>
          </div>

          <!-- Mood Picker -->
          <div>
            <div class="flex items-center gap-2 mb-2">
              <Smile class="w-4 h-4 text-primary-400" />
              <label class="text-xs font-bold text-surface-400 uppercase tracking-wider">Mood Hari Ini</label>
            </div>
            <div class="flex gap-2">
              <button
                v-for="mood in moodEmojis"
                :key="mood.value"
                type="button"
                @click="form.mood_score = mood.value"
                :disabled="isSubmitting"
                class="flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl transition-all border"
                :class="form.mood_score === mood.value
                  ? 'bg-primary-500/15 border-primary-500/30 scale-105 shadow-lg shadow-primary-500/10'
                  : 'bg-surface-800/30 border-surface-700/30 hover:bg-surface-800/60'"
              >
                <span class="text-lg">{{ mood.emoji }}</span>
                <span class="text-[8px] font-semibold text-surface-400 leading-tight">{{ mood.label }}</span>
              </button>
            </div>
          </div>

          <!-- Submit -->
          <button
            type="submit"
            :disabled="isSubmitting"
            class="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-xs font-bold text-white tracking-wider uppercase active:scale-98 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20"
          >
            <Loader2 v-if="isSubmitting" class="w-4 h-4 animate-spin" />
            <Plus v-else class="w-4 h-4" />
            <span>{{ isSubmitting ? 'Menyimpan...' : 'Simpan Log Aktivitas' }}</span>
          </button>
        </form>
      </div>
    </transition>
  </Teleport>
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

.toast-slide-enter-active,
.toast-slide-leave-active {
  transition: all 0.3s ease-out;
}
.toast-slide-enter-from {
  opacity: 0;
  transform: translate(-50%, -20px);
}
.toast-slide-leave-to {
  opacity: 0;
  transform: translate(-50%, -20px);
}
</style>
