import { useState, useRef } from 'react'

function pad(n) { return String(n).padStart(2, '0') }

export default function MockTest() {
  const [file, setFile] = useState(null)
  const [fileURL, setFileURL] = useState(null)
  const [duration, setDuration] = useState(60)
  const [running, setRunning] = useState(false)
  const [status, setStatus] = useState('')
  const [remaining, setRemaining] = useState(null)
  const [answers, setAnswers] = useState('')
  const [aiFeedback, setAiFeedback] = useState('')
  const [isReviewing, setIsReviewing] = useState(false)
  const intervalRef = useRef(null)

  async function reviewAnswers() {
    setIsReviewing(true)
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/ai/chat`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ message: `Please review these mock test answers: ${answers}` })
      })
      const data = await response.json()
      setAiFeedback(data.reply)
    } catch (err) {
      setAiFeedback("Sorry, I couldn't process your request right now. Check your connection! 🌐")
    } finally {
      setIsReviewing(false)
    }
  }

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

      <div className="mock-review-section">
        <h3 className="sub-title">📝 Type your answers here for AI Review:</h3>
        <textarea 
          className="answer-field" 
          value={answers} 
          onChange={e => setAnswers(e.target.value)}
          placeholder="Enter your answers/notes here to get AI feedback..."
        />
        <button 
          className="btn-secondary ai-review-btn" 
          onClick={reviewAnswers}
          disabled={!answers.trim() || isReviewing}
        >
          {isReviewing ? '⏳ Reviewing...' : '🧠 Review with AI'}
        </button>
        
        {aiFeedback && (
          <div className="ai-feedback-box">
            <h4>💡 AI Guidance:</h4>
            <p>{aiFeedback}</p>
          </div>
        )}
      </div>

      {running && (
        <button className="btn-danger" style={{ marginTop: '12px' }} onClick={endTest}>🛑 End Test</button>
      )}

      <style>{`
        .mock-review-section {
          margin-top: 25px;
          padding-top: 15px;
          border-top: 1px solid rgba(255,255,255,0.1);
        }
        .sub-title {
          font-size: 1rem;
          margin-bottom: 10px;
          opacity: 0.9;
        }
        .answer-field {
          width: 100%;
          min-height: 150px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          padding: 15px;
          color: white;
          font-family: inherit;
          resize: vertical;
          margin-bottom: 10px;
        }
        .ai-review-btn {
          width: 100%;
          background: linear-gradient(135deg, #7c4dff, #448aff);
          color: white;
          border: none;
          font-weight: bold;
        }
        .ai-feedback-box {
          margin-top: 15px;
          padding: 15px;
          background: rgba(124, 77, 255, 0.1);
          border-left: 4px solid #7c4dff;
          border-radius: 8px;
        }
        .ai-feedback-box h4 {
          margin-top: 0;
          color: #7c4dff;
          margin-bottom: 8px;
        }
      `}</style>
    </section>
  )
}
