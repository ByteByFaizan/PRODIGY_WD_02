(function() {
  'use strict';

  const display = document.getElementById('display');
  const startBtn = document.getElementById('startBtn');
  const lapBtn = document.getElementById('lapBtn');
  const resetBtn = document.getElementById('resetBtn');
  const clearLapsBtn = document.getElementById('clearLapsBtn');
  const exportBtn = document.getElementById('exportBtn');
  const lapsContainer = document.getElementById('laps');
  const lapsCount = document.getElementById('lapsCount');
  const statsContainer = document.getElementById('stats');

  let running = false;
  let startTime = 0;
  let elapsedBefore = 0;
  let laps = [];
  let animationId = null;
  let lastLapTime = 0;

  function formatTime(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const milliseconds = Math.floor(ms % 1000);
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(milliseconds).padStart(3, '0')}`;
  }

  function updateDisplay() {
    const currentMs = elapsedBefore + (performance.now() - startTime);
    display.textContent = formatTime(currentMs);
    if (running) {
      animationId = requestAnimationFrame(updateDisplay);
    }
  }

  function start() {
    if (running) return;
    running = true;
    startTime = performance.now();
    startBtn.textContent = 'Pause';
    startBtn.classList.remove('primary');
    display.classList.add('running');
    lapBtn.disabled = false;
    updateDisplay();
  }

  function pause() {
    if (!running) return;
    running = false;
    elapsedBefore += (performance.now() - startTime);
    startBtn.textContent = 'Resume';
    startBtn.classList.add('primary');
    display.classList.remove('running');
    if (animationId) {
      cancelAnimationFrame(animationId);
      animationId = null;
    }
  }

  function reset() {
    pause();
    running = false;
    startTime = 0;
    elapsedBefore = 0;
    lastLapTime = 0;
    display.textContent = '00:00.000';
    display.classList.remove('running');
    startBtn.textContent = 'Start';
    startBtn.classList.add('primary');
    lapBtn.disabled = true;
  }

  function lap() {
    if (elapsedBefore === 0 && !running) return;
    
    const currentMs = elapsedBefore + (running ? (performance.now() - startTime) : 0);
    const lapTime = currentMs - lastLapTime;
    lastLapTime = currentMs;
    
    const entry = {
      index: laps.length + 1,
      time: formatTime(lapTime),
      cumulative: formatTime(currentMs),
      cumulativeMs: currentMs,
      lapMs: lapTime
    };
    
    laps.push(entry);
    renderLaps();
    highlightFastestSlowest();
    updateStats();
  }

  function highlightFastestSlowest() {
    if (laps.length < 2) return;
    
    const lapTimes = laps.map(l => l.lapMs);
    const fastest = Math.min(...lapTimes);
    const slowest = Math.max(...lapTimes);

    document.querySelectorAll('.lap').forEach((el, idx) => {
      const reversedIdx = laps.length - 1 - idx;
      el.classList.remove('fastest', 'slowest');
      
      if (fastest !== slowest) {
        if (laps[reversedIdx].lapMs === fastest) {
          el.classList.add('fastest');
        }
        if (laps[reversedIdx].lapMs === slowest) {
          el.classList.add('slowest');
        }
      }
    });
  }

  function updateStats() {
    if (laps.length === 0) {
      statsContainer.classList.remove('visible');
      return;
    }

    const lapTimes = laps.map(l => l.lapMs);
    const avgLapTime = lapTimes.reduce((a, b) => a + b, 0) / lapTimes.length;
    const fastest = Math.min(...lapTimes);
    const slowest = Math.max(...lapTimes);

    statsContainer.innerHTML = `
      <div class="stats-grid">
        <div class="stat-item">
          <div class="stat-label">Avg Lap</div>
          <div class="stat-value">${formatTime(avgLapTime)}</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">Best Lap</div>
          <div class="stat-value">${formatTime(fastest)}</div>
        </div>
      </div>
    `;
    statsContainer.classList.add('visible');
  }

  function renderLaps() {
    if (laps.length === 0) {
      lapsContainer.innerHTML = '<div class="empty-state">No laps recorded yet</div>';
      lapsCount.textContent = '0';
      clearLapsBtn.disabled = true;
      exportBtn.disabled = true;
      return;
    }

    lapsContainer.innerHTML = '';
    for (let i = laps.length - 1; i >= 0; i--) {
      const l = laps[i];
      const div = document.createElement('div');
      div.className = 'lap';
      div.innerHTML = `
        <div><strong>Lap ${l.index}</strong></div>
        <div>${l.time} <span class="small">(${l.cumulative})</span></div>
      `;
      lapsContainer.appendChild(div);
    }
    
    lapsCount.textContent = laps.length;
    clearLapsBtn.disabled = false;
    exportBtn.disabled = false;
  }

  function exportCSV() {
    if (!laps.length) {
      alert('No laps to export');
      return;
    }
    
    const header = ['Lap', 'Lap Time', 'Cumulative Time'];
    const rows = laps.map(l => [l.index, l.time, l.cumulative]);
    const csv = [header, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stopwatch-laps-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function clearAllLaps() {
    if (confirm('Clear all lap times?')) {
      laps = [];
      lastLapTime = 0;
      renderLaps();
      updateStats();
    }
  }

  function resetAll() {
    reset();
    laps = [];
    lastLapTime = 0;
    renderLaps();
    updateStats();
  }

  startBtn.addEventListener('click', () => {
    running ? pause() : start();
  });
  
  lapBtn.addEventListener('click', lap);
  
  resetBtn.addEventListener('click', resetAll);
  
  clearLapsBtn.addEventListener('click', clearAllLaps);
  
  exportBtn.addEventListener('click', exportCSV);

  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
      e.preventDefault();
      running ? pause() : start();
    }
    if (e.key.toLowerCase() === 'l' && !lapBtn.disabled) {
      e.preventDefault();
      lap();
    }
    if (e.key.toLowerCase() === 'r') {
      e.preventDefault();
      if (elapsedBefore > 0 || running) {
        resetAll();
      }
    }
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && running) {
      pause();
    }
  });

  lapBtn.disabled = true;
  clearLapsBtn.disabled = true;
  exportBtn.disabled = true;

})();