<script setup>
import { connections } from '../../data/system'
import { Wifi, WifiOff } from '@lucide/vue'
</script>

<template>
  <div class="mx-4">
    <div class="space-y-2">
      <div
        v-for="conn in connections"
        :key="conn.id"
        class="surface-card-sm p-3.5 flex items-center gap-3"
      >
        <!-- Icon -->
        <div class="w-10 h-10 rounded-xl bg-surface-800 flex items-center justify-center text-lg shrink-0">
          {{ conn.icon }}
        </div>

        <!-- Info -->
        <div class="flex-1 min-w-0">
          <h4 class="text-sm font-semibold text-white">{{ conn.name }}</h4>
          <p class="text-xs text-surface-500 font-mono truncate">{{ conn.url }}</p>
        </div>

        <!-- Status -->
        <div class="flex flex-col items-end gap-1 shrink-0">
          <div class="flex items-center gap-1.5">
            <span
              class="w-2 h-2 rounded-full"
              :class="conn.status === 'connected'
                ? 'bg-success-400 animate-pulse shadow-sm shadow-success-400/50'
                : 'bg-danger-500'"
            ></span>
            <span
              class="text-xs font-semibold"
              :class="conn.status === 'connected' ? 'text-success-400' : 'text-danger-400'"
            >
              {{ conn.status === 'connected' ? 'Online' : 'Offline' }}
            </span>
          </div>
          <span v-if="conn.status === 'connected'" class="text-[10px] text-surface-500 font-mono">
            {{ conn.latency }}ms
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
