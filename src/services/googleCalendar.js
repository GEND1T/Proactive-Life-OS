let tokenClient = null

/**
 * Initializes the Google GIS Code Client and requests an auth code, then exchanges it for tokens.
 * @param {Function} callback - Callback function that receives the access token string.
 */
export function initTokenClient(callback) {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
  if (!clientId) {
    console.error('Google Client ID is missing. Add VITE_GOOGLE_CLIENT_ID to .env.local')
    alert('Konfigurasi Google Client ID tidak ditemukan. Harap tambahkan VITE_GOOGLE_CLIENT_ID ke file .env.local Anda.')
    return
  }

  if (typeof google === 'undefined' || !google.accounts || !google.accounts.oauth2) {
    console.error('Google Accounts SDK (gsi client) is not loaded.')
    alert('Google SDK belum selesai dimuat di latar belakang. Silakan tunggu beberapa detik atau muat ulang halaman.')
    return
  }

  try {
    tokenClient = google.accounts.oauth2.initCodeClient({
      client_id: clientId,
      scope: 'https://www.googleapis.com/auth/calendar.events',
      ux_mode: 'popup',
      callback: async (response) => {
        if (response.error) {
          console.error('OAuth Code Client Error:', response.error)
          alert(`Login Gagal: ${response.error_description || response.error}`)
          return
        }

        if (response.code) {
          try {
            const exchangeResponse = await fetch('/api/google/exchange', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ code: response.code })
            })

            const data = await exchangeResponse.json()

            if (!exchangeResponse.ok) {
              throw new Error(data.error || 'Gagal menukarkan kode otorisasi')
            }

            const expiresAt = Date.now() + (Number(data.expires_in) * 1000)
            localStorage.setItem('google_access_token', data.access_token)
            if (data.refresh_token) {
              localStorage.setItem('google_refresh_token', data.refresh_token)
            }
            localStorage.setItem('google_token_expires_at', expiresAt)

            if (callback) callback(data.access_token)
          } catch (err) {
            console.error('Failed to exchange code:', err)
            alert(`Terjadi kesalahan saat memproses token Google: ${err.message}`)
          }
        }
      }
    })

    tokenClient.requestCode()
  } catch (err) {
    console.error('Failed to initialize Google code client:', err)
    alert(`Terjadi kesalahan saat menginisialisasi login Google: ${err.message}`)
  }
}

/**
 * Retrieves a valid saved access token from localStorage.
 * Checks for expiration with a 5-minute buffer and refreshes it via backend if needed.
 * @returns {Promise<string|null>} - The access token, or null if expired or missing.
 */
export async function getValidToken() {
  const token = localStorage.getItem('google_access_token')
  const expiresAt = localStorage.getItem('google_token_expires_at')
  const refreshToken = localStorage.getItem('google_refresh_token')

  if (!token || !expiresAt) return null

  // If token expires in less than 5 minutes (300000 ms), refresh it automatically using refresh_token
  if (Date.now() > Number(expiresAt) - 300000) {
    if (refreshToken) {
      try {
        console.log('Access token expired. Refreshing token via backend...')
        const response = await fetch('/api/google/refresh', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ refresh_token: refreshToken })
        })

        const data = await response.json()

        if (response.ok && data.access_token) {
          const expiresAtNew = Date.now() + (Number(data.expires_in) * 1000)
          localStorage.setItem('google_access_token', data.access_token)
          localStorage.setItem('google_token_expires_at', expiresAtNew)
          console.log('Token successfully refreshed!')
          return data.access_token
        } else {
          console.error('Failed to refresh token:', data.error)
        }
      } catch (err) {
        console.error('Error while refreshing token:', err)
      }
    }

    // If refreshing fails or no refresh token is present, clear local session
    clearToken()
    return null
  }

  return token
}

/**
 * Clears Google OAuth tokens from localStorage.
 */
export function clearToken() {
  localStorage.removeItem('google_access_token')
  localStorage.removeItem('google_refresh_token')
  localStorage.removeItem('google_token_expires_at')
}

/**
 * Fetches events from primary Google Calendar for a specific date.
 * @param {Date} date - The date to fetch events for.
 * @returns {Promise<Array>} - Mapped event array matching the TimelineView format.
 */
export async function fetchEventsForDate(date) {
  const token = await getValidToken()
  if (!token) {
    throw new Error('Unauthorized: Token tidak valid atau sudah kedaluwarsa')
  }

  // Define date bounds in local time
  const startOfDay = new Date(date)
  startOfDay.setHours(0, 0, 0, 0)

  const endOfDay = new Date(date)
  endOfDay.setHours(23, 59, 59, 999)

  const timeMin = startOfDay.toISOString()
  const timeMax = endOfDay.toISOString()

  const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}&singleEvents=true&orderBy=startTime`

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  })

  if (!response.ok) {
    if (response.status === 401) {
      clearToken()
      throw new Error('Session Expired: Sesi login Google Anda telah berakhir. Harap hubungkan ulang.')
    }
    const errData = await response.json().catch(() => ({}))
    throw new Error(errData.error?.message || `Google API Error: Status ${response.status}`)
  }

  const data = await response.json()
  return mapGoogleEvents(data.items || [])
}

function mapGoogleEvents(items) {
  // Filter out cancelled events or events without start times
  const activeItems = items.filter(item => item.status !== 'cancelled' && item.start)

  return activeItems.map(item => {
    const summary = item.summary || '(Tanpa Judul)'
    const description = item.description || ''
    const category = detectCategory(summary, description)
    const color = getColorByCategory(category)

    let startStr = item.start.dateTime
    let endStr = item.end?.dateTime

    const isAllDay = !startStr && item.start.date

    if (isAllDay) {
      // Set to 06:00 local time for all-day events to display at the top of the timeline
      const localDate = new Date(item.start.date)
      localDate.setHours(6, 0, 0, 0)
      startStr = localDate.toISOString()

      const localEndDate = item.end?.date ? new Date(item.end.date) : new Date(item.start.date)
      localEndDate.setHours(7, 0, 0, 0)
      endStr = localEndDate.toISOString()
    } else {
      startStr = item.start.dateTime
      endStr = item.end?.dateTime || startStr
    }

    return {
      id: item.id,
      title: isAllDay ? `[Seharian] ${summary}` : summary,
      start: startStr,
      end: endStr,
      category,
      color: isAllDay ? 'cyan' : color,
      location: item.location || '',
      rrule: !!item.recurrence || !!item.recurringEventId,
      description: description,
      isAllDay
    }
  })
}

/**
 * Detect event category based on title & description keywords.
 * @param {string} title
 * @param {string} description
 * @returns {string} - 'akademik' | 'coding' | 'meeting' | 'deadline' | 'personal'
 */
function detectCategory(title, description) {
  const text = `${title} ${description}`.toLowerCase()

  if (/kuliah|praktikum|kelas|tugas|ujian|lms|filkom|dosen|belajar|school|class|homework|exam/.test(text)) {
    return 'akademik'
  }
  if (/coding|code|programming|git|github|develop|debug|frontend|backend|sprint|web|repo|wakatime/.test(text)) {
    return 'coding'
  }
  if (/meeting|call|zoom|meet|diskusi|sync|briefing|weekly|daily|standup|klien|client|interview/.test(text)) {
    return 'meeting'
  }
  if (/deadline|kumpul|submit|batas|penting|urgent|milestone|due/.test(text)) {
    return 'deadline'
  }
  return 'personal'
}

/**
 * Get color based on category.
 * @param {string} category
 * @returns {string} - 'blue' | 'green' | 'purple' | 'red' | 'yellow'
 */
function getColorByCategory(category) {
  const colors = {
    akademik: 'blue',
    coding: 'green',
    meeting: 'purple',
    deadline: 'red',
    personal: 'yellow'
  }
  return colors[category] || 'yellow'
}

/**
 * Create a new event in Google Calendar.
 * @param {Object} eventData 
 * @returns {Promise<Object>} The created Google Event mapped to local format
 */
export async function createGoogleEvent(eventData) {
  const token = await getValidToken()
  if (!token) throw new Error('Unauthorized: Sesi Google Calendar tidak aktif')

  const url = 'https://www.googleapis.com/calendar/v3/calendars/primary/events'
  
  const payload = {
    summary: eventData.title,
    location: eventData.location || '',
    description: eventData.description || '',
    start: {
      dateTime: eventData.start
    },
    end: {
      dateTime: eventData.end || eventData.start
    }
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  })

  if (!response.ok) {
    if (response.status === 401) {
      clearToken()
      throw new Error('Session Expired: Harap login ulang dengan Google Calendar')
    }
    const errData = await response.json().catch(() => ({}))
    throw new Error(errData.error?.message || 'Gagal menyimpan ke Google Calendar')
  }

  const item = await response.json()
  return mapGoogleEvents([item])[0]
}

/**
 * Update an existing event in Google Calendar.
 * @param {string} eventId 
 * @param {Object} eventData 
 * @returns {Promise<Object>} The updated Google Event mapped to local format
 */
export async function updateGoogleEvent(eventId, eventData) {
  const token = await getValidToken()
  if (!token) throw new Error('Unauthorized: Sesi Google Calendar tidak aktif')

  const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`
  
  const payload = {
    summary: eventData.title,
    location: eventData.location || '',
    description: eventData.description || '',
    start: {
      dateTime: eventData.start
    },
    end: {
      dateTime: eventData.end || eventData.start
    }
  }

  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  })

  if (!response.ok) {
    if (response.status === 401) {
      clearToken()
      throw new Error('Session Expired: Sesi login Google Anda telah berakhir. Harap hubungkan ulang.')
    }
    const errData = await response.json().catch(() => ({}))
    throw new Error(errData.error?.message || 'Gagal memperbarui Google Calendar')
  }

  const item = await response.json()
  return mapGoogleEvents([item])[0]
}

/**
 * Delete an event from Google Calendar.
 * @param {string} eventId 
 * @returns {Promise<boolean>}
 */
export async function deleteGoogleEvent(eventId) {
  const token = await getValidToken()
  if (!token) throw new Error('Unauthorized: Sesi Google Calendar tidak aktif')

  const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`

  const response = await fetch(url, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`
    }
  })

  if (!response.ok) {
    if (response.status === 401) {
      clearToken()
      throw new Error('Session Expired: Harap login ulang dengan Google Calendar')
    }
    const errData = await response.json().catch(() => ({}))
    throw new Error(errData.error?.message || 'Gagal menghapus dari Google Calendar')
  }

  return true
}
