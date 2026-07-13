import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const app = express()

app.use(cors())
app.use(express.json())

const clientId = process.env.VITE_GOOGLE_CLIENT_ID
const clientSecret = process.env.GOOGLE_CLIENT_SECRET

// 1. Endpoint to exchange auth code for tokens
app.post('/api/google/exchange', async (req, res) => {
  const { code } = req.body

  if (!code) {
    return res.status(400).json({ error: 'Auth code is required' })
  }

  if (!clientSecret) {
    return res.status(500).json({ 
      error: 'GOOGLE_CLIENT_SECRET is missing. Please add it to Vercel environment variables or .env.local' 
    })
  }

  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: 'postmessage',
        grant_type: 'authorization_code',
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('Google token exchange failed:', data)
      return res.status(response.status).json({ 
        error: data.error_description || data.error || 'Failed to exchange auth code' 
      })
    }

    res.json({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_in: data.expires_in,
    })
  } catch (error) {
    console.error('Error during token exchange:', error)
    res.status(500).json({ error: 'Internal server error during token exchange' })
  }
})

// 2. Endpoint to refresh access token using refresh token
app.post('/api/google/refresh', async (req, res) => {
  const { refresh_token } = req.body

  if (!refresh_token) {
    return res.status(400).json({ error: 'Refresh token is required' })
  }

  if (!clientSecret) {
    return res.status(500).json({ 
      error: 'GOOGLE_CLIENT_SECRET is missing. Please add it to Vercel environment variables or .env.local' 
    })
  }

  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refresh_token,
        grant_type: 'refresh_token',
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('Google token refresh failed:', data)
      return res.status(response.status).json({ 
        error: data.error_description || data.error || 'Failed to refresh token' 
      })
    }

    res.json({
      access_token: data.access_token,
      expires_in: data.expires_in,
    })
  } catch (error) {
    console.error('Error during token refresh:', error)
    res.status(500).json({ error: 'Internal server error during token refresh' })
  }
})

const geminiApiKey = process.env.GEMINI_API_KEY

// 3. AI Insight Generation Endpoint (Gemini API)
app.post('/api/ai/insight', async (req, res) => {
  const { module, context } = req.body

  if (!module || !context) {
    return res.status(400).json({ error: 'Module and context are required' })
  }

  if (!geminiApiKey) {
    return res.status(200).json({
      insight: null,
      source: 'none',
      error: 'GEMINI_API_KEY not configured'
    })
  }

  const modulePrompts = {
    dashboard: `Kamu adalah AI personal assistant bernama Life-OS AI untuk aplikasi produktivitas mahasiswa Indonesia.
Berdasarkan data berikut, berikan 1 insight singkat (2-3 kalimat) dalam bahasa Indonesia yang actionable dan personal:
- Jam tidur hari ini: ${context.sleepHours || '?'} jam
- Langkah kaki: ${context.steps || '?'}
- Stress level: ${context.stress || '?'}/100
- Jadwal hari ini: ${context.eventsCount || 0} kegiatan
- Saldo total: Rp ${context.balance || '?'}
- Pengeluaran hari ini: Rp ${context.todaySpending || '?'}
Fokus pada satu rekomendasi yang paling penting untuk hari ini.`,

    finance: `Kamu adalah AI financial advisor untuk mahasiswa Indonesia.
Berdasarkan data keuangan berikut, berikan 1 analisis singkat (2-3 kalimat) dalam bahasa Indonesia:
- Saldo total: Rp ${context.balance || '?'}
- Pengeluaran hari ini: Rp ${context.todaySpending || '?'}
- Budget harian: Rp ${context.dailyBudget || '?'}
- Persentase budget terpakai: ${context.spendingPercentage || '?'}%
- Jumlah transaksi terbaru: ${context.recentTransactionsCount || '?'}
- Kategori pengeluaran terbesar: ${context.topCategory || '?'}
Berikan saran hemat yang relevan untuk mahasiswa.`,

    calendar: `Kamu adalah AI time management assistant untuk mahasiswa Indonesia.
Berdasarkan jadwal berikut, berikan 1 insight singkat (2-3 kalimat) dalam bahasa Indonesia:
- Jumlah kegiatan hari ini: ${context.eventsCount || 0}
- Jenis kegiatan: ${context.categories || '?'}
- Waktu mulai pertama: ${context.firstEventTime || '?'}
- Waktu selesai terakhir: ${context.lastEventTime || '?'}
- Ada gap kosong: ${context.hasGap ? 'Ya' : 'Tidak'}
Berikan saran pengaturan waktu yang optimal.`,

    lifelogs: `Kamu adalah AI health & wellness coach untuk mahasiswa Indonesia.
Berdasarkan data kesehatan berikut, berikan 1 analisis singkat (2-3 kalimat) dalam bahasa Indonesia:
- Tidur: ${context.sleepHours || '?'} jam (deep sleep: ${context.deepSleepMinutes || '?'} menit)
- Langkah kaki: ${context.steps || '?'} / 10.000
- Screen time: ${context.screenTimeHours || '?'} jam
- Coding: ${context.codingHours || '?'} jam
- Rest BPM: ${context.heartRate || '?'}
- Stress level: ${context.stress || '?'}/100
Berikan satu rekomendasi kesehatan yang paling relevan.`,

    habits: `Kamu adalah AI habit coach untuk mahasiswa Indonesia.
Berdasarkan data kebiasaan berikut, berikan 1 motivasi singkat (2-3 kalimat) dalam bahasa Indonesia:
- Total kebiasaan: ${context.totalHabits || '?'}
- Kebiasaan ROUTINE: ${context.routineCount || '?'}
- Kebiasaan SUGGESTION: ${context.suggestionCount || '?'}
- Rata-rata poin: ${context.avgPoints || '?'}/10
- Kebiasaan mendekati evolusi (poin >= 7): ${context.nearEvolution || '?'}
Berikan semangat dan saran untuk meningkatkan konsistensi.`,
  }

  const prompt = modulePrompts[module]
  if (!prompt) {
    return res.status(400).json({ error: `Unknown module: ${module}` })
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 200,
          }
        })
      }
    )

    const data = await response.json()

    if (!response.ok) {
      console.error('Gemini API error:', data)
      return res.status(200).json({
        insight: null,
        source: 'error',
        error: data.error?.message || 'Gemini API call failed'
      })
    }

    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || null

    res.json({
      insight: generatedText,
      source: 'gemini',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error calling Gemini API:', error)
    res.status(200).json({
      insight: null,
      source: 'error',
      error: error.message || 'Failed to generate AI insight'
    })
  }
})

// Local development server listener
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3001
  app.listen(PORT, () => {
    console.log(`Local Google Auth Backend listening on port ${PORT}`)
  })
}

export default app
