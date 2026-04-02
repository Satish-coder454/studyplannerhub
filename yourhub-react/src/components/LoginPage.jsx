import { useState } from 'react'
import { apiRequest } from '../api'

export default function LoginPage({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [msgColor, setMsgColor] = useState('#fca5a5')

  async function handleLogin() {
    try {
      const res = await apiRequest('/login', {
        method: 'POST',
        body: JSON.stringify({ username, password })
      })
      localStorage.setItem('token', res.token)
      localStorage.setItem('loggedInUser', res.username)
      onLogin()
    } catch (err) {
      setMsgColor('#fca5a5')
      setMessage(err.error || 'Login failed')
    }
  }

  async function handleRegister() {
    if (!username || !password) { setMsgColor('#fca5a5'); setMessage('Fill all fields!'); return }
    try {
      await apiRequest('/register', {
        method: 'POST',
        body: JSON.stringify({ username, password })
      })
      setMsgColor('#86efac')
      setMessage('Registered! Now login.')
    } catch (err) {
       setMsgColor('#fca5a5')
       setMessage(err.error || 'Registration failed')
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') handleLogin()
  }

  return (
    <div className="login-container">
      <div className="login-scene">
        <div className="login-glow" />
        <div className="login-box">
          <div className="login-logo">
            <span className="logo-icon">✦</span>
            <span>YourHub</span>
          </div>
          <p className="login-tagline">Your personal study command center</p>

          <div className="input-group">
            <span className="input-icon">◈</span>
            <input
              type="text"
              placeholder="Username"
              autoComplete="username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>
          <div className="input-group">
            <span className="input-icon">◆</span>
            <input
              type="password"
              placeholder="Password"
              autoComplete="current-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>

          <button className="btn-primary" onClick={handleLogin}>
            <span>Enter Hub</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </button>
          <button className="btn-ghost" onClick={handleRegister}>Create Account</button>

          <p className="login-message" style={{ color: msgColor }}>{message}</p>
        </div>
      </div>
    </div>
  )
}
