/* =========================================================
   Core: Leaderboard (season-aware)
   ========================================================= */

/* -----------------------------
   Core: Leaderboard (season-aware)
   ----------------------------- */
async function loadLeaderboard() {
  try {
    const seasonSelect = document.getElementById('seasonSelect');
    const selectedSeason = seasonSelect?.value || '';

    const [roundDataSnapshot, rawLapsSnapshot] = await Promise.all([
      window.firebaseGet(window.firebaseRef(window.firebaseDB, 'Round_Data')),
      window.firebaseGet(window.firebaseRef(window.firebaseDB, 'Form_responses_1'))
    ]);
    
    const roundData = toArray(roundDataSnapshot.val()).filter(r => r && r.Driver);
    const rawLapsData = toArray(rawLapsSnapshot.val()).filter(r => r && r.Driver);

    const filteredRoundData = selectedSeason 
      ? roundData.filter(r => String(r.Season) == String(selectedSeason))
      : roundData;

    const driverMap = {};
    
    filteredRoundData.forEach(row => {
      const name = row.Driver;
      if (!driverMap[name]) {
        driverMap[name] = { driver: name, points: 0, purpleSectors: 0, wins: 0 };
      }
      driverMap[name].points += parseInt(row['Total_Points']) || 0;
      driverMap[name].purpleSectors += parseInt(row['Purple_Sectors']) || 0;
      if (parseInt(row.Position) === 1) driverMap[name].wins += 1;
    });

    const filteredLaps = selectedSeason 
      ? rawLapsData.filter(r => String(r.Season) == String(selectedSeason))
      : rawLapsData;
    
    filteredLaps.forEach(lap => {
      if (!driverMap[lap.Driver]) {
        driverMap[lap.Driver] = { driver: lap.Driver, points: 0, purpleSectors: 0, wins: 0 };
      }
    });

    const driversArr = Object.values(driverMap);
    driversArr.sort((a,b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.wins !== a.wins) return b.wins - a.wins;
      return b.purpleSectors - a.purpleSectors;
    });

    const displayData = driversArr.map((d,i)=>({
      position: i+1,
      driver: d.driver,
      points: d.points,
      purpleSectors: d.purpleSectors,
      wins: d.wins
    }));

    displayLeaderboard(displayData);

    document.getElementById('totalDrivers').textContent = displayData.length;
    const totalPoints = displayData.reduce((s,d)=>s + (d.points||0), 0);
    document.getElementById('totalPoints').textContent = totalPoints;

    const roundSubmissions = {};
    filteredLaps.forEach(lap => {
      const key = `S${lap.Season}-R${lap.Round}`;
      if (!roundSubmissions[key]) roundSubmissions[key] = new Set();
      roundSubmissions[key].add(lap.Driver);
    });
    
    const completedRounds = Object.values(roundSubmissions).filter(drivers => drivers.size >= 3).length;
    document.getElementById('totalRounds').textContent = completedRounds;

    createPointsProgressionGraph(filteredRoundData, selectedSeason);

    populateSeasonFilter();

  } catch (err) {
    console.error('loadLeaderboard error', err);
  }
}



function displayLeaderboard(data) {
  const tbody = document.getElementById('leaderboard-body');
  tbody.innerHTML = '';
  const frag = document.createDocumentFragment();

  data.forEach((row,index) => {
    const tr = document.createElement('tr');
    if (index === 0) tr.classList.add('position-1');
    if (index === 1) tr.classList.add('position-2');
    if (index === 2) tr.classList.add('position-3');

    const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '';

    const formattedName = getFormattedDriverName(row.driver);

    tr.innerHTML = `
      <td data-label="Position"><span class="medal">${medal}</span>${row.position}</td>
      <td data-label="Driver"><strong style="cursor:pointer;color:#667eea;" class="driver-link" data-driver="${row.driver}">${formattedName}</strong></td>
      <td data-label="Points"><strong>${row.points}</strong></td>
      <td data-label="Purple Sectors">${row.purpleSectors}</td>
      <td data-label="Wins">${row.wins}</td>
    `;
    frag.appendChild(tr);
  });

  tbody.appendChild(frag);

  tbody.querySelectorAll('.driver-link').forEach(link=>{
    link.addEventListener('click', function(e){
      const driverName = this.getAttribute('data-driver');
      goToDriverCurrentRound(driverName);
    });
  });

  document.getElementById('leaderboard-loading').style.display = 'none';
  document.getElementById('leaderboard-content').style.display = 'block';
}

