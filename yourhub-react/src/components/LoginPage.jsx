import { useState, useEffect, useRef } from 'react'
import { apiRequest } from '../api'

export default function LoginPage({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [msgColor, setMsgColor] = useState('#fca5a5')
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [shouldShake, setShouldShake] = useState(false)
  
  const userRef = useRef(null)

  useEffect(() => {
    userRef.current?.focus()
  }, [])

  async function handleSubmit(e) {
    if (e) e.preventDefault()
    if (!username || !password) {
      triggerError('Please fill all fields')
      return
    }

    setIsLoading(true)
    setMessage('')
    
    try {
      if (isLogin) {
        const res = await apiRequest('/login', {
          method: 'POST',
          body: JSON.stringify({ username, password })
        })
        localStorage.setItem('token', res.token)
        localStorage.setItem('loggedInUser', res.username)
        onLogin()
      } else {
        await apiRequest('/register', {
          method: 'POST',
          body: JSON.stringify({ username, password })
        })
        setMsgColor('#86efac')
        setMessage('Registration successful! Please login.')
        setIsLogin(true)
      }
    } catch (err) {
      triggerError(err.error || `${isLogin ? 'Login' : 'Registration'} failed`)
    } finally {
      setIsLoading(false)
    }
  }

  function triggerError(msg) {
    setMsgColor('#fca5a5')
    setMessage(msg)
    setShouldShake(true)
    setTimeout(() => setShouldShake(false), 500)
  }

  return (
    <div className="login-container">
      <div className="login-mesh" />
      <div className="login-scene">
        <div className="login-glow" />
        <form 
          className={`login-box ${shouldShake ? 'shake' : ''}`} 
          onSubmit={handleSubmit}
        >
          <div className="login-logo">
            <span className="logo-icon">✦</span>
            <span>YourHub</span>
          </div>
          <p className="login-tagline">Your personal study command center</p>

          <div className="mode-toggle">
            <button 
              type="button"
              className={`mode-btn ${isLogin ? 'active' : ''}`}
              onClick={() => { setIsLogin(true); setMessage('') }}
            >
              Login
            </button>
            <button 
              type="button"
              className={`mode-btn ${!isLogin ? 'active' : ''}`}
              onClick={() => { setIsLogin(false); setMessage('') }}
            >
              Sign Up
            </button>
          </div>

          <div className="input-group">
            <span className="input-icon">◈</span>
            <input
              ref={userRef}
              type="text"
              placeholder="Username"
              autoComplete="username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              disabled={isLoading}
            />
          </div>
          
          <div className="input-group">
            <span className="input-icon">◆</span>
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              autoComplete={isLogin ? 'current-password' : 'new-password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              disabled={isLoading}
            />
            <button 
              type="button" 
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex="-1"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
              )}
            </button>
          </div>

          <button className="btn-primary" type="submit" disabled={isLoading}>
            {isLoading ? (
              <div className="spinner" />
            ) : (
              <>
                <span>{isLogin ? 'Enter Hub' : 'Create Account'}</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </>
            )}
          </button>

          {message && (
            <p className="login-message" style={{ color: msgColor }}>
              {message}
            </p>
          )}
        </form>
      </div>
    </div>
  )
}
