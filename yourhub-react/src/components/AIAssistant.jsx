import { useState, useRef, useEffect } from 'react'

export default function AIAssistant() {
  const [messages, setMessages] = useState([
    { role: 'assistant', text: "Hello! I'm your YourHub Study Guide. How can I help you today?" }
  ])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const scrollRef = useRef(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  async function handleSend() {
    if (!input.trim()) return

    const userMsg = { role: 'user', text: input }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsTyping(true)

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/ai/chat`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ message: input })
      })
      const data = await response.json()
      
      setMessages(prev => [...prev, { role: 'assistant', text: data.reply }])
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', text: "Sorry, I'm having trouble connecting right now. 🛡️" }])
    } finally {
      setIsTyping(false)
    }
  }

  return (
    <section className="card" id="ai-assistant">
      <div className="card-accent-line" />
      <h2 className="section-title">
        <span className="section-icon">🧠</span> Study AI Guide
      </h2>
      
      <div className="chat-container">
        <div className="chat-messages" ref={scrollRef}>
          {messages.map((m, i) => (
            <div key={i} className={`message ${m.role}`}>
              <div className="message-bubble">
                {m.text}
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="message assistant">
              <div className="message-bubble typing">
                <span>.</span><span>.</span><span>.</span>
              </div>
            </div>
          )}
        </div>
        
        <div className="chat-input-area">
          <input 
            type="text" 
            value={input} 
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="Ask me anything about your studies..."
            className="chat-input"
          />
          <button className="chat-send-btn" onClick={handleSend}>
            🚀
          </button>
        </div>
      </div>

      <style>{`
        .chat-container {
          background: rgba(255, 255, 255, 0.03);
          border-radius: 16px;
          display: flex;
          flex-direction: column;
          height: 400px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .chat-messages {
          flex: 1;
          overflow-y: auto;
          padding: 15px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .message {
          display: flex;
          width: 100%;
        }
        .message.user {
          justify-content: flex-end;
        }
        .message.assistant {
          justify-content: flex-start;
        }
        .message-bubble {
          max-width: 80%;
          padding: 10px 15px;
          border-radius: 15px;
          font-size: 0.95rem;
          line-height: 1.4;
        }
        .user .message-bubble {
          background: var(--primary-color, #7c4dff);
          color: white;
          border-bottom-right-radius: 2px;
        }
        .assistant .message-bubble {
          background: rgba(255, 255, 255, 0.1);
          color: #e0e0e0;
          border-bottom-left-radius: 2px;
        }
        .dark-mode .assistant .message-bubble {
          background: rgba(255, 255, 255, 0.08);
        }
        
        .chat-input-area {
          display: flex;
          padding: 10px;
          gap: 8px;
          background: rgba(0, 0, 0, 0.2);
          border-bottom-left-radius: 16px;
          border-bottom-right-radius: 16px;
        }
        .chat-input {
          flex: 1;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          padding: 8px 15px;
          color: white;
          outline: none;
        }
        .chat-send-btn {
          background: var(--primary-color, #7c4dff);
          border: none;
          border-radius: 50%;
          width: 38px;
          height: 38px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.2rem;
          transition: transform 0.2s;
        }
        .chat-send-btn:hover {
          transform: scale(1.1);
        }

        .typing span {
          animation: blink 1.4s infinite both;
          font-size: 2rem;
          line-height: 0;
          display: inline-block;
          margin: 0 1px;
        }
        .typing span:nth-child(2) { animation-delay: 0.2s; }
        .typing span:nth-child(3) { animation-delay: 0.4s; }

        @keyframes blink {
          0% { opacity: .2; }
          20% { opacity: 1; }
          100% { opacity: .2; }
        }
      `}</style>
    </section>
  )
}
