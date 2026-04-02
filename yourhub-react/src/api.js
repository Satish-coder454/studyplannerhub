export const getToken = () => localStorage.getItem('token')

export async function apiRequest(endpoint, options = {}) {
  const token = getToken()
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  }

  const response = await fetch(`/api${endpoint}`, {
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
}
