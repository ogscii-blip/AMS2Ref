/* =========================================================
   Points Progression Graph with Animated Driver Photos
   ========================================================= */

/* goToDriverCurrentRound: uses season selected in Overall, or latest season with laps if "All Seasons" */
async function goToDriverCurrentRound(driverName) {
  showTab('round');

  let selectedSeason = document.getElementById('seasonSelect')?.value || '';
  
  // FIXED: If "All Seasons" selected, find the latest season with actual lap submissions
  if (!selectedSeason) {
    const rawLapsSnapshot = await window.firebaseGet(window.firebaseRef(window.firebaseDB, 'Form_responses_1'));
    const rawLapsData = toArray(rawLapsSnapshot.val()).filter(r => r && r.Driver && r.Season && r.Round);
    
    if (rawLapsData.length > 0) {
      const seasonsWithLaps = [...new Set(rawLapsData.map(lap => lap.Season))].filter(s=>s).sort((a,b)=>b-a);
      selectedSeason = seasonsWithLaps[0] || ''; // Use latest season with laps
    } else {
      // Fallback to configured seasons if no laps yet
      if (!CACHE.setupArray) {
        const setupSnap = await window.firebaseGet(window.firebaseRef(window.firebaseDB, 'Form_responses_2'));
        CACHE.setupArray = toArray(setupSnap.val());
      }
      const seasons = [...new Set(CACHE.setupArray.map(s => s.Season))].filter(s=>s).sort((a,b)=>b-a);
      selectedSeason = seasons[0] || '';
    }
  }
  
  const roundDropdown = document.getElementById('roundSeasonSelect');
  if (roundDropdown) roundDropdown.value = selectedSeason;

  // Wait a short moment for DOM, then loadRoundData ensures it uses roundSeasonSelect.value
  await wait(200);
  if (typeof loadRoundData === 'function') await loadRoundData();
  await wait(200);

  // Find round details for this season only
  const keyPrefix = selectedSeason ? `details-S${selectedSeason}-R` : 'details-S';
  const matches = Array.from(document.querySelectorAll(`[id^="${keyPrefix}"]`));
  if (!matches.length) {
    console.warn('No rounds for season', selectedSeason);
    return;
  }

  // Extract keys like "S3-R6" - with descending sort, first item is latest
  const keys = matches.map(el => el.id.replace('details-', ''));
  keys.sort((a,b) => {
    const [sa, ra] = a.replace('S','').split('-R').map(Number);
    const [sb, rb] = b.replace('S','').split('-R').map(Number);
    if (sa !== sb) return sb - sa; // Descending
    return rb - ra; // Descending
  });

  const latestKey = keys[0]; // First is now latest
  const details = document.getElementById(`details-${latestKey}`);
  const icon = document.getElementById(`toggle-${latestKey}`);
  if (!details) return;

  details.classList.add('expanded');
  if (icon) icon.classList.add('expanded');

  details.scrollIntoView({behavior: 'smooth', block: 'start'});
  details.style.transition = 'background 0.4s ease';
  details.style.background = '#fffa9c';
  setTimeout(()=> details.style.background = '', 700);
}

function goToDriverProfile(driverName) {
  showTab('drivers');
  setTimeout(() => {
    const card = document.querySelector(`.driver-card[data-driver="${driverName}"]`);
    if (card) {
      card.scrollIntoView({behavior: 'smooth', block: 'start'});
      const orig = card.style.background;
      card.style.background = '#fffa9c';
      setTimeout(()=> card.style.background = orig, 700);
    }
  }, 300);
}

function toggleRound(key) {
  const details = document.getElementById(`details-${key}`);
  const icon = document.getElementById(`toggle-${key}`);
  if (!details) return;
  details.classList.toggle('expanded');
  if (icon) icon.classList.toggle('expanded');
}

/* -----------------------------
   Points Progression Graph with Animated Driver Photos
   ----------------------------- */
let chartInstance = null; // Store chart instance globally
let chartAnimationTriggered = false; // Track if animation has run

function createPointsProgressionGraph(roundData, selectedSeason) {
  const graphContainer = document.getElementById('points-progression-graph');
  if (!graphContainer) return;

  // Destroy previous chart if it exists
  if (chartInstance) {
    chartInstance.destroy();
    chartInstance = null;
  }
  chartAnimationTriggered = false;

  // Group data by driver and round to calculate cumulative points
  const driverRounds = {};
  const allRounds = new Set();

  roundData.forEach(row => {
    const driver = row.Driver;
    const round = parseInt(row.Round) || 0;
    const points = parseInt(row['Total_Points']) || 0;
    
    if (!driverRounds[driver]) driverRounds[driver] = {};
    if (!driverRounds[driver][round]) driverRounds[driver][round] = 0;
    driverRounds[driver][round] += points;
    allRounds.add(round);
  });

  const sortedRounds = Array.from(allRounds).sort((a,b) => a - b);
  if (sortedRounds.length === 0) {
    graphContainer.style.display = 'none';
    return;
  }

  // Calculate cumulative points for each driver at each round
  const datasets = [];
  const colors = ['#667eea', '#e74c3c', '#f39c12', '#2ecc71', '#9b59b6', '#1abc9c'];
  let colorIndex = 0;

  Object.keys(driverRounds).forEach(driver => {
    const cumulativePoints = [0]; // FIXED: Start with 0 points at R0
    let total = 0;

    sortedRounds.forEach(round => {
      total += (driverRounds[driver][round] || 0);
      cumulativePoints.push(total);
    });

    const profile = DRIVER_PROFILES[encodeKey(driver)] || {};
    const driverColor = colors[colorIndex % colors.length];
    colorIndex++;

    // FIXED: Only use photos if user is logged in
    const usePhoto = currentUser && profile.photoUrl;

    datasets.push({
      label: getFormattedDriverName(driver, false),
      data: cumulativePoints,
      borderColor: driverColor,
      backgroundColor: driverColor + '33',
      borderWidth: 0, // CHANGED: Hide Chart.js lines completely
      tension: 0.3,
      pointRadius: 0,
      pointHoverRadius: 0, // CHANGED: Also hide hover points
      driverName: driver,
      photoUrl: usePhoto ? normalizePhotoUrl(profile.photoUrl) : null,
      driverNumber: profile.number || '?'
    });
  });

  // Clear previous chart
  graphContainer.innerHTML = '<canvas id="pointsChart"></canvas>';
  const ctx = document.getElementById('pointsChart').getContext('2d');

  // Create the chart without any lines or animation
  chartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: ['R0', ...sortedRounds.map(r => `R${r}`)], // FIXED: Add R0 label
      datasets: datasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      aspectRatio: window.innerWidth <= 768 ? 1.2 : 2.5, // Mobile-friendly aspect ratio
      animation: false, // Disable initial animation
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: {
            usePointStyle: true,
            padding: window.innerWidth <= 480 ? 8 : 15,
            font: { 
              size: window.innerWidth <= 480 ? 10 : 12, 
              weight: 'bold' 
            }
          }
        },
        title: {
          display: true,
          text: selectedSeason ? `Season ${selectedSeason} Points Progression` : 'Overall Points Progression',
          font: { 
            size: window.innerWidth <= 480 ? 14 : 18, 
            weight: 'bold' 
          },
          padding: window.innerWidth <= 480 ? 10 : 20
        },
        tooltip: {
          enabled: false // CHANGED: Disable tooltips during animation
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: window.innerWidth > 480,
            text: 'Total Points',
            font: { size: 14, weight: 'bold' }
          },
          ticks: {
            stepSize: 5,
            font: { size: window.innerWidth <= 480 ? 10 : 12 }
          }
        },
        x: {
          title: {
            display: window.innerWidth > 480,
            text: 'Round',
            font: { size: 14, weight: 'bold' }
          },
          ticks: {
            font: { size: window.innerWidth <= 480 ? 10 : 12 }
          }
        }
      },
      interaction: {
        mode: 'nearest',
        axis: 'x',
        intersect: false
      }
    }
  });

  graphContainer.style.display = 'block';

  // FIXED: Use Intersection Observer to trigger animation only when visible
  setupChartVisibilityObserver(graphContainer, sortedRounds);
}

function setupChartVisibilityObserver(graphContainer, rounds) {
  // Remove any existing observer
  if (graphContainer._observer) {
    graphContainer._observer.disconnect();
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !chartAnimationTriggered) {
        chartAnimationTriggered = true;
        
        if (chartInstance) {
          // Start the animation
          animateDriverAvatars(chartInstance, rounds);
        }
        
        observer.disconnect();
      }
    });
  }, {
    threshold: 0.3,
    rootMargin: '0px'
  });

  observer.observe(graphContainer);
  graphContainer._observer = observer;
}

function animateDriverAvatars(chart, rounds) {
  const canvas = chart.canvas;
  const ctx = canvas.getContext('2d');
  const avatarSize = 30;
  const animationDuration = 2500;
  const startTime = Date.now();

  // Create avatar images
  const avatars = chart.data.datasets.map(dataset => {
    const img = new Image();
    if (dataset.photoUrl) {
      img.src = dataset.photoUrl;
    }
    return {
      img: img,
      loaded: false,
      driverNumber: dataset.driverNumber,
      color: dataset.borderColor,
      hasPhoto: !!dataset.photoUrl
    };
  });

  avatars.forEach((avatar, idx) => {
    if (avatar.hasPhoto) {
      avatar.img.onload = () => { avatar.loaded = true; };
      avatar.img.onerror = () => { avatar.hasPhoto = false; };
    }
  });

  function animate() {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / animationDuration, 1);
    
    const currentPositionFloat = progress * rounds.length;
    const currentRoundIndex = Math.floor(currentPositionFloat);
    const roundProgress = currentPositionFloat - currentRoundIndex;

    // Redraw chart base (without lines)
    chart.update('none');

    // Draw our custom lines and avatars
    chart.data.datasets.forEach((dataset, idx) => {
      const avatar = avatars[idx];
      const meta = chart.getDatasetMeta(idx);
      if (!meta || !meta.data || meta.data.length === 0) return;

      ctx.save();
      
      // Draw the line up to current progress
      ctx.strokeStyle = dataset.borderColor;
      ctx.lineWidth = 2;
      ctx.beginPath();
      
      for (let i = 0; i <= currentRoundIndex; i++) {
        const point = meta.data[i];
        if (!point) continue;
        
        const x = point.x;
        const y = chart.scales.y.getPixelForValue(dataset.data[i]);
        
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      
      // Draw interpolated segment
      if (currentRoundIndex < meta.data.length - 1 && roundProgress > 0) {
        const currentPoint = meta.data[currentRoundIndex];
        const nextPoint = meta.data[currentRoundIndex + 1];
        
        if (currentPoint && nextPoint) {
          const currentY = chart.scales.y.getPixelForValue(dataset.data[currentRoundIndex]);
          const nextY = chart.scales.y.getPixelForValue(dataset.data[currentRoundIndex + 1]);
          
          const interpX = currentPoint.x + (nextPoint.x - currentPoint.x) * roundProgress;
          const interpY = currentY + (nextY - currentY) * roundProgress;
          
          ctx.lineTo(interpX, interpY);
        }
      }
      
      ctx.stroke();
      ctx.restore();

      // Draw avatar at tip
      const currentPoint = meta.data[currentRoundIndex];
      const nextPoint = meta.data[currentRoundIndex + 1];
      
      if (!currentPoint) return;

      let tipX, tipY;
      if (nextPoint && roundProgress > 0) {
        tipX = currentPoint.x + (nextPoint.x - currentPoint.x) * roundProgress;
        const currentY = chart.scales.y.getPixelForValue(dataset.data[currentRoundIndex]);
        const nextY = chart.scales.y.getPixelForValue(dataset.data[currentRoundIndex + 1]);
        tipY = currentY + (nextY - currentY) * roundProgress;
      } else {
        tipX = currentPoint.x;
        tipY = chart.scales.y.getPixelForValue(dataset.data[currentRoundIndex]);
      }

      ctx.save();
      
      if (avatar.hasPhoto && avatar.loaded) {
        ctx.beginPath();
        ctx.arc(tipX, tipY, avatarSize / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(avatar.img, tipX - avatarSize / 2, tipY - avatarSize / 2, avatarSize, avatarSize);
        ctx.restore();
        
        ctx.save();
        ctx.strokeStyle = avatar.color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(tipX, tipY, avatarSize / 2, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      } else {
        ctx.beginPath();
        ctx.arc(tipX, tipY, avatarSize / 2, 0, Math.PI * 2);
        ctx.fillStyle = avatar.color;
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(avatar.driverNumber, tipX, tipY);
      }
      
      ctx.restore();
    });

    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      // Animation complete - re-enable tooltips and restore full lines
      chart.options.plugins.tooltip.enabled = true;
      chart.data.datasets.forEach(dataset => {
        dataset.borderWidth = 3;
      });
      chart.update('none');
    }
  }

  requestAnimationFrame(animate);
}

