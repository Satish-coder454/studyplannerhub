import { useState, useRef } from 'react'

function pad(n) { return String(n).padStart(2, '0') }

export default function MockTest() {
  const [file, setFile] = useState(null)
  const [fileURL, setFileURL] = useState(null)
  const [duration, setDuration] = useState(60)
  const [running, setRunning] = useState(false)
  const [status, setStatus] = useState('')
  const [remaining, setRemaining] = useState(null)
  const intervalRef = useRef(null)

  function handleFile(e) {
    const f = e.target.files[0]
    if (!f) return
    setFile(f)
    setFileURL(URL.createObjectURL(f))
    setStatus('Ready to start ✦')
  }

  function startTest() {
    if (running) { alert('Test already running!'); return }
    if (!file) { alert('Please upload a mock paper first.'); return }
    if (duration < 10) { alert('Duration must be at least 10 minutes.'); return }
    let secs = duration * 60
    setRemaining(secs)
    setRunning(true)
    intervalRef.current = setInterval(() => {
      secs--
      setRemaining(secs)
      if (secs <= 0) {
        clearInterval(intervalRef.current)
        setRunning(false)
        setStatus("🛑 TIME'S UP! Test finished.")
        setRemaining(null)
        alert('Mock Test Complete! Time to review.')
      } else {
        setStatus(`⏱ Remaining: ${pad(Math.floor(secs/60))}:${pad(secs%60)}`)
      }
    }, 1000)
  }

  function endTest() {
    if (!running) return
    clearInterval(intervalRef.current)
    const elapsed = Math.floor((duration * 60 - remaining) / 60)
    setStatus(`✓ Test ended early. Duration: ${elapsed} min.`)
    setRunning(false)
    setRemaining(null)
  }

  return (
    <section className="card" id="mock-test">
      <div className="card-accent-line" />
      <h2 className="section-title"><span className="section-icon">📚</span> Mock Test Simulation</h2>
      <div className="mock-controls">
        <label className="file-label">
          <input type="file" accept=".pdf,.doc,.docx,.jpg,.png" onChange={handleFile} />
          <span>📂 Upload Paper</span>
        </label>
        <input
          type="number"
          value={duration}
          min="10"
          className="field-input mock-dur-field"
          placeholder="Duration (min)"
          onChange={e => setDuration(Number(e.target.value))}
        />
        {!running && (
          <button className="btn-primary" onClick={startTest}>▶ Start Test</button>
        )}
      </div>

      {file && (
        <div className="mock-info-box">
          <p>📄 {file.name}</p>
          {fileURL && <a href={fileURL} target="_blank" rel="noopener noreferrer" className="view-paper-link">👁 View Paper</a>}
        </div>
      )}

      {status && <div className="mock-timer-status" aria-live="polite">{status}</div>}

      {running && (
        <button className="btn-danger" style={{ marginTop: '12px' }} onClick={endTest}>🛑 End Test</button>
      )}
    </section>
  )
}
