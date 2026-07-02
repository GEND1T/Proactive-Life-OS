<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppHeader from './components/layout/AppHeader.vue'
import BottomNav from './components/layout/BottomNav.vue'
import QuickFAB from './components/layout/QuickFAB.vue'
import { useTheme } from './composables/useTheme'

const route = useRoute()
const router = useRouter()
const theme = useTheme() // Initialize theme state and lifecycle hooks
const previousIndex = ref(0)
const mainContent = ref(null)

// Touch swipe navigation handler
const touchStartX = ref(0)
const touchStartY = ref(0)
const touchEndX = ref(0)
const touchEndY = ref(0)

const routeSequence = [
  '/',
  '/calendar',
  '/finance',
  '/habit',
  '/lifelogs',
  '/control'
]

function handleTouchStart(e) {
  // Ignore swipes on sliders, select boxes, textareas, scroll-snap boxes, or charts
  const target = e.target
  if (
    target.closest('input[type="range"]') ||
    target.closest('select') ||
    target.closest('textarea') ||
    target.closest('.scroll-snap-x') ||
    target.closest('.no-swipe') ||
    target.closest('canvas')
  ) {
    return
  }

  touchStartX.value = e.touches[0].screenX
  touchStartY.value = e.touches[0].screenY
}

function handleTouchEnd(e) {
  if (!touchStartX.value || !touchStartY.value) return

  touchEndX.value = e.changedTouches[0].screenX
  touchEndY.value = e.changedTouches[0].screenY

  const deltaX = touchEndX.value - touchStartX.value
  const deltaY = touchEndY.value - touchStartY.value

  // Verify horizontal swiping gesture (deltaX > 100px and vertical variation deltaY < 60px)
  if (Math.abs(deltaX) > 100 && Math.abs(deltaY) < 60) {
    const currentPath = route.path
    const currentIndex = routeSequence.indexOf(currentPath)

    if (currentIndex !== -1) {
      if (deltaX < 0) {
        // Swiped left -> Go to Next Page
        if (currentIndex < routeSequence.length - 1) {
          router.push(routeSequence[currentIndex + 1])
        }
      } else {
        // Swiped right -> Go to Prev Page
        if (currentIndex > 0) {
          router.push(routeSequence[currentIndex - 1])
        }
      }
    }
  }

  // Reset coordinates
  touchStartX.value = 0
  touchStartY.value = 0
}

const transitionName = computed(() => {
  const currentIndex = route.meta.index ?? 0
  const direction = currentIndex > previousIndex.value ? 'slide-left' : 'slide-right'
  previousIndex.value = currentIndex
  return direction
})

// Scroll page container to top on route change
watch(() => route.path, () => {
  if (mainContent.value) {
    mainContent.value.scrollTop = 0
  }
})
</script>

<template>
  <div class="h-screen h-[100dvh] bg-surface-900 bg-mesh relative overflow-hidden">
    <!-- Background mesh gradient -->
    <div class="fixed inset-0 pointer-events-none z-0">
      <div class="absolute top-0 left-1/4 w-96 h-96 bg-primary-500/5 rounded-full blur-3xl"></div>
      <div class="absolute bottom-1/3 right-0 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl"></div>
    </div>

    <!-- App Content -->
    <div class="relative z-10 flex flex-col h-full">
      <!-- Sticky Header -->
      <AppHeader v-if="route.meta.layout !== 'blank'" />

      <!-- Main Content Area -->
      <main
        ref="mainContent"
        class="flex-1 overflow-y-auto"
        :class="route.meta.layout !== 'blank' ? 'pb-24 pt-16' : ''"
        @touchstart="handleTouchStart"
        @touchend="handleTouchEnd"
      >
        <router-view v-slot="{ Component }">
          <transition :name="transitionName" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>

      <!-- Floating Action Button -->
      <QuickFAB v-if="route.meta.layout !== 'blank'" />

      <!-- Bottom Navigation -->
      <BottomNav v-if="route.meta.layout !== 'blank'" />
    </div>
  </div>
</template>

<style>
.slide-left-enter-active,
.slide-left-leave-active,
.slide-right-enter-active,
.slide-right-leave-active {
  transition: all 0.28s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-left-enter-from {
  opacity: 0;
  transform: translateX(30px);
}
.slide-left-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}

.slide-right-enter-from {
  opacity: 0;
  transform: translateX(-30px);
}
.slide-right-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
</style>
