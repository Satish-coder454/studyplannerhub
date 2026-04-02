import { useState, useRef, useEffect } from 'react'

const PLAYLIST = ['music1.mp3', 'music2.mp3', 'music3.mp3', 'music4.mp3']

export default function MusicSection() {
  const [trackIdx, setTrackIdx] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef(null)
  const canvasRef = useRef(null)
  const audioCtxRef = useRef(null)
  const analyserRef = useRef(null)
  const rafRef = useRef(null)

  function loadTrack(i) {
    const idx = (i + PLAYLIST.length) % PLAYLIST.length
    setTrackIdx(idx)
    if (audioRef.current) {
      audioRef.current.src = PLAYLIST[idx]
      audioRef.current.load()
      audioRef.current.play().catch(() => {})
      setIsPlaying(true)
    }
  }

  function togglePlay() {
    if (!audioRef.current) return
    if (audioRef.current.paused) {
      audioRef.current.play()
      setIsPlaying(true)
    } else {
      audioRef.current.pause()
      setIsPlaying(false)
    }
  }

  function setupVisualizer() {
    if (audioCtxRef.current || !audioRef.current) return
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const analyser = ctx.createAnalyser()
    const source = ctx.createMediaElementSource(audioRef.current)
    source.connect(analyser)
    analyser.connect(ctx.destination)
    audioCtxRef.current = ctx
    analyserRef.current = analyser
    drawVisualizer()
  }

  function drawVisualizer() {
    const canvas = canvasRef.current
    const analyser = analyserRef.current
    if (!canvas || !analyser) return
    const vCtx = canvas.getContext('2d')
    canvas.width = canvas.clientWidth
    canvas.height = 80
    const bufLen = analyser.frequencyBinCount
    const data = new Uint8Array(bufLen)
    analyser.getByteFrequencyData(data)
    vCtx.clearRect(0, 0, canvas.width, canvas.height)
    const bw = (canvas.width / bufLen) * 2
    let x = 0
    for (let i = 0; i < bufLen; i++) {
      const h = data[i]
      vCtx.fillStyle = `rgba(${Math.min(h + 80, 255)},99,255,0.85)`
      vCtx.fillRect(x, canvas.height - h, bw, h)
      x += bw + 1
    }
    rafRef.current = requestAnimationFrame(drawVisualizer)
  }

  useEffect(() => {
    const audio = audioRef.current
    function onEnded() { loadTrack(trackIdx + 1) }
    audio?.addEventListener('ended', onEnded)
    return () => {
      audio?.removeEventListener('ended', onEnded)
      cancelAnimationFrame(rafRef.current)
    }
  }, [trackIdx])

  return (
    <section className="card" id="music">
      <div className="card-accent-line" />
      <h2 className="section-title"><span className="section-icon">🎶</span> Your Music Hub</h2>

      <div className="player-box">
        <div className="player-track-name">♪ {PLAYLIST[trackIdx]}</div>
        <audio
          ref={audioRef}
          className="audio-player"
          controls
          src={PLAYLIST[trackIdx]}
          onPlay={() => { setIsPlaying(true); setupVisualizer(); if (audioCtxRef.current?.state === 'suspended') audioCtxRef.current.resume() }}
          onPause={() => setIsPlaying(false)}
        />
        <canvas ref={canvasRef} className="music-visualizer" />
        <div className="music-controls">
          <button className="music-btn" onClick={() => loadTrack(trackIdx - 1)}>⏮</button>
          <button className={`music-btn${isPlaying ? ' music-btn--play' : ''}`} onClick={togglePlay}>
            {isPlaying ? '⏸ Pause' : '▶ Play'}
          </button>
          <button className="music-btn" onClick={() => loadTrack(trackIdx + 1)}>⏭</button>
        </div>
      </div>

      <hr className="music-divider" />
      <h3 className="sub-heading">🎧 Spotify Playlist</h3>
      <iframe
        src="https://open.spotify.com/embed/playlist/37i9dQZF1DX8Uebhn9wzrS"
        width="100%" height="352"
        title="Spotify playlist"
        frameBorder="0"
        allow="encrypted-media"
        className="spotify-frame"
      />

      <hr className="music-divider" />
      <h3 className="sub-heading">🎥 LoFi Stream</h3>
      <iframe
        width="100%" height="315"
        src="https://www.youtube.com/embed/jfKfPfyJRdk"
        title="LoFi stream"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="yt-frame"
      />
    </section>
  )
}
