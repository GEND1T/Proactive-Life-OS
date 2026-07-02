import { ref, computed } from 'vue'
import { supabase } from '../services/supabase'

const habits = ref([])
const isLoading = ref(false)
const error = ref(null)

// Helper to save to localStorage as a fallback / offline cache
function saveToLocalStorage() {
  localStorage.setItem('sb-habit-tracker-cache', JSON.stringify(habits.value))
}

// Helper to load from localStorage cache
function loadFromLocalStorage() {
  const cached = localStorage.getItem('sb-habit-tracker-cache')
  if (cached) {
    try {
      habits.value = JSON.parse(cached)
    } catch (err) {
      console.error('Failed to parse cached habits:', err)
    }
  }
}

export function useHabitDB() {
  
  async function fetchHabits() {
    isLoading.value = true
    error.value = null
    try {
      const { data, error: dbError } = await supabase
        .from('habit_tracker')
        .select('*')
        .order('created_at', { ascending: false })

      if (dbError) throw dbError
      habits.value = data || []
      saveToLocalStorage()
    } catch (err) {
      console.warn('Error fetching habits from Supabase, falling back to cache:', err)
      error.value = err.message || 'Gagal sinkronisasi dengan database.'
      loadFromLocalStorage()
    } finally {
      isLoading.value = false
    }
  }

  async function addHabit(habitData) {
    isLoading.value = true
    error.value = null
    try {
      const points = Math.max(0, Math.min(10, Number(habitData.points) || 0))
      // If points reach 10, force routine status, otherwise use the payload status
      const status = points >= 10 ? 'ROUTINE' : (habitData.status || 'SUGGESTION')

      const newHabitPayload = {
        activity_name: habitData.activity_name,
        time_start: habitData.time_start,
        time_end: habitData.time_end,
        points: points,
        status: status,
      }

      let insertedData = null

      try {
        const { data, error: dbError } = await supabase
          .from('habit_tracker')
          .insert([newHabitPayload])
          .select()

        if (dbError) throw dbError
        insertedData = data?.[0]
      } catch (dbErr) {
        console.warn('Database save failed, using local offline fallback:', dbErr)
      }

      // If database call failed or is offline, generate a mockup local ID
      const savedHabit = insertedData || {
        id: 'local-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
        created_at: new Date().toISOString(),
        ...newHabitPayload
      }

      habits.value = [savedHabit, ...habits.value]
      saveToLocalStorage()
      return { success: true, data: savedHabit }
    } catch (err) {
      console.error('Error adding habit:', err)
      error.value = err.message || 'Gagal menambahkan kebiasaan.'
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  async function updateHabit(id, payload) {
    isLoading.value = true
    error.value = null

    // Determine final status/points adjustments
    const updatedPayload = { ...payload }
    if (payload.points !== undefined) {
      const pts = Math.max(0, Math.min(10, Number(payload.points)))
      updatedPayload.points = pts
      if (pts >= 10) {
        updatedPayload.status = 'ROUTINE'
      } else if (pts < 10 && payload.status === undefined) {
        // If points drop below 10, auto-revert to SUGGESTION unless status is explicitly passed
        const existing = habits.value.find(h => h.id === id)
        if (existing && existing.status === 'ROUTINE') {
          updatedPayload.status = 'SUGGESTION'
        }
      }
    }

    try {
      let isLocalOnly = id.startsWith?.('local-')
      let dbUpdated = null

      if (!isLocalOnly) {
        try {
          const { data, error: dbError } = await supabase
            .from('habit_tracker')
            .update(updatedPayload)
            .eq('id', id)
            .select()

          if (dbError) throw dbError
          dbUpdated = data?.[0]
        } catch (dbErr) {
          console.warn('Failed to update in Supabase, updating cache locally:', dbErr)
        }
      }

      // Update in memory ref
      const index = habits.value.findIndex(h => h.id === id)
      if (index !== -1) {
        habits.value[index] = dbUpdated || {
          ...habits.value[index],
          ...updatedPayload
        }
      }
      saveToLocalStorage()
      return { success: true }
    } catch (err) {
      console.error('Error updating habit:', err)
      error.value = err.message || 'Gagal memperbarui kebiasaan.'
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  async function deleteHabit(id) {
    isLoading.value = true
    error.value = null
    try {
      let isLocalOnly = id.startsWith?.('local-')

      if (!isLocalOnly) {
        try {
          const { error: dbError } = await supabase
            .from('habit_tracker')
            .delete()
            .eq('id', id)

          if (dbError) throw dbError
        } catch (dbErr) {
          console.warn('Failed to delete in Supabase, deleting from cache:', dbErr)
        }
      }

      // Delete from memory ref
      habits.value = habits.value.filter(h => h.id !== id)
      saveToLocalStorage()
      return { success: true }
    } catch (err) {
      console.error('Error deleting habit:', err)
      error.value = err.message || 'Gagal menghapus kebiasaan.'
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  // Adjust habit points dynamically (+1 or -1) with Optimistic UI & Auto-Evolution
  async function adjustPoints(id, increment) {
    const index = habits.value.findIndex(h => h.id === id)
    if (index === -1) return { success: false, error: 'Habit not found' }

    const habit = habits.value[index]
    const oldPoints = habit.points || 0
    const oldStatus = habit.status

    const newPoints = Math.max(0, Math.min(10, oldPoints + increment))
    let newStatus = oldStatus

    if (newPoints >= 10 && oldStatus === 'SUGGESTION') {
      newStatus = 'ROUTINE'
    } else if (newPoints < 10 && oldStatus === 'ROUTINE') {
      newStatus = 'SUGGESTION'
    }

    // Apply Optimistic UI change locally
    habit.points = newPoints
    habit.status = newStatus
    saveToLocalStorage()

    // Trigger update on Supabase in background
    let isLocalOnly = id.startsWith?.('local-')
    if (isLocalOnly) {
      return { success: true, evolved: newStatus !== oldStatus }
    }

    try {
      const { error: dbError } = await supabase
        .from('habit_tracker')
        .update({ points: newPoints, status: newStatus })
        .eq('id', id)

      if (dbError) throw dbError
      return { success: true, evolved: newStatus !== oldStatus }
    } catch (err) {
      console.warn('Failed to save point adjustment to Supabase, reverting local changes:', err)
      // Revert if database save fails
      habit.points = oldPoints
      habit.status = oldStatus
      saveToLocalStorage()
      return { success: false, error: err.message }
    }
  }

  // Load cache initially
  loadFromLocalStorage()

  return {
    habits,
    isLoading,
    error,
    fetchHabits,
    addHabit,
    updateHabit,
    deleteHabit,
    adjustPoints,
  }
}
