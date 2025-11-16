/* todo.js - Final Updated Version */

/* -----------------------
     LOAD SAVED DATA
------------------------*/

let todoList = JSON.parse(localStorage.getItem('todoList') || '[]');
let discussionThread = JSON.parse(localStorage.getItem('discussionThread') || '[]');
let plannerData = JSON.parse(localStorage.getItem('plannerData') || '{}');
let streak = JSON.parse(localStorage.getItem('streak') || '{"count":0,"lastCompletedDate":null}');
let studyData = JSON.parse(localStorage.getItem("studyData") || "{}");

if (!studyData.lastStudyDate) studyData.lastStudyDate = "";

/* -----------------------
     ON PAGE LOAD
------------------------*/

document.addEventListener('DOMContentLoaded', () => {

  /* -----------------------
        DAILY QUOTE
  ------------------------*/
  async function loadQuote() {
    try {
      const res = await fetch("https://api.quotable.io/random");
      const data = await res.json();
      document.getElementById("dailyQuote").innerHTML =
        `"${data.content}"<br/>— ${data.author || "Unknown"}`;
    } catch (err) {
      document.getElementById("dailyQuote").innerText = "Keep on shining! 🚀";
    }
  }
  loadQuote();


  /* -----------------------
        STREAK
  ------------------------*/
  function saveStreakToStorage() {
    localStorage.setItem("streak", JSON.stringify(streak));
  }

  function loadStreakToUI() {
    if (streak.lastCompletedDate) {
      const last = new Date(streak.lastCompletedDate);
      if (isNaN(last)) {
        streak.count = 0;
        streak.lastCompletedDate = null;
        saveStreakToStorage();
      }
    }
    document.getElementById("streakCount").innerText = streak.count;
  }

  loadStreakToUI();

  function updateStreakOnCompletion() {
    const today = new Date().toDateString();

    if (!streak.lastCompletedDate) {
      streak.count = 1;
      streak.lastCompletedDate = today;
      saveStreakToStorage();
      loadStreakToUI();
      return;
    }

    const last = new Date(streak.lastCompletedDate);
    const lastStr = last.toDateString();

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    if (lastStr === today) return;

    if (lastStr === yesterday.toDateString()) {
      streak.count++;
    } else {
      streak.count = 1;
    }

    streak.lastCompletedDate = today;
    saveStreakToStorage();
    loadStreakToUI();
  }


  /* -----------------------
        TO-DO LIST
  ------------------------*/

  const taskNameInput = document.getElementById("taskName");
  const taskDateInput = document.getElementById("taskDate");
  const addTaskBtn = document.getElementById("addTaskBtn");
  const todoListBox = document.getElementById("todoList");

  function saveTodos() {
    localStorage.setItem("todoList", JSON.stringify(todoList));
  }

  function addTask() {
    const name = taskNameInput.value.trim();
    const date = taskDateInput.value;
    if (!name || !date) return alert("Please fill Task Name and Date!");

    todoList.push({ name, date, completed: false });
    saveTodos();
    renderTasks();

    taskNameInput.value = "";
    taskDateInput.value = "";
  }

  addTaskBtn.addEventListener("click", addTask);

  function deleteTask(i) {
    todoList.splice(i, 1);
    saveTodos();
    renderTasks();
  }

  function toggleTask(i) {
    todoList[i].completed = !todoList[i].completed;
    if (todoList[i].completed) updateStreakOnCompletion();
    saveTodos();
    renderTasks();
  }

  function updateProgress() {
    const total = todoList.length;
    const done = todoList.filter(t => t.completed).length;
    const pct = total ? Math.round((done / total) * 100) : 0;

    const bar = document.getElementById("progressBar");
    bar.style.width = pct + "%";
    bar.innerText = pct + "%";
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, m => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;"
    })[m]);
  }

  function renderTasks() {
    todoListBox.innerHTML = "";

    todoList.forEach((t, i) => {
      const item = document.createElement("div");
      item.className = "todo-item";

      item.innerHTML = `
        <div class="todo-left">
          <input type="checkbox" ${t.completed ? "checked" : ""} />
          <div>
            <div class="task-name">${escapeHtml(t.name)}</div>
            <div class="task-date">Due: ${escapeHtml(t.date)}</div>
          </div>
        </div>
        <button class="delBtn">Delete</button>
      `;

      item.querySelector("input").addEventListener("change", () => toggleTask(i));
      item.querySelector(".delBtn").addEventListener("click", () => deleteTask(i));

      todoListBox.appendChild(item);
    });

    updateProgress();
  }

  renderTasks();


  /* -----------------------
        WEEKLY PLANNER (NEW)
  ------------------------*/

  const plannerDateEl = document.getElementById("plannerDate");
  const plannerTaskEl = document.getElementById("plannerTask");
  const savePlannerBtn = document.getElementById("savePlannerBtn");
  const weekCalendarEl = document.getElementById("weekCalendar");

  const days = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

  function savePlanner() {
    const dateVal = plannerDateEl.value;
    const taskText = plannerTaskEl.value.trim();

    if (!dateVal || !taskText) return alert("Select a date & enter a task!");

    const date = new Date(dateVal);
    const dayName = days[date.getDay()];

    if (!plannerData[dayName]) plannerData[dayName] = [];
    plannerData[dayName].push(taskText);

    localStorage.setItem("plannerData", JSON.stringify(plannerData));
    plannerTaskEl.value = "";
    renderPlanner();
  }

  savePlannerBtn.addEventListener("click", savePlanner);

  window.editPlannerTask = function(day, i) {
    let newText = prompt("Edit task:", plannerData[day][i]);
    if (newText === null) return;

    plannerData[day][i] = newText;
    localStorage.setItem("plannerData", JSON.stringify(plannerData));
    renderPlanner();
  };

  window.deletePlannerTask = function(day, i) {
    plannerData[day].splice(i, 1);
    if (plannerData[day].length === 0) delete plannerData[day];

    localStorage.setItem("plannerData", JSON.stringify(plannerData));
    renderPlanner();
  };

  function renderPlanner() {
    weekCalendarEl.innerHTML = "";

    days.forEach(day => {
      const box = document.createElement("div");
      box.className = "planner-day";

      box.innerHTML = `<h3>${day}</h3>`;

      const tasks = plannerData[day] || [];
      tasks.forEach((task, index) => {
        const row = document.createElement("div");
        row.className = "planner-task";

        row.innerHTML = `
          <span>${task}</span>
          <div>
            <button class="edit-btn" onclick="editPlannerTask('${day}', ${index})">Edit</button>
            <button class="delete-btn" onclick="deletePlannerTask('${day}', ${index})">X</button>
          </div>
        `;

        box.appendChild(row);
      });

      weekCalendarEl.appendChild(box);
    });
  }

  renderPlanner();


  /* -----------------------
        DISCUSSION BOARD
  ------------------------*/

  const discussionBox = document.getElementById("discussionBox");
  const usernameEl = document.getElementById("username");
  const postBtn = document.getElementById("postDiscussionBtn");
  const discussionThreadBox = document.getElementById("discussionThread");

  function renderDiscussion() {
    discussionThreadBox.innerHTML = "";
    discussionThread.forEach(p => {
      const item = document.createElement("div");
      item.className = "post";
      item.innerHTML = `<b>${escapeHtml(p.username)}:</b> ${escapeHtml(p.text)}<br>
        <small>${escapeHtml(p.time)}</small>`;
      discussionThreadBox.appendChild(item);
    });
  }

  postBtn.addEventListener("click", () => {
    const text = discussionBox.value.trim();
    const username = usernameEl.value.trim() || "Anonymous";
    if (!text) return;

    discussionThread.unshift({
      text,
      username,
      time: new Date().toLocaleString()
    });

    localStorage.setItem("discussionThread", JSON.stringify(discussionThread));

    discussionBox.value = "";
    usernameEl.value = "";
    renderDiscussion();
  });

  renderDiscussion();


  /* -----------------------
        THEME TOGGLE
  ------------------------*/

  const themeToggle = document.getElementById("holo-toggle");

  if (localStorage.getItem("darkModeEnabled") === "true") {
    document.body.classList.add("dark-mode");
    themeToggle.checked = true;
  }

  themeToggle.addEventListener("change", () => {
    const enabled = themeToggle.checked;
    document.body.classList.toggle("dark-mode", enabled);
    localStorage.setItem("darkModeEnabled", enabled);
  });


  /* -----------------------
        LIVE CLOCK
  ------------------------*/

  function updateClock() {
    const t = new Date();
    document.getElementById("live-time").innerText =
      t.toLocaleTimeString();

    document.getElementById("live-date").innerText =
      t.toLocaleDateString("en-US", {
        weekday: "long", year: "numeric", month: "long", day: "numeric"
      });
  }

  setInterval(updateClock, 1000);
  updateClock();


  /* -----------------------
        STUDY TIMER
  ------------------------*/

  const timerDisplay = document.getElementById("timer-display");
  const startBtn = document.getElementById("start-btn");
  const stopBtn = document.getElementById("stop-btn");
  const resetBtn = document.getElementById("reset-btn");
  const countdownMinutesInput = document.getElementById("countdown-minutes");
  const startCountdownBtn = document.getElementById("start-countdown-btn");

  let stopwatchInterval = null;
  let countdownInterval = null;
  let stopwatchSeconds = Number(localStorage.getItem("stopwatchSeconds") || 0);
  let countdownSecondsRemaining = 0;
  let isTimerRunning = false;

  function pad(n) { return String(n).padStart(2, "0"); }

  function formatTime(sec) {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${pad(h)}:${pad(m)}:${pad(s)}`;
  }

  function updateTimerDisplayValue(val) {
    timerDisplay.textContent = formatTime(val);
  }

  function markStudiedToday() {
    studyData.lastStudyDate = new Date().toLocaleDateString();
    localStorage.setItem("studyData", JSON.stringify(studyData));
  }

  function startStopwatch() {
    if (isTimerRunning) return;

    isTimerRunning = true;
    stopwatchInterval = setInterval(() => {
      stopwatchSeconds++;
      localStorage.setItem("stopwatchSeconds", stopwatchSeconds);
      updateTimerDisplayValue(stopwatchSeconds);
    }, 1000);

    markStudiedToday();
  }

  function stopTimer() {
    isTimerRunning = false;
    clearInterval(stopwatchInterval);
    clearInterval(countdownInterval);
  }

  function resetTimer() {
    stopTimer();
    stopwatchSeconds = 0;
    localStorage.setItem("stopwatchSeconds", "0");
    updateTimerDisplayValue(0);
  }

  function startCountdown() {
    if (isTimerRunning) return;

    let minutes = Number(countdownMinutesInput.value);
    if (!minutes || minutes <= 0) return alert("Enter valid minutes (1+)");

    countdownSecondsRemaining = minutes * 60;
    isTimerRunning = true;
    updateTimerDisplayValue(countdownSecondsRemaining);

    countdownInterval = setInterval(() => {
      countdownSecondsRemaining--;
      updateTimerDisplayValue(countdownSecondsRemaining);

      if (countdownSecondsRemaining <= 0) {
        clearInterval(countdownInterval);
        isTimerRunning = false;
        alert("Session complete! Take a break. 🧘");
      }
    }, 1000);

    markStudiedToday();
  }

  startBtn.addEventListener("click", startStopwatch);
  stopBtn.addEventListener("click", stopTimer);
  resetBtn.addEventListener("click", resetTimer);
  startCountdownBtn.addEventListener("click", startCountdown);

  updateTimerDisplayValue(stopwatchSeconds);


  /* -----------------------
        REMINDER BOT
  ------------------------*/

  const reminderEnableEl = document.getElementById("enableReminders");
  const reminderTimeEl = document.getElementById("reminderTime");
  const sendTestReminderBtn = document.getElementById("sendTestReminder");

  async function sendStudyReminder() {
    if (Notification.permission !== "granted") {
      await Notification.requestPermission();
    }
    new Notification("Study Reminder 📚", {
      body: "You haven't studied today!",
      icon: "img1.jpg"
    });
  }

  sendTestReminderBtn.addEventListener("click", sendStudyReminder);

  setInterval(() => {
    if (!reminderEnableEl.checked) return;

    const now = new Date();
    const current = `${pad(now.getHours())}:${pad(now.getMinutes())}`;

    if (current === reminderTimeEl.value) {
      const today = new Date().toLocaleDateString();
      if (studyData.lastStudyDate !== today) sendStudyReminder();
    }
  }, 60000);


  /* -----------------------
        MUSIC PLAYER
  ------------------------*/

  const playlist = ["music1.mp3", "music2.mp3", "music3.mp3"];
  let currentTrack = 0;

  const audioPlayer = document.getElementById("audioPlayer");
  const playPauseBtn = document.getElementById("playPause");
  const nextTrackBtn = document.getElementById("nextTrack");
  const prevTrackBtn = document.getElementById("prevTrack");
  const currentTrackName = document.getElementById("currentTrackName");

  function loadTrack(i) {
    currentTrack = i;
    audioPlayer.src = playlist[currentTrack];
    currentTrackName.textContent = "Track: " + playlist[currentTrack];
    audioPlayer.play();
    playPauseBtn.textContent = "⏸ Pause";
  }

  playPauseBtn.addEventListener("click", () => {
    if (audioPlayer.paused) {
      audioPlayer.play();
      playPauseBtn.textContent = "⏸ Pause";
    } else {
      audioPlayer.pause();
      playPauseBtn.textContent = "▶ Play";
    }
  });

  nextTrackBtn.addEventListener("click", () => loadTrack((currentTrack + 1) % playlist.length));
  prevTrackBtn.addEventListener("click", () => loadTrack((currentTrack - 1 + playlist.length) % playlist.length));
  audioPlayer.addEventListener("ended", () => loadTrack((currentTrack + 1) % playlist.length));

  loadTrack(0);


});  // END DOMContentLoaded


/* -----------------------
      STICKY NOTES
------------------------*/

const stickyNoteTextarea = document.getElementById("stickyNoteTextarea");
const STICKY_NOTE_KEY = "yourhub_sticky_note";

function loadStickyNote() {
  const saved = localStorage.getItem(STICKY_NOTE_KEY);
  if (saved) stickyNoteTextarea.value = saved;
}
function saveStickyNote() {
  localStorage.setItem(STICKY_NOTE_KEY, stickyNoteTextarea.value);
}

if (stickyNoteTextarea) {
  loadStickyNote();
  stickyNoteTextarea.addEventListener("input", saveStickyNote);
}


/* -----------------------
      PDF EXPORT
------------------------*/

document.getElementById("exportNotePdfBtn")?.addEventListener("click", () => {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.text(stickyNoteTextarea.value, 10, 10);
  doc.save("StudyHub_Note.pdf");
});


/* -----------------------
      AUDIO VISUALIZER
------------------------*/

const visualizer = document.getElementById("musicVisualizer");
const vCtx = visualizer?.getContext("2d");
let audioCtx, analyser, sourceNode;

function setupVisualizer() {
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  analyser = audioCtx.createAnalyser();
  sourceNode = audioCtx.createMediaElementSource(audioPlayer);

  sourceNode.connect(analyser);
  analyser.connect(audioCtx.destination);
  drawVisualizer();
}

function drawVisualizer() {
  requestAnimationFrame(drawVisualizer);
  if (!analyser) return;

  let bufferLength = analyser.frequencyBinCount;
  let dataArray = new Uint8Array(bufferLength);
  analyser.getByteFrequencyData(dataArray);

  vCtx.clearRect(0, 0, visualizer.width, visualizer.height);

  let barWidth = (visualizer.width / bufferLength) * 2;
  let x = 0;

  for (let i = 0; i < bufferLength; i++) {
    let barHeight = dataArray[i];
    vCtx.fillStyle = `rgb(${barHeight + 100}, 50, 255)`;
    vCtx.fillRect(x, visualizer.height - barHeight, barWidth, barHeight);
    x += barWidth + 1;
  }
}

function resizeVisualizer() {
  visualizer.width = visualizer.clientWidth;
  visualizer.height = 100;
}

window.addEventListener("resize", resizeVisualizer);
resizeVisualizer();

audioPlayer?.addEventListener("play", () => {
  if (!audioCtx) setupVisualizer();
  audioCtx.resume();
});
