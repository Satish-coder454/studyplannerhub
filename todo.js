/* todo.js - Final Updated Version (with fixes for streak zero-reset)
   Option A: minimal fixes applied to make Monthly Planner + Daily Notes work
*/

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
    MOCK TEST AREA (NEW)
------------------------*/

const mockUpload = document.getElementById("mockUpload");
const mockDurationInput = document.getElementById("mockDuration");
const startMockBtn = document.getElementById("startMockBtn");
const endMockBtn = document.getElementById("endMockBtn");
const mockDisplayContainer = document.getElementById("mockDisplayContainer");
const mockFileNameEl = document.getElementById("mockFileName");
const mockFileLinkEl = document.getElementById("mockFileLink");
const mockTimerStatusEl = document.getElementById("mockTimerStatus");

let mockTestInterval = null;
let mockTimeRemaining = 0;
let mockTimerRunning = false;

// Function to format time for the mock test timer
function formatMockTime(sec) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `Remaining: ${pad(m)}:${pad(s)}`;
}

// 1. Handle File Upload
mockUpload?.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) {
        mockDisplayContainer.style.display = 'block';
        mockFileNameEl.textContent = `File: ${file.name}`;
        
        // Create a local URL for the file to allow viewing
        const fileURL = URL.createObjectURL(file);
        mockFileLinkEl.href = fileURL;
        mockFileLinkEl.style.display = 'inline';

        mockTimerStatusEl.textContent = 'Ready to start.';
    } else {
        mockDisplayContainer.style.display = 'none';
        mockFileNameEl.textContent = 'No file loaded.';
        mockFileLinkEl.style.display = 'none';
        mockTimerStatusEl.textContent = '';
    }
});

// 2. Start Test Function
startMockBtn?.addEventListener("click", () => {
    const duration = Number(mockDurationInput.value);
    
    if (mockTimerRunning) return alert("Test already running!");
    if (!mockUpload.files.length) return alert("Please upload a mock paper first.");
    if (duration < 10) return alert("Duration must be at least 10 minutes.");

    mockTimeRemaining = duration * 60;
    mockTimerRunning = true;

    // UI Updates
    mockTimerStatusEl.textContent = formatMockTime(mockTimeRemaining);
    startMockBtn.style.display = 'none';
    endMockBtn.style.display = 'block';
    
    // Start the countdown
    mockTestInterval = setInterval(() => {
        mockTimeRemaining--;
        mockTimerStatusEl.textContent = formatMockTime(mockTimeRemaining);

        if (mockTimeRemaining <= 0) {
            clearInterval(mockTestInterval);
            mockTimerRunning = false;
            mockTimerStatusEl.textContent = "TIME'S UP! Test finished. 🛑";
            endMockBtn.style.display = 'none';
            startMockBtn.style.display = 'block';
            alert("Mock Test Complete! Time to review.");
            // Log study activity upon test completion
            markStudiedToday(); 
        }
    }, 1000);
});

// 3. End Test Function (Manual Stop)
endMockBtn?.addEventListener("click", () => {
    if (!mockTimerRunning) return;

    clearInterval(mockTestInterval);
    mockTimerRunning = false;
    
    const minutesElapsed = Math.floor((Number(mockDurationInput.value) * 60 - mockTimeRemaining) / 60);
    
    mockTimerStatusEl.textContent = `Test ended early. Duration: ${minutesElapsed} minutes.`;
    endMockBtn.style.display = 'none';
    startMockBtn.style.display = 'block';
    markStudiedToday(); // Log study activity
});

// Initial state check
if (endMockBtn) endMockBtn.style.display = 'none';
if (mockDisplayContainer) mockDisplayContainer.style.display = 'none';

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
        STREAK (FIXED LOGIC)
    ------------------------*/
    function saveStreakToStorage() {
        localStorage.setItem("streak", JSON.stringify(streak));
    }

    // FIX: Check for skipped days on load and reset streak to 0
    function loadStreakToUI() {
        const today = new Date().toDateString();
        
        if (streak.lastCompletedDate) {
            const last = new Date(streak.lastCompletedDate);
            
            if (isNaN(last)) {
                streak.count = 0;
                streak.lastCompletedDate = null;
                saveStreakToStorage();
            } else {
                const oneDay = 24 * 60 * 60 * 1000; // milliseconds in a day
                const diffDays = Math.round(Math.abs((new Date().getTime() - last.getTime()) / oneDay));
                
                // Streak is broken if the last completion was 2 or more days ago
                if (diffDays > 1 && last.toDateString() !== today) {
                    streak.count = 0;
                    streak.lastCompletedDate = null;
                    saveStreakToStorage();
                }
            }
        }
        document.getElementById("streakCount").innerText = streak.count;
    }

    loadStreakToUI();

    // FIX: Update streak logic for increment/reset
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

        if (lastStr === today) return; // Already completed today

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        if (lastStr === yesterday.toDateString()) {
            // Completed yesterday, so increment
            streak.count++;
        } else {
            // Missed a day (not today and not yesterday), so reset to 1 (new streak)
            // Note: loadStreakToUI already resets to 0 if a day was missed on page load
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

    addTaskBtn?.addEventListener("click", addTask);

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
        if (bar) {
            bar.style.width = pct + "%";
            bar.innerText = pct + "%";
        }
    }

    function escapeHtml(s) {
        return String(s).replace(/[&<>"']/g, m => ({
            "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;"
        })[m]);
    }

    function renderTasks() {
        if (!todoListBox) return;
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


  /* ----------------------------
   DAILY NOTES (Glass modal) + Preview Dots
   Paste inside DOMContentLoaded in todo.js
-----------------------------*/
(function attachDailyNotesAndDots() {
  const STORAGE_KEY = "dailyNotes_v1";

  // Inject small CSS for preview-dot (if you haven't added it to todo.css)
  (function injectDotStyle(){
    const css = `
      .mini-cal-date { position: relative; }
      .mini-cal-date .note-dot {
        position: absolute;
        right: 6px;
        bottom: 6px;
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #ef4444;
        box-shadow: 0 0 6px rgba(239,68,68,0.35);
        opacity: 0.95;
      }
      .mini-cal-date.has-notes { padding-bottom: 8px; }
    `;
    const s = document.createElement("style");
    s.textContent = css;
    document.head.appendChild(s);
  })();

  // Modal elements (must match IDs in your HTML)
  const modal = document.getElementById("dailyNoteModal");
  const overlay = document.getElementById("dnOverlay");
  const closeBtn = document.getElementById("dnClose");
  const closeBtn2 = document.getElementById("dnCloseBtn");
  const deleteAllBtn = document.getElementById("dnDeleteAll");
  const saveBtn = document.getElementById("dnSaveBtn");
  const savedStamp = document.getElementById("dnSavedStamp");

  const dateLabel = document.getElementById("dnDateLabel");
  const noteArea = document.getElementById("dnNoteArea");
  const taskInput = document.getElementById("dnTaskInput");
  const addTaskBtn = document.getElementById("dnAddTask");
  const taskList = document.getElementById("dnTaskList");

  if (!modal) {
    console.warn("Daily Notes modal HTML not found — skipping daily notes attach.");
    return;
  }

  // load store
  let notesStore = {};
  try {
    notesStore = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch (e) {
    notesStore = {};
  }

  // helpers
  function isoToFriendly(iso) {
    try {
      const d = new Date(iso + "T00:00:00");
      return d.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric", year: "numeric" });
    } catch { return iso; }
  }

  function saveStore() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notesStore));
      if (savedStamp) {
        savedStamp.textContent = "Saved " + new Date().toLocaleTimeString();
        setTimeout(()=> savedStamp.textContent = "", 1300);
      }
      // update dots when store changes
      markAllDateDots();
    } catch (err) { console.error("Unable to save daily notes:", err); }
  }

  let currentIso = null;

  function ensureIsoEntry(iso) {
    if (!notesStore[iso]) notesStore[iso] = { note: "", tasks: [] };
  }

  function openModalFor(iso) {
    if (!iso) return;
    currentIso = iso;
    ensureIsoEntry(iso);
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    dateLabel.textContent = isoToFriendly(iso);
    noteArea.value = notesStore[iso].note || "";
    renderTaskList();
    // focus note area for convenience
    setTimeout(()=> noteArea.focus(), 120);
  }

  function closeModal() {
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    currentIso = null;
  }

  function renderTaskList() {
    taskList.innerHTML = "";
    const arr = (notesStore[currentIso] && notesStore[currentIso].tasks) || [];
    arr.forEach(t => {
      const li = document.createElement("li");
      li.className = "dn-task-item" + (t.done ? " done" : "");
      li.dataset.id = t.id;

      const ck = document.createElement("input");
      ck.type = "checkbox";
      ck.checked = !!t.done;
      ck.addEventListener("change", () => {
        t.done = ck.checked;
        saveStore();
        renderTaskList();
      });
      li.appendChild(ck);

      const txt = document.createElement("div");
      txt.className = "task-text";
      txt.textContent = t.text;
      // allow inline edit via dblclick
      txt.addEventListener("dblclick", () => {
        txt.contentEditable = "true";
        txt.focus();
      });
      txt.addEventListener("blur", () => {
        txt.contentEditable = "false";
        t.text = txt.textContent.trim();
        saveStore();
        renderTaskList();
      });
      li.appendChild(txt);

      const editBtn = document.createElement("button");
      editBtn.textContent = "Edit";
      editBtn.addEventListener("click", () => {
        const newVal = prompt("Edit task", t.text);
        if (newVal === null) return;
        t.text = newVal.trim();
        saveStore();
        renderTaskList();
      });
      li.appendChild(editBtn);

      const delBtn = document.createElement("button");
      delBtn.textContent = "X";
      delBtn.addEventListener("click", () => {
        if (!confirm("Delete this task?")) return;
        notesStore[currentIso].tasks = notesStore[currentIso].tasks.filter(x => x.id !== t.id);
        saveStore();
        renderTaskList();
      });
      li.appendChild(delBtn);

      taskList.appendChild(li);
    });
  }

  function addTask(text) {
    if (!currentIso || !text) return;
    const task = { id: String(Date.now()) + Math.floor(Math.random()*9999), text: text.trim(), done: false };
    notesStore[currentIso].tasks.unshift(task);
    taskInput.value = "";
    saveStore();
    renderTaskList();
  }

  // UI events
  addTaskBtn.addEventListener("click", () => addTask(taskInput.value));
  taskInput.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); addTask(taskInput.value); } });

  saveBtn.addEventListener("click", () => {
    if (!currentIso) return;
    notesStore[currentIso].note = noteArea.value;
    saveStore();
  });

  deleteAllBtn.addEventListener("click", () => {
    if (!currentIso) return;
    if (!confirm("Delete all notes and tasks for this date?")) return;
    delete notesStore[currentIso];
    saveStore();
    closeModal();
  });

  closeBtn.addEventListener("click", closeModal);
  closeBtn2.addEventListener("click", closeModal);
  overlay.addEventListener("click", closeModal);
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });

  // auto-save note area (debounced)
  let autoTimer = null;
  noteArea.addEventListener("input", () => {
    if (!currentIso) return;
    clearTimeout(autoTimer);
    autoTimer = setTimeout(() => {
      notesStore[currentIso].note = noteArea.value;
      saveStore();
    }, 700);
  });

  // restore store from localStorage on init
  try { notesStore = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); } catch(e){ notesStore = {}; }

  // attach click listener to any element with data-iso attribute (delegated)
  document.addEventListener("click", (e) => {
    const el = e.target.closest("[data-iso]");
    if (!el) return;
    const iso = el.getAttribute("data-iso");
    if (!iso) return;
    openModalFor(iso);
  });

  // Expose programmatic open
  window.openDailyNotes = (iso) => { if (iso) openModalFor(iso); };

  /* -----------------------------
     PREVIEW DOTS FOR DATES WITH NOTES
     - Adds a small red dot inside .mini-cal-date[data-iso]
     - Observes DOM changes (calendar re-renders) and updates dots
  -----------------------------*/

  function hasContentForIso(iso) {
    const entry = notesStore[iso];
    if (!entry) return false;
    if (entry.note && entry.note.trim().length > 0) return true;
    if (Array.isArray(entry.tasks) && entry.tasks.length > 0) return true;
    return false;
  }

  function addDotToElement(el) {
    if (!el) return;
    if (el.querySelector(".note-dot")) return; // already has dot
    const dot = document.createElement("span");
    dot.className = "note-dot";
    el.appendChild(dot);
    el.classList.add("has-notes");
  }

  function removeDotFromElement(el) {
    if (!el) return;
    const d = el.querySelector(".note-dot");
    if (d) d.remove();
    el.classList.remove("has-notes");
  }

  function markAllDateDots() {
    // update notesStore fresh from localStorage (in case other code updated it)
    try { notesStore = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); } catch(e){ notesStore = {}; }

    const dateEls = document.querySelectorAll(".mini-cal-date[data-iso], [data-iso].mini-cal-date");
    dateEls.forEach(el => {
      const iso = el.getAttribute("data-iso");
      if (!iso) return;
      if (hasContentForIso(iso)) addDotToElement(el);
      else removeDotFromElement(el);
    });
  }

  // expose markAllDateDots to global scope so monthly planner can call it
  window.markAllDateDots = markAllDateDots;

  // run once now
  markAllDateDots();

  // watch for future changes to DOM (mini-calendar rerenders)
  const calendarContainer = document.querySelector("#calendarGrid") || document.body;
  const mo = new MutationObserver((mutations) => {
    // small debounce
    clearTimeout(window.__dailyNotesDotTimer);
    window.__dailyNotesDotTimer = setTimeout(() => {
      markAllDateDots();
    }, 120);
  });
  mo.observe(calendarContainer, { childList: true, subtree: true });

  // Also watch storage events (for multi-tab sync)
  window.addEventListener("storage", (e) => {
    if (e.key === STORAGE_KEY) {
      try { notesStore = JSON.parse(e.newValue || "{}"); } catch(e){ notesStore = {}; }
      markAllDateDots();
    }
  });

})(); // end attachDailyNotesAndDots IIFE

/* -----------------------
   MONTHLY PLANNER
------------------------*/

const monthTitle = document.getElementById("monthTitle");
const calendarGrid = document.getElementById("calendarGrid");
const prevMonthBtn = document.getElementById("prevMonthBtn");
const nextMonthBtn = document.getElementById("nextMonthBtn");

let currentMonth = new Date();

function renderMonthlyPlanner() {

    if (!calendarGrid || !monthTitle) return;

    calendarGrid.innerHTML = "";

    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    // Set title
    monthTitle.textContent =
        currentMonth.toLocaleDateString("en-US", {
            month: "long",
            year: "numeric"
        });

    // Days of week header
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    days.forEach(d => {
        const div = document.createElement("div");
        div.className = "day-name";
        div.textContent = d;
        calendarGrid.appendChild(div);
    });

    const firstDay = new Date(year, month, 1).getDay();
    const numDays = new Date(year, month + 1, 0).getDate();
    const todayISO = new Date().toISOString().split("T")[0];

    // Blank cells before month starts
    for (let i = 0; i < firstDay; i++) {
        const blank = document.createElement("div");
        blank.className = "calendar-date empty";
        calendarGrid.appendChild(blank);
    }

    // Actual days
    for (let d = 1; d <= numDays; d++) {
        const iso = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

        const cell = document.createElement("div");
        // include mini-cal-date so Daily Notes module recognizes it
        cell.className = "calendar-date mini-cal-date";
        cell.textContent = d;
        cell.dataset.iso = iso;

        if (iso === todayISO) {
            cell.classList.add("today");
        }

        calendarGrid.appendChild(cell);
    }

    // After building calendar, update dots (if function exposed)
    if (typeof window.markAllDateDots === "function") {
        setTimeout(() => {
            try { window.markAllDateDots(); } catch(e) { /* ignore */ }
        }, 50);
    }
}

prevMonthBtn?.addEventListener("click", () => {
    currentMonth.setMonth(currentMonth.getMonth() - 1);
    renderMonthlyPlanner();
});

nextMonthBtn?.addEventListener("click", () => {
    currentMonth.setMonth(currentMonth.getMonth() + 1);
    renderMonthlyPlanner();
});

renderMonthlyPlanner();

/* -----------------------
    DISCUSSION BOARD
------------------------*/

const discussionBox = document.getElementById("discussionBox");
const usernameEl = document.getElementById("username");
const postBtn = document.getElementById("postDiscussionBtn");
const discussionThreadBox = document.getElementById("discussionThread");

function renderDiscussion() {
    if (!discussionThreadBox) return;
    discussionThreadBox.innerHTML = "";
    discussionThread.forEach(p => {
        const item = document.createElement("div");
        item.className = "post";
        item.innerHTML = `<b>${escapeHtml(p.username)}:</b> ${escapeHtml(p.text)}<br>
            <small>${escapeHtml(p.time)}</small>`;
        discussionThreadBox.appendChild(item);
    });
}

postBtn?.addEventListener("click", () => {
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
    if (themeToggle) themeToggle.checked = true;
}

themeToggle?.addEventListener("change", () => {
    const enabled = themeToggle.checked;
    document.body.classList.toggle("dark-mode", enabled);
    localStorage.setItem("darkModeEnabled", enabled);
});


/* -----------------------
    LIVE CLOCK
------------------------*/

function updateClock() {
    const t = new Date();
    const liveTimeEl = document.getElementById("live-time");
    const liveDateEl = document.getElementById("live-date");
    if (liveTimeEl) liveTimeEl.innerText = t.toLocaleTimeString();
    if (liveDateEl) liveDateEl.innerText = t.toLocaleDateString("en-US", {
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
    if (timerDisplay) timerDisplay.textContent = formatTime(val);
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

startBtn?.addEventListener("click", startStopwatch);
stopBtn?.addEventListener("click", stopTimer);
resetBtn?.addEventListener("click", resetTimer);
startCountdownBtn?.addEventListener("click", startCountdown);

updateTimerDisplayValue(stopwatchSeconds);


/* -----------------------
    REMINDER BOT (Notification Logic)
------------------------*/

const reminderEnableEl = document.getElementById("enableReminders");
const reminderTimeEl = document.getElementById("reminderTime");
const sendTestReminderBtn = document.getElementById("sendTestReminder");

async function sendStudyReminder() {
    if (Notification.permission !== "granted") {
        await Notification.requestPermission();
    }
    if (Notification.permission === "granted") {
        new Notification("Study Reminder 📚", {
            body: "You haven't studied today! Time to hit the books.",
            icon: "img1.jpg"
        });
    }
}

sendTestReminderBtn?.addEventListener("click", sendStudyReminder);

// Checks every minute if the current time matches the reminder time AND if the user hasn't studied today.
setInterval(() => {
    if (!reminderEnableEl || !reminderEnableEl.checked) return;

    const now = new Date();
    const current = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
    const reminderTargetTime = reminderTimeEl?.value;
    
    // Prevent continuous reminders if the time matches
    if (current === reminderTargetTime) {
        const today = new Date().toLocaleDateString();
        
        // Send reminder ONLY if study data for today is missing
        if (studyData.lastStudyDate !== today) {
            sendStudyReminder();
        }
    }
}, 60000);
/* -----------------------
   LIBRARY SYSTEM (Option C)
------------------------*/

let library = JSON.parse(localStorage.getItem("library") || "[]");

const libTitle = document.getElementById("libTitle");
const libAuthor = document.getElementById("libAuthor");
const libTags = document.getElementById("libTags");
const libFile = document.getElementById("libFile");
const libAddBtn = document.getElementById("libAddBtn");
const libraryGrid = document.getElementById("libraryGrid");

const libModal = document.getElementById("libModal");
const libOverlay = document.getElementById("libOverlay");
const libClose = document.getElementById("libClose");
const libModalTitle = document.getElementById("libModalTitle");
const libModalAuthor = document.getElementById("libModalAuthor");
const libModalTags = document.getElementById("libModalTags");
const libProgressSlider = document.getElementById("libProgressSlider");
const libProgressValue = document.getElementById("libProgressValue");
const libNotes = document.getElementById("libNotes");
const libFileLink = document.getElementById("libFileLink");
const libSaveBtn = document.getElementById("libSaveBtn");
const libDeleteBtn = document.getElementById("libDeleteBtn");

let currentBookId = null;

function saveLibrary() {
    localStorage.setItem("library", JSON.stringify(library));
}

function renderLibrary() {
    libraryGrid.innerHTML = "";

    library.forEach(b => {
        const card = document.createElement("div");
        card.className = "library-card";
        card.dataset.id = b.id;

        card.innerHTML = `
            <h4>${b.title}</h4>
            <div>By: ${b.author}</div>
            <div class="library-tags">${b.tags.join(", ")}</div>
            <small>Progress: ${b.progress}%</small>
        `;

        card.addEventListener("click", () => openLibraryModal(b.id));
        libraryGrid.appendChild(card);
    });
}

libAddBtn.addEventListener("click", () => {
    const title = libTitle.value.trim();
    const author = libAuthor.value.trim();
    const tags = libTags.value.split(",").map(t => t.trim()).filter(Boolean);

    if (!title) return alert("Enter a book title!");

    let fileURL = "";
    if (libFile.files.length > 0) {
        fileURL = URL.createObjectURL(libFile.files[0]);
    }

    library.push({
        id: Date.now(),
        title,
        author,
        tags,
        fileURL,
        progress: 0,
        notes: ""
    });

    saveLibrary();
    renderLibrary();

    libTitle.value = "";
    libAuthor.value = "";
    libTags.value = "";
    libFile.value = "";
});

function openLibraryModal(id) {
    const b = library.find(x => x.id === id);
    if (!b) return;

    currentBookId = id;

    libModalTitle.textContent = b.title;
    libModalAuthor.textContent = b.author;
    libModalTags.textContent = b.tags.join(", ");
    libProgressSlider.value = b.progress;
    libProgressValue.textContent = b.progress + "%";
    libNotes.value = b.notes || "";
    libFileLink.href = b.fileURL || "#";

    libModal.setAttribute("aria-hidden", "false");
}

libClose.addEventListener("click", () => {
    libModal.setAttribute("aria-hidden", "true");
});

libOverlay.addEventListener("click", () => {
    libModal.setAttribute("aria-hidden", "true");
});

libProgressSlider.addEventListener("input", () => {
    libProgressValue.textContent = libProgressSlider.value + "%";
});

libSaveBtn.addEventListener("click", () => {
    const b = library.find(x => x.id === currentBookId);
    if (!b) return;

    b.progress = Number(libProgressSlider.value);
    b.notes = libNotes.value;

    saveLibrary();
    renderLibrary();
    libModal.setAttribute("aria-hidden", "true");
});

libDeleteBtn.addEventListener("click", () => {
    if (!confirm("Delete this book?")) return;

    library = library.filter(x => x.id !== currentBookId);
    saveLibrary();
    renderLibrary();
    libModal.setAttribute("aria-hidden", "true");
});

renderLibrary();



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
    if (audioPlayer) {
      audioPlayer.src = playlist[currentTrack];
      currentTrackName.textContent = "Track: " + playlist[currentTrack];
      audioPlayer.play();
      playPauseBtn.textContent = "⏸ Pause";
    }
}

playPauseBtn?.addEventListener("click", () => {
    if (!audioPlayer) return;
    if (audioPlayer.paused) {
        audioPlayer.play();
        playPauseBtn.textContent = "⏸ Pause";
    } else {
        audioPlayer.pause();
        playPauseBtn.textContent = "▶ Play";
    }
});

nextTrackBtn?.addEventListener("click", () => loadTrack((currentTrack + 1) % playlist.length));
prevTrackBtn?.addEventListener("click", () => loadTrack((currentTrack - 1 + playlist.length) % playlist.length));
audioPlayer?.addEventListener("ended", () => loadTrack((currentTrack + 1) % playlist.length));

// Initially loads the first track
// Removed loadTrack(0) here to allow manual control, as the audio player may autoplay (user choice)
if (currentTrackName) currentTrackName.textContent = "Track: " + playlist[currentTrack];

}
);  // END DOMContentLoaded


/* -----------------------
    STICKY NOTES
------------------------*/

const stickyNoteTextarea = document.getElementById("stickyNoteTextarea");
const STICKY_NOTE_KEY = "yourhub_sticky_note";

function loadStickyNote() {
    const saved = localStorage.getItem(STICKY_NOTE_KEY);
    if (saved && stickyNoteTextarea) stickyNoteTextarea.value = saved;
}
function saveStickyNote() {
    if (stickyNoteTextarea) localStorage.setItem(STICKY_NOTE_KEY, stickyNoteTextarea.value);
}

if (stickyNoteTextarea) {
    loadStickyNote();
    stickyNoteTextarea.addEventListener("input", saveStickyNote);
}

// Clear button logic
document.getElementById("clearStickyBtn")?.addEventListener("click", () => {
    if (!stickyNoteTextarea) return;
    stickyNoteTextarea.value = "";
    saveStickyNote();
});


/* -----------------------
    PDF EXPORT
------------------------*/

document.getElementById("exportNotePdfBtn")?.addEventListener("click", () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const text = stickyNoteTextarea ? stickyNoteTextarea.value : "";
    
    // Split text into lines to handle wrap (basic implementation)
    const lines = doc.splitTextToSize(text, 180);
    doc.text(lines, 10, 10);
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
    if (!analyser || !vCtx || !visualizer) return;

    let bufferLength = analyser.frequencyBinCount;
    let dataArray = new Uint8Array(bufferLength);
    analyser.getByteFrequencyData(dataArray);

    vCtx.clearRect(0, 0, visualizer.width, visualizer.height);

    let barWidth = (visualizer.width / bufferLength) * 2;
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
        let barHeight = dataArray[i];
        vCtx.fillStyle = `rgb(${Math.min(barHeight + 100,255)}, 50, 255)`;
        vCtx.fillRect(x, visualizer.height - barHeight, barWidth, barHeight);
        x += barWidth + 1;
    }
}

function resizeVisualizer() {
    if (!visualizer) return;
    visualizer.width = visualizer.clientWidth;
    visualizer.height = 100;
}

window.addEventListener("resize", resizeVisualizer);
resizeVisualizer();

audioPlayer?.addEventListener("play", () => {
    if (!audioCtx) setupVisualizer();
    // User interaction is required to resume AudioContext
    if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
});
const menuButton = document.getElementById("menuIcon");
const sidebar = document.querySelector(".sidebar");
const overlay = document.getElementById("overlay");

menuButton?.addEventListener("click", () => {
    const isOpen = sidebar.classList.contains("open");

    if (isOpen) {
        sidebar.classList.remove("open");
        overlay.classList.remove("show");
        menuButton.classList.remove("open");
    } else {
        sidebar.classList.add("open");
        overlay.classList.add("show");
        menuButton.classList.add("open");
    }
});

overlay?.addEventListener("click", () => {
    sidebar.classList.remove("open");
    overlay.classList.remove("show");
    menuButton.classList.remove("open");
});
