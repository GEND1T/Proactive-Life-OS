import { createRouter, createWebHistory } from 'vue-router'
import { supabase } from '../services/supabase'

const routes = [
  {
    path: '/login',
    name: 'login',
    component: () => import('../views/LoginView.vue'),
    meta: { title: 'Login', layout: 'blank', index: -1 },
  },
  {
    path: '/',
    name: 'dashboard',
    component: () => import('../views/DashboardView.vue'),
    meta: { title: 'Dashboard', icon: 'Home', index: 0 },
  },
  {
    path: '/calendar',
    name: 'calendar',
    component: () => import('../views/CalendarView.vue'),
    meta: { title: 'Time Orchestrator', icon: 'Calendar', index: 1 },
  },
  {
    path: '/finance',
    name: 'finance',
    component: () => import('../views/FinanceView.vue'),
    meta: { title: 'Finance Vault', icon: 'Wallet', index: 2 },
  },
  {
    path: '/lifelogs',
    name: 'lifelogs',
    component: () => import('../views/LifeLogsView.vue'),
    meta: { title: 'Life Logs', icon: 'BarChart3', index: 3 },
  },
  {
    path: '/control',
    name: 'control',
    component: () => import('../views/ControlView.vue'),
    meta: { title: 'Life-OS Control', icon: 'Settings', index: 4 },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// Route navigation guard with Supabase Auth & Demo Session Fallback
router.beforeEach(async (to, from, next) => {
  let session = null
  try {
    const { data } = await supabase.auth.getSession()
    session = data?.session
  } catch (err) {
    console.error('Error getting supabase session:', err)
  }

  const isDemoSession = localStorage.getItem('sb-demo-session') === 'true'
  const hasSession = session || isDemoSession

  if (to.name !== 'login' && !hasSession) {
    next({ name: 'login' })
  } else if (to.name === 'login' && hasSession) {
    next({ name: 'dashboard' })
  } else {
    next()
  }
})

export default router

