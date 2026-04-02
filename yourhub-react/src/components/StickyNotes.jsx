import { useState, useEffect } from 'react'
import { apiRequest } from '../api'

export default function StickyNotes() {
  const [note, setNote] = useState('')

  useEffect(() => {
    apiRequest('/sticky')
      .then(res => setNote(res.note || ''))
      .catch(console.error)
  }, [])

  useEffect(() => {
    // Avoid writing an empty note on initial mount race condition by simple debouncing
    const delayDebounceFn = setTimeout(() => {
      apiRequest('/sticky', { method: 'POST', body: JSON.stringify({ note }) })
        .catch(console.error)
    }, 1000)

    return () => clearTimeout(delayDebounceFn)
  }, [note])

  function exportPdf() {
    if (!window.jspdf) { alert('PDF library not loaded.'); return }
    const { jsPDF } = window.jspdf
    const doc = new jsPDF()
    const lines = doc.splitTextToSize(note, 180)
    doc.setFont('helvetica'); doc.setFontSize(12)
    doc.text(lines, 15, 20)
    doc.save('YourHub_Note.pdf')
  }

  function clearNote() { setNote('') }

  return (
    <section className="card sticky-card" id="sticky-notes">
      <h2>📌 Sticky Notes</h2>
      <textarea
        id="stickyNoteTextarea"
        placeholder="Jot down anything here..."
        value={note}
        onChange={e => setNote(e.target.value)}
      />
      <div className="sticky-actions">
        <button className="btn-secondary" onClick={exportPdf}>📄 Export PDF</button>
        <button className="btn-ghost-dark" onClick={clearNote}>🗑 Clear</button>
      </div>
      <div className="note-save-info">Auto-saved to database ✦</div>

      {/* jsPDF CDN loaded inline */}
      <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js" />
    </section>
  )
}
