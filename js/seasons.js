/* =========================================================
   Populate Season Dropdown Helper
   ========================================================= */

/* -----------------------------
   Populate season dropdown helper
   ----------------------------- */
async function populateSeasonFilter() {
  try {
    if (!CACHE.setupArray) {
      const setupRef = window.firebaseRef(window.firebaseDB, 'Form_responses_2');
      const snap = await window.firebaseGet(setupRef);
      CACHE.setupArray = toArray(snap.val());
    }
    const setupData = CACHE.setupArray || [];

    const seasons = [...new Set(setupData.map(s => s.Season))].filter(s=>s).sort((a,b)=>a-b);
    const seasonSelect = document.getElementById('seasonSelect');
    const roundSeasonSelect = document.getElementById('roundSeasonSelect');
    const setupSeasonSelect = document.getElementById('setupSeasonSelect');

    function fill(selectEl) {
      if (!selectEl) return;
      const prev = selectEl.value || '';
      selectEl.innerHTML = '<option value="">All Seasons</option>';
      seasons.forEach(season=>{
        const opt = document.createElement('option');
        opt.value = season;
        opt.textContent = `Season ${season}`;
        selectEl.appendChild(opt);
      });
      selectEl.value = prev;
    }

    fill(seasonSelect);
    fill(roundSeasonSelect);
    fill(setupSeasonSelect);

  } catch (err) {
    console.error('populateSeasonFilter error', err);
  }
}

