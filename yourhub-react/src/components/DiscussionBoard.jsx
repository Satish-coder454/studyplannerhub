import { useState, useEffect } from 'react'
import { apiRequest } from '../api'

export default function DiscussionBoard() {
  const [posts, setPosts] = useState([])
  const [text, setText] = useState('')
  const [username, setUsername] = useState('')

  useEffect(() => {
    apiRequest('/discussion').then(setPosts).catch(console.error)
  }, [])

  async function post() {
    if (!text.trim()) return
    const newPost = { text: text.trim(), username: username.trim() || 'Anonymous', time: new Date().toLocaleString() }
    try {
      await apiRequest('/discussion', { method: 'POST', body: JSON.stringify(newPost) })
      setPosts(prev => [newPost, ...prev])
      setText(''); setUsername('')
    } catch (e) {
      console.error('Discussion post failed', e)
    }
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[m])
  }

  return (
    <section className="card" id="discussion">
      <div className="card-accent-line" />
      <h2 className="section-title"><span className="section-icon">💬</span> Discussion Board</h2>
      <textarea
        className="discussion-textarea"
        placeholder="Share a thought, question, or insight..."
        value={text}
        onChange={e => setText(e.target.value)}
      />
      <div className="discussion-form-row">
        <input
          className="field-input username-field"
          placeholder="Your name..."
          value={username}
          onChange={e => setUsername(e.target.value)}
        />
        <button className="btn-primary" onClick={post}>Post 💬</button>
      </div>
      <div style={{ marginTop: '16px' }}>
        {posts.map((p, i) => (
          <div key={i} className="post">
            <b>{p.username}</b>: {p.text}<br/>
            <small>{p.time}</small>
          </div>
        ))}
      </div>
    </section>
  )
}
