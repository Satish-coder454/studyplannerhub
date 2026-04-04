import { useState, useEffect } from 'react'

export default function Sidebar({ isOpen, onClose, onLogout, darkMode, onToggleDark }) {
  const [selectedAvatar, setSelectedAvatar] = useState(() => 
    localStorage.getItem('userAvatar') || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix'
  )
  const [showPicker, setShowPicker] = useState(false)

  const avatars = [
    'Felix', 'Aria', 'Luna', 'Orion', 'Nova', 'Atlas'
  ].map(seed => `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`)

  useEffect(() => {
    localStorage.setItem('userAvatar', selectedAvatar)
  }, [selectedAvatar])
  const navLinks = [
    { href: '#motivation', icon: '🌟', label: 'Daily Motivation' },
    { href: '#todo',       icon: '📝', label: 'To-Do List' },
    { href: '#sticky-notes', icon: '📌', label: 'Sticky Notes' },
    { href: '#monthly-planner', icon: '📆', label: 'Monthly Planner' },
    { href: '#discussion', icon: '💬', label: 'Discussion Board' },
    { href: '#mock-test',  icon: '📚', label: 'Mock Test' },
    { href: '#cloud-notes', icon: '☁️', label: 'Cloud Space' },
    { href: '#meet',       icon: '📡', label: 'Meet Live' },
    { href: '#music',      icon: '🎶', label: 'Study Music' },
  ]

  return (
    <aside className={`sidebar${isOpen ? ' open' : ''}`} aria-label="Main navigation">
      <div className="sidebar-header">
        <div className="header-top">
          <div className="logo">
            <span className="logo-mark">✦</span>
            <span className="logo-text">YourHub</span>
          </div>
          <div className="avatar-container">
            <img 
              src={selectedAvatar} 
              alt="User avatar" 
              className="user-avatar"
              onClick={() => setShowPicker(!showPicker)}
            />
            {showPicker && (
              <div className="avatar-picker card">
                {avatars.map(url => (
                  <img 
                    key={url} 
                    src={url} 
                    className={`picker-avatar ${selectedAvatar === url ? 'active' : ''}`}
                    onClick={() => { setSelectedAvatar(url); setShowPicker(false); }}
                    alt="option"
                  />
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="logo-tagline">Study Command Center</div>
      </div>

      <nav className="side-nav">
        {navLinks.map(l => (
          <a key={l.href} href={l.href} className="side-link" onClick={onClose}>
            <span className="nav-icon">{l.icon}</span>
            <span>{l.label}</span>
          </a>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button className="logout-btn" onClick={onLogout}>
          <span>🚪</span><span>Logout</span>
        </button>

        {/* Holographic Dark Mode Toggle */}
        <div className="toggle-container">
          <span className="toggle-label">Dark Mode</span>
          <div className="toggle-wrap">
            <input
              className="toggle-input"
              id="holo-toggle"
              type="checkbox"
              checked={darkMode}
              onChange={onToggleDark}
            />
            <label className="toggle-track" htmlFor="holo-toggle">
              <div className="track-lines"><div className="track-line" /></div>
              <div className="toggle-thumb">
                <div className="thumb-core" />
                <div className="thumb-inner" />
                <div className="thumb-scan" />
                <div className="thumb-particles">
                  <div className="thumb-particle" />
                  <div className="thumb-particle" />
                  <div className="thumb-particle" />
                  <div className="thumb-particle" />
                  <div className="thumb-particle" />
                </div>
              </div>
              <div className="toggle-data">
                <div className="data-text off">OFF</div>
                <div className="data-text on">ON</div>
                <div className="status-indicator off" />
                <div className="status-indicator on" />
              </div>
              <div className="energy-rings">
                <div className="energy-ring" />
                <div className="energy-ring" />
                <div className="energy-ring" />
              </div>
              <div className="interface-lines">
                <div className="interface-line" />
                <div className="interface-line" />
                <div className="interface-line" />
                <div className="interface-line" />
                <div className="interface-line" />
                <div className="interface-line" />
              </div>
              <div className="toggle-reflection" />
              <div className="holo-glow" />
            </label>
          </div>
        </div>
      </div>
    </aside>
  )
}
