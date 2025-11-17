/* todo.js - Final Updated Version (with fixes for streak zero-reset) */

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
mockUpload.addEventListener("change", (e) => {
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
startMockBtn.addEventListener("click", () => {
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
endMockBtn.addEventListener("click", () => {
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
endMockBtn.style.display = 'none';
mockDisplayContainer.style.display = 'none';

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
    WEEKLY PLANNER — BEAUTIFIED
------------------------*/

const plannerDateEl = document.getElementById("plannerDate");
const plannerTaskEl = document.getElementById("plannerTask");
const savePlannerBtn = document.getElementById("savePlannerBtn");
const weekCalendarEl = document.getElementById("weekCalendar");

let plannerData = JSON.parse(localStorage.getItem("plannerData") || "{}");

const days = [
    "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
];

// Emojis for daily aesthetics ✨
const dayIcons = {
    Sunday: "☀️",
    Monday: "💼",
    Tuesday: "📝",
    Wednesday: "📌",
    Thursday: "📚",
    Friday: "⚡",
    Saturday: "🌈"
};

// Add task
function savePlanner() {
    const dateVal = plannerDateEl.value;
    const taskText = plannerTaskEl.value.trim();

    if (!dateVal || !taskText)
        return alert("Select a date & enter a task!");

    const date = new Date(dateVal);
    const dayName = days[date.getDay()];

    if (!plannerData[dayName]) plannerData[dayName] = [];

    plannerData[dayName].push({
        text: taskText,
        done: false,
        created: Date.now()
    });

    // Sort tasks alphabetically
    plannerData[dayName].sort((a, b) => a.text.localeCompare(b.text));

    localStorage.setItem("plannerData", JSON.stringify(plannerData));

    plannerTaskEl.value = "";
    animateAdd(dayName);
    renderPlanner();
}

savePlannerBtn.addEventListener("click", savePlanner);

// Edit task modal (native prompt)
window.editPlannerTask = function(day, i) {
    let newText = prompt("Edit task:", plannerData[day][i].text);
    if (newText === null) return;

    plannerData[day][i].text = newText.trim() || plannerData[day][i].text;

    localStorage.setItem("plannerData", JSON.stringify(plannerData));
    renderPlanner();
};

// Delete task
window.deletePlannerTask = function(day, i) {
    plannerData[day].splice(i, 1);
    if (plannerData[day].length === 0) delete plannerData[day];

    localStorage.setItem("plannerData", JSON.stringify(plannerData));
    renderPlanner();
};

// Toggle completed state
window.togglePlannerDone = function(day, i) {
    plannerData[day][i].done = !plannerData[day][i].done;
    localStorage.setItem("plannerData", JSON.stringify(plannerData));
    renderPlanner();
};

// Add glow pulse animation
function animateAdd(day) {
    const card = document.querySelector(`[data-day="${day}"]`);
    if (!card) return;

    card.classList.add("pulse-add");
    setTimeout(() => card.classList.remove("pulse-add"), 700);
}

// Render Planner
function renderPlanner() {
    weekCalendarEl.innerHTML = "";

    days.forEach(day => {
        const box = document.createElement("div");
        box.className = "planner-day";
        box.dataset.day = day;

        // Daily title with emoji & animations 🎨
        box.innerHTML = `
            <h3>
                <span style="font-size:1.3rem">${dayIcons[day]}</span>
                ${day}
            </h3>
        `;

        const tasks = plannerData[day] || [];

        tasks.forEach((task, index) => {
            const row = document.createElement("div");
            row.className = "planner-task";
            if (task.done) row.classList.add("task-done");

            row.innerHTML = `
                <span>
                    <input type="checkbox" ${task.done ? "checked" : ""} onclick="togglePlannerDone('${day}', ${index})" />
                    ${task.text}
                </span>
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

    sendTestReminderBtn.addEventListener("click", sendStudyReminder);

    // Checks every minute if the current time matches the reminder time AND if the user hasn't studied today.
    setInterval(() => {
        if (!reminderEnableEl.checked) return;

        const now = new Date();
        const current = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
        const reminderTargetTime = reminderTimeEl.value;
        
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

    // Initially loads the first track
    // Removed loadTrack(0) here to allow manual control, as the audio player may autoplay (user choice)
    currentTrackName.textContent = "Track: " + playlist[currentTrack];

});  // END DOMContentLoaded


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

// Clear button logic
document.getElementById("clearStickyBtn")?.addEventListener("click", () => {
    stickyNoteTextarea.value = "";
    saveStickyNote();
});


/* -----------------------
    PDF EXPORT
------------------------*/

document.getElementById("exportNotePdfBtn")?.addEventListener("click", () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const text = stickyNoteTextarea.value;
    
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
    if (!visualizer) return;
    visualizer.width = visualizer.clientWidth;
    visualizer.height = 100;
}

window.addEventListener("resize", resizeVisualizer);
resizeVisualizer();

audioPlayer?.addEventListener("play", () => {
    if (!audioCtx) setupVisualizer();
    // User interaction is required to resume AudioContext
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
});
const menuButton = document.getElementById("menuIcon");
const sidebar = document.querySelector(".sidebar");
const overlay = document.getElementById("overlay");

menuButton.addEventListener("click", () => {
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

overlay.addEventListener("click", () => {
    sidebar.classList.remove("open");
    overlay.classList.remove("show");
    menuButton.classList.remove("open");
});
