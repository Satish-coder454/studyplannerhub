export const getToken = () => localStorage.getItem('token')

function getBaseUrl() {
  const envUrl = import.meta.env.VITE_API_URL
  if (!envUrl) return '/api'
  if (envUrl.endsWith('/api')) return envUrl
  return envUrl.replace(/\/$/, '') + '/api'
}

const BASE_URL = getBaseUrl()

export async function apiRequest(endpoint, options = {}) {
  const token = getToken()
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  }

  const url = `${BASE_URL}${endpoint}`
  
  try {
    const response = await fetch(url, {
      ...options,
      headers,
    })

    if (response.status === 401 && endpoint !== '/login' && endpoint !== '/register') {
      localStorage.removeItem('token')
      localStorage.removeItem('loggedInUser')
      window.location.reload()
    }

    const data = await response.json().catch(() => ({}))
    
    if (!response.ok) {
      throw { status: response.status, ...data }
    }
    
    return data
  } catch (err) {
    console.error(`🌐 API Request Failed: [${options.method || 'GET'}] ${url}`, err)
    if (err.name === 'TypeError' && err.message === 'Failed to fetch') {
      console.warn('💡 Tip: Check if VITE_API_URL is set correctly in your environment variables.')
    }
    throw err
  }
}
