import { useState, useEffect } from 'react'
import LoginPage from './components/LoginPage'
import Sidebar from './components/Sidebar'
import MotivationSection from './components/MotivationSection'
import ReminderBot from './components/ReminderBot'
import TodoSection from './components/TodoSection'
import StickyNotes from './components/StickyNotes'
import DiscussionBoard from './components/DiscussionBoard'
import MockTest from './components/MockTest'
import MonthlyPlanner from './components/MonthlyPlanner'
import MeetSection from './components/MeetSection'
import MusicSection from './components/MusicSection'
import useStreak from './hooks/useStreak'
import useClock from './hooks/useClock'

export default function App() {
  const [loggedIn, setLoggedIn] = useState(() => !!localStorage.getItem('loggedInUser'))
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkModeEnabled') === 'true')
  const [streakCount, updateStreak] = useStreak()
  const [liveTime, liveDate] = useClock()

  // Sync dark mode to body
  useEffect(() => {
    document.body.classList.toggle('dark-mode', darkMode)
    localStorage.setItem('darkModeEnabled', darkMode)
  }, [darkMode])

  function handleLogout() {
    localStorage.removeItem('loggedInUser')
    localStorage.removeItem('token')
    setLoggedIn(false)
    setSidebarOpen(false)
  }

  if (!loggedIn) {
    return <LoginPage onLogin={() => setLoggedIn(true)} />
  }

  return (
    <>
      {/* Ambient orbs + noise */}
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />
      <div className="noise-overlay" />

      {/* Hamburger */}
      <div
        id="menuIcon"
        className={`menu-button${sidebarOpen ? ' open' : ''}`}
        role="button"
        tabIndex={0}
        aria-label="Open sidebar"
        onClick={() => setSidebarOpen(o => !o)}
        onKeyDown={e => e.key === 'Enter' && setSidebarOpen(o => !o)}
      >
        <div className="bar bar1" />
        <div className="bar bar2" />
        <div className="bar bar3" />
      </div>

      {/* Google Search */}
      <div className="google-search-box">
        <form action="https://www.google.com/search" method="GET" target="_blank">
          <span className="search-icon">⌕</span>
          <input type="text" name="q" placeholder="Search the web..." className="google-input" />
          <button type="submit" className="google-btn">Go</button>
        </form>
      </div>

      {/* Dim overlay when sidebar opens */}
      <div
        className={`overlay${sidebarOpen ? ' show' : ''}`}
        aria-hidden="true"
        onClick={() => setSidebarOpen(false)}
      />

      <div className="layout">
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onLogout={handleLogout}
          darkMode={darkMode}
          onToggleDark={() => setDarkMode(d => !d)}
        />

        <main className="content" role="main">
          <MotivationSection streak={streakCount} />
          <ReminderBot />
          <TodoSection onStreakUpdate={updateStreak} />
          <StickyNotes />
          <DiscussionBoard />
          <MockTest />
          <MonthlyPlanner />
          <MeetSection />
          <MusicSection />
        </main>
      </div>

      {/* Live Clock */}
      <div className="time-box" aria-hidden="false">
        <div className="time-icon">◷</div>
        <h2 className="live-time">{liveTime}</h2>
        <p className="live-date">{liveDate}</p>
      </div>
    </>
  )
}
