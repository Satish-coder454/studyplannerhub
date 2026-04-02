import { useState, useRef } from 'react'

export default function ReminderBot() {
  const [enabled, setEnabled] = useState(false)
  const [time, setTime] = useState('21:00')

  function pad(n) { return String(n).padStart(2, '0') }

  async function sendReminder() {
    if (Notification.permission !== 'granted') await Notification.requestPermission()
    if (Notification.permission === 'granted') {
      new Notification('Study Reminder 📚', {
        body: "You haven't studied today! Time to hit the books.",
      })
    }
  }

  return (
    <section className="card" id="reminderBot">
      <div className="card-accent-line" />
      <h2 className="section-title"><span className="section-icon">🤖</span> Study Reminder Bot</h2>
      <div className="reminder-controls">
        <label className="toggle-pill">
          <input type="checkbox" checked={enabled} onChange={e => setEnabled(e.target.checked)} />
          <span className="pill-track" />
          <span className="pill-label">Enable daily reminders</span>
        </label>
        <label className="time-label">
          Remind me at
          <input type="time" value={time} onChange={e => setTime(e.target.value)} className="time-input" />
        </label>
        <button className="btn-secondary" onClick={sendReminder}>Send Test 🔔</button>
      </div>
    </section>
  )
}
