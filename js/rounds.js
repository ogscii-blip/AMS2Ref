/* =========================================================
   Round Data (season-aware)
   ========================================================= */

/* -----------------------------
   Round Data (season-aware)
   ----------------------------- */
async function loadRoundData() {
  try {
    if (!CACHE.roundDataArray || !CACHE.tracksMap || !CACHE.carsMap || !CACHE.setupArray) {
      const [roundSnapshot, tracksSnapshot, carsSnapshot, setupSnapshot] = await Promise.all([
        window.firebaseGet(window.firebaseRef(window.firebaseDB, 'Round_Data')),
        window.firebaseGet(window.firebaseRef(window.firebaseDB, 'Tracks')),
        window.firebaseGet(window.firebaseRef(window.firebaseDB, 'Cars')),
        window.firebaseGet(window.firebaseRef(window.firebaseDB, 'Form_responses_2'))
      ]);
      CACHE.roundDataArray = toArray(roundSnapshot.val());
      const tracksArr = toArray(tracksSnapshot.val());
      const carsArr = toArray(carsSnapshot.val());
      CACHE.tracksMap = {};
      tracksArr.forEach(r=> { if (r && r['Track_Combos']) CACHE.tracksMap[r['Track_Combos'].trim()] = r['Track_Image_URL'] || ''; });
      CACHE.carsMap = {};
      carsArr.forEach(r=> { if (r && r['Car_Name']) CACHE.carsMap[r['Car_Name'].trim()] = r['Car_Image_URL'] || ''; });
      CACHE.setupArray = toArray(setupSnapshot.val());
    }

    const roundDataRaw = CACHE.roundDataArray;
    const tracksMap = CACHE.tracksMap;
    const carsMap = CACHE.carsMap;
    const setupArr = CACHE.setupArray;

    const roundSeasonSelect = document.getElementById('roundSeasonSelect');
    const selectedSeason = roundSeasonSelect?.value || '';

    let filtered = roundDataRaw.filter(r => r && r.Driver && r.Position);
    if (selectedSeason) filtered = filtered.filter(r => String(r.Season) == String(selectedSeason));

    const allData = filtered.map((row, idx) => {
      const ps1 = row['Purple_Sector_1'];
      const ps2 = row['Purple_Sector_2'];
      const ps3 = row['Purple_Sector_3'];
      const purpleSector1 = ps1 === 'TRUE' || ps1 === true || ps1 === 'true';
      const purpleSector2 = ps2 === 'TRUE' || ps2 === true || ps2 === 'true';
      const purpleSector3 = ps3 === 'TRUE' || ps3 === true || ps3 === 'true';

      return {
        round: row.Round,
        driver: row.Driver,
        sector1: row['Sector_1']?.toString() || '',
        sector2: row['Sector_2']?.toString() || '',
        sector3: row['Sector_3']?.toString() || '',
        totalTime: row['Total_Lap_Time']?.toString() || '',
        position: parseInt(row.Position) || 0,
        purpleSectors: parseInt(row['Purple_Sectors']) || 0,
        points: parseInt(row['Total_Points']) || 0,
        timestamp: idx,
        trackLayout: row['Track-Layout'] || '',
        car: row['Car_Name'] || '',
        season: row.Season,
        purpleSector1,
        purpleSector2,
        purpleSector3
      };
    });

    const roundGroups = {};
    allData.forEach(r => {
      const key = `S${r.season}-R${r.round}`;
      if (!roundGroups[key]) roundGroups[key] = { season: r.season, round: r.round, results: [] };
      roundGroups[key].results.push(r);
    });

    Object.keys(roundGroups).forEach(key => {
      const rs = roundGroups[key].results;
      const fastest1 = Math.min(...rs.map(r => parseFloat(r.sector1) || Infinity));
      const fastest2 = Math.min(...rs.map(r => parseFloat(r.sector2) || Infinity));
      const fastest3 = Math.min(...rs.map(r => parseFloat(r.sector3) || Infinity));
      rs.forEach(r => {
        r.purpleSector1 = parseFloat(r.sector1) === fastest1;
        r.purpleSector2 = parseFloat(r.sector2) === fastest2;
        r.purpleSector3 = parseFloat(r.sector3) === fastest3;
      });
      rs.sort((a,b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.purpleSectors !== a.purpleSectors) return b.purpleSectors - a.purpleSectors;
        return a.timestamp - b.timestamp;
      });
    });

    displayRoundData(roundGroups, tracksMap, carsMap);

  } catch (err) {
    console.error('loadRoundData error', err);
  }
}

function displayRoundData(roundGroups, tracksMap, carsMap) {
  const container = document.getElementById('round-content');
  container.innerHTML = '';
  const frag = document.createDocumentFragment();

  const fallbackTrackImage = 'https://static.vecteezy.com/system/resources/previews/015/114/628/non_2x/race-track-icon-isometric-road-circuit-vector.jpg';
  const fallbackCarImage = 'https://thumb.silhouette-ac.com/t/e9/e9f1eb16ae292f36be10def00d95ecbb_t.jpeg';

  const sortedKeys = Object.keys(roundGroups).sort((a,b) => {
    const [sa, ra] = a.replace('S','').split('-R').map(Number);
    const [sb, rb] = b.replace('S','').split('-R').map(Number);
    if (sa !== sb) return sb - sa;
    return rb - ra;
  });

  sortedKeys.forEach(key => {
    const g = roundGroups[key];
    const results = g.results;
    const season = g.season;
    const round = g.round;

    const trackLayout = results[0].trackLayout?.trim() || '';
    const car = results[0].car?.trim() || '';
    const trackImage = tracksMap[trackLayout] || fallbackTrackImage;
    const carImage = carsMap[car] || fallbackCarImage;
    const summary = results.map(r=> `${r.driver} - P${r.position} - ${r.points}pts`).join(' | ');

    const roundDiv = document.createElement('div');
    roundDiv.className = 'round-group';

    const header = document.createElement('div');
    header.className = 'round-header';
    header.innerHTML = `
      <div class="round-info-column">
        <h3>Round ${round}</h3>
        <p class="season-number">${season}</p>
        <div class="round-summary">${summary}</div>
      </div>
      <div class="round-banner-column">
        <div class="round-banner-icon">
          <img src="${trackImage}" alt="${trackLayout}" onerror="this.src='${fallbackTrackImage}'">
          <p>${trackLayout}</p>
        </div>
      </div>
      <div class="round-banner-column">
        <div class="round-banner-icon">
          <img src="${carImage}" alt="${car}" onerror="this.src='${fallbackCarImage}'">
          <p>${car}</p>
        </div>
      </div>
      <span class="toggle-icon" id="toggle-${key}">▼</span>
    `;
    header.addEventListener('click', ()=> toggleRound(key));

    const details = document.createElement('div');
    details.className = 'round-details';
    details.id = `details-${key}`;

    const table = document.createElement('table');
    table.className = 'leaderboard-table';
    table.innerHTML = `
      <thead>
        <tr>
          <th>Driver</th><th>Sector 1</th><th>Sector 2</th><th>Sector 3</th>
          <th>Total Time</th><th>Gap</th><th>Position</th><th>Purple Sectors</th><th>Points</th>
        </tr>
      </thead>
      <tbody></tbody>
    `;
    const tbody = table.querySelector('tbody');

    const winnerTime = results.length > 0 ? timeToSeconds(results[0].totalTime) : 0;

    results.forEach(row => {
      const tr = document.createElement('tr');
      if (row.position === 1) tr.classList.add('position-1');
      if (row.position === 2) tr.classList.add('position-2');
      if (row.position === 3) tr.classList.add('position-3');

      const sector1Html = row.purpleSector1 ? `<span class="purple-sector">${formatTime(row.sector1)}</span>` : formatTime(row.sector1);
      const sector2Html = row.purpleSector2 ? `<span class="purple-sector">${formatTime(row.sector2)}</span>` : formatTime(row.sector2);
      const sector3Html = row.purpleSector3 ? `<span class="purple-sector">${formatTime(row.sector3)}</span>` : formatTime(row.sector3);

      const formattedName = getFormattedDriverName(row.driver);

      let gapHtml = '';
      if (row.position === 1) {
        gapHtml = '<span style="color:#2ecc71;font-weight:bold;">Interval</span>';
      } else {
        const driverTime = timeToSeconds(row.totalTime);
        const gap = driverTime - winnerTime;
        if (gap > 0 && isFinite(gap)) {
          gapHtml = `<span style="color:#e74c3c;">+${gap.toFixed(3)}s</span>`;
        } else {
          gapHtml = '-';
        }
      }

      tr.innerHTML = `
        <td data-label="Driver"><strong class="driver-link-round" data-driver="${row.driver}" style="cursor:pointer;color:#667eea">${formattedName}</strong></td>
        <td data-label="Sector 1">${sector1Html}</td>
        <td data-label="Sector 2">${sector2Html}</td>
        <td data-label="Sector 3">${sector3Html}</td>
        <td data-label="Total Time"><strong>${formatTime(row.totalTime)}</strong></td>
        <td data-label="Gap">${gapHtml}</td>
        <td data-label="Position">${row.position}</td>
        <td data-label="Purple Sectors">${row.purpleSectors}</td>
        <td data-label="Points"><strong>${row.points}</strong></td>
      `;
      tbody.appendChild(tr);
    });

    details.appendChild(table);

    const raceAnimationHtml = createRaceAnimation(key, results);
    if (raceAnimationHtml) {
      const raceDiv = document.createElement('div');
      raceDiv.innerHTML = raceAnimationHtml;
      details.appendChild(raceDiv.firstElementChild);
    }

    roundDiv.appendChild(header);
    roundDiv.appendChild(details);
    frag.appendChild(roundDiv);
  });

  container.appendChild(frag);

  container.querySelectorAll('.driver-link-round').forEach(link => {
    link.addEventListener('click', function() {
      goToDriverProfile(this.getAttribute('data-driver'));
    });
  });

  if (sortedKeys.length > 0) {
    setTimeout(() => {
      const latestKey = sortedKeys[0];
      const d = document.getElementById(`details-${latestKey}`);
      const i = document.getElementById(`toggle-${latestKey}`);
      if (d) d.classList.add('expanded');
      if (i) i.classList.add('expanded');
    }, 150);
  }

  document.getElementById('round-loading').style.display = 'none';
  document.getElementById('round-content').style.display = 'block';
}

