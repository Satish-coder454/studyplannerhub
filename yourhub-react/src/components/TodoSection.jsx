import { useState, useEffect, useRef } from 'react'
import { apiRequest } from '../api'

function pad(n) { return String(n).padStart(2, '0') }
function formatTime(sec) {
  return `${pad(Math.floor(sec / 3600))}:${pad(Math.floor((sec % 3600) / 60))}:${pad(sec % 60)}`
}

export default function TodoSection({ onStreakUpdate }) {
  const [tasks, setTasks] = useState([])
  const [taskName, setTaskName] = useState('')
  const [taskDate, setTaskDate] = useState('')

  // Timer
  const [stopwatchSec, setStopwatchSec] = useState(() => Number(localStorage.getItem('stopwatchSeconds') || 0))
  const [isRunning, setIsRunning] = useState(false)
  const [countdownMin, setCountdownMin] = useState(25)
  const [countdownSec, setCountdownSec] = useState(null) // null = not active
  const swInterval = useRef(null)
  const cdInterval = useRef(null)

  // Load tasks on mount
  useEffect(() => {
    apiRequest('/todos').then(setTasks).catch(console.error)
  }, [])

  // Save stopwatch
  useEffect(() => { localStorage.setItem('stopwatchSeconds', stopwatchSec) }, [stopwatchSec])

  async function addTask() {
    if (!taskName.trim() || !taskDate) { alert('Please fill Task Name and Date!'); return }
    try {
      const payload = { name: taskName.trim(), date: taskDate, completed: false }
      const res = await apiRequest('/todos', { method: 'POST', body: JSON.stringify(payload) })
      setTasks(prev => [...prev, { ...payload, id: res.id }])
      setTaskName(''); setTaskDate('')
    } catch (e) { console.error('Add task error', e) }
  }

  async function deleteTask(id, index) {
    try {
      await apiRequest(`/todos/${id}`, { method: 'DELETE' })
      setTasks(prev => prev.filter((_, idx) => idx !== index))
    } catch (e) { console.error('Delete error', e) }
  }

  async function toggleTask(id, index) {
    const task = tasks[index]
    const nextCompleted = !task.completed
    try {
      await apiRequest(`/todos/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ completed: nextCompleted })
      })
      setTasks(prev => {
        const next = [...prev]
        next[index] = { ...next[index], completed: nextCompleted }
        if (nextCompleted) onStreakUpdate()
        return next
      })
    } catch (e) { console.error('Toggle error', e) }
  }

  const done = tasks.filter(t => t.completed).length
  const pct = tasks.length ? Math.round((done / tasks.length) * 100) : 0

  // Stopwatch
  function startStopwatch() {
    if (isRunning) return
    setIsRunning(true)
    swInterval.current = setInterval(() => setStopwatchSec(s => s + 1), 1000)
  }
  function stopTimer() {
    setIsRunning(false)
    clearInterval(swInterval.current)
    clearInterval(cdInterval.current)
    cdInterval.current = null
    setCountdownSec(null)
  }
  function resetTimer() {
    stopTimer()
    setStopwatchSec(0)
  }
  function startCountdown() {
    if (isRunning) return
    const mins = Number(countdownMin)
    if (!mins || mins <= 0) { alert('Enter valid minutes (1+)'); return }
    let secs = mins * 60
    setCountdownSec(secs)
    setIsRunning(true)
    cdInterval.current = setInterval(() => {
      secs--
      setCountdownSec(secs)
      if (secs <= 0) {
        clearInterval(cdInterval.current)
        setIsRunning(false)
        setCountdownSec(null)
        alert('Session complete! Take a break. 🧘')
      }
    }, 1000)
  }

  const displayTime = countdownSec !== null ? formatTime(countdownSec) : formatTime(stopwatchSec)

  return (
    <section className="card" id="todo">
      <div className="card-accent-line" />
      <h2 className="section-title"><span className="section-icon">📝</span> To-Do List</h2>

      <div className="todo-form">
        <input
          type="text"
          placeholder="Task name..."
          className="field-input"
          value={taskName}
          onChange={e => setTaskName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addTask()}
        />
        <input type="date" className="field-input" value={taskDate} onChange={e => setTaskDate(e.target.value)} />
        <button className="btn-primary" onClick={addTask}>
          <span>Add Task</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 5v14M5 12h14"/></svg>
        </button>
      </div>

      <div aria-live="polite">
        {tasks.map((t, i) => (
          <div key={i} className={`todo-item${t.completed ? ' completed' : ''}`}>
            <div className="todo-left">
              <input type="checkbox" checked={t.completed} onChange={() => toggleTask(t.id, i)} />
              <div>
                <div className="task-name">{t.name}</div>
                <div className="task-date">Due: {t.date}</div>
              </div>
            </div>
            <div className="todo-actions">
              <button onClick={() => deleteTask(t.id, i)}>Delete</button>
            </div>
          </div>
        ))}
      </div>

      <div id="progressContainer">
        <div id="progressBar" role="progressbar" aria-valuemin="0" aria-valuemax="100"
          style={{ width: pct + '%' }}>
          {pct > 8 ? pct + '%' : ''}
        </div>
      </div>

      {/* TIMER */}
      <div className="study-timer-box">
        <h3>⏱ Study Time Tracker</h3>
        <div className="timer-display">{displayTime}</div>
        <div className="timer-buttons">
          <button className="timer-btn timer-start" onClick={startStopwatch}>▶ Start</button>
          <button className="timer-btn timer-stop" onClick={stopTimer}>⏸ Stop</button>
          <button className="timer-btn timer-reset" onClick={resetTimer}>↺ Reset</button>
        </div>
        <hr className="timer-separator" />
        <div className="countdown-controls">
          <input
            type="number"
            value={countdownMin}
            min="1"
            className="field-input countdown-field"
            placeholder="Minutes"
            onChange={e => setCountdownMin(e.target.value)}
          />
          <button className="btn-secondary countdown-button" onClick={startCountdown}>Start Countdown ⏳</button>
        </div>
      </div>
    </section>
  )
}
