<script setup>
import { ref, watch } from 'vue'
import { Sparkles, RefreshCw, Loader2 } from '@lucide/vue'

const props = defineProps({
  icon: { type: [String, Object, Function], default: '🤖' },
  title: { type: String, default: 'AI Analysis' },
  message: { type: String, required: true },
  timestamp: { type: String, default: 'Baru saja' },
  loading: { type: Boolean, default: false },
  source: { type: String, default: '' }, // 'gemini', 'rules', 'cache'
})

const emit = defineEmits(['refresh'])

const displayedText = ref('')
const isTyping = ref(false)
const lastTypedMessage = ref('')

// Watch for message changes (including dynamic AI updates)
watch(() => props.message, (newMsg) => {
  if (newMsg && newMsg !== lastTypedMessage.value) {
    typeText(newMsg)
  }
}, { immediate: true })

function typeText(text) {
  if (!text) return
  displayedText.value = ''
  isTyping.value = true
  lastTypedMessage.value = text
  let i = 0
  const interval = setInterval(() => {
    if (i < text.length) {
      displayedText.value += text[i]
      i++
    } else {
      clearInterval(interval)
      isTyping.value = false
    }
  }, 15)
}

function handleRefresh() {
  emit('refresh')
}

const sourceLabels = {
  gemini: 'Powered by Gemini AI',
  rules: 'Smart Analysis Engine',
  cache: 'Cached Insight',
}
</script>

<template>
  <div class="glass-card-aurora p-4 mx-4 mt-3 mb-4" id="ai-insight-card">
    <div class="relative z-10">
      <!-- Header -->
      <div class="flex items-center justify-between mb-2.5">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-xl bg-primary-500/20 flex items-center justify-center">
            <Sparkles class="w-4 h-4 text-primary-400 animate-pulse" />
          </div>
          <div>
            <h3 class="text-xs font-semibold text-primary-300 uppercase tracking-wider">{{ title }}</h3>
          </div>
        </div>
        <button
          @click="handleRefresh"
          :disabled="loading"
          class="p-1.5 rounded-lg hover:bg-white/5 transition-colors disabled:opacity-50"
          :class="loading ? 'animate-spin' : ''"
        >
          <RefreshCw class="w-3.5 h-3.5 text-surface-500" />
        </button>
      </div>

      <!-- AI Message -->
      <div class="min-h-[40px]">
        <!-- Loading State -->
        <div v-if="loading" class="flex items-center gap-2 py-1">
          <Loader2 class="w-4 h-4 text-primary-400 animate-spin" />
          <span class="text-sm text-surface-400 italic">Menganalisis data Anda...</span>
          <span class="flex gap-1 ml-1">
            <span class="w-1.5 h-1.5 bg-primary-400/60 rounded-full animate-bounce" style="animation-delay: 0ms"></span>
            <span class="w-1.5 h-1.5 bg-primary-400/60 rounded-full animate-bounce" style="animation-delay: 150ms"></span>
            <span class="w-1.5 h-1.5 bg-primary-400/60 rounded-full animate-bounce" style="animation-delay: 300ms"></span>
          </span>
        </div>

        <!-- Displayed Message -->
        <p v-else class="text-sm text-surface-300 leading-relaxed flex items-start">
          <component :is="icon" v-if="typeof icon !== 'string'" class="w-4 h-4 text-primary-400 mr-2 mt-1 shrink-0" />
          <span v-else class="mr-1.5">{{ icon }}</span>
          <span>{{ displayedText }}</span>
          <span
            v-if="isTyping"
            class="inline-block w-0.5 h-4 bg-primary-400 ml-0.5 align-middle"
            style="animation: typing-cursor 0.8s ease-in-out infinite"
          ></span>
        </p>
      </div>

      <!-- Footer -->
      <div class="flex items-center justify-between mt-3 pt-2.5 border-t border-white/5">
        <span class="text-[10px] text-surface-500 font-medium">
          ✨ Dianalisis {{ timestamp }}
        </span>
        <span class="text-[10px] font-medium flex items-center gap-1"
          :class="source === 'gemini' ? 'text-cyan-400/60' : 'text-primary-500/60'">
          <span v-if="source === 'gemini'" class="w-1.5 h-1.5 rounded-full bg-cyan-400 inline-block"></span>
          <span v-else-if="source === 'rules'" class="w-1.5 h-1.5 rounded-full bg-primary-400 inline-block"></span>
          {{ sourceLabels[source] || 'AI Engine' }}
        </span>
      </div>
    </div>
  </div>
</template>
