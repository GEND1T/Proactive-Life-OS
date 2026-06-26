import { calendarEvents as initialMockEvents } from '../data/calendar'

const LOCAL_STORAGE_KEY = 'life_os_local_events'

/**
 * Get all local events. Initializes with mock events if empty.
 * @returns {Array}
 */
export function getLocalEvents() {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY)
    if (!saved) {
      // Inisialisasi awal dengan data dummy
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(initialMockEvents))
      return initialMockEvents
    }
    return JSON.parse(saved)
  } catch (e) {
    console.error('Failed to parse local events:', e)
    return initialMockEvents
  }
}

/**
 * Save events list to localStorage and dispatch custom change event.
 * @param {Array} events 
 */
function saveLocalEvents(events) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(events))
    // Hubungkan update ke window event agar ter-sync otomatis antar component
    window.dispatchEvent(new CustomEvent('local-events-updated'))
  } catch (e) {
    console.error('Failed to save local events:', e)
  }
}

/**
 * Add a new event locally.
 * @param {Object} eventData 
 * @returns {Object} The added event
 */
export function addEvent(eventData) {
  const events = getLocalEvents()
  const newEvent = {
    id: `evt-local-${Date.now()}`,
    title: eventData.title || '(Tanpa Judul)',
    start: eventData.start,
    end: eventData.end || eventData.start,
    category: eventData.category || 'personal',
    color: eventData.color || 'yellow',
    location: eventData.location || '',
    rrule: !!eventData.rrule,
    description: eventData.description || ''
  }
  
  events.push(newEvent)
  saveLocalEvents(events)
  return newEvent
}

/**
 * Update an existing local event.
 * @param {string} id 
 * @param {Object} updatedData 
 * @returns {boolean}
 */
export function updateEvent(id, updatedData) {
  const events = getLocalEvents()
  const index = events.findIndex(e => e.id === id)
  if (index === -1) return false

  events[index] = {
    ...events[index],
    title: updatedData.title,
    start: updatedData.start,
    end: updatedData.end,
    category: updatedData.category,
    color: updatedData.color,
    location: updatedData.location,
    description: updatedData.description,
    rrule: updatedData.rrule !== undefined ? updatedData.rrule : events[index].rrule
  }

  saveLocalEvents(events)
  return true
}

/**
 * Delete a local event.
 * @param {string} id 
 * @returns {boolean}
 */
export function deleteEvent(id) {
  const events = getLocalEvents()
  const filtered = events.filter(e => e.id !== id)
  
  if (events.length === filtered.length) return false
  
  saveLocalEvents(filtered)
  return true
}
