<script setup>
import MiniSparkline from './MiniSparkline.vue'

defineProps({
  label: { type: String, required: true },
  value: { type: [String, Number], required: true },
  subtitle: { type: String, default: '' },
  icon: { type: [String, Object, Function], default: '' },
  trend: { type: String, default: '' },
  trendUp: { type: Boolean, default: true },
  color: { type: String, default: 'primary' },
  sparklineData: { type: Array, default: () => [] } // Data for sparkline (optional)
})

const colorMap = {
  primary: 'from-primary-500/20 to-primary-600/10 text-primary-400',
  green: 'from-success-500/20 to-success-600/10 text-success-400',
  rose: 'from-danger-500/20 to-danger-600/10 text-danger-400',
  purple: 'from-purple-500/20 to-purple-600/10 text-purple-400',
  amber: 'from-amber-500/20 to-amber-600/10 text-amber-400',
  cyan: 'from-cyan-500/20 to-cyan-600/10 text-cyan-400',
}
</script>

<template>
  <div class="surface-card-sm p-3.5 hover:border-primary-500/20 transition-colors group">
    <!-- Icon & Label -->
    <div class="flex items-center gap-2 mb-2">
      <div
        class="w-8 h-8 rounded-lg bg-gradient-to-br flex items-center justify-center"
        :class="colorMap[color] || colorMap.primary"
      >
        <component :is="icon" v-if="typeof icon !== 'string'" class="w-4 h-4" />
        <span v-else class="text-sm">{{ icon }}</span>
      </div>
      <span class="text-xs text-surface-400 font-medium">{{ label }}</span>
    </div>

      <!-- Value & Trend / Sparkline -->
      <div class="flex items-end justify-between w-full">
        <div>
          <p class="text-xl font-bold text-white group-hover:text-primary-200 transition-colors">
            {{ value }}
          </p>
          <p v-if="subtitle" class="text-[11px] text-surface-500 mt-0.5">{{ subtitle }}</p>
        </div>

        <div class="flex flex-col items-end gap-1.5">
          <!-- Sparkline -->
          <MiniSparkline v-if="sparklineData && sparklineData.length > 0" :data="sparklineData" :color="color" />
          
          <!-- Trend -->
      <span
        v-if="trend"
        class="text-[10px] font-semibold px-1.5 py-0.5 rounded-md"
        :class="trendUp
          ? 'bg-success-500/15 text-success-400'
          : 'bg-danger-500/15 text-danger-400'"
      >
        {{ trendUp ? '↑' : '↓' }} {{ trend }}
        </span>
        </div>
      </div>
    </div>
  </template>
