/* =========================================================
   UI: Tabs & Navigation
   ========================================================= */

/* -----------------------------
   UI: Tabs & Navigation
   ----------------------------- */
function safeAddActiveButton(target) {
  // highlight clicked button - fallback when event not available
  if (!target) {
    // try to infer from active tab
    const activeTabName = document.querySelector('.tab-content.active')?.id;
    const btn = document.querySelector(`.tab-button[onclick*="${activeTabName}"]`);
    if (btn) btn.classList.add('active');
    return;
  }
  target.classList.add('active');
}

function showTab(tabName, sourceButton = null) {
  // Hide all tabs
  document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
  document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));

  const tabEl = document.getElementById(tabName);
  if (!tabEl) return;
  tabEl.classList.add('active');

  safeAddActiveButton(sourceButton || document.activeElement);

  // Tab-specific loads
  if (tabName === 'overall') {
    loadLeaderboard();
  } else if (tabName === 'round') {
    preSelectCurrentSeasonInRoundResults();
    loadRoundData();
  } else if (tabName === 'drivers') {
    loadDriverStats();
  } else if (tabName === 'profile') {
    loadProfile();
  } else if (tabName === 'setup') {
    loadRoundSetup();
  } else if (tabName === 'admin') {
    loadAdminTools();
  }
}

// FIXED: Helper to pre-select current season when opening Round Results
async function preSelectCurrentSeasonInRoundResults() {
  const roundDropdown = document.getElementById('roundSeasonSelect');
  if (!roundDropdown) return;
  
  // If roundDropdown already has a value, keep it (user may have set it)
  if (roundDropdown.value) return;
  
  // Find the latest season that has actual lap submissions
  const rawLapsSnapshot = await window.firebaseGet(window.firebaseRef(window.firebaseDB, 'Form_responses_1'));
  const rawLapsData = toArray(rawLapsSnapshot.val()).filter(r => r && r.Driver && r.Season && r.Round);
  
  if (rawLapsData.length === 0) {
    // No laps submitted yet, don't pre-select any season
    return;
  }
  
  // Get unique seasons from submitted laps and sort descending
  const seasonsWithLaps = [...new Set(rawLapsData.map(lap => lap.Season))].filter(s=>s).sort((a,b)=>b-a);
  const currentSeason = seasonsWithLaps[0] || '';
  
  if (currentSeason) roundDropdown.value = currentSeason;
}

