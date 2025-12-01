/* =========================================================
   Admin Tools - Lap Time Management
   ========================================================= */

/* -----------------------------
   Admin Tools - Lap Time Management
   ----------------------------- */
let ADMIN_USERNAME = null;

function isAdmin() {
  if (!currentUser || !ADMIN_USERNAME) return false;
  
  // Support wildcard: "*" means all users are admins
  if (ADMIN_USERNAME === '*') return true;
  
  // Support comma-separated list: "Olaf,Alex,Ben"
  const adminList = ADMIN_USERNAME.split(',').map(name => name.trim());
  return adminList.includes(currentUser.name);
}

function updateAdminUsername(configMap) {
  ADMIN_USERNAME = configMap['admin_username'] || null;
  console.log('Admin username set to:', ADMIN_USERNAME);
  console.log('Current user:', currentUser);
  console.log('Is admin?', isAdmin());
  updateAdminTabVisibility();
}

function updateAdminTabVisibility() {
  const adminTab = document.querySelector('.tab-button[onclick*="admin"]');
  if (adminTab) {
    adminTab.style.display = isAdmin() ? '' : 'none';
  }
}

/*
async function loadAdminTools() {
  if (!isAdmin()) {
    document.getElementById('admin-content').innerHTML = '<p style="text-align:center;padding:40px;color:#666;">Access Denied</p>';
    return;
  }

  try {
    const lapsSnapshot = await window.firebaseGet(window.firebaseRef(window.firebaseDB, 'Form_responses_1'));
    const lapsData = toArray(lapsSnapshot.val());
    
    const lapsWithKeys = [];
    const lapsObject = lapsSnapshot.val();
    if (lapsObject && typeof lapsObject === 'object') {
      Object.keys(lapsObject).forEach(key => {
        if (lapsObject[key]) {
          lapsWithKeys.push({ ...lapsObject[key], _firebaseKey: key });
        }
      });
    }

    displayAdminLapTimes(lapsWithKeys);

  } catch (err) {
    console.error('loadAdminTools error', err);
  }
}


// Store current filter state globally
let currentAdminFilters = {
  driver: '',
  season: '',
  round: ''
};
*/

function displayAdminLapTimes(lapsData) {
  const container = document.getElementById('admin-lap-times-table');
  if (!container) return;

  const drivers = [...new Set(lapsData.map(l => l.Driver).filter(Boolean))].sort();
  const seasons = [...new Set(lapsData.map(l => l.Season).filter(Boolean))].sort((a,b) => b-a);
  const rounds = [...new Set(lapsData.map(l => l.Round).filter(Boolean))].sort((a,b) => a-b);

  const filterHtml = `
    <div class="admin-filters">
      <select id="adminFilterDriver" class="admin-filter-select" onchange="filterAdminLaps()">
        <option value="">All Drivers</option>
        ${drivers.map(d => `<option value="${d}" ${currentAdminFilters.driver === d ? 'selected' : ''}>${d}</option>`).join('')}
      </select>
      <select id="adminFilterSeason" class="admin-filter-select" onchange="filterAdminLaps()">
        <option value="">All Seasons</option>
        ${seasons.map(s => `<option value="${s}" ${String(currentAdminFilters.season) === String(s) ? 'selected' : ''}>Season ${s}</option>`).join('')}
      </select>
      <select id="adminFilterRound" class="admin-filter-select" onchange="filterAdminLaps()">
        <option value="">All Rounds</option>
        ${rounds.map(r => `<option value="${r}" ${String(currentAdminFilters.round) === String(r) ? 'selected' : ''}>Round ${r}</option>`).join('')}
      </select>
      <button onclick="clearAdminFilters()" class="admin-filter-btn">Clear Filters</button>
    </div>
  `;

  lapsData.sort((a, b) => {
    const timeA = new Date(a.Timestamp).getTime();
    const timeB = new Date(b.Timestamp).getTime();
    return timeB - timeA;
  });

  const tableHtml = `
    <table class="admin-table">
      <thead>
        <tr>
          <th>Timestamp</th>
          <th>Driver</th>
          <th>Season</th>
          <th>Round</th>
          <th>Sector 1</th>
          <th>Sector 2</th>
          <th>Sector 3</th>
          <th onclick="sortAdminByTotalTime()" style="cursor:pointer;" title="Click to sort">
            Total Time <span id="sortIndicator">⇅</span>
          </th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody id="adminLapsTableBody">
        ${lapsData.map(lap => createAdminLapRow(lap)).join('')}
      </tbody>
    </table>
  `;

  container.innerHTML = filterHtml + tableHtml;

  window.adminLapsData = lapsData;
  
  // Reapply filters if they exist
  if (currentAdminFilters.driver || currentAdminFilters.season || currentAdminFilters.round) {
    filterAdminLaps();
  }
}



function createAdminLapRow(lap) {
  const timestamp = new Date(lap.Timestamp).toLocaleString();
  const s1 = formatTime(lap.Sector_1);
  const s2 = formatTime(lap.Sector_2);
  const s3 = formatTime(lap.Sector_3);
  const total = formatTime(lap.Total_Lap_Time);

  return `
    <tr data-key="${lap._firebaseKey}">
      <td data-label="Timestamp">${timestamp}</td>
      <td data-label="Driver">${lap.Driver}</td>
      <td data-label="Season">${lap.Season}</td>
      <td data-label="Round">${lap.Round}</td>
      <td data-label="Sector 1">${s1}</td>
      <td data-label="Sector 2">${s2}</td>
      <td data-label="Sector 3">${s3}</td>
      <td data-label="Total Time">${total}</td>
      <td data-label="Actions">
        <button onclick="editAdminLap('${lap._firebaseKey}')" class="admin-btn-edit">✏️ Edit</button>
        <button onclick="deleteAdminLap('${lap._firebaseKey}')" class="admin-btn-delete">🗑️ Delete</button>
      </td>
    </tr>
  `;
}

function filterAdminLaps() {
  const driverFilter = document.getElementById('adminFilterDriver')?.value || '';
  const seasonFilter = document.getElementById('adminFilterSeason')?.value || '';
  const roundFilter = document.getElementById('adminFilterRound')?.value || '';

  // Store current filter state (as strings for consistent comparison)
  currentAdminFilters = {
    driver: driverFilter,
    season: seasonFilter,
    round: roundFilter
  };

  let filtered = window.adminLapsData || [];

  if (driverFilter) filtered = filtered.filter(l => l.Driver === driverFilter);
  if (seasonFilter) filtered = filtered.filter(l => String(l.Season) === String(seasonFilter));
  if (roundFilter) filtered = filtered.filter(l => String(l.Round) === String(roundFilter));

  const tbody = document.getElementById('adminLapsTableBody');
  if (tbody) {
    tbody.innerHTML = filtered.map(lap => createAdminLapRow(lap)).join('');
  }
}


function clearAdminFilters() {
  // Clear stored filters
  currentAdminFilters = {
    driver: '',
    season: '',
    round: ''
  };
  
  const driverFilter = document.getElementById('adminFilterDriver');
  const seasonFilter = document.getElementById('adminFilterSeason');
  const roundFilter = document.getElementById('adminFilterRound');
  
  if (driverFilter) driverFilter.value = '';
  if (seasonFilter) seasonFilter.value = '';
  if (roundFilter) roundFilter.value = '';
  
  filterAdminLaps();
}


// Add sorting functionality
//let adminSortAscending = true;

function sortAdminByTotalTime() {
  const tbody = document.getElementById('adminLapsTableBody');
  if (!tbody) return;

  // Get current rows
  const rows = Array.from(tbody.querySelectorAll('tr'));
  
  // Sort by total time
  rows.sort((a, b) => {
    const keyA = a.getAttribute('data-key');
    const keyB = b.getAttribute('data-key');
    
    const lapA = window.adminLapsData.find(l => l._firebaseKey === keyA);
    const lapB = window.adminLapsData.find(l => l._firebaseKey === keyB);
    
    if (!lapA || !lapB) return 0;
    
    const timeA = parseFloat(lapA.Total_Lap_Time) || 0;
    const timeB = parseFloat(lapB.Total_Lap_Time) || 0;
    
    return adminSortAscending ? timeA - timeB : timeB - timeA;
  });

  // Toggle sort direction for next click
  adminSortAscending = !adminSortAscending;
  
  // Update indicator
  const indicator = document.getElementById('sortIndicator');
  if (indicator) {
    indicator.textContent = adminSortAscending ? '↓' : '↑';
  }

  // Clear and re-append sorted rows
  tbody.innerHTML = '';
  rows.forEach(row => tbody.appendChild(row));
}


async function editAdminLap(firebaseKey) {
  const lap = window.adminLapsData.find(l => l._firebaseKey === firebaseKey);
  if (!lap) return;

  const modal = document.createElement('div');
  modal.className = 'admin-modal';
  modal.innerHTML = `
    <div class="admin-modal-content">
      <div class="admin-modal-header">
        <h3>Edit Lap Time</h3>
        <button onclick="closeAdminModal()" class="admin-modal-close">×</button>
      </div>
      <div class="admin-modal-body">
        <p><strong>Driver:</strong> ${lap.Driver}</p>
        <p><strong>Season:</strong> ${lap.Season} | <strong>Round:</strong> ${lap.Round}</p>
        <p><strong>Original Timestamp:</strong> ${new Date(lap.Timestamp).toLocaleString()}</p>
        
        <div class="admin-edit-form">
          <div class="admin-form-group">
            <label>Sector 1 (seconds):</label>
            <input type="number" step="0.001" id="editS1" value="${lap.Sector_1}" class="admin-input">
          </div>
          <div class="admin-form-group">
            <label>Sector 2 (seconds):</label>
            <input type="number" step="0.001" id="editS2" value="${lap.Sector_2}" class="admin-input">
          </div>
          <div class="admin-form-group">
            <label>Sector 3 (seconds):</label>
            <input type="number" step="0.001" id="editS3" value="${lap.Sector_3}" class="admin-input">
          </div>
        </div>
      </div>
      <div class="admin-modal-footer">
        <button onclick="saveAdminLapEdit('${firebaseKey}')" class="admin-btn-save">💾 Save Changes</button>
        <button onclick="closeAdminModal()" class="admin-btn-cancel">Cancel</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  setTimeout(() => modal.classList.add('show'), 10);
}

async function saveAdminLapEdit(firebaseKey) {
  try {
    const s1 = parseFloat(document.getElementById('editS1').value);
    const s2 = parseFloat(document.getElementById('editS2').value);
    const s3 = parseFloat(document.getElementById('editS3').value);

    if (!isFinite(s1) || !isFinite(s2) || !isFinite(s3)) {
      alert('❌ Invalid sector times');
      return;
    }

    const totalTime = s1 + s2 + s3;

    const lap = window.adminLapsData.find(l => l._firebaseKey === firebaseKey);
    
    const lapRef = window.firebaseRef(window.firebaseDB, `Form_responses_1/${firebaseKey}`);
    await window.firebaseSet(lapRef, {
      ...lap,
      Sector_1: s1,
      Sector_2: s2,
      Sector_3: s3,
      Total_Lap_Time: totalTime,
      Last_Modified: new Date().toISOString(),
      Modified_By: currentUser.name
    });

    //alert('✅ Lap time updated successfully!');
    closeAdminModal();
    
    // Reload admin tools but preserve filters
    await loadAdminTools();
    
    CACHE.roundDataArray = null;

  } catch (err) {
    console.error('saveAdminLapEdit error', err);
    alert('❌ Error saving: ' + err.message);
  }
}

async function deleteAdminLap(firebaseKey) {
  const lap = window.adminLapsData.find(l => l._firebaseKey === firebaseKey);
  if (!lap) return;

  const confirmMsg = `⚠️ Delete this lap time?\n\nDriver: ${lap.Driver}\nSeason ${lap.Season} - Round ${lap.Round}\nTime: ${formatTime(lap.Total_Lap_Time)}\n\nThis cannot be undone!`;
  
  if (!confirm(confirmMsg)) return;

  try {
    const lapRef = window.firebaseRef(window.firebaseDB, `Form_responses_1/${firebaseKey}`);
    await window.firebaseSet(lapRef, null);

    alert('✅ Lap time deleted successfully!');
    
    // Reload admin tools but preserve filters
    await loadAdminTools();
    
    CACHE.roundDataArray = null;

  } catch (err) {
    console.error('deleteAdminLap error', err);
    alert('❌ Error deleting: ' + err.message);
  }
}
function closeAdminModal() {
  const modal = document.querySelector('.admin-modal');
  if (modal) {
    modal.classList.remove('show');
    setTimeout(() => modal.remove(), 300);
  }
}

// Load individual email toggle states
async function loadEmailToggleStates() {
  if (!isAdmin()) return;
  
  try {
    const configRef = window.firebaseRef(window.firebaseDB, 'Config');
    const snapshot = await window.firebaseGet(configRef);
    const config = snapshot.val();
    
    if (!config) return;
    
    // Set toggle states (default to true if not set)
    const newRoundEnabled = config.email_newRound_enabled !== false;
    const fastestLapEnabled = config.email_fastestLap_enabled !== false;
    const weeklyResultsEnabled = config.email_weeklyResults_enabled !== false;
    
    const newRoundToggle = document.getElementById('emailToggle_newRound');
    const fastestLapToggle = document.getElementById('emailToggle_fastestLap');
    const weeklyResultsToggle = document.getElementById('emailToggle_weeklyResults');
    const masterToggle = document.getElementById('emailToggleMaster');
    
    if (newRoundToggle) newRoundToggle.checked = newRoundEnabled;
    if (fastestLapToggle) fastestLapToggle.checked = fastestLapEnabled;
    if (weeklyResultsToggle) weeklyResultsToggle.checked = weeklyResultsEnabled;
    
    // Update master toggle based on individual states
    const allEnabled = newRoundEnabled && fastestLapEnabled && weeklyResultsEnabled;
    if (masterToggle) masterToggle.checked = allEnabled;
    
    updateEmailTypeStatus('newRound', newRoundEnabled);
    updateEmailTypeStatus('fastestLap', fastestLapEnabled);
    updateEmailTypeStatus('weeklyResults', weeklyResultsEnabled);
    
  } catch (error) {
    console.error('Error loading email toggle states:', error);
  }
}

// Toggle specific email type
async function toggleEmailType(emailType) {
  if (!isAdmin()) {
    alert('❌ Only admins can change this setting');
    return;
  }
  
  const toggleSwitch = document.getElementById(`emailToggle_${emailType}`);
  const enabled = toggleSwitch.checked;
  
  try {
    const configRef = window.firebaseRef(window.firebaseDB, `Config/email_${emailType}_enabled`);
    await window.firebaseSet(configRef, enabled);
    
    updateEmailTypeStatus(emailType, enabled);
    
    // Show confirmation
    showEmailToggleMessage(emailType, enabled);
    
    console.log(`${emailType} notifications ${enabled ? 'ENABLED' : 'PAUSED'}`);
    
  } catch (error) {
    console.error(`Error toggling ${emailType} notifications:`, error);
    alert('❌ Error updating setting: ' + error.message);
    
    // Revert toggle on error
    toggleSwitch.checked = !enabled;
  }
}

// Update visual status for specific email type
function updateEmailTypeStatus(emailType, enabled) {
  const statusBadge = document.getElementById(`emailStatus_${emailType}`);
  if (statusBadge) {
    statusBadge.textContent = enabled ? 'ACTIVE' : 'PAUSED';
    statusBadge.className = enabled ? 'admin-email-status-badge active' : 'admin-email-status-badge paused';
  }
}

// Show toggle confirmation message
function showEmailToggleMessage(emailType, enabled) {
  const statusDiv = document.getElementById('emailToggleGlobalStatus');
  if (!statusDiv) return;
  
  const typeNames = {
    newRound: 'New Round',
    fastestLap: 'Fastest Lap',
    weeklyResults: 'Weekly Results'
  };
  
  statusDiv.style.display = 'block';
  statusDiv.style.background = enabled ? '#d4edda' : '#fff3cd';
  statusDiv.style.color = enabled ? '#155724' : '#856404';
  statusDiv.textContent = enabled 
    ? `✅ ${typeNames[emailType]} notifications are now ENABLED` 
    : `⏸️ ${typeNames[emailType]} notifications are now PAUSED`;
  
  setTimeout(() => {
    statusDiv.style.display = 'none';
  }, 3000);
}

// Master toggle - enables/disables all email types at once
async function toggleAllEmails() {
  if (!isAdmin()) {
    alert('❌ Only admins can change this setting');
    return;
  }
  
  const masterToggle = document.getElementById('emailToggleMaster');
  const enabled = masterToggle.checked;
  
  try {
    const configRef = window.firebaseRef(window.firebaseDB, 'Config');
    
    // Get current config
    const snapshot = await window.firebaseGet(configRef);
    const currentConfig = snapshot.val() || {};
    
    // Update email toggles while preserving other config
    await window.firebaseSet(configRef, {
      ...currentConfig,
      email_newRound_enabled: enabled,
      email_fastestLap_enabled: enabled,
      email_weeklyResults_enabled: enabled
    });
    
    // Update all individual toggles
    const newRoundToggle = document.getElementById('emailToggle_newRound');
    const fastestLapToggle = document.getElementById('emailToggle_fastestLap');
    const weeklyResultsToggle = document.getElementById('emailToggle_weeklyResults');
    
    if (newRoundToggle) newRoundToggle.checked = enabled;
    if (fastestLapToggle) fastestLapToggle.checked = enabled;
    if (weeklyResultsToggle) weeklyResultsToggle.checked = enabled;
    
    updateEmailTypeStatus('newRound', enabled);
    updateEmailTypeStatus('fastestLap', enabled);
    updateEmailTypeStatus('weeklyResults', enabled);
    
    const statusDiv = document.getElementById('emailToggleGlobalStatus');
    if (statusDiv) {
      statusDiv.style.display = 'block';
      statusDiv.style.background = enabled ? '#d4edda' : '#fff3cd';
      statusDiv.style.color = enabled ? '#155724' : '#856404';
      statusDiv.textContent = enabled 
        ? '✅ ALL email notifications are now ENABLED' 
        : '⏸️ ALL email notifications are now PAUSED';
      
      setTimeout(() => {
        statusDiv.style.display = 'none';
      }, 3000);
    }
    
    console.log(`All email notifications ${enabled ? 'ENABLED' : 'PAUSED'}`);
    
  } catch (error) {
    console.error('Error toggling all email notifications:', error);
    alert('❌ Error updating settings: ' + error.message);
    masterToggle.checked = !enabled;
  }
}

// ============================================================================
// STEP 2: UPDATE YOUR displayAdminInterface() FUNCTION
// Find this function and update it with the email toggle section
// ============================================================================


function displayAdminInterface(lapsData, tracksData, carsData, emailLogsData) {
  const container = document.getElementById('admin-lap-times-table');
  if (!container) return;

  // Admin tabs navigation
  const tabsHtml = `
    <div class="admin-tabs">
      <button class="admin-tab-button ${currentAdminTab === 'time-submissions' ? 'active' : ''}" onclick="switchAdminTab('time-submissions')">
        ⏱️ Time Submissions
      </button>
      <button class="admin-tab-button ${currentAdminTab === 'tracks-config' ? 'active' : ''}" onclick="switchAdminTab('tracks-config')">
        🏁 Tracks Config
      </button>
      <button class="admin-tab-button ${currentAdminTab === 'cars-config' ? 'active' : ''}" onclick="switchAdminTab('cars-config')">
        🏎️ Cars Config
      </button>
      <button class="admin-tab-button ${currentAdminTab === 'email-logs' ? 'active' : ''}" onclick="switchAdminTab('email-logs')">
        📧 Email Logs
      </button>
    </div>
  `;

  // REMOVED emailToggleHtml from here - it's now in generateEmailLogsContent()

  let contentHtml = '';

  if (currentAdminTab === 'time-submissions') {
    contentHtml = generateTimeSubmissionsContent(lapsData);
  } else if (currentAdminTab === 'tracks-config') {
    contentHtml = generateTracksConfigContent(tracksData);
  } else if (currentAdminTab === 'cars-config') {
    contentHtml = generateCarsConfigContent(carsData);
  } else if (currentAdminTab === 'email-logs') {
    contentHtml = generateEmailLogsContent(emailLogsData);
  }

  // CHANGED: No longer including emailToggleHtml here
  container.innerHTML = tabsHtml + contentHtml;

  window.adminLapsData = lapsData;
  
  // Load email toggle states only when on email-logs tab
  if (currentAdminTab === 'email-logs') {
    setTimeout(() => loadEmailToggleStates(), 100);
  }
  
  // Reapply filters if on time submissions tab
  if (currentAdminTab === 'time-submissions' && (currentAdminFilters.driver || currentAdminFilters.season || currentAdminFilters.round)) {
    filterAdminLaps();
  }
}


// ============================================================================
// STEP 3: MAKE SURE YOUR loadAdminTools() LOADS EMAIL LOGS
// Update this section if it's not already loading email logs
// ============================================================================

async function loadAdminTools() {
  console.log('loadAdminTools called');
  console.log('isAdmin():', isAdmin());
  console.log('currentUser:', currentUser);
  console.log('ADMIN_USERNAME:', ADMIN_USERNAME);
  
  const adminContent = document.getElementById('admin-content');
  const adminLapTimesTable = document.getElementById('admin-lap-times-table');
  
  if (!adminContent && !adminLapTimesTable) {
    console.error('Admin content containers not found in DOM');
    return;
  }
  
  if (!isAdmin()) {
    const container = adminContent || adminLapTimesTable;
    if (container) {
      container.innerHTML = '<p style="text-align:center;padding:40px;color:#666;">Access Denied</p>';
    }
    return;
  }

  try {
    console.log('Loading admin data from Firebase...');
    
    // Show loading message
    if (adminLapTimesTable) {
      adminLapTimesTable.innerHTML = '<p style="text-align:center;padding:40px;">Loading admin data...</p>';
    }
    
    const [lapsSnapshot, tracksSnapshot, carsSnapshot, emailLogsSnapshot] = await Promise.all([
      window.firebaseGet(window.firebaseRef(window.firebaseDB, 'Form_responses_1')),
      window.firebaseGet(window.firebaseRef(window.firebaseDB, 'Tracks')),
      window.firebaseGet(window.firebaseRef(window.firebaseDB, 'Cars')),
      window.firebaseGet(window.firebaseRef(window.firebaseDB, 'Email_Logs'))
    ]);
    
    console.log('Firebase data loaded successfully');
    
    const lapsData = toArray(lapsSnapshot.val());
    const tracksData = toArray(tracksSnapshot.val());
    const carsData = toArray(carsSnapshot.val());
    
    console.log('Laps count:', lapsData.length);
    console.log('Tracks count:', tracksData.length);
    console.log('Cars count:', carsData.length);
    
    const lapsWithKeys = [];
    const lapsObject = lapsSnapshot.val();
    if (lapsObject && typeof lapsObject === 'object') {
      Object.keys(lapsObject).forEach(key => {
        if (lapsObject[key]) {
          lapsWithKeys.push({ ...lapsObject[key], _firebaseKey: key });
        }
      });
    }

    // Process email logs
    const emailLogsData = [];
    const emailLogsObject = emailLogsSnapshot.val();
    if (emailLogsObject && typeof emailLogsObject === 'object') {
      Object.entries(emailLogsObject).forEach(([key, value]) => {
        emailLogsData.push({ id: key, ...value });
      });
    }
    
    console.log('Email logs count:', emailLogsData.length);

    // Store tracks and cars data globally
    window.adminTracksData = tracksData;
    window.adminCarsData = carsData;

    console.log('Displaying admin interface...');
    displayAdminInterface(lapsWithKeys, tracksData, carsData, emailLogsData);
    console.log('Admin interface displayed successfully');

  } catch (err) {
    console.error('loadAdminTools error:', err);
    console.error('Error stack:', err.stack);
    const container = adminLapTimesTable || adminContent;
    if (container) {
      container.innerHTML = `<p style="text-align:center;padding:40px;color:#d32f2f;">Error loading admin tools: ${err.message}<br><small>Check console for details</small></p>`;
    }
  }
}


function displayRoundCards(setupData, roundData, tracksMap={}, carsMap={}) {
  const container = document.getElementById('round-cards-grid');
  container.innerHTML = '';

  if (!setupData || !setupData.length) {
    container.innerHTML = '<p style="text-align:center;padding:40px;color:#666;">No rounds configured yet. Use the form below to add your first round!</p>';
    return;
  }

  const fallbackTrackImage = 'https://static.vecteezy.com/system/resources/previews/015/114/628/non_2x/race-track-icon-isometric-road-circuit-vector.jpg';
  const fallbackCarImage = 'https://thumb.silhouette-ac.com/t/e9/e9f1eb16ae292f36be10def00d95ecbb_t.jpeg';

  const bySeasonRound = {};
  const byCombo = {};
  const rdArr = toArray(roundData);
  rdArr.forEach(r => {
    if (!r) return;
    const s = r.Season; const rn = r.Round;
    const key = `${s}-${rn}`;
    if (!bySeasonRound[key]) bySeasonRound[key] = [];
    bySeasonRound[key].push({ driver: r.Driver, totalTime: parseFloat(r['Total_Lap_Time']) || Infinity, round: rn, season: s, sector1: parseFloat(r['Sector_1'])||Infinity, sector2: parseFloat(r['Sector_2'])||Infinity, sector3: parseFloat(r['Sector_3'])||Infinity });

    const comboKey = `${r['Track-Layout'] || ''}||${r['Car_Name'] || ''}`;
    if (!byCombo[comboKey]) byCombo[comboKey] = [];
    byCombo[comboKey].push({ driver: r.Driver, totalTime: parseFloat(r['Total_Lap_Time']) || Infinity, round: rn, season: s, sector1: parseFloat(r['Sector_1'])||Infinity, sector2: parseFloat(r['Sector_2'])||Infinity, sector3: parseFloat(r['Sector_3'])||Infinity });
  });

  const frag = document.createDocumentFragment();
  setupData.sort((a,b) => a.season - b.season || a.round - b.round).forEach(setup => {
    const card = document.createElement('div'); card.className = 'round-card';
    const key = `${setup.season}-${setup.round}`;
    const roundTimes = bySeasonRound[key] || [];
    const comboTimes = byCombo[`${setup.trackLayout}||${setup.car}`] || [];

    const bestRoundTime = roundTimes.length ? roundTimes.reduce((p,c)=> c.totalTime < p.totalTime ? c : p) : null;
    const bestComboTime = comboTimes.length ? comboTimes.reduce((p,c)=> c.totalTime < p.totalTime ? c : p) : null;
    const bestSector1 = comboTimes.length ? comboTimes.reduce((p,c)=> c.sector1 < p.sector1 ? c : p) : null;
    const bestSector2 = comboTimes.length ? comboTimes.reduce((p,c)=> c.sector2 < p.sector2 ? c : p) : null;
    const bestSector3 = comboTimes.length ? comboTimes.reduce((p,c)=> c.sector3 < p.sector3 ? c : p) : null;

    const trackImage = tracksMap[setup.trackLayout] || fallbackTrackImage;
    const carImage = carsMap[setup.car] || fallbackCarImage;

    card.innerHTML = `
      <div class="round-card-header"><h3>Round ${setup.round}</h3><p class="season-number">${setup.season}</p></div>
      <div class="round-card-images">
        <div class="round-card-image-container"><img src="${trackImage}" alt="${setup.trackLayout}" onerror="this.src='${fallbackTrackImage}'"><p>${setup.trackLayout}</p></div>
        <div class="round-card-image-container"><img src="${carImage}" alt="${setup.car}" onerror="this.src='${fallbackCarImage}'"><p>${setup.car}</p></div>
      </div>
      <div class="round-card-body">
        ${bestRoundTime ? `<div class="best-time-section"><h4>🏆 This Round's Best</h4><div class="best-time-item gold"><div><div class="best-time-label">${getFormattedDriverName(bestRoundTime.driver)}</div><div class="best-time-context">Round ${setup.round} - Season ${setup.season}</div></div><div class="best-time-value">${formatTime(bestRoundTime.totalTime)}</div></div></div>` : `<div class="best-time-section"><p style="color:#999;">No lap times recorded yet</p></div>`}
        ${bestComboTime ? `<div class="best-time-section"><h4>⚡ All-Time Best (This Combo)</h4><div class="best-time-item"><div><div class="best-time-label">Lap: ${getFormattedDriverName(bestComboTime.driver)}</div><div class="best-time-context">Round ${bestComboTime.round}${bestComboTime.season ? ` - Season ${bestComboTime.season}` : ''}</div></div><div class="best-time-value">${formatTime(bestComboTime.totalTime)}</div></div>
          ${bestSector1 ? `<div class="best-time-item"><div><div class="best-time-label">S1: ${getFormattedDriverName(bestSector1.driver)}</div></div><div class="best-time-value">${formatTime(bestSector1.sector1)}</div></div>` : ''}
          ${bestSector2 ? `<div class="best-time-item"><div><div class="best-time-label">S2: ${getFormattedDriverName(bestSector2.driver)}</div></div><div class="best-time-value">${formatTime(bestSector2.sector2)}</div></div>` : ''}
          ${bestSector3 ? `<div class="best-time-item"><div><div class="best-time-label">S3: ${getFormattedDriverName(bestSector3.driver)}</div></div><div class="best-time-value">${formatTime(bestSector3.sector3)}</div></div>` : ''}
        </div>` : ''}
      </div>
    `;
    frag.appendChild(card);
  });

  container.appendChild(frag);
}


// ============================================================================
// MISSING ADMIN FUNCTIONS - Tab Switching and Content Generators
// ============================================================================

function switchAdminTab(tabName) {
  currentAdminTab = tabName;
  loadAdminTools();
}
function generateTimeSubmissionsContent(lapsData) {
  const drivers = [...new Set(lapsData.map(l => l.Driver).filter(Boolean))].sort();
  const seasons = [...new Set(lapsData.map(l => l.Season).filter(Boolean))].sort((a,b) => b-a);
  const rounds = [...new Set(lapsData.map(l => l.Round).filter(Boolean))].sort((a,b) => a-b);

  const subBannerHtml = `
    <div class="admin-sub-banner">
      <h3>⏱️ Time Submissions</h3>
      <p>View, edit, and manage all lap time submissions</p>
    </div>
  `;

  const filterHtml = `
    <div class="admin-filters">
      <select id="adminFilterDriver" class="admin-filter-select" onchange="filterAdminLaps()">
        <option value="">All Drivers</option>
        ${drivers.map(d => `<option value="${d}" ${currentAdminFilters.driver === d ? 'selected' : ''}>${d}</option>`).join('')}
      </select>
      <select id="adminFilterSeason" class="admin-filter-select" onchange="filterAdminLaps()">
        <option value="">All Seasons</option>
        ${seasons.map(s => `<option value="${s}" ${String(currentAdminFilters.season) === String(s) ? 'selected' : ''}>Season ${s}</option>`).join('')}
      </select>
      <select id="adminFilterRound" class="admin-filter-select" onchange="filterAdminLaps()">
        <option value="">All Rounds</option>
        ${rounds.map(r => `<option value="${r}" ${String(currentAdminFilters.round) === String(r) ? 'selected' : ''}>Round ${r}</option>`).join('')}
      </select>
      <button onclick="clearAdminFilters()" class="admin-filter-btn">Clear Filters</button>
    </div>
  `;

  lapsData.sort((a, b) => {
    const timeA = new Date(a.Timestamp).getTime();
    const timeB = new Date(b.Timestamp).getTime();
    return timeB - timeA;
  });

  const tableHtml = `
    <table class="admin-table">
      <thead>
        <tr>
          <th>Timestamp</th>
          <th>Driver</th>
          <th>Season</th>
          <th>Round</th>
          <th>Sector 1</th>
          <th>Sector 2</th>
          <th>Sector 3</th>
          <th onclick="sortAdminByTotalTime()" style="cursor:pointer;" title="Click to sort">
            Total Time <span id="sortIndicator">⇅</span>
          </th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody id="adminLapsTableBody">
        ${lapsData.map(lap => createAdminLapRow(lap)).join('')}
      </tbody>
    </table>
  `;

  return subBannerHtml + filterHtml + tableHtml;
}

function generateTracksConfigContent(tracksData) {
  const subBannerHtml = `
    <div class="admin-sub-banner">
      <h3>🏁 Tracks Configuration</h3>
      <p>Manage track layouts and images</p>
    </div>
  `;

  const searchHtml = `
    <div class="admin-search-bar">
      <input type="text" 
             id="trackSearchInput" 
             placeholder="🔍 Search tracks..." 
             class="admin-search-input"
             oninput="filterTracksTable()" />
    </div>
  `;

  const addNewHtml = `
    <div class="admin-add-new">
      <h4>➕ Add New Track</h4>
      <div class="admin-form-inline">
        <input type="text" id="newTrackCombo" placeholder="Track & Layout (e.g., Silverstone - GP)" class="admin-input" />
        <input type="text" id="newTrackImageUrl" placeholder="Image URL" class="admin-input" />
        <button onclick="addNewTrack()" class="admin-btn-save">Add Track</button>
      </div>
    </div>
  `;

  const tableHtml = `
    <table class="admin-table">
      <thead>
        <tr>
          <th>Track & Layout</th>
          <th>Image URL</th>
          <th>Preview</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody id="tracksTableBody">
        ${tracksData.map((track, idx) => `
          <tr data-track-name="${(track.Track_Combos || '').toLowerCase()}">
            <td data-label="Track & Layout">${track.Track_Combos || ''}</td>
            <td data-label="Image URL">
              <input type="text" 
                     id="trackUrl-${idx}" 
                     value="${track.Track_Image_URL || ''}" 
                     class="admin-input-inline" 
                     style="width: 100%; max-width: 400px;" />
            </td>
            <td data-label="Preview">
              ${track.Track_Image_URL ? `<img src="${track.Track_Image_URL}" style="width: 60px; height: 40px; object-fit: cover; border-radius: 4px;" onerror="this.style.display='none'">` : 'No image'}
            </td>
            <td data-label="Actions">
              <button onclick="updateTrack(${idx})" class="admin-btn-edit">💾 Save</button>
              <button onclick="deleteTrack(${idx})" class="admin-btn-delete">🗑️ Delete</button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;

  return subBannerHtml + searchHtml + addNewHtml + tableHtml;
}

function generateCarsConfigContent(carsData) {
  const subBannerHtml = `
    <div class="admin-sub-banner">
      <h3>🏎️ Cars Configuration</h3>
      <p>Manage car names and images</p>
    </div>
  `;

  const searchHtml = `
    <div class="admin-search-bar">
      <input type="text" 
             id="carSearchInput" 
             placeholder="🔍 Search cars..." 
             class="admin-search-input"
             oninput="filterCarsTable()" />
    </div>
  `;

  const addNewHtml = `
    <div class="admin-add-new">
      <h4>➕ Add New Car</h4>
      <div class="admin-form-inline">
        <input type="text" id="newCarName" placeholder="Car Name (e.g., Formula Pro Gen 2)" class="admin-input" />
        <input type="text" id="newCarImageUrl" placeholder="Image URL" class="admin-input" />
        <button onclick="addNewCar()" class="admin-btn-save">Add Car</button>
      </div>
    </div>
  `;

  const tableHtml = `
    <table class="admin-table">
      <thead>
        <tr>
          <th>Car Name</th>
          <th>Image URL</th>
          <th>Preview</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody id="carsTableBody">
        ${carsData.map((car, idx) => `
          <tr data-car-name="${(car.Car_Name || '').toLowerCase()}">
            <td data-label="Car Name">${car.Car_Name || ''}</td>
            <td data-label="Image URL">
              <input type="text" 
                     id="carUrl-${idx}" 
                     value="${car.Car_Image_URL || ''}" 
                     class="admin-input-inline" 
                     style="width: 100%; max-width: 400px;" />
            </td>
            <td data-label="Preview">
              ${car.Car_Image_URL ? `<img src="${car.Car_Image_URL}" style="width: 60px; height: 40px; object-fit: cover; border-radius: 4px;" onerror="this.style.display='none'">` : 'No image'}
            </td>
            <td data-label="Actions">
              <button onclick="updateCar(${idx})" class="admin-btn-edit">💾 Save</button>
              <button onclick="deleteCar(${idx})" class="admin-btn-delete">🗑️ Delete</button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;

  return subBannerHtml + searchHtml + addNewHtml + tableHtml;
}

function generateEmailLogsContent(emailLogsData) {
  const subBannerHtml = `
    <div class="admin-sub-banner">
      <h3>📧 Email Logs & Controls</h3>
      <p>Monitor email notifications and manage settings</p>
    </div>
  `;

  // EMAIL TOGGLE SECTION (now inside Email Logs tab)
  const emailToggleHtml = `
    <div class="admin-email-toggle-section">
      <div class="admin-email-toggle-card">
        <div class="admin-email-toggle-header">
          <h3>📧 Email Notifications Control</h3>
        </div>
        <div class="admin-email-toggle-body">
          <p class="admin-email-description">Control email notifications by type. Individual user preferences will be preserved when notifications are re-enabled.</p>
          
          <!-- Master Toggle -->
          <div class="admin-email-master-toggle">
            <div class="admin-email-toggle-row master">
              <div class="admin-email-toggle-info">
                <span class="admin-email-toggle-icon">🎛️</span>
                <div class="admin-email-toggle-text">
                  <strong>Master Control</strong>
                  <span class="admin-email-toggle-desc">Enable/disable all email types at once</span>
                </div>
              </div>
              <label class="admin-toggle-switch">
                <input type="checkbox" id="emailToggleMaster" onchange="toggleAllEmails()" checked>
                <span class="admin-toggle-slider"></span>
              </label>
            </div>
          </div>

          <div class="admin-email-divider"></div>

          <!-- Individual Email Type Toggles -->
          <div class="admin-email-types-grid">
            
            <!-- New Round Notifications -->
            <div class="admin-email-type-card">
              <div class="admin-email-type-header">
                <span class="admin-email-type-icon">🏁</span>
                <div class="admin-email-type-title">
                  <h4>New Round</h4>
                  <span class="admin-email-status-badge active" id="emailStatus_newRound">ACTIVE</span>
                </div>
              </div>
              <p class="admin-email-type-desc">Sent when a new round is configured and ready</p>
              <div class="admin-email-toggle-row">
                <span class="admin-email-toggle-label">Enable Notifications</span>
                <label class="admin-toggle-switch">
                  <input type="checkbox" id="emailToggle_newRound" onchange="toggleEmailType('newRound')" checked>
                  <span class="admin-toggle-slider"></span>
                </label>
              </div>
            </div>

            <!-- Fastest Lap Notifications -->
            <div class="admin-email-type-card">
              <div class="admin-email-type-header">
                <span class="admin-email-type-icon">⚡</span>
                <div class="admin-email-type-title">
                  <h4>Fastest Lap</h4>
                  <span class="admin-email-status-badge active" id="emailStatus_fastestLap">ACTIVE</span>
                </div>
              </div>
              <p class="admin-email-type-desc">Sent when a new fastest lap is recorded</p>
              <div class="admin-email-toggle-row">
                <span class="admin-email-toggle-label">Enable Notifications</span>
                <label class="admin-toggle-switch">
                  <input type="checkbox" id="emailToggle_fastestLap" onchange="toggleEmailType('fastestLap')" checked>
                  <span class="admin-toggle-slider"></span>
                </label>
              </div>
            </div>

            <!-- Weekly Results Notifications -->
            <div class="admin-email-type-card">
              <div class="admin-email-type-header">
                <span class="admin-email-type-icon">🏆</span>
                <div class="admin-email-type-title">
                  <h4>Weekly Results</h4>
                  <span class="admin-email-status-badge active" id="emailStatus_weeklyResults">ACTIVE</span>
                </div>
              </div>
              <p class="admin-email-type-desc">Sent every Monday with round results</p>
              <div class="admin-email-toggle-row">
                <span class="admin-email-toggle-label">Enable Notifications</span>
                <label class="admin-toggle-switch">
                  <input type="checkbox" id="emailToggle_weeklyResults" onchange="toggleEmailType('weeklyResults')" checked>
                  <span class="admin-toggle-slider"></span>
                </label>
              </div>
            </div>

          </div>

          <div id="emailToggleGlobalStatus" class="admin-status-message" style="display: none;"></div>
          
        </div>
      </div>
    </div>
  `;

  // Calculate stats
  const totalEmails = emailLogsData.length;
  const sentEmails = emailLogsData.filter(log => log.status === 'sent').length;
  const failedEmails = emailLogsData.filter(log => log.status === 'failed').length;
  const skippedEmails = emailLogsData.filter(log => log.status === 'skipped').length;

  const statsHtml = `
    <div class="admin-email-stats">
      <div class="admin-stat-card">
        <div class="admin-stat-number">${totalEmails}</div>
        <div class="admin-stat-label">Total Emails</div>
      </div>
      <div class="admin-stat-card admin-stat-success">
        <div class="admin-stat-number">${sentEmails}</div>
        <div class="admin-stat-label">Sent Successfully</div>
      </div>
      <div class="admin-stat-card admin-stat-warning">
        <div class="admin-stat-number">${skippedEmails}</div>
        <div class="admin-stat-label">Skipped (Paused)</div>
      </div>
      <div class="admin-stat-card admin-stat-failed">
        <div class="admin-stat-number">${failedEmails}</div>
        <div class="admin-stat-label">Failed</div>
      </div>
    </div>
  `;

  // Get unique types for filter
  const types = [...new Set(emailLogsData.map(l => l.type).filter(Boolean))];

  const filterHtml = `
    <div class="admin-filters">
      <select id="emailTypeFilter" class="admin-filter-select" onchange="filterEmailLogs()">
        <option value="">All Types</option>
        ${types.map(t => `<option value="${t}">${t}</option>`).join('')}
      </select>
      <select id="emailStatusFilter" class="admin-filter-select" onchange="filterEmailLogs()">
        <option value="">All Status</option>
        <option value="sent">Sent</option>
        <option value="skipped">Skipped</option>
        <option value="failed">Failed</option>
      </select>
      <input type="text" 
             id="emailRecipientSearch" 
             placeholder="🔍 Search recipient..." 
             class="admin-search-input"
             oninput="filterEmailLogs()" />
      <button onclick="clearEmailFilters()" class="admin-filter-btn">Clear Filters</button>
    </div>
  `;

  // Sort by timestamp (newest first)
  emailLogsData.sort((a, b) => b.sentAt - a.sentAt);

  const tableHtml = `
    <table class="admin-table">
      <thead>
        <tr>
          <th>Timestamp</th>
          <th>Type</th>
          <th>Recipient</th>
          <th>Subject</th>
          <th>Status</th>
          <th>Error/Reason</th>
        </tr>
      </thead>
      <tbody id="emailLogsTableBody">
        ${emailLogsData.map(log => createEmailLogRow(log)).join('')}
      </tbody>
    </table>
  `;

  // RETURN: toggles first, then stats, filters, and table
  return subBannerHtml + emailToggleHtml + statsHtml + filterHtml + tableHtml;
}

function createEmailLogRow(log) {
  const date = new Date(log.sentAt);
  const formattedDate = date.toLocaleString('en-GB', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  let statusClass = 'admin-badge-failed';
  if (log.status === 'sent') statusClass = 'admin-badge-success';
  if (log.status === 'skipped') statusClass = 'admin-badge-warning';
  
  const typeClass = `admin-badge-${log.type || 'general'}`;

  return `
    <tr data-recipient="${(log.recipient || '').toLowerCase()}" data-type="${log.type}" data-status="${log.status}">
      <td data-label="Timestamp" style="font-size: 12px; color: #666;">${formattedDate}</td>
      <td data-label="Type"><span class="admin-badge ${typeClass}">${log.type}</span></td>
      <td data-label="Recipient">${log.recipient}</td>
      <td data-label="Subject">${log.subject}</td>
      <td data-label="Status"><span class="admin-badge ${statusClass}">${log.status}</span></td>
      <td data-label="Error/Reason" style="color: ${log.status === 'failed' ? '#dc3545' : '#856404'}; font-size: 12px;">${log.error || log.reason || '-'}</td>
    </tr>
  `;
}


function filterEmailLogs() {
  const typeFilter = document.getElementById('emailTypeFilter')?.value || '';
  const statusFilter = document.getElementById('emailStatusFilter')?.value || '';
  const recipientSearch = document.getElementById('emailRecipientSearch')?.value.toLowerCase().trim() || '';
  
  const tbody = document.getElementById('emailLogsTableBody');
  if (!tbody) return;

  const rows = tbody.querySelectorAll('tr');
  
  rows.forEach(row => {
    const recipient = row.getAttribute('data-recipient') || '';
    const type = row.getAttribute('data-type') || '';
    const status = row.getAttribute('data-status') || '';
    
    const matchesType = !typeFilter || type === typeFilter;
    const matchesStatus = !statusFilter || status === statusFilter;
    const matchesRecipient = !recipientSearch || recipient.includes(recipientSearch);
    
    if (matchesType && matchesStatus && matchesRecipient) {
      row.style.display = '';
    } else {
      row.style.display = 'none';
    }
  });
}

function clearEmailFilters() {
  const typeFilter = document.getElementById('emailTypeFilter');
  const statusFilter = document.getElementById('emailStatusFilter');
  const recipientSearch = document.getElementById('emailRecipientSearch');
  
  if (typeFilter) typeFilter.value = '';
  if (statusFilter) statusFilter.value = '';
  if (recipientSearch) recipientSearch.value = '';
  
  filterEmailLogs();
}

// Live filter function for tracks
function filterTracksTable() {
  const searchInput = document.getElementById('trackSearchInput');
  if (!searchInput) return;

  const searchTerm = searchInput.value.toLowerCase().trim();
  const tbody = document.getElementById('tracksTableBody');
  if (!tbody) return;

  const rows = tbody.querySelectorAll('tr');
  
  rows.forEach(row => {
    const trackName = row.getAttribute('data-track-name') || '';
    
    if (trackName.includes(searchTerm)) {
      row.style.display = '';
    } else {
      row.style.display = 'none';
    }
  });
}

// Live filter function for cars
function filterCarsTable() {
  const searchInput = document.getElementById('carSearchInput');
  if (!searchInput) return;

  const searchTerm = searchInput.value.toLowerCase().trim();
  const tbody = document.getElementById('carsTableBody');
  if (!tbody) return;

  const rows = tbody.querySelectorAll('tr');
  
  rows.forEach(row => {
    const carName = row.getAttribute('data-car-name') || '';
    
    if (carName.includes(searchTerm)) {
      row.style.display = '';
    } else {
      row.style.display = 'none';
    }
  });
}


// Track management functions
async function addNewTrack() {
  const combo = document.getElementById('newTrackCombo')?.value.trim();
  const imageUrl = document.getElementById('newTrackImageUrl')?.value.trim();

  if (!combo) {
    alert('❌ Please enter a track & layout name');
    return;
  }

  try {
    const trackData = {
      Track_Combos: combo,
      Track_Image_URL: imageUrl
    };

    const tracksRef = window.firebaseRef(window.firebaseDB, 'Tracks');
    await window.firebasePush(tracksRef, trackData);

    alert('✅ Track added successfully!');
    CACHE.tracksMap = null;
    loadAdminTools();
  } catch (err) {
    console.error('addNewTrack error', err);
    alert('❌ Error adding track: ' + err.message);
  }
}

async function updateTrack(index) {
  const track = window.adminTracksData[index];
  if (!track) return;

  const newImageUrl = document.getElementById(`trackUrl-${index}`)?.value.trim();

  try {
    const tracksSnapshot = await window.firebaseGet(window.firebaseRef(window.firebaseDB, 'Tracks'));
    const tracksObject = tracksSnapshot.val();
    
    if (tracksObject && typeof tracksObject === 'object') {
      const keys = Object.keys(tracksObject);
      const firebaseKey = keys[index];
      
      const trackRef = window.firebaseRef(window.firebaseDB, `Tracks/${firebaseKey}`);
      await window.firebaseSet(trackRef, {
        ...track,
        Track_Image_URL: newImageUrl
      });

      alert('✅ Track updated successfully!');
      CACHE.tracksMap = null;
      loadAdminTools();
    }
  } catch (err) {
    console.error('updateTrack error', err);
    alert('❌ Error updating track: ' + err.message);
  }
}

async function deleteTrack(index) {
  const track = window.adminTracksData[index];
  if (!track) return;

  if (!confirm(`⚠️ Delete track "${track.Track_Combos}"?\n\nThis cannot be undone!`)) return;

  try {
    const tracksSnapshot = await window.firebaseGet(window.firebaseRef(window.firebaseDB, 'Tracks'));
    const tracksObject = tracksSnapshot.val();
    
    if (tracksObject && typeof tracksObject === 'object') {
      const keys = Object.keys(tracksObject);
      const firebaseKey = keys[index];
      
      const trackRef = window.firebaseRef(window.firebaseDB, `Tracks/${firebaseKey}`);
      await window.firebaseSet(trackRef, null);

      alert('✅ Track deleted successfully!');
      CACHE.tracksMap = null;
      loadAdminTools();
    }
  } catch (err) {
    console.error('deleteTrack error', err);
    alert('❌ Error deleting track: ' + err.message);
  }
}

// Car management functions
async function addNewCar() {
  const carName = document.getElementById('newCarName')?.value.trim();
  const imageUrl = document.getElementById('newCarImageUrl')?.value.trim();

  if (!carName) {
    alert('❌ Please enter a car name');
    return;
  }

  try {
    const carData = {
      Car_Name: carName,
      Car_Image_URL: imageUrl
    };

    const carsRef = window.firebaseRef(window.firebaseDB, 'Cars');
    await window.firebasePush(carsRef, carData);

    alert('✅ Car added successfully!');
    CACHE.carsMap = null;
    loadAdminTools();
  } catch (err) {
    console.error('addNewCar error', err);
    alert('❌ Error adding car: ' + err.message);
  }
}

async function updateCar(index) {
  const car = window.adminCarsData[index];
  if (!car) return;

  const newImageUrl = document.getElementById(`carUrl-${index}`)?.value.trim();

  try {
    const carsSnapshot = await window.firebaseGet(window.firebaseRef(window.firebaseDB, 'Cars'));
    const carsObject = carsSnapshot.val();
    
    if (carsObject && typeof carsObject === 'object') {
      const keys = Object.keys(carsObject);
      const firebaseKey = keys[index];
      
      const carRef = window.firebaseRef(window.firebaseDB, `Cars/${firebaseKey}`);
      await window.firebaseSet(carRef, {
        ...car,
        Car_Image_URL: newImageUrl
      });

      alert('✅ Car updated successfully!');
      CACHE.carsMap = null;
      loadAdminTools();
    }
  } catch (err) {
    console.error('updateCar error', err);
    alert('❌ Error updating car: ' + err.message);
  }
}

async function deleteCar(index) {
  const car = window.adminCarsData[index];
  if (!car) return;

  if (!confirm(`⚠️ Delete car "${car.Car_Name}"?\n\nThis cannot be undone!`)) return;

  try {
    const carsSnapshot = await window.firebaseGet(window.firebaseRef(window.firebaseDB, 'Cars'));
    const carsObject = carsSnapshot.val();
    
    if (carsObject && typeof carsObject === 'object') {
      const keys = Object.keys(carsObject);
      const firebaseKey = keys[index];
      
      const carRef = window.firebaseRef(window.firebaseDB, `Cars/${firebaseKey}`);
      await window.firebaseSet(carRef, null);

      alert('✅ Car deleted successfully!');
      CACHE.carsMap = null;
      loadAdminTools();
    }
  } catch (err) {
    console.error('deleteCar error', err);
    alert('❌ Error deleting car: ' + err.message);
  }
}

// ============================================================================
// Dynamic Total Time Preview for Lap Time Submission
// ============================================================================
function setupTotalTimePreview() {
  const sector1Sec = document.getElementById('sector1-sec');
  const sector1Ms = document.getElementById('sector1-ms');
  const sector2Sec = document.getElementById('sector2-sec');
  const sector2Ms = document.getElementById('sector2-ms');
  const sector3Sec = document.getElementById('sector3-sec');
  const sector3Ms = document.getElementById('sector3-ms');
  const totalTimeDisplay = document.getElementById('totalTimeDisplay');

  if (!totalTimeDisplay) return;

  function updateTotalTime() {
    // Get values (default to 0 if empty)
    const s1Sec = parseInt(sector1Sec.value) || 0;
    const s1Ms = parseInt(sector1Ms.value) || 0;
    const s2Sec = parseInt(sector2Sec.value) || 0;
    const s2Ms = parseInt(sector2Ms.value) || 0;
    const s3Sec = parseInt(sector3Sec.value) || 0;
    const s3Ms = parseInt(sector3Ms.value) || 0;

    // Calculate total milliseconds
    const totalMs = (s1Sec * 1000 + s1Ms) + (s2Sec * 1000 + s2Ms) + (s3Sec * 1000 + s3Ms);

    // If all fields are empty, show placeholder
    if (totalMs === 0) {
      totalTimeDisplay.textContent = '--:--.---';
      totalTimeDisplay.style.opacity = '0.5';
      return;
    }

    // Convert to minutes:seconds.milliseconds
    const minutes = Math.floor(totalMs / 60000);
    const seconds = Math.floor((totalMs % 60000) / 1000);
    const milliseconds = totalMs % 1000;

    // Format as MM:SS.mmm
    const formatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(milliseconds).padStart(3, '0')}`;
    
    totalTimeDisplay.textContent = formatted;
    totalTimeDisplay.style.opacity = '1';
  }

  // Add input listeners to all sector fields
  const allInputs = [sector1Sec, sector1Ms, sector2Sec, sector2Ms, sector3Sec, sector3Ms];
  allInputs.forEach(input => {
    if (input) {
      input.addEventListener('input', updateTotalTime);
      input.addEventListener('keyup', updateTotalTime);
      input.addEventListener('change', updateTotalTime);
    }
  });

  // Initialize with current values
  updateTotalTime();
}

// ============================================================================
// Manual Recalculate Function for Admin Portal
// ============================================================================
async function manualRecalculate() {
    const recalcButton = document.getElementById('manualRecalcButton');
    const statusDiv = document.getElementById('recalcStatus');
    
    try {
        // Disable button and show loading
        if (recalcButton) {
            recalcButton.disabled = true;
            recalcButton.textContent = '⏳ Recalculating...';
        }
        
        if (statusDiv) {
            statusDiv.style.display = 'block';
            statusDiv.style.background = '#d1ecf1';
            statusDiv.style.color = '#0c5460';
            statusDiv.textContent = '⏳ Recalculating all standings...';
        }
        
        console.log('🔧 Calling Cloud Function to recalculate standings...');
        
        // Call the Cloud Function
        const recalculateStandings = window.httpsCallable(window.firebaseFunctions, 'recalculateStandings');
        const result = await recalculateStandings();
        
        console.log('✅ Cloud Function response:', result.data);
        
        // Show success
        if (statusDiv) {
            statusDiv.style.background = '#d4edda';
            statusDiv.style.color = '#155724';
            statusDiv.textContent = '✅ ' + result.data.message;
        }
        
        // Re-enable button
        if (recalcButton) {
            recalcButton.disabled = false;
            recalcButton.textContent = '🔄 Recalculate All Standings';
        }
        
        // Reload data after 2 seconds
        setTimeout(() => {
            if (statusDiv) statusDiv.style.display = 'none';
            
            // Refresh displays
            if (typeof loadLeaderboard === 'function') loadLeaderboard();
            if (typeof loadRoundData === 'function') loadRoundData();
            if (typeof loadAdminData === 'function') loadAdminData();
            
            alert('✅ Standings recalculated! Data refreshed.');
        }, 2000);
        
    } catch (error) {
        console.error('❌ Error calling recalculate function:', error);
        
        if (statusDiv) {
            statusDiv.style.background = '#f8d7da';
            statusDiv.style.color = '#721c24';
            statusDiv.textContent = '❌ Error: ' + error.message;
        }
        
        if (recalcButton) {
            recalcButton.disabled = false;
            recalcButton.textContent = '🔄 Recalculate All Standings';
        }
