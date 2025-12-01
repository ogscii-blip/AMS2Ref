/* =========================================================
   Driver Statistics & Profiles
   ========================================================= */

/* Driver Stats section continues in next file due to length... */
/* The rest remains the same as your original file from loadDriverStats onwards */
/* -----------------------------
   Driver Stats (CONTINUATION FROM PART 1)
   ----------------------------- */
async function loadDriverStats() {
  try {
    const [roundSnap, leaderboardSnap] = await Promise.all([
      window.firebaseGet(window.firebaseRef(window.firebaseDB, 'Round_Data')),
      window.firebaseGet(window.firebaseRef(window.firebaseDB, 'Leaderboard'))
    ]);
    const roundArr = toArray(roundSnap.val());
    const leaderboardArr = toArray(leaderboardSnap.val());

    const champSorted = leaderboardArr.slice().filter(l=>l && l.Driver).sort((a,b)=> (parseInt(b['Total_Points'])||0) - (parseInt(a['Total_Points'])||0));
    const champPos = {};
    champSorted.forEach((r,i)=> { if (r && r.Driver) champPos[r.Driver] = i+1; });

    const drivers = [...new Set((leaderboardArr.map(r=>r.Driver).filter(Boolean)).concat(roundArr.map(r=>r.Driver).filter(Boolean)))].filter(Boolean);

    const driversContent = document.getElementById('drivers-content');
    driversContent.innerHTML = '';
    const frag = document.createDocumentFragment();

    const roundsByDriver = {};
    roundArr.forEach(r => { if (!r || !r.Driver) return; if (!roundsByDriver[r.Driver]) roundsByDriver[r.Driver] = []; roundsByDriver[r.Driver].push(r); });

    drivers.forEach(driverName => {
      const driverRoundData = (roundsByDriver[driverName] || []);
      const driverLeaderboard = leaderboardArr.find(l => l.Driver === driverName) || {};
      const totalPoints = parseInt(driverLeaderboard['Total_Points']) || 0;
      const totalPurpleSectors = parseInt(driverLeaderboard['Total_Purple_Sectors']) || 0;
      const totalWins = parseInt(driverLeaderboard['Total_Wins']) || 0;
      const totalRounds = driverRoundData.length;
      const avgPosition = totalRounds > 0 ? (driverRoundData.reduce((s,r)=> s + (parseInt(r.Position)||0),0)/totalRounds).toFixed(1) : 'N/A';

      let personalBest = null;
      if (driverRoundData.length) {
        personalBest = driverRoundData.reduce((best,cur)=> {
          const c = parseFloat(cur['Total_Lap_Time']) || Infinity;
          const b = best ? parseFloat(best['Total_Lap_Time']) || Infinity : Infinity;
          return c < b ? cur : best;
        }, null);
      }

      const trackCarRecordsMap = {};
      driverRoundData.forEach(r => {
        const key = `${r['Track-Layout'] || ''} - ${r['Car_Name'] || ''}`;
        const t = parseFloat(r['Total_Lap_Time']) || Infinity;
        if (!trackCarRecordsMap[key] || t < trackCarRecordsMap[key].time) trackCarRecordsMap[key] = { combo: key, time: t, timeFormatted: formatTime(r['Total_Lap_Time']) };
      });
      const trackCarRecordsArray = Object.values(trackCarRecordsMap).sort((a,b)=>a.time-b.time);

      const trackCounts = {}; const carCounts = {};
      driverRoundData.forEach(r => { if (r['Track-Layout']) trackCounts[r['Track-Layout']] = (trackCounts[r['Track-Layout']]||0)+1; if (r['Car_Name']) carCounts[r['Car_Name']] = (carCounts[r['Car_Name']]||0)+1; });
      const favoriteTrack = Object.keys(trackCounts).sort((a,b)=>trackCounts[b]-trackCounts[a])[0] || 'N/A';
      const favoriteCar = Object.keys(carCounts).sort((a,b)=>carCounts[b]-carCounts[a])[0] || 'N/A';

      const positionsByRound = {};
      roundArr.forEach(r => {
        if (!r || !r.Round) return;
        const roundKey = `${r.Season}-${r.Round}`;
        if (!positionsByRound[roundKey]) positionsByRound[roundKey] = {};
        positionsByRound[roundKey][r.Driver] = parseInt(r.Position) || 999;
      });
      const opponents = [...new Set(roundArr.map(r=>r.Driver).filter(d=>d && d !== driverName))];
      const h2hRecords = {};
      opponents.forEach(op => {
        let wins = 0, losses = 0;
        Object.values(positionsByRound).forEach(roundMap => {
          if (roundMap[driverName] && roundMap[op]) {
            if (roundMap[driverName] < roundMap[op]) wins++; else if (roundMap[driverName] > roundMap[op]) losses++;
          }
        });
        if (wins || losses) h2hRecords[op] = { wins, losses };
      });

      const profileKey = encodeKey(driverName);
      const profile = DRIVER_PROFILES[profileKey] || {};

      let formattedName, formattedShortName;
      if (currentUser && profile && profile.surname) {
        formattedName = `${profile.name} ${profile.surname}`;
        formattedShortName = `${profile.name.charAt(0)}. ${profile.surname}`;
      } else if (!currentUser && profile && profile.surname) {
        formattedName = `${profile.name.charAt(0)}. ${profile.surname.charAt(0)}.`;
        formattedShortName = `${profile.name.charAt(0)}. ${profile.surname.charAt(0)}.`;
      } else {
        formattedName = driverName;
        formattedShortName = driverName;
      }
      
      const championshipPosition = champPos[driverName] || 'N/A';

      const card = document.createElement('div'); 
      card.className = 'driver-card'; 
      card.setAttribute('data-driver', driverName);
      
      let desktopPhotoHtml = '';
      let mobilePhotoHtml = '';
      
      if (currentUser) {
        desktopPhotoHtml = profile && profile.photoUrl 
          ? `<div class="driver-photo-container"><img src="${normalizePhotoUrl(profile.photoUrl)}" alt="${formattedName}" class="driver-photo"><div class="driver-number-badge">${profile.number||'?'}</div></div>` 
          : '';
        mobilePhotoHtml = profile && profile.photoUrl 
          ? `<div class="driver-photo-container-mobile"><img src="${normalizePhotoUrl(profile.photoUrl)}" alt="${formattedName}" class="driver-photo-mobile"><div class="driver-number-badge-mobile">${profile.number||'?'}</div></div>` 
          : '';
      } else {
        const driverNumber = profile && profile.number ? profile.number : '?';
        desktopPhotoHtml = `<div class="driver-number-placeholder">${driverNumber}</div>`;
        mobilePhotoHtml = `<div class="driver-number-placeholder-mobile">${driverNumber}</div>`;
      }

      const trackCarRecordsHtml = trackCarRecordsArray.length ? trackCarRecordsArray.map(r=> `<div class="record-item"><span>${r.combo}</span><strong>${r.timeFormatted}</strong></div>`).join('') : '<p style="color:#999;text-align:center">No records yet</p>';
      const h2hHtml = Object.entries(h2hRecords).length ? Object.entries(h2hRecords).map(([op,rec])=> `<div class="h2h-card"><div class="opponent">vs ${getFormattedDriverName(op, false)}</div><div class="record">${rec.wins}W - ${rec.losses}L</div></div>`).join('') : '<p style="color:#999;text-align:center">No head-to-head data yet</p>';

      // ============================================================================
      // FLIP CARD STRUCTURE - FRONT AND BACK
      // ============================================================================
      card.innerHTML = `
        <div class="driver-card-inner">
          <!-- ============ FRONT OF CARD ============ -->
          <div class="driver-card-front">
            <button class="flip-card-button" onclick="flipDriverCard(this)" title="View Equipment Setup">
              🎮
            </button>
            
            <div class="driver-header">${desktopPhotoHtml}<div class="driver-info"><h2>${formattedName}</h2><div class="driver-position">Championship Position: ${championshipPosition}</div></div></div>
            <div class="driver-header-mobile">${mobilePhotoHtml}<div class="driver-name-mobile">${formattedShortName}</div><div class="driver-stats-compact"><div class="stat-compact-item"><span class="stat-compact-label">Championship Position:</span><span class="stat-compact-value">${championshipPosition}</span></div><div class="stat-compact-row"><div class="stat-compact-item"><span class="stat-compact-label">Total Points:</span><span class="stat-compact-value">${totalPoints}</span></div><div class="stat-compact-item"><span class="stat-compact-label">Races:</span><span class="stat-compact-value">${totalRounds}</span></div></div></div></div>
            <div class="stats-grid-driver"><div class="stat-card-driver"><h3>Total Points</h3><p class="stat-value">${totalPoints}</p></div><div class="stat-card-driver"><h3>Wins</h3><p class="stat-value">${totalWins}</p></div><div class="stat-card-driver"><h3>Purple Sectors</h3><p class="stat-value">${totalPurpleSectors}</p></div><div class="stat-card-driver"><h3>Avg Position</h3><p class="stat-value">${avgPosition}</p></div></div>
            ${profile && profile.bio ? `<p style="text-align:center;color:#666;margin:20px 0;font-style:italic;">"${profile.bio}"</p>` : ''}
            <div class="driver-records-section"><h3 class="section-title">🏆 Lap Time Records</h3><div class="lap-records"><div class="personal-best"><strong style="color:#667eea;">Personal Best Lap:</strong><div style="font-size:1.5em;font-weight:bold;color:#2c3e50;margin:5px 0;">${personalBest ? formatTime(personalBest['Total_Lap_Time']) : 'N/A'}</div>${personalBest ? `<div style="font-size:0.9em;color:#666;">${personalBest['Track-Layout']}<br>${personalBest['Car_Name']}</div>` : ''}</div><div class="quick-stats"><div class="quick-stat-item"><strong style="color:#667eea;">Purple Sectors:</strong> ${totalPurpleSectors}</div><div class="quick-stat-item"><strong style="color:#667eea;">Favorite Track:</strong> ${favoriteTrack}</div><div class="quick-stat-item"><strong style="color:#667eea;">Favorite Car:</strong> ${favoriteCar}</div></div></div></div>
            <div class="driver-records-section"><h3 class="section-title">📍 Track + Car Records</h3><div class="track-car-records">${trackCarRecordsHtml}</div></div>
            <div class="driver-records-section"><h3 class="section-title">⚔️ Head-to-Head Record</h3><div class="h2h-grid">${h2hHtml}</div></div>
          </div>
          
          <!-- ============ BACK OF CARD ============ -->
          <div class="driver-card-back">
            <button class="flip-card-button flip-back" onclick="flipDriverCard(this)" title="Back to Stats">
              ↩
            </button>
            
            <div class="equipment-back-header">
              <h2>${formattedName}</h2>
              <h3>🎮 Equipment Setup</h3>
            </div>
            
            ${profile && profile.equipment && Object.values(profile.equipment).some(v => v) ? `
              <div class="equipment-grid-back">
                ${profile.equipment.wheel ? `
                  <div class="equipment-display-item-back">
                    ${profile.equipment.wheelImage ? `<img src="${normalizePhotoUrl(profile.equipment.wheelImage)}" alt="Wheel" onerror="this.style.display='none'">` : ''}
                    <div class="equipment-display-label">🎯 Wheel</div>
                    <div class="equipment-display-value">${profile.equipment.wheel}</div>
                  </div>
                ` : ''}
                ${profile.equipment.wheelbase ? `
                  <div class="equipment-display-item-back">
                    ${profile.equipment.wheelbaseImage ? `<img src="${normalizePhotoUrl(profile.equipment.wheelbaseImage)}" alt="Wheelbase" onerror="this.style.display='none'">` : ''}
                    <div class="equipment-display-label">⚙️ Wheelbase</div>
                    <div class="equipment-display-value">${profile.equipment.wheelbase}</div>
                  </div>
                ` : ''}
                ${profile.equipment.pedals ? `
                  <div class="equipment-display-item-back">
                    ${profile.equipment.pedalsImage ? `<img src="${normalizePhotoUrl(profile.equipment.pedalsImage)}" alt="Pedals" onerror="this.style.display='none'">` : ''}
                    <div class="equipment-display-label">🦶 Pedals</div>
                    <div class="equipment-display-value">${profile.equipment.pedals}</div>
                  </div>
                ` : ''}
                ${profile.equipment.shifter ? `
                  <div class="equipment-display-item-back">
                    ${profile.equipment.shifterImage ? `<img src="${normalizePhotoUrl(profile.equipment.shifterImage)}" alt="Shifter" onerror="this.style.display='none'">` : ''}
                    <div class="equipment-display-label">🔧 Shifter</div>
                    <div class="equipment-display-value">${profile.equipment.shifter}</div>
                  </div>
                ` : ''}
                ${profile.equipment.cockpit ? `
                  <div class="equipment-display-item-back">
                    ${profile.equipment.cockpitImage ? `<img src="${normalizePhotoUrl(profile.equipment.cockpitImage)}" alt="Cockpit" onerror="this.style.display='none'">` : ''}
                    <div class="equipment-display-label">🪑 Cockpit</div>
                    <div class="equipment-display-value">${profile.equipment.cockpit}</div>
                  </div>
                ` : ''}
                ${profile.equipment.seat ? `
                  <div class="equipment-display-item-back">
                    ${profile.equipment.seatImage ? `<img src="${normalizePhotoUrl(profile.equipment.seatImage)}" alt="Seat" onerror="this.style.display='none'">` : ''}
                    <div class="equipment-display-label">💺 Seat</div>
                    <div class="equipment-display-value">${profile.equipment.seat}</div>
                  </div>
                ` : ''}
                ${profile.equipment.other ? `
                  <div class="equipment-display-item-back full-width">
                    ${profile.equipment.otherImage ? `<img src="${normalizePhotoUrl(profile.equipment.otherImage)}" alt="Other" onerror="this.style.display='none'">` : ''}
                    <div class="equipment-display-label">🎧 Other</div>
                    <div class="equipment-display-value">${profile.equipment.other}</div>
                  </div>
                ` : ''}
              </div>
            ` : `
              <div class="equipment-empty-state">
                <p style="font-size: 48px; margin: 20px 0;">🎮</p>
                <p style="color: #999; font-size: 16px;">No equipment information available</p>
                <p style="color: #ccc; font-size: 14px; margin-top: 10px;">Driver can add equipment details in their profile</p>
              </div>
            `}
          </div>
        </div>
      `;

      frag.appendChild(card);
    });

    driversContent.appendChild(frag);
    document.getElementById('drivers-loading').style.display = 'none';
    document.getElementById('drivers-content').style.display = 'block';

  } catch (err) {
    console.error('loadDriverStats error', err);
    document.getElementById('drivers-loading').innerHTML = '<p style="color:red;">Error loading driver statistics</p>';
  }
}

