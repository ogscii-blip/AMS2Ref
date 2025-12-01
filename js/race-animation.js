/* =========================================================
   Race Animation for Round Results
   ========================================================= */

/* -----------------------------
   Race Animation for Round Results
   ----------------------------- */
function createRaceAnimation(roundKey, results) {
  // Only show top 3
  const top3 = results.slice(0, 3);
  if (top3.length === 0) return '';

  const containerId = `race-animation-${roundKey}`;
  const canvasId = `race-canvas-${roundKey}`;
  const replayBtnId = `replay-${roundKey}`;

  // Create HTML structure
  const html = `
    <div class="race-animation-container" id="${containerId}">
      <div class="race-animation-header">
        <h4>🏁 Race Replay - Top 3</h4>
        <button class="replay-button" id="${replayBtnId}">↻ Replay</button>
      </div>
      <canvas id="${canvasId}" class="race-canvas"></canvas>
    </div>
  `;

  // Schedule animation setup after DOM insertion
  setTimeout(() => {
    setupRaceAnimation(canvasId, replayBtnId, top3, roundKey);
  }, 100);

  return html;
}

function setupRaceAnimation(canvasId, replayBtnId, top3, roundKey) {
  const canvas = document.getElementById(canvasId);
  const replayBtn = document.getElementById(replayBtnId);
  
  if (!canvas || !replayBtn) return;

  const ctx = canvas.getContext('2d');
  let animationId = null;
  let hasAnimated = false;
  let isAnimating = false;

  const resizeCanvas = () => {
    const container = canvas.parentElement;
    const rect = container.getBoundingClientRect();
    canvas.style.width = '100%';
    canvas.width = rect.width;
    canvas.height = canvas.offsetHeight;
    
    if (isAnimating) {
      cancelAnimationFrame(animationId);
      startAnimation();
    }
  };
  
  resizeCanvas();

  let resizeTimeout;
  const handleResize = () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      resizeCanvas();
    }, 100);
  };

  window.addEventListener('resize', handleResize);
  window.addEventListener('orientationchange', () => {
    setTimeout(resizeCanvas, 100);
  });

  const colors = ['#667eea', '#e74c3c', '#f39c12'];

  const drivers = top3.map((result, idx) => {
    const s1 = timeToSeconds(result.sector1);
    const s2 = timeToSeconds(result.sector2);
    const s3 = timeToSeconds(result.sector3);
    const total = s1 + s2 + s3;

    return {
      name: result.driver,
      position: result.position,
      sector1: s1,
      sector2: s2,
      sector3: s3,
      totalTime: total,
      color: colors[idx],
      currentSector: 0,
      progress: 0,
      finished: false,
      finishTime: null,
      lanePosition: 1 // Start in middle lane (0=top, 1=middle, 2=bottom)
    };
  });

  const ANIMATION_DURATION = 4000;
  
  const getPositions = () => {
    const startX = 80;
    const finishX = canvas.width - 80;
    const trackLength = finishX - startX;
    
    return {
      startX,
      finishX,
      trackLength,
      sector1End: startX + (trackLength / 3),
      sector2End: startX + (2 * trackLength / 3)
    };
  };

  const slowestTime = Math.max(...drivers.map(d => d.totalTime));

function drawTrack() {
  const { startX, finishX, sector1End, sector2End } = getPositions();
  
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const laneHeight = canvas.height / 3;
  ctx.strokeStyle = '#ddd';
  ctx.lineWidth = 2;
  ctx.setLineDash([10, 5]);
  for (let i = 1; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(startX, i * laneHeight);
    ctx.lineTo(finishX, i * laneHeight);
    ctx.stroke();
  }
  ctx.setLineDash([]);
  ctx.strokeStyle = '#bbb';
  ctx.lineWidth = 1;
  ctx.setLineDash([5, 5]);
  
  ctx.beginPath();
  ctx.moveTo(sector1End, 0);
  ctx.lineTo(sector1End, canvas.height);
  ctx.stroke();
  
  ctx.beginPath();
  ctx.moveTo(sector2End, 0);
  ctx.lineTo(sector2End, canvas.height);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = '#999';
  ctx.font = 'bold 12px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('S1', (startX + sector1End) / 2, 15);
  ctx.fillText('S2', (sector1End + sector2End) / 2, 15);
  ctx.fillText('S3', (sector2End + finishX) / 2, 15);
  
  // START line
  ctx.strokeStyle = '#2ecc71';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(startX, 0);
  ctx.lineTo(startX, canvas.height);
  ctx.stroke();

  // START label - rotated 90deg clockwise, bigger, and centered to the LEFT of start line
  ctx.save();
  ctx.translate(startX - 15, canvas.height / 2);
  ctx.rotate(Math.PI / 2);
  ctx.fillStyle = '#2ecc71';
  ctx.font = 'bold 24px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('START', 0, 0);
  ctx.restore();
  
  // Draw checkered flag at finish line
  drawCheckeredFlag(finishX);

  // FINISH label - rotated 90deg clockwise, bigger, and centered
  ctx.save();
  ctx.translate(finishX, canvas.height / 2);
  ctx.rotate(Math.PI / 2);
  ctx.fillStyle = '#2c3e50';
  ctx.font = 'bold 24px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('FINISH', 0, 0);
  ctx.restore();
}

function drawCheckeredFlag(x) {
  const squareSize = 8;
  const flagHeight = canvas.height;
  const cols = 3;
  const rows = Math.ceil(flagHeight / squareSize);

  // Calculate the vertical range where "FINISH" text will be (center area)
  const textAreaTop = (canvas.height / 2) - 40; // Give 40px above center
  const textAreaBottom = (canvas.height / 2) + 40; // Give 40px below center

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const squareY = row * squareSize;
      
      // Skip drawing squares in the text area
      if (squareY >= textAreaTop && squareY <= textAreaBottom) {
        continue;
      }
      
      const isBlack = (row + col) % 2 === 0;
      ctx.fillStyle = isBlack ? '#2c3e50' : '#fff';
      ctx.fillRect(
        x - (cols * squareSize / 2) + (col * squareSize),
        row * squareSize,
        squareSize,
        squareSize
      );
    }
  }

  // Draw border for top section
  const topSectionHeight = Math.floor(textAreaTop / squareSize) * squareSize;
  if (topSectionHeight > 0) {
    ctx.strokeStyle = '#2c3e50';
    ctx.lineWidth = 2;
    ctx.strokeRect(
      x - (cols * squareSize / 2),
      0,
      cols * squareSize,
      topSectionHeight
    );
  }

  // Draw border for bottom section
  const bottomSectionStart = Math.ceil(textAreaBottom / squareSize) * squareSize;
  const bottomSectionHeight = flagHeight - bottomSectionStart;
  if (bottomSectionHeight > 0) {
    ctx.strokeStyle = '#2c3e50';
    ctx.lineWidth = 2;
    ctx.strokeRect(
      x - (cols * squareSize / 2),
      bottomSectionStart,
      cols * squareSize,
      bottomSectionHeight
    );
  }
}


  function drawGlowingLane(startX, finishX, laneY, laneHeight, color) {
    ctx.save();

    const gradient = ctx.createLinearGradient(startX, 0, finishX, 0);
    
    const lightColor = hexToRgba(color, 0.1);
    const mediumColor = hexToRgba(color, 0.2);
    const strongColor = hexToRgba(color, 0.3);
    
    gradient.addColorStop(0, lightColor);
    gradient.addColorStop(0.7, mediumColor);
    gradient.addColorStop(1, strongColor);

    ctx.fillStyle = gradient;
    
    const laneTop = laneY - laneHeight/2 + 5;
    const stripHeight = laneHeight - 10;
    
    ctx.fillRect(startX, laneTop, finishX - startX, stripHeight);

    ctx.restore();
  }

  function hexToRgba(hex, alpha) {
    hex = hex.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  function drawFinishCarpet(finishX, laneY, finishPosition, driverColor) {
    const carpetWidth = 35;
    const carpetHeight = 25;
    const carpetX = finishX - carpetWidth - 10;
    const carpetY = laneY - carpetHeight / 2;

    ctx.save();

    let carpetBaseColor;
    if (finishPosition === 1) {
      carpetBaseColor = '#FFD700';
    } else if (finishPosition === 2) {
      carpetBaseColor = '#C0C0C0';
    } else if (finishPosition === 3) {
      carpetBaseColor = '#CD7F32';
    }

    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.fillRect(carpetX + 2, carpetY + 2, carpetWidth, carpetHeight);

    const gradient = ctx.createLinearGradient(carpetX, carpetY, carpetX, carpetY + carpetHeight);
    gradient.addColorStop(0, carpetBaseColor);
    gradient.addColorStop(1, shadeColor(carpetBaseColor, -20));
    ctx.fillStyle = gradient;
    ctx.fillRect(carpetX, carpetY, carpetWidth, carpetHeight);

    ctx.strokeStyle = driverColor;
    ctx.lineWidth = 3;
    ctx.strokeRect(carpetX, carpetY, carpetWidth, carpetHeight);

    ctx.strokeStyle = 'white';
    ctx.lineWidth = 1;
    ctx.strokeRect(carpetX + 3, carpetY + 3, carpetWidth - 6, carpetHeight - 6);

    ctx.fillStyle = '#2c3e50';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const ordinal = finishPosition === 1 ? 'st' : finishPosition === 2 ? 'nd' : 'rd';
    ctx.fillText(`${finishPosition}${ordinal}`, carpetX + carpetWidth / 2, carpetY + carpetHeight / 2);

    if (finishPosition === 1) {
      drawSparkles(carpetX + carpetWidth / 2, carpetY + carpetHeight / 2, carpetWidth);
    }

    ctx.restore();
  }

  function shadeColor(color, percent) {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return '#' + (
      0x1000000 +
      (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
      (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
      (B < 255 ? (B < 1 ? 0 : B) : 255)
    ).toString(16).slice(1);
  }

  function drawSparkles(x, y, size) {
    const sparkleCount = 4;
    const sparkleSize = 3;
    const sparkleDistance = size / 2 + 5;
    
    ctx.fillStyle = '#FFD700';
    
    for (let i = 0; i < sparkleCount; i++) {
      const angle = (Math.PI * 2 / sparkleCount) * i + (Date.now() / 500);
      const sx = x + Math.cos(angle) * sparkleDistance;
      const sy = y + Math.sin(angle) * sparkleDistance;
      
      ctx.beginPath();
      for (let j = 0; j < 5; j++) {
        const starAngle = (Math.PI * 2 / 5) * j + angle;
        const radius = j % 2 === 0 ? sparkleSize : sparkleSize / 2;
        const px = sx + Math.cos(starAngle) * radius;
        const py = sy + Math.sin(starAngle) * radius;
        if (j === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
    }
  }

  function drawCar(x, y, color, driverName, position) {
    const carWidth = 50;
    const carHeight = 18;

    ctx.save();

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x - carWidth/2 + 5, y - carHeight/2);
    ctx.lineTo(x + carWidth/2 - 3, y - carHeight/2);
    ctx.quadraticCurveTo(x + carWidth/2, y - carHeight/2, x + carWidth/2, y - carHeight/2 + 3);
    ctx.lineTo(x + carWidth/2, y + carHeight/2 - 3);
    ctx.quadraticCurveTo(x + carWidth/2, y + carHeight/2, x + carWidth/2 - 3, y + carHeight/2);
    ctx.lineTo(x - carWidth/2 + 5, y + carHeight/2);
    ctx.quadraticCurveTo(x - carWidth/2 + 2, y + carHeight/2, x - carWidth/2 + 2, y + carHeight/2 - 3);
    ctx.lineTo(x - carWidth/2 + 2, y - carHeight/2 + 3);
    ctx.quadraticCurveTo(x - carWidth/2 + 2, y - carHeight/2, x - carWidth/2 + 5, y - carHeight/2);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.ellipse(x + carWidth/6, y, carWidth/4, carHeight/3, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = color;
    ctx.globalAlpha = 0.8;
    ctx.beginPath();
    ctx.moveTo(x + carWidth/2, y - carHeight/2 - 2);
    ctx.lineTo(x + carWidth/2 + 5, y - carHeight/2 - 1);
    ctx.lineTo(x + carWidth/2 + 5, y + carHeight/2 + 1);
    ctx.lineTo(x + carWidth/2, y + carHeight/2 + 2);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;

    ctx.fillStyle = color;
    ctx.globalAlpha = 0.8;
    ctx.beginPath();
    ctx.moveTo(x - carWidth/2 + 2, y - carHeight/2 - 3);
    ctx.lineTo(x - carWidth/2 - 3, y - carHeight/2 - 2);
    ctx.lineTo(x - carWidth/2 - 3, y + carHeight/2 + 2);
    ctx.lineTo(x - carWidth/2 + 2, y + carHeight/2 + 3);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;

    ctx.fillStyle = '#1a1a1a';
    const wheelRadius = 4;
    const wheelOffset = carWidth/3;
    
    ctx.beginPath();
    ctx.arc(x + wheelOffset, y - carHeight/2 - 1, wheelRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + wheelOffset, y + carHeight/2 + 1, wheelRadius, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(x - wheelOffset, y - carHeight/2 - 1, wheelRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x - wheelOffset, y + carHeight/2 + 1, wheelRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    const rimRadius = 2;
    ctx.beginPath();
    ctx.arc(x + wheelOffset, y - carHeight/2 - 1, rimRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + wheelOffset, y + carHeight/2 + 1, rimRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x - wheelOffset, y - carHeight/2 - 1, rimRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x - wheelOffset, y + carHeight/2 + 1, rimRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x - carWidth/2 + 8, y - 2);
    ctx.lineTo(x + carWidth/2 - 5, y - 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x - carWidth/2 + 8, y + 2);
    ctx.lineTo(x + carWidth/2 - 5, y + 2);
    ctx.stroke();

    ctx.restore();

    ctx.fillStyle = '#2c3e50';
    ctx.font = 'bold 11px Arial';
    ctx.textAlign = 'left';
    const profile = DRIVER_PROFILES[encodeKey(driverName)] || {};
    
    let displayName;
    if (currentUser && profile.name && profile.surname) {
      displayName = `${profile.name.charAt(0)}. ${profile.surname}`;
    } else if (profile.name && profile.surname) {
      displayName = `${profile.name.charAt(0)}. ${profile.surname.charAt(0)}.`;
    } else {
      displayName = driverName;
    }
    
    ctx.fillText(`P${position} ${displayName}`, x + carWidth/2 + 8, y + 4);
  }

  // Calculate cumulative times at each sector end for sorting
  function getCumulativeTime(driver, elapsedRealTime) {
    if (elapsedRealTime <= driver.sector1) {
      return elapsedRealTime;
    } else if (elapsedRealTime <= driver.sector1 + driver.sector2) {
      return elapsedRealTime;
    } else {
      return elapsedRealTime;
    }
  }

function animate() {
  const { startX, finishX, sector1End, sector2End } = getPositions();
  
  const now = Date.now();
  const elapsed = now - startTime;
  
  // Slow down the last 20% of the race for dramatic effect
  let adjustedProgress;
  if (elapsed / ANIMATION_DURATION < 0.8) {
    adjustedProgress = (elapsed / ANIMATION_DURATION) / 0.8 * 0.8;
  } else {
    const remainingProgress = (elapsed / ANIMATION_DURATION - 0.8) / 0.2;
    adjustedProgress = 0.8 + (remainingProgress * 0.5 * 0.2);
  }
  
  const progress = Math.min(adjustedProgress, 1);

  drawTrack();

  const laneHeight = canvas.height / 3;
  let finishOrder = [];

  const trackLength = finishX - startX;
  
  // Calculate each driver's position
  const driverStates = drivers.map((driver, idx) => {
    // Calculate overall progress for this driver (faster drivers finish earlier)
    const timeRatio = driver.totalTime / slowestTime;
    const driverProgress = Math.min(progress / timeRatio, 1);
    
    // Simple linear position for visual
    let x = startX + (trackLength * driverProgress);
    let finished = false;
    
    if (driverProgress >= 1) {
      x = finishX;
      finished = true;
      
      if (!driver.finished) {
        driver.finished = true;
        driver.finishTime = now;
      }
    }

    if (driver.finished) {
      finishOrder.push({ driver, idx, finishTime: driver.finishTime });
    }

    // For ranking: calculate which drivers have completed each sector based on their times
    // Use actual sector times to determine ranking
    let rankingScore = 0;
    
    // Figure out where we are in the overall race
    const fastestS1 = Math.min(...drivers.map(d => d.sector1));
    const fastestS1S2 = Math.min(...drivers.map(d => d.sector1 + d.sector2));
    const fastestTotal = Math.min(...drivers.map(d => d.totalTime));
    
    // Determine race phase based on fastest driver
    const globalElapsed = progress * fastestTotal;
    
    if (globalElapsed < fastestS1) {
      // Phase 1: Everyone in S1, rank by S1 time (lower is better)
      rankingScore = driver.sector1;
    } else if (globalElapsed < fastestS1S2) {
      // Phase 2: Best drivers in S2, rank by S1+S2 cumulative (lower is better)
      rankingScore = driver.sector1 + driver.sector2;
    } else {
      // Phase 3: In S3, rank by total time (lower is better)
      rankingScore = driver.totalTime;
    }

    return {
      driver,
      idx,
      x,
      xProgress: driverProgress,
      rankingScore, // Lower is better
      finished: driver.finished
    };
  });

  // Sort by ranking score (LOWER is better = ahead = top lane)
  driverStates.sort((a, b) => {
    if (Math.abs(a.rankingScore - b.rankingScore) > 0.001) {
      return a.rankingScore - b.rankingScore;
    }
    return a.idx - b.idx; // Stable sort by original position
  });

  // Assign lanes with smooth transitions
  driverStates.forEach((state, position) => {
    state.targetLane = position;
    
    const currentLane = state.driver.lanePosition;
    const laneChangeSpeed = 0.01;
    
    if (Math.abs(currentLane - state.targetLane) < 0.01) {
      state.driver.lanePosition = state.targetLane;
    } else if (currentLane < state.targetLane) {
      state.driver.lanePosition = Math.min(currentLane + laneChangeSpeed, state.targetLane);
    } else if (currentLane > state.targetLane) {
      state.driver.lanePosition = Math.max(currentLane - laneChangeSpeed, state.targetLane);
    }
  });

  // Draw glowing lanes for finished drivers
  driverStates.forEach(state => {
    if (state.finished) {
      const laneY = (state.driver.lanePosition + 0.5) * laneHeight;
      drawGlowingLane(startX, finishX, laneY, laneHeight, state.driver.color);
    }
  });

  // Draw cars
  driverStates.forEach(state => {
    const laneY = (state.driver.lanePosition + 0.5) * laneHeight;
    drawCar(state.x, laneY, state.driver.color, state.driver.name, state.driver.position);
  });

  // Draw finish carpets
  if (finishOrder.length > 0) {
    finishOrder.sort((a, b) => a.finishTime - b.finishTime);
    finishOrder.forEach((item, finishPos) => {
      const laneY = (item.driver.lanePosition + 0.5) * laneHeight;
      drawFinishCarpet(finishX, laneY, finishPos + 1, item.driver.color);
    });
  }

  if (progress < 1) {
    animationId = requestAnimationFrame(animate);
  } else {
    isAnimating = false;
  }
}


  let startTime;

 function startAnimation() {
  if (animationId) {
    cancelAnimationFrame(animationId);
  }
  
  drivers.forEach(d => {
    d.progress = 0;
    d.finished = false;
    d.finishTime = null;
    d.lanePosition = 1; // Reset ALL cars to middle lane at start
  });

  isAnimating = true;
  startTime = Date.now();
  animationId = requestAnimationFrame(animate);
}

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !hasAnimated) {
        hasAnimated = true;
        setTimeout(() => startAnimation(), 300);
      }
    });
  }, {
    threshold: 0.3
  });

  observer.observe(canvas);

  replayBtn.addEventListener('click', () => {
    hasAnimated = true;
    startAnimation();
  });
}

