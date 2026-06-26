<script setup>
import { ref } from 'vue'
import { Play } from '@lucide/vue'
import ToggleSwitch from '../shared/ToggleSwitch.vue'
import { webhooks as initialWebhooks } from '../../data/system'
import { useFormatters } from '../../composables/useFormatters'

const { formatRelativeTime } = useFormatters()

const webhooks = ref(initialWebhooks.map(w => ({ ...w })))

function toggleWebhook(id) {
  const wh = webhooks.value.find(w => w.id === id)
  if (wh) wh.enabled = !wh.enabled
}

const testingId = ref(null)

function testWebhook(id) {
  testingId.value = id
  setTimeout(() => { testingId.value = null }, 1500)
}
</script>

<template>
  <div class="mx-4">
    <div class="space-y-2">
      <div
        v-for="wh in webhooks"
        :key="wh.id"
        class="surface-card-sm p-3.5 flex items-start gap-3 transition-all"
        :class="wh.enabled ? 'border-primary-500/10' : 'opacity-60'"
      >
        <!-- Icon -->
        <div class="w-10 h-10 rounded-xl bg-surface-800 flex items-center justify-center text-lg shrink-0">
          {{ wh.icon }}
        </div>

        <!-- Info -->
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 mb-0.5">
            <h4 class="text-sm font-semibold text-white truncate">{{ wh.name }}</h4>
          </div>
          <p class="text-xs text-surface-500 leading-relaxed mb-1.5">{{ wh.description }}</p>
          <div class="flex items-center gap-2">
            <span
              class="w-1.5 h-1.5 rounded-full"
              :class="wh.enabled && wh.status === 'success' ? 'bg-success-400 animate-pulse' : 'bg-surface-600'"
            ></span>
            <span class="text-[10px] text-surface-500">
              {{ wh.enabled ? 'Terakhir: ' + formatRelativeTime(wh.lastTriggered) : 'Nonaktif' }}
            </span>
          </div>
        </div>

        <!-- Controls -->
        <div class="flex flex-col items-end gap-2 shrink-0">
          <ToggleSwitch v-model="wh.enabled" />
          <button
            v-if="wh.enabled"
            @click="testWebhook(wh.id)"
            class="flex items-center gap-1 px-2 py-1 rounded-lg bg-primary-500/10 text-primary-400 text-[10px] font-medium hover:bg-primary-500/20 transition-colors"
            :class="testingId === wh.id ? 'animate-pulse' : ''"
          >
            <Play class="w-3 h-3" />
            {{ testingId === wh.id ? 'Testing...' : 'Test' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
