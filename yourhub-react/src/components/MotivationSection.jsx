import { useState, useEffect } from 'react'

export default function MotivationSection({ streak }) {
  const [quote, setQuote] = useState('Loading your daily spark...')

  useEffect(() => {
    fetch('https://api.quotable.io/random')
      .then(r => r.json())
      .then(d => setQuote(`"${d.content}" — ${d.author || 'Unknown'}`))
      .catch(() => setQuote('Keep on shining! 🚀'))
  }, [])

  return (
    <section className="card card--hero" id="motivation">
      <div className="card-accent-line" />
      <div className="section-header">
        <h2 className="section-title"><span className="section-icon">🌟</span> Daily Motivation</h2>
        <div className="streak-badge">🔥 <span>{streak}</span> day streak</div>
      </div>
      <div className="quote-text">{quote}</div>
    </section>
  )
}
