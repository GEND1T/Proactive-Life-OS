<script setup>
import { ref, onMounted } from 'vue'
import { Sparkles, RefreshCw } from '@lucide/vue'

const props = defineProps({
  icon: { type: [String, Object, Function], default: '🤖' },
  title: { type: String, default: 'AI Analysis' },
  message: { type: String, required: true },
  timestamp: { type: String, default: 'Baru saja' },
})

const displayedText = ref('')
const isTyping = ref(true)
const isRefreshing = ref(false)

onMounted(() => {
  typeText()
})

function typeText() {
  displayedText.value = ''
  isTyping.value = true
  let i = 0
  const interval = setInterval(() => {
    if (i < props.message.length) {
      displayedText.value += props.message[i]
      i++
    } else {
      clearInterval(interval)
      isTyping.value = false
    }
  }, 18)
}

function refresh() {
  isRefreshing.value = true
  setTimeout(() => {
    typeText()
    isRefreshing.value = false
  }, 600)
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
          @click="refresh"
          class="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
          :class="isRefreshing ? 'animate-spin' : ''"
        >
          <RefreshCw class="w-3.5 h-3.5 text-surface-500" />
        </button>
      </div>

      <!-- AI Message -->
      <div class="min-h-[40px]">
        <p class="text-sm text-surface-300 leading-relaxed flex items-start">
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
        <span class="text-[10px] text-primary-500/60 font-medium">Powered by Llama-3</span>
      </div>
    </div>
  </div>
</template>
