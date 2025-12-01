/* =========================================================
   Basic DOM Helpers (sector inputs etc.)
   ========================================================= */

        if (row) {
          const driverLink = row.querySelector('.driver-link');
          if (driverLink) {
            const driverName = driverLink.getAttribute('data-driver');
            goToDriverCurrentRound(driverName);
          }
        }
      });
    }
  }
});

// Add these global variables at the top with your other admin globals
//let currentAdminTab = 'time-submissions';

/*
async function loadAdminTools() {
  if (!isAdmin()) {
    document.getElementById('admin-content').innerHTML = '<p style="text-align:center;padding:40px;color:#666;">Access Denied</p>';
    return;
  }

  try {
    const [lapsSnapshot, tracksSnapshot, carsSnapshot, emailLogsSnapshot] = await Promise.all([
     window.firebaseGet(window.firebaseRef(window.firebaseDB, 'Form_responses_1')),
     window.firebaseGet(window.firebaseRef(window.firebaseDB, 'Tracks')),
     window.firebaseGet(window.firebaseRef(window.firebaseDB, 'Cars')),
     window.firebaseGet(window.firebaseRef(window.firebaseDB, 'Email_Logs'))
   ]);

     const emailLogsData = [];
   const emailLogsObject = emailLogsSnapshot.val();
   if (emailLogsObject && typeof emailLogsObject === 'object') {
     Object.entries(emailLogsObject).forEach(([key, value]) => {
       emailLogsData.push({ id: key, ...value });
     });
   }
    
    const lapsData = toArray(lapsSnapshot.val());
    const tracksData = toArray(tracksSnapshot.val());
    const carsData = toArray(carsSnapshot.val());
    
    const lapsWithKeys = [];
    const lapsObject = lapsSnapshot.val();
    if (lapsObject && typeof lapsObject === 'object') {
      Object.keys(lapsObject).forEach(key => {
        if (lapsObject[key]) {
          lapsWithKeys.push({ ...lapsObject[key], _firebaseKey: key });
        }
      });
    }

    // Store tracks and cars data globally
    window.adminTracksData = tracksData;
    window.adminCarsData = carsData;

    displayAdminInterface(lapsWithKeys, tracksData, carsData, emailLogsData);

  } catch (err) {
    console.error('loadAdminTools error', err);
  }
}
*/

/*
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

  container.innerHTML = tabsHtml + contentHtml;

  window.adminLapsData = lapsData;
  
  // Reapply filters if on time submissions tab
  if (currentAdminTab === 'time-submissions' && (currentAdminFilters.driver || currentAdminFilters.season || currentAdminFilters.round)) {
    filterAdminLaps();
  }
}
*/

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
        
        alert('❌ Failed to recalculate: ' + error.message);
    }
}

// ============================================================================
// Email Preferences Management
// ============================================================================

// Load email preferences when user logs in
async function loadEmailPreferences() {
  if (!currentUser) return;
  
  try {
    const profileKey = encodeKey(currentUser.name);
    const arrayIndex = DRIVER_PROFILE_INDICES[profileKey];
    
    let profileRef;
    if (arrayIndex !== undefined) {
      // Array-based storage
      profileRef = window.firebaseRef(window.firebaseDB, `Driver_Profiles/${arrayIndex}`);
    } else {
      // Object-based storage
      profileRef = window.firebaseRef(window.firebaseDB, `Driver_Profiles/${profileKey}`);
    }
    
    const snapshot = await window.firebaseGet(profileRef);
    const profile = snapshot.val();
    
    if (profile && profile.emailNotifications) {
      document.getElementById('email-newRound').checked = profile.emailNotifications.newRound !== false;
      document.getElementById('email-fastestLap').checked = profile.emailNotifications.fastestLap !== false;
      document.getElementById('email-weeklyResults').checked = profile.emailNotifications.weeklyResults !== false;
    } else {
      // Default all to true
      document.getElementById('email-newRound').checked = true;
      document.getElementById('email-fastestLap').checked = true;
      document.getElementById('email-weeklyResults').checked = true;
    }
  } catch (error) {
    console.error('Error loading email preferences:', error);
  }
}

// Save email preferences
async function saveEmailPreferences() {
  if (!currentUser) {
    alert('Please log in first');
    return;
  }
  
  const newRound = document.getElementById('email-newRound').checked;
  const fastestLap = document.getElementById('email-fastestLap').checked;
  const weeklyResults = document.getElementById('email-weeklyResults').checked;
  
  const profileKey = encodeKey(currentUser.name);
  const arrayIndex = DRIVER_PROFILE_INDICES[profileKey];
  
  let profileRef;
  if (arrayIndex !== undefined) {
    // Array-based storage
    profileRef = window.firebaseRef(window.firebaseDB, `Driver_Profiles/${arrayIndex}/emailNotifications`);
  } else {
    // Object-based storage
    profileRef = window.firebaseRef(window.firebaseDB, `Driver_Profiles/${profileKey}/emailNotifications`);
  }
  
  try {
    await window.firebaseSet(profileRef, {
      newRound: newRound,
      fastestLap: fastestLap,
      weeklyResults: weeklyResults
    });
    
    const message = document.getElementById('email-pref-message');
    message.style.display = 'block';
    message.style.background = '#d4edda';
    message.style.color = '#155724';
    message.textContent = '✅ Email preferences saved successfully!';
    
    setTimeout(() => {
      message.style.display = 'none';
    }, 3000);
    
    console.log('Email preferences saved:', { newRound, fastestLap, weeklyResults });
    
  } catch (error) {
    console.error('Error saving email preferences:', error);
    const message = document.getElementById('email-pref-message');
    message.style.display = 'block';
    message.style.background = '#f8d7da';
    message.style.color = '#721c24';
    message.textContent = '❌ Error saving preferences: ' + error.message;
  }
}
// Track preview function
function updateTrackPreview(trackCombo) {
  const previewContainer = document.getElementById('trackPreviewContainer');
  const previewImg = document.getElementById('trackPreviewImg');
  const previewLabel = document.getElementById('trackPreviewLabel');
  
  if (!previewContainer || !previewImg || !previewLabel) return;
  
  if (trackCombo && CACHE.tracksMap && CACHE.tracksMap[trackCombo]) {
    const imageUrl = CACHE.tracksMap[trackCombo];
    previewImg.src = imageUrl;
    previewLabel.textContent = trackCombo;
    previewContainer.style.display = 'block';
    
    previewImg.onerror = function() {
      previewImg.src = 'https://static.vecteezy.com/system/resources/previews/015/114/628/non_2x/race-track-icon-isometric-road-circuit-vector.jpg';
    };
  } else {
    previewContainer.style.display = 'none';
  }
}

// Car preview function
function updateCarPreview(carName) {
  const previewContainer = document.getElementById('carPreviewContainer');
  const previewImg = document.getElementById('carPreviewImg');
  const previewLabel = document.getElementById('carPreviewLabel');
  
  if (!previewContainer || !previewImg || !previewLabel) return;
  
  if (carName && CACHE.carsMap && CACHE.carsMap[carName]) {
    const imageUrl = CACHE.carsMap[carName];
    previewImg.src = imageUrl;
    previewLabel.textContent = carName;
    previewContainer.style.display = 'block';
    
    previewImg.onerror = function() {
      previewImg.src = 'https://thumb.silhouette-ac.com/t/e9/e9f1eb16ae292f36be10def00d95ecbb_t.jpeg';
    };
  } else {
    previewContainer.style.display = 'none';
  }
}

// Setup event listeners when page loads
document.addEventListener('DOMContentLoaded', function() {
  const trackDropdown = document.getElementById('trackLayout');
  const carDropdown = document.getElementById('carName');
  
  if (trackDropdown) {
    trackDropdown.addEventListener('change', function() {
      updateTrackPreview(this.value);
    });
  }
  
  if (carDropdown) {
    carDropdown.addEventListener('change', function() {
      updateCarPreview(this.value);
    });
  }
});
