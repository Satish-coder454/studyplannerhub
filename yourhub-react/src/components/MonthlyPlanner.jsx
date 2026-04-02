import { useState, useEffect } from 'react'
import { apiRequest } from '../api'

function isoToFriendly(iso) {
  try { return new Date(iso + 'T00:00:00').toLocaleDateString(undefined, { weekday:'long', month:'short', day:'numeric', year:'numeric' }) }
  catch { return iso }
}

// ---- Daily Notes Modal ----
function DailyNoteModal({ iso, onClose, onActivity }) {
  const [note, setNote] = useState('')
  const [tasks, setTasks] = useState([])
  const [taskText, setTaskText] = useState('')
  const [savedMsg, setSavedMsg] = useState('')

  useEffect(() => {
    apiRequest(`/planner/${iso}`)
      .then(res => {
        setNote(res.note || '')
        setTasks(res.tasks || [])
      })
      .catch(console.error)
  }, [iso])

  function indicateSave() {
    onActivity()
    setSavedMsg('Saved ' + new Date().toLocaleTimeString())
    setTimeout(() => setSavedMsg(''), 1300)
  }

  async function saveNote() {
    try {
      await apiRequest(`/planner/${iso}/note`, { method: 'POST', body: JSON.stringify({ note }) })
      indicateSave()
    } catch (e) { console.error('Note save error', e) }
  }

  async function addTask() {
    if (!taskText.trim()) return
    try {
      const res = await apiRequest(`/planner/${iso}/task`, { method: 'POST', body: JSON.stringify({ text: taskText.trim(), done: false }) })
      setTasks(prev => [{ id: res.id, text: taskText.trim(), done: false }, ...prev])
      setTaskText('')
      indicateSave()
    } catch (e) { console.error('Add task error', e) }
  }

  async function toggleTask(id) {
    const task = tasks.find(t => t.id === id)
    try {
      await apiRequest(`/planner/task/${id}`, { method: 'PUT', body: JSON.stringify({ done: !task.done }) })
      setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t))
    } catch (e) { console.error('Toggle task error', e) }
  }

  async function deleteTask(id) {
    if (!confirm('Delete this task?')) return
    try {
      await apiRequest(`/planner/task/${id}`, { method: 'DELETE' })
      setTasks(prev => prev.filter(t => t.id !== id))
      indicateSave()
    } catch (e) { console.error('Delete task error', e) }
  }

  async function deleteAll() {
    if (!confirm('Delete all notes and tasks for this date?')) return
    try {
      await apiRequest(`/planner/${iso}`, { method: 'DELETE' })
      onActivity()
      onClose()
    } catch (e) { console.error('Delete all error', e) }
  }

  return (
    <div className="dn-modal open">
      <div className="dn-overlay" onClick={onClose} />
      <div className="dn-panel">
        <div className="dn-header">
          <div>
            <h3>{isoToFriendly(iso)}</h3>
            <div className="dn-sub">Notes &amp; tasks for this day</div>
          </div>
          <div className="dn-actions">
            <button onClick={onClose} title="Close">✕</button>
          </div>
        </div>
        <div className="dn-body">
          <label className="dn-label">📝 Notes</label>
          <textarea
            className="dn-textarea"
            placeholder="Write something meaningful..."
            value={note}
            onChange={e => setNote(e.target.value)}
            onBlur={saveNote}
          />
          <label className="dn-label">✅ Tasks</label>
          <div className="dn-task-header">
            <input
              className="dn-task-input"
              placeholder="Add a task..."
              value={taskText}
              onChange={e => setTaskText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addTask()}
            />
            <button className="btn-primary" onClick={addTask}>Add</button>
          </div>
          <ul className="dn-task-list">
            {tasks.map(t => (
              <li key={t.id} className={`dn-task-item${t.done ? ' done' : ''}`}>
                <input type="checkbox" checked={t.done} onChange={() => toggleTask(t.id)} />
                <div className="task-text">{t.text}</div>
                <button onClick={() => deleteTask(t.id)}>✕</button>
              </li>
            ))}
          </ul>
        </div>
        <div className="dn-footer">
          <button className="dn-btn dn-ghost" onClick={deleteAll}>🗑 Delete All</button>
          <button className="dn-btn dn-save" onClick={saveNote}>💾 Save Note</button>
          <span className="dn-saved">{savedMsg}</span>
          <button className="dn-btn" style={{ marginLeft: 'auto' }} onClick={onClose}>Close ✕</button>
        </div>
      </div>
    </div>
  )
}

// ---- Monthly Planner ----
export default function MonthlyPlanner() {
  const [current, setCurrent] = useState(new Date())
  const [selectedIso, setSelectedIso] = useState(null)
  const [activeDates, setActiveDates] = useState([])

  function loadDots() {
    apiRequest('/planner-dots').then(setActiveDates).catch(console.error)
  }

  useEffect(() => { loadDots() }, [])

  const year = current.getFullYear()
  const month = current.getMonth()
  const monthLabel = current.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const firstDay = new Date(year, month, 1).getDay()
  const numDays = new Date(year, month + 1, 0).getDate()
  const todayISO = new Date().toISOString().split('T')[0]
  const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

  function prevMonth() { setCurrent(new Date(year, month - 1, 1)) }
  function nextMonth() { setCurrent(new Date(year, month + 1, 1)) }

  return (
    <section className="card" id="monthly-planner">
      <div className="card-accent-line" />
      <h2 className="section-title"><span className="section-icon">📆</span> Monthly Planner</h2>
      <div className="month-header">
        <button className="month-nav-btn" onClick={prevMonth}>◀</button>
        <h3>{monthLabel}</h3>
        <button className="month-nav-btn" onClick={nextMonth}>▶</button>
      </div>
      <div className="calendar-grid">
        {days.map(d => <div key={d} className="day-name">{d}</div>)}
        {Array.from({ length: firstDay }, (_, i) => <div key={'e' + i} className="calendar-date empty" />)}
        {Array.from({ length: numDays }, (_, i) => {
          const d = i + 1
          const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
          const hasContent = activeDates.includes(iso)
          return (
            <div
              key={iso}
              className={`calendar-date mini-cal-date${iso === todayISO ? ' today' : ''}`}
              data-iso={iso}
              onClick={() => setSelectedIso(iso)}
            >
              {d}
              {hasContent && <span className="note-dot" />}
            </div>
          )
        })}
      </div>
      {selectedIso && <DailyNoteModal iso={selectedIso} onClose={() => setSelectedIso(null)} onActivity={loadDots} />}
    </section>
  )
}
