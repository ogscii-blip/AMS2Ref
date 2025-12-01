/* =========================================================
   Lap Time Submission
   ========================================================= */

/* -----------------------------
   Lap Time Submission (with form reset!)
   ----------------------------- */
function disableButton(btn, disabled) {
  if (!btn) return;
  btn.disabled = disabled;
  btn.style.opacity = disabled ? '0.5' : '1';
  btn.style.cursor = disabled ? 'not-allowed' : 'pointer';
}

document.getElementById('lapTimeForm')?.addEventListener('submit', async function(e){
  e.preventDefault();
  if (!currentUser) { alert('⚠️ Please sign in first'); return; }

  const submitBtn = this.querySelector('button[type="submit"]');
  const messageDiv = document.getElementById('lapTimeMessage');
  disableButton(submitBtn, true);
  messageDiv.style.display='block'; messageDiv.style.background='#d1ecf1'; messageDiv.style.color='#0c5460'; messageDiv.textContent='⏳ Submitting...';

  try {
    const s1sec = document.getElementById('sector1-sec').value.trim();
    const s1ms = document.getElementById('sector1-ms').value.trim();
    const s2sec = document.getElementById('sector2-sec').value.trim();
    const s2ms = document.getElementById('sector2-ms').value.trim();
    const s3sec = document.getElementById('sector3-sec').value.trim();
    const s3ms = document.getElementById('sector3-ms').value.trim();

    if (!s1sec || !s1ms || !s2sec || !s2ms || !s3sec || !s3ms) throw new Error('Please fill all sector time fields');

    const s1 = parseFloat(s1sec) + parseFloat(s1ms)/1000;
    const s2 = parseFloat(s2sec) + parseFloat(s2ms)/1000;
    const s3 = parseFloat(s3sec) + parseFloat(s3ms)/1000;
    const totalTime = s1 + s2 + s3;

    const roundNumber = parseInt(document.getElementById('roundNumber2').value);
    const seasonNumber = parseInt(document.getElementById('seasonNumber').value);
    if (!roundNumber || !seasonNumber) throw new Error('Please select both round and season');

    if (!CACHE.setupArray) {
      const setupSnap = await window.firebaseGet(window.firebaseRef(window.firebaseDB, 'Form_responses_2'));
      CACHE.setupArray = toArray(setupSnap.val());
    }
    const roundSetup = CACHE.setupArray.find(s => s && Number(s.Round_Number) == roundNumber && Number(s.Season) == seasonNumber);
    if (!roundSetup) throw new Error(`Round ${roundNumber} Season ${seasonNumber} not configured!`);

    const lapTimeData = {
      Timestamp: new Date().toISOString(),
      Driver: currentUser.name,
      Season: seasonNumber,
      Round: roundNumber,
      Sector_1: s1,
      Sector_2: s2,
      Sector_3: s3,
      Total_Lap_Time: totalTime,
      'Track-Layout': roundSetup['Track-Layout'],
      Car_Name: roundSetup.Car_Name
    };

    await window.firebasePush(window.firebaseRef(window.firebaseDB, 'Form_responses_1'), lapTimeData);
    messageDiv.style.background='#d4edda'; messageDiv.style.color='#155724'; messageDiv.textContent='✅ Lap time submitted! Server is calculating...';

    document.getElementById('lapTimeForm').reset();

    CACHE.roundDataArray = null;
    await wait(2000);
    loadLeaderboard();
    loadRoundData();

    setTimeout(()=> { messageDiv.style.display='none'; }, 4500);
  } catch (err) {
    console.error('lap submit err', err);
    messageDiv.style.background='#f8d7da'; messageDiv.style.color='#721c24'; messageDiv.textContent='❌ ' + err.message;
  } finally {
    disableButton(submitBtn, false);
  }
});

