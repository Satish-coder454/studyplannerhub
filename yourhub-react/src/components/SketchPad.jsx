import { useRef, useState, useEffect } from 'react'

export default function SketchPad() {
  const canvasRef = useRef(null)
  const ctxRef = useRef(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [color, setColor] = useState('#7c4dff')
  const [lineWidth, setLineWidth] = useState(5)
  const [tool, setTool] = useState('pen') // pen, eraser, rect, circle

  // Initial drawing state for shapes
  const [startPos, setStartPos] = useState({ x: 0, y: 0 })
  const [snapshot, setSnapshot] = useState(null)

  useEffect(() => {
    const canvas = canvasRef.current
    canvas.width = canvas.offsetWidth * 2
    canvas.height = canvas.offsetHeight * 2
    const ctx = canvas.getContext('2d')
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.scale(2, 2)
    ctxRef.current = ctx
  }, [])

  function startDrawing(e) {
    const { offsetX, offsetY } = e.nativeEvent
    if (tool === 'pen' || tool === 'eraser') {
      ctxRef.current.beginPath()
      ctxRef.current.moveTo(offsetX, offsetY)
    } else {
      setStartPos({ x: offsetX, y: offsetY })
      // Take a snapshot to restore during drag
      const canvas = canvasRef.current
      setSnapshot(ctxRef.current.getImageData(0, 0, canvas.width, canvas.height))
    }
    setIsDrawing(true)
  }

  function draw(e) {
    if (!isDrawing) return
    const { offsetX, offsetY } = e.nativeEvent
    const ctx = ctxRef.current

    ctx.strokeStyle = tool === 'eraser' ? '#ffffff' : color
    ctx.lineWidth = lineWidth

    if (tool === 'pen' || tool === 'eraser') {
      ctx.lineTo(offsetX, offsetY)
      ctx.stroke()
    } else {
      // Restore snapshot
      ctx.putImageData(snapshot, 0, 0)
      ctx.beginPath()
      if (tool === 'rect') {
        ctx.strokeRect(startPos.x, startPos.y, offsetX - startPos.x, offsetY - startPos.y)
      } else if (tool === 'circle') {
        const radius = Math.sqrt(Math.pow(offsetX - startPos.x, 2) + Math.pow(offsetY - startPos.y, 2))
        ctx.arc(startPos.x, startPos.y, radius, 0, 2 * Math.PI)
        ctx.stroke()
      }
    }
  }

  function stopDrawing() {
    if (isDrawing && (tool === 'pen' || tool === 'eraser')) {
      ctxRef.current.closePath()
    }
    setIsDrawing(false)
  }

  function clearCanvas() {
    const canvas = canvasRef.current
    ctxRef.current.clearRect(0, 0, canvas.width, canvas.height)
  }

  function downloadCanvas() {
    const link = document.createElement('a')
    link.download = 'sketch.png'
    link.href = canvasRef.current.toDataURL()
    link.click()
  }

  return (
    <section className="card" id="sketchpad">
      <div className="card-accent-line" />
      <h2 className="section-title">
        <span className="section-icon">🎨</span> Sketch & Diagram Space
      </h2>
      
      <div className="sketchpad-toolbar">
        <div className="tool-group">
          <button 
            className={`tool-btn ${tool === 'pen' ? 'active' : ''}`} 
            onClick={() => setTool('pen')} title="Pen"
          >✏️</button>
          <button 
            className={`tool-btn ${tool === 'rect' ? 'active' : ''}`} 
            onClick={() => setTool('rect')} title="Rectangle"
          >⬜</button>
          <button 
            className={`tool-btn ${tool === 'circle' ? 'active' : ''}`} 
            onClick={() => setTool('circle')} title="Circle"
          >⭕</button>
          <button 
            className={`tool-btn ${tool === 'eraser' ? 'active' : ''}`} 
            onClick={() => setTool('eraser')} title="Eraser"
          >🧹</button>
        </div>

        <div className="tool-group">
          <input 
            type="color" 
            value={color} 
            onChange={(e) => setColor(e.target.value)} 
            className="color-picker"
          />
          <input 
            type="range" 
            min="1" max="20" 
            value={lineWidth} 
            onChange={(e) => setLineWidth(e.target.value)} 
            className="width-slider"
          />
        </div>

        <div className="tool-group">
          <button className="btn-secondary" onClick={clearCanvas}>Clear</button>
          <button className="btn-primary" onClick={downloadCanvas}>💾 Save</button>
        </div>
      </div>

      <div className="canvas-wrapper">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseOut={stopDrawing}
        />
      </div>

      <style>{`
        .sketchpad-toolbar {
          display: flex;
          flex-wrap: wrap;
          gap: 15px;
          margin-bottom: 15px;
          align-items: center;
          padding: 10px;
          background: rgba(255,255,255,0.05);
          border-radius: 12px;
        }
        .tool-group {
          display: flex;
          gap: 8px;
          align-items: center;
        }
        .tool-btn {
          background: rgba(255,255,255,0.1);
          border: none;
          padding: 8px 12px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 1.2rem;
          transition: all 0.2s;
        }
        .tool-btn:hover { background: rgba(255,255,255,0.2); }
        .tool-btn.active { 
          background: var(--primary-color, #7c4dff);
          box-shadow: 0 0 15px var(--primary-color, #7c4dff);
        }
        .color-picker {
          width: 40px;
          height: 40px;
          border: none;
          background: none;
          cursor: pointer;
        }
        .width-slider {
          width: 80px;
          accent-color: var(--primary-color, #7c4dff);
        }
        .canvas-wrapper {
          background: #ffffff;
          border-radius: 12px;
          overflow: hidden;
          cursor: crosshair;
          box-shadow: inset 0 0 10px rgba(0,0,0,0.1);
        }
        canvas {
          display: block;
          width: 100%;
          height: 450px;
        }
        .dark-mode .canvas-wrapper {
          background: #f8f9fa; /* Slightly off-white for dark mode comfort */
        }
      `}</style>
    </section>
  )
}
