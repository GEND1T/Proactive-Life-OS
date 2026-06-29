import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const app = express()
const PORT = process.env.PORT || 3001

// Setup cors to allow the frontend to access endpoints
app.use(cors())
app.use(express.json())

const clientId = process.env.VITE_GOOGLE_CLIENT_ID
const clientSecret = process.env.GOOGLE_CLIENT_SECRET

console.log('Google Auth Backend starting...')
console.log('Using Client ID:', clientId ? 'Found' : 'Missing!')
console.log('Using Client Secret:', clientSecret ? 'Found' : 'Missing!')

if (!clientId) {
  console.error('CRITICAL: VITE_GOOGLE_CLIENT_ID is not defined in .env.local')
}

// 1. Endpoint to exchange auth code for tokens
app.post('/api/google/exchange', async (req, res) => {
  const { code } = req.body

  if (!code) {
    return res.status(400).json({ error: 'Auth code is required' })
  }

  if (!clientSecret) {
    return res.status(500).json({ 
      error: 'GOOGLE_CLIENT_SECRET is missing. Please add it to your .env.local file' 
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
        redirect_uri: 'postmessage', // Required for Google GIS Code Client popup mode
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

    // Return tokens to the client
    res.json({
      access_token: data.access_token,
      refresh_token: data.refresh_token, // This will be returned only on the first authorization
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
      error: 'GOOGLE_CLIENT_SECRET is missing. Please add it to your .env.local file' 
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

app.listen(PORT, () => {
  console.log(`Google Auth Backend listening on port ${PORT}`)
})
