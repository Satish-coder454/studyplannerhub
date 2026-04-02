export default function MeetSection() {
  return (
    <section className="card meet-box" id="meet">
      <div className="card-accent-line" />
      <h2 className="section-title"><span className="section-icon">📡</span> Meet Live</h2>
      <p className="meet-desc">Jump into a live Google Meet session with your study group.</p>
      <a href="https://meet.google.com/" className="meet-link" target="_blank" rel="noopener noreferrer">
        <span>Join Meeting</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3"/>
        </svg>
      </a>
    </section>
  )
}
