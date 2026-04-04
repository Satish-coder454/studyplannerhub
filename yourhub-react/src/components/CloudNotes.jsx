import { useState, useEffect } from 'react'
import { apiRequest } from '../api'

export default function CloudNotes() {
  const [notes, setNotes] = useState([])
  const [activeNote, setActiveNote] = useState(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchNotes()
  }, [])

  async function fetchNotes() {
    setLoading(true)
    try {
      const data = await apiRequest('/notes')
      setNotes(data)
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    if (!title.trim() && !content.trim()) return
    const id = activeNote?.id
    try {
      const res = await apiRequest('/notes', {
        method: 'POST',
        body: JSON.stringify({ id, title, content })
      })
      if (!id) {
        const newNote = { id: res.id, title, content, updatedAt: new Date().toISOString() }
        setNotes([newNote, ...notes])
        setActiveNote(newNote)
      } else {
        setNotes(notes.map(n => n.id === id ? { ...n, title, content } : n))
      }
    } catch (err) {
      console.error('Note save failed', err)
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this note?')) return
    try {
      await apiRequest(`/notes/${id}`, { method: 'DELETE' })
      setNotes(notes.filter(n => n.id !== id))
      if (activeNote?.id === id) {
        setActiveNote(null)
        setTitle('')
        setContent('')
      }
    } catch (err) {
      console.error('Note delete failed', err)
    }
  }

  function startNewNote() {
    setActiveNote({ id: null })
    setTitle('')
    setContent('')
  }

  function selectNote(note) {
    setActiveNote(note)
    setTitle(note.title)
    setContent(note.content)
  }

  const filteredNotes = notes.filter(n => 
    n.title?.toLowerCase().includes(search.toLowerCase()) || 
    n.content?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <section id="cloud-notes" className="card cloud-notes-card">
      <div className="card-accent-line" />
      <div className="section-header">
        <h2 className="section-title">
          <span className="section-icon">☁️</span>
          Cloud Space
        </h2>
        <div className="notes-actions">
           <button className="btn-secondary" onClick={startNewNote}>
             <span>+ New Note</span>
           </button>
        </div>
      </div>

      <div className="cloud-notes-container">
        <div className="notes-sidebar">
          <input 
            type="text" 
            placeholder="Search notes..." 
            className="field-input search-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="notes-list">
            {loading ? <p className="loading-text">Loading...</p> : 
             filteredNotes.length === 0 ? <p className="empty-text">No notes found</p> :
             filteredNotes.map(note => (
              <div 
                key={note.id} 
                className={`note-item ${activeNote?.id === note.id ? 'active' : ''}`}
                onClick={() => selectNote(note)}
              >
                <div className="note-item-header">
                  <span className="note-title">{note.title || 'Untitled Note'}</span>
                  <button className="delete-note-btn" onClick={(e) => { e.stopPropagation(); handleDelete(note.id) }}>×</button>
                </div>
                <span className="note-preview">{note.content?.substring(0, 40)}...</span>
              </div>
            ))}
          </div>
        </div>

        <div className="note-editor">
          {activeNote ? (
            <>
              <input 
                type="text" 
                placeholder="Note Title" 
                className="note-title-input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={handleSave}
              />
              <textarea 
                placeholder="Start writing..." 
                className="note-content-area"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onBlur={handleSave}
              />
              <div className="editor-footer">
                <span className="status-text">Changes saved automatically</span>
              </div>
            </>
          ) : (
            <div className="editor-placeholder">
              <span className="placeholder-icon">📝</span>
              <h3>Select a note to view or edit</h3>
              <p>Your notes are synced safely in the hub's cloud space.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
