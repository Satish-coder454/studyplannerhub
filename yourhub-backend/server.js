const express = require('express')
const cors = require('cors')
const sqlite3 = require('sqlite3')
const { open } = require('sqlite')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const path = require('path')

const app = express()


const allowedOrigins = [
  'https://studyplannerhub-4i8i.vercel.app', // Your Vercel frontend
  'http://localhost:5173',                   // Vite default local port
  'http://localhost:3000'                    // CRA default local port
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  credentials: true // Required if you are sending cookies or authorization headers
}));
app.use(express.json())

const JWT_SECRET = 'super-secret-yourhub-key' // Default key for dev

let db;

async function initDB() {
  try {
    db = await open({
      filename: process.env.DB_PATH || path.join(__dirname, 'database.sqlite'),
      driver: sqlite3.Database
    })
  } catch (err) {
    console.error(`❌ Failed to open database at ${process.env.DB_PATH}:`, err.message)
    console.log('⚠️ Falling back to local directory database.sqlite...')
    db = await open({
      filename: path.join(__dirname, 'database.sqlite'),
      driver: sqlite3.Database
    })
  }

  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      passwordHash TEXT
    );
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER,
      name TEXT,
      date TEXT,
      completed BOOLEAN,
      FOREIGN KEY(userId) REFERENCES users(id)
    );
    CREATE TABLE IF NOT EXISTS dailyNotes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER,
      isoDate TEXT,
      note TEXT,
      UNIQUE(userId, isoDate),
      FOREIGN KEY(userId) REFERENCES users(id)
    );
    CREATE TABLE IF NOT EXISTS dailyTasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER,
      isoDate TEXT,
      text TEXT,
      done BOOLEAN,
      FOREIGN KEY(userId) REFERENCES users(id)
    );
    CREATE TABLE IF NOT EXISTS sticky (
      userId INTEGER PRIMARY KEY,
      note TEXT,
      FOREIGN KEY(userId) REFERENCES users(id)
    );
    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      text TEXT,
      username TEXT,
      time TEXT
    );
    CREATE TABLE IF NOT EXISTS stats (
      userId INTEGER PRIMARY KEY,
      streakCount INTEGER DEFAULT 0,
      lastCompletedDate TEXT,
      FOREIGN KEY(userId) REFERENCES users(id)
    );
    CREATE TABLE IF NOT EXISTS cloudNotes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER,
      title TEXT,
      content TEXT,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(userId) REFERENCES users(id)
    );
  `)
  console.log('✅ SQLite Database ready.')
}
initDB()

// --- Authenticaton Middleware ---
function auth(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1]
  if (!token) return res.status(401).json({ error: 'No token provided' })
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ error: 'Invalid token' })
    req.userId = decoded.userId
    req.username = decoded.username
    next()
  })
}

// --- Auth Routes ---
app.post('/api/register', async (req, res) => {
  const { username, password } = req.body
  try {
    const hash = await bcrypt.hash(password, 10)
    await db.run('INSERT INTO users (username, passwordHash) VALUES (?, ?)', [username, hash])
    res.json({ message: 'User registered' })
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT') res.status(400).json({ error: 'Username taken' })
    else res.status(500).json({ error: 'Registration failed' })
  }
})

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body
  const user = await db.get('SELECT * FROM users WHERE username = ?', [username])
  if (user && await bcrypt.compare(password, user.passwordHash)) {
    const token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET)
    res.json({ token, username })
  } else {
    res.status(401).json({ error: 'Invalid credentials' })
  }
})

// --- Todo Routes ---
app.get('/api/todos', auth, async (req, res) => {
  const tasks = await db.all('SELECT * FROM tasks WHERE userId = ?', [req.userId])
  res.json(tasks.map(t => ({...t, completed: Boolean(t.completed)})))
})

app.post('/api/todos', auth, async (req, res) => {
  const { name, date, completed } = req.body
  const result = await db.run('INSERT INTO tasks (userId, name, date, completed) VALUES (?, ?, ?, ?)', [req.userId, name, date, completed ? 1 : 0])
  res.json({ id: result.lastID })
})

app.put('/api/todos/:id', auth, async (req, res) => {
  const { completed } = req.body
  await db.run('UPDATE tasks SET completed = ? WHERE id = ? AND userId = ?', [completed ? 1 : 0, req.params.id, req.userId])
  res.json({ success: true })
})

app.delete('/api/todos/:id', auth, async (req, res) => {
  await db.run('DELETE FROM tasks WHERE id = ? AND userId = ?', [req.params.id, req.userId])
  res.json({ success: true })
})


// --- Discussion Board (Global) ---
app.get('/api/discussion', async (req, res) => {
  const posts = await db.all('SELECT * FROM posts ORDER BY id DESC')
  res.json(posts)
})
app.post('/api/discussion', async (req, res) => {
  const { text, username, time } = req.body
  await db.run('INSERT INTO posts (text, username, time) VALUES (?, ?, ?)', [text, username, time])
  res.json({ success: true })
})

// --- Sticky Notes ---
app.get('/api/sticky', auth, async (req, res) => {
  const record = await db.get('SELECT note FROM sticky WHERE userId = ?', [req.userId])
  res.json({ note: record ? record.note : '' })
})
app.post('/api/sticky', auth, async (req, res) => {
  const { note } = req.body
  await db.run('INSERT INTO sticky (userId, note) VALUES (?, ?) ON CONFLICT(userId) DO UPDATE SET note=excluded.note', [req.userId, note])
  res.json({ success: true })
})

// --- Streak ---
app.get('/api/streak', auth, async (req, res) => {
  let stat = await db.get('SELECT * FROM stats WHERE userId = ?', [req.userId])
  if (!stat) {
    await db.run('INSERT INTO stats (userId) VALUES (?)', [req.userId])
    stat = { streakCount: 0, lastCompletedDate: null }
  }
  res.json(stat)
})
app.post('/api/streak', auth, async (req, res) => {
  const { streakCount, lastCompletedDate } = req.body
  await db.run('UPDATE stats SET streakCount = ?, lastCompletedDate = ? WHERE userId = ?', [streakCount, lastCompletedDate, req.userId])
  res.json({ success: true })
})

// --- Daily Planner Notes ---
app.get('/api/planner/:iso', auth, async (req, res) => {
  const { iso } = req.params
  const noteRow = await db.get('SELECT note FROM dailyNotes WHERE userId = ? AND isoDate = ?', [req.userId, iso])
  const tasks = await db.all('SELECT id, text, done FROM dailyTasks WHERE userId = ? AND isoDate = ? ORDER BY id DESC', [req.userId, iso])
  res.json({ note: noteRow ? noteRow.note : '', tasks: tasks.map(t => ({...t, done: Boolean(t.done)})) })
})

app.post('/api/planner/:iso/note', auth, async (req, res) => {
  const { iso } = req.params
  const { note } = req.body
  await db.run('INSERT INTO dailyNotes (userId, isoDate, note) VALUES (?, ?, ?) ON CONFLICT(userId, isoDate) DO UPDATE SET note=excluded.note', [req.userId, iso, note])
  res.json({ success: true })
})

app.post('/api/planner/:iso/task', auth, async (req, res) => {
  const { iso } = req.params
  const { text, done } = req.body
  const result = await db.run('INSERT INTO dailyTasks (userId, isoDate, text, done) VALUES (?, ?, ?, ?)', [req.userId, iso, text, done ? 1 : 0])
  res.json({ id: result.lastID })
})
app.put('/api/planner/task/:id', auth, async (req, res) => {
  const { done } = req.body
  await db.run('UPDATE dailyTasks SET done = ? WHERE id = ? AND userId = ?', [done ? 1 : 0, req.params.id, req.userId])
  res.json({ success: true })
})
app.delete('/api/planner/task/:id', auth, async (req, res) => {
  await db.run('DELETE FROM dailyTasks WHERE id = ? AND userId = ?', [req.params.id, req.userId])
  res.json({ success: true })
})
app.delete('/api/planner/:iso', auth, async (req, res) => {
  const { iso } = req.params
  await db.run('DELETE FROM dailyNotes WHERE userId = ? AND isoDate = ?', [req.userId, iso])
  await db.run('DELETE FROM dailyTasks WHERE userId = ? AND isoDate = ?', [req.userId, iso])
  res.json({ success: true })
})

// --- Cloud Notes ---
app.get('/api/notes', auth, async (req, res) => {
  const notes = await db.all('SELECT * FROM cloudNotes WHERE userId = ? ORDER BY updatedAt DESC', [req.userId])
  res.json(notes)
})

app.post('/api/notes', auth, async (req, res) => {
  const { id, title, content } = req.body
  if (id) {
    await db.run('UPDATE cloudNotes SET title = ?, content = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ? AND userId = ?', [title, content, id, req.userId])
    res.json({ success: true })
  } else {
    const result = await db.run('INSERT INTO cloudNotes (userId, title, content) VALUES (?, ?, ?)', [req.userId, title, content])
    res.json({ id: result.lastID })
  }
})

app.delete('/api/notes/:id', auth, async (req, res) => {
  await db.run('DELETE FROM cloudNotes WHERE id = ? AND userId = ?', [req.params.id, req.userId])
  res.json({ success: true })
})

// Utility fetch for dots indicator 
app.get('/api/planner-dots', auth, async (req, res) => {
  const rowsNotes = await db.all('SELECT isoDate FROM dailyNotes WHERE userId = ? AND note != ""', [req.userId])
  const rowsTasks = await db.all('SELECT isoDate FROM dailyTasks WHERE userId = ? GROUP BY isoDate', [req.userId])
  const dates = new Set([...rowsNotes.map(r=>r.isoDate), ...rowsTasks.map(r=>r.isoDate)])
  res.json(Array.from(dates))
})

// --- Study AI Chat Helper ---
app.post('/api/ai/chat', auth, async (req, res) => {
  const { message } = req.body
  const m = message.toLowerCase()

  // Get user context to make it feel "AI"
  const taskCount = await db.all('SELECT count(*) as count FROM tasks WHERE userId = ? AND completed = 0', [req.userId])
  const noteCount = await db.all('SELECT count(*) as count FROM cloudNotes WHERE userId = ?', [req.userId])

  let reply = ""

  if (m.includes('review these mock test answers')) {
    const ans = message.replace('Please review these mock test answers:', '').trim()
    if (ans.length < 50) {
      reply = "I've analyzed your answers. They seem a bit brief—try to elaborate more on your reasoning next time! In a real exam, detailed explanations often fetch extra marks. 📝"
    } else {
      reply = "Great effort on this test! I've reviewed your submission. Your structure is logical, and you've covered the core concepts. To improve, try adding more specific examples or diagrams (use the Sketchpad!) to support your points. Well done! 🌟"
    }
  } else if (m.includes('hello') || m.includes('hi')) {
    reply = `Hello, ${req.username || 'there'}! I'm ready to help you study. You have ${taskCount[0].count} pending tasks. What's our focus today?`
  } else if (m.includes('task') || m.includes('todo')) {
    reply = `You have ${taskCount[0].count} items on your list. Break them into 25-minute Pomodoro chunks for maximum efficiency! 🕒`
  } else if (m.includes('note')) {
    reply = `I see you've saved ${noteCount[0].count} notes in the Cloud. Keep it up! Active recall is the best way to remember them. 📝`
  } else if (m.includes('exam') || m.includes('test')) {
    reply = "Exams can be stressful, but preparation is key. Use the Mock Test section to practice, and don't forget to take breaks! 🎓"
  } else if (m.includes('sketch') || m.includes('canvas')) {
    reply = "Visualizing your concepts in the Sketchpad is a great strategy for complex subjects like science or math. 🎨"
  } else if (m.includes('help')) {
    reply = "I can guide you on task management, note-taking, and study techniques. Just ask about specific parts of YourHub!"
  } else {
    const responses = [
      "That's interesting! How does that connect to your current study goals? 🤔",
      "I'm here to support your learning journey. Keep pushing! 🚀",
      "Remember: consistency is better than intensity. A little bit every day goes a long way. 🌟",
      "Have you tried the Pomodoro technique for this? It might help! ⏲️",
      "Don't forget to stay hydrated while studying! 💧"
    ];
    reply = responses[Math.floor(Math.random() * responses.length)];
  }

  res.json({ reply })
})

const PORT = process.env.PORT || 3001
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Backend running on port ${PORT}`)
})
