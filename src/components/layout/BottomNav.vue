<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Home, CalendarDays, Wallet, BarChart3, Settings } from '@lucide/vue'

const route = useRoute()
const router = useRouter()

const tabs = [
  { name: 'dashboard', label: 'Home', icon: Home, path: '/' },
  { name: 'calendar', label: 'Jadwal', icon: CalendarDays, path: '/calendar' },
  { name: 'spacer', label: '', icon: null, path: '' },
  { name: 'lifelogs', label: 'Logs', icon: BarChart3, path: '/lifelogs' },
  { name: 'control', label: 'Control', icon: Settings, path: '/control' },
]

const activeTab = computed(() => route.name)

function navigate(tab) {
  if (tab.name === 'spacer') return
  router.push(tab.path)
}
</script>

<template>
  <nav class="fixed bottom-0 left-0 right-0 z-50 safe-bottom" id="bottom-nav">
    <div class="bg-surface-900/95 backdrop-blur-xl border-t border-white/5">
      <div class="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        <template v-for="tab in tabs" :key="tab.name">
          <!-- Spacer for FAB -->
          <div v-if="tab.name === 'spacer'" class="w-16"></div>

          <!-- Nav Item -->
          <button
            v-else
            @click="navigate(tab)"
            class="flex flex-col items-center justify-center gap-0.5 w-16 h-14 rounded-2xl transition-all duration-300 relative group"
            :class="activeTab === tab.name
              ? 'text-primary-400'
              : 'text-surface-500 hover:text-surface-300'"
            :id="`nav-${tab.name}`"
          >
            <!-- Active background glow -->
            <div
              v-if="activeTab === tab.name"
              class="absolute inset-1 bg-primary-500/10 rounded-xl transition-all duration-300"
            ></div>

            <!-- Icon -->
            <component
              :is="tab.icon"
              class="w-5 h-5 relative z-10 transition-transform duration-300"
              :class="activeTab === tab.name ? 'scale-110' : 'group-hover:scale-105'"
            />

            <!-- Label -->
            <span
              class="text-[10px] font-medium relative z-10 transition-all duration-300"
              :class="activeTab === tab.name ? 'opacity-100 translate-y-0' : 'opacity-70'"
            >
              {{ tab.label }}
            </span>

            <!-- Active indicator dot -->
            <div
              v-if="activeTab === tab.name"
              class="absolute -top-0 w-8 h-0.5 bg-gradient-to-r from-primary-400 to-purple-400 rounded-full"
            ></div>
          </button>
        </template>
      </div>
    </div>
  </nav>
</template>
