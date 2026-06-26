const webhookUrl = import.meta.env.VITE_N8N_WEBHOOK_URL

/**
 * Sends a payload to the n8n webhook.
 * @param {string} type - 'finance' or 'activity'
 * @param {object} payload - The log details to submit
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function submitToWebhook(type, payload) {
  if (!webhookUrl) {
    console.error('n8n Webhook URL is missing in environment variables.')
    return { success: false, error: 'Konfigurasi Webhook n8n tidak ditemukan (.env.local)' }
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type,
        timestamp: new Date().toISOString(),
        data: payload,
      }),
    })

    if (response.ok) {
      return { success: true }
    } else {
      const errorText = await response.text()
      return {
        success: false,
        error: `Server n8n merespon dengan status ${response.status}: ${errorText || 'Unknown Error'}`,
      }
    }
  } catch (err) {
    console.error('Error submitting to n8n webhook:', err)
    return {
      success: false,
      error: err.message || 'Koneksi ke server n8n gagal. Periksa jaringan Anda.',
    }
  }
}
