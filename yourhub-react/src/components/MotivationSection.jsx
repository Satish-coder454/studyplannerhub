import { useState, useEffect } from 'react'

export default function MotivationSection({ streak }) {
  const [quote, setQuote] = useState('Loading your daily spark...')
  const [author, setAuthor] = useState('')

  useEffect(() => {
    fetch('https://favqs.com/api/qotd')
      .then(r => r.json())
      .then(data => {
        if (data.quote) {
          setQuote(data.quote.body)
          setAuthor(data.quote.author)
        }
      })
      .catch(() => {
        setQuote('Great things never come from comfort zones.')
        setAuthor('Anonymous')
      })
  }, [])

  return (
    <section className="card card--hero" id="motivation">
      <div className="card-accent-line" />
      <div className="section-header">
        <h2 className="section-title"><span className="section-icon">🌟</span> Daily Motivation</h2>
        <div className="streak-badge">🔥 <span>{streak}</span> day streak</div>
      </div>
      <div className="quote-container">
        <div className="quote-text">"{quote}"</div>
        {author && <div className="quote-author">— {author}</div>}
      </div>
    </section>
  )
}
