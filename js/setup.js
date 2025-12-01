/* =========================================================
   Round Setup & Cards
   ========================================================= */

/* -----------------------------
   Round Setup & Cards
   ----------------------------- */
async function loadTracksAndCars() {
  if (!CACHE.tracksMap || !CACHE.carsMap) {
    const [tracksSnap, carsSnap] = await Promise.all([
      window.firebaseGet(window.firebaseRef(window.firebaseDB, 'Tracks')),
      window.firebaseGet(window.firebaseRef(window.firebaseDB, 'Cars'))
    ]);
    const tracks = toArray(tracksSnap.val());
    const cars = toArray(carsSnap.val());
    CACHE.tracksMap = {}; tracks.forEach(r=> { if (r && r['Track_Combos']) CACHE.tracksMap[r['Track_Combos'].trim()] = r['Track_Image_URL'] || ''; });
    CACHE.carsMap = {}; cars.forEach(r=> { if (r && r['Car_Name']) CACHE.carsMap[r['Car_Name'].trim()] = r['Car_Image_URL'] || ''; });
  }

  const trackSelect = document.getElementById('trackLayout');
  const carSelect = document.getElementById('carName');
  if (trackSelect) {
    trackSelect.innerHTML = '<option value="">-- Select Track & Layout --</option>';
    Object.keys(CACHE.tracksMap).sort().forEach(t => {
      const opt = document.createElement('option'); opt.value = t; opt.textContent = t; trackSelect.appendChild(opt);
    });
  }
  if (carSelect) {
    carSelect.innerHTML = '<option value="">-- Select Car --</option>';
    Object.keys(CACHE.carsMap).sort().forEach(c => {
      const opt = document.createElement('option'); opt.value = c; opt.textContent = c; carSelect.appendChild(opt);
    });
  }
}

document.getElementById('roundSetupForm')?.addEventListener('submit', async function(e){
  e.preventDefault();
  const roundNumber = parseInt(document.getElementById('roundNumber').value);
  const trackLayout = document.getElementById('trackLayout').value;
  const carName = document.getElementById('carName').value;
  const season = parseInt(document.getElementById('season').value);
  const messageDiv = document.getElementById('setupMessage');
  if (!messageDiv) return;
  messageDiv.style.display = 'block'; messageDiv.textContent = '⏳ Saving round configuration...';

  try {
    const setupData = { Timestamp: new Date().toISOString(), Round_Number: roundNumber, 'Track-Layout': trackLayout, Car_Name: carName, Season: season };
    const setupRef = window.firebaseRef(window.firebaseDB, 'Form_responses_2');
    await window.firebasePush(setupRef, setupData);
    messageDiv.style.background = '#d4edda'; messageDiv.style.color = '#155724'; messageDiv.textContent = '✅ Round configuration saved!';
    document.getElementById('roundSetupForm').reset();
    CACHE.setupArray = null;
    await wait(350);
    loadRoundSetup();
    setTimeout(()=> messageDiv.style.display = 'none', 1800);
  } catch (err) {
    console.error('round setup save error', err);
    messageDiv.style.background = '#f8d7da'; messageDiv.style.color = '#721c24'; messageDiv.textContent = '❌ ' + err.message;
  }
});



async function loadRoundSetup() {
  try {
    const [setupSnap, roundSnap] = await Promise.all([
      window.firebaseGet(window.firebaseRef(window.firebaseDB, 'Form_responses_2')),
      window.firebaseGet(window.firebaseRef(window.firebaseDB, 'Round_Data'))
    ]);
    const setupArr = toArray(setupSnap.val());
    const roundArr = toArray(roundSnap.val());

    const unique = {};
    setupArr.forEach(row => {
      if (!row || !row.Round_Number) return;
      const key = `${row.Season}-${row.Round_Number}`;
      const time = new Date(row.Timestamp).getTime() || 0;
      if (!unique[key] || time > unique[key].time) unique[key] = { ...row, time };
    });
    const finalSetup = Object.values(unique).map(u=> ({ round: u.Round_Number, trackLayout: u['Track-Layout'], car: u.Car_Name, season: u.Season }));

    displayRoundCards(finalSetup, roundArr, CACHE.tracksMap || {}, CACHE.carsMap || {});
    document.getElementById('setup-cards-loading').style.display = 'none';
    document.getElementById('setup-cards-content').style.display = 'block';
    CACHE.setupArray = setupArr;
    populateSeasonFilter();

  } catch (err) {
    console.error('loadRoundSetup error', err);
  }
}

