
    const display = document.getElementById("display");
    const hoursEl = document.getElementById("hours");
    const minutesEl = document.getElementById("minutes");
    const secondsEl = document.getElementById("seconds");
    const millisecondsEl = document.getElementById("milliseconds");
    const startPauseBtn = document.getElementById("startPauseBtn");
    const lapBtn = document.getElementById("lapBtn");
    const resetBtn = document.getElementById("resetBtn");
    const copyBtn = document.getElementById("copyBtn");
    const clearLapsBtn = document.getElementById("clearLapsBtn");
    const lapsList = document.getElementById("laps");
    const emptyState = document.getElementById("emptyState");
    const lapCount = document.getElementById("lapCount");
    const statusText = document.getElementById("status-text");
    const statusDot = document.getElementById("status-dot");
    const hint = document.getElementById("hint");

    let running = false;
    let startTime = 0;
    let elapsed = 0;
    let rafId = null;
    let lapNumber = 0;

    function pad(value, length = 2) {
      return String(value).padStart(length, "0");
    }

    function formatTime(ms) {
      const total = Math.max(0, Math.floor(ms));
      const hours = Math.floor(total / 3600000);
      const minutes = Math.floor((total % 3600000) / 60000);
      const seconds = Math.floor((total % 60000) / 1000);

      return {
        hours,
        minutes,
        seconds,
        text: `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
      };
    }

    function renderTime(ms) {
      const time = formatTime(ms);
      display.textContent = time.text;
      hoursEl.textContent = pad(time.hours);
      minutesEl.textContent = pad(time.minutes);
      secondsEl.textContent = pad(time.seconds);
    }

    function setStatus(mode) {
      const map = {
        ready: { text: "Ready", color: "#33d6c8" },
        running: { text: "Running", color: "#f6c25c" },
        paused: { text: "Paused", color: "#5b86ff" }
      };
      const current = map[mode];
      statusText.textContent = current.text;
      statusDot.style.background = current.color;
      statusDot.style.boxShadow = `0 0 0 6px ${current.color}22`;
    }

    function updateHint() {
      if (running) {
        hint.textContent = "Timer is running. Save lap times or pause when needed.";
      } else if (elapsed > 0) {
        hint.textContent = "Timer is paused. Resume or reset when you’re ready.";
      } else {
        hint.textContent = "Press Start to begin timing.";
      }
    }

    function updateButtons() {
      startPauseBtn.textContent = running ? "Pause" : (elapsed > 0 ? "Resume" : "Start");
      lapBtn.disabled = !running;
      clearLapsBtn.disabled = lapsList.querySelectorAll("li.lap").length === 0;
    }

    function tick() {
      if (!running) return;
      const now = performance.now();
      elapsed = now - startTime;
      renderTime(elapsed);
      rafId = requestAnimationFrame(tick);
    }

    function start() {
      if (running) return;
      running = true;
      startTime = performance.now() - elapsed;
      setStatus("running");
      updateHint();
      updateButtons();
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(tick);
    }

    function pause() {
      if (!running) return;
      running = false;
      cancelAnimationFrame(rafId);
      setStatus("paused");
      updateHint();
      updateButtons();
    }

    function toggleStartPause() {
      if (running) {
        pause();
      } else {
        start();
      }
    }

    function reset() {
      running = false;
      elapsed = 0;
      lapNumber = 0;
      startTime = 0;
      cancelAnimationFrame(rafId);
      renderTime(0);
      setStatus("ready");
      updateHint();
      updateButtons();
      clearLaps();
    }

    function addLap() {
      if (!running) return;

      const entry = formatTime(elapsed);
      lapNumber += 1;
      emptyState.remove();

      const li = document.createElement("li");
      li.className = "lap";
      li.innerHTML = `
        <div class="lap-index">${lapNumber}</div>
        <div class="lap-label">Lap ${lapNumber}</div>
        <div class="lap-time">${entry.text}</div>
      `;
      lapsList.prepend(li);
      lapCount.textContent = `${lapNumber} lap${lapNumber === 1 ? "" : "s"} recorded`;
      updateButtons();
    }

    function clearLaps() {
      const laps = lapsList.querySelectorAll("li.lap");
      laps.forEach((lap) => lap.remove());
      lapNumber = 0;
      lapCount.textContent = "0 laps recorded";
      if (!lapsList.querySelector("#emptyState")) {
        lapsList.innerHTML = "";
        lapsList.appendChild(emptyState);
      }
      updateButtons();
    }

    async function copyTime() {
      const text = display.textContent;
      try {
        await navigator.clipboard.writeText(text);
        hint.textContent = `Copied ${text} to clipboard.`;
      } catch {
        hint.textContent = "Clipboard copy was blocked by the browser.";
      }
    }

    startPauseBtn.addEventListener("click", toggleStartPause);
    lapBtn.addEventListener("click", addLap);
    resetBtn.addEventListener("click", reset);
    copyBtn.addEventListener("click", copyTime);
    clearLapsBtn.addEventListener("click", clearLaps);

    window.addEventListener("keydown", (event) => {
      if (event.target.matches("button")) return;
      if (event.code === "Space") {
        event.preventDefault();
        toggleStartPause();
      }
      if (event.key.toLowerCase() === "l") addLap();
      if (event.key.toLowerCase() === "r") reset();
    });

    renderTime(0);
    setStatus("ready");
    updateHint();
    updateButtons();