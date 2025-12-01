/* =========================================================
   Login / Session Handling
   ========================================================= */

/* -----------------------------
   Login / Session handling
   ----------------------------- */
function getFormattedDriverName(driverLoginName, includeNumber = true) {
  const profile = DRIVER_PROFILES[encodeKey(driverLoginName)];
  
  if (currentUser && profile && profile.surname && profile.name) {
    const number = profile.number || '?';
    return includeNumber 
      ? `${profile.name.charAt(0)}. ${profile.surname} - ${number}`
      : `${profile.name.charAt(0)}. ${profile.surname}`;
  }
  
  if (!currentUser && profile && profile.surname && profile.name) {
    return `${profile.name.charAt(0)}. ${profile.surname.charAt(0)}.`;
  }
  
  return driverLoginName;
}

// Add this function to script.js:

function flipDriverCard(button) {
  const card = button.closest('.driver-card');
  if (card) {
    card.classList.toggle('flipped');
  }
}

function login() {
  const driverName = document.getElementById('driverNameInput')?.value.trim();
  const password = document.getElementById('passwordInput')?.value;
  
  console.log('Login attempt:', driverName);
  console.log('ALLOWED_USERS:', ALLOWED_USERS);
  console.log('ALLOWED_USERS keys:', Object.keys(ALLOWED_USERS));
  
  if (!driverName || !password) { 
    alert('⚠️ Please enter both driver name and password.'); 
    return; 
  }
  
  // Check if ALLOWED_USERS is loaded
  if (Object.keys(ALLOWED_USERS).length === 0) {
    alert('⏳ Configuration is still loading. Please wait a moment and try again.');
    console.error('ALLOWED_USERS not loaded yet');
    return;
  }
  
  if (!ALLOWED_USERS[driverName]) { 
    alert(`⛔ Access Denied\n\nDriver name "${driverName}" is not authorized.\n\nAllowed users: ${Object.keys(ALLOWED_USERS).join(', ')}`); 
    console.error('User not in ALLOWED_USERS:', driverName);
    console.error('Available users:', Object.keys(ALLOWED_USERS));
    return; 
  }
  
  const storedPassword = ALLOWED_USERS[driverName].password;
  if (password !== storedPassword) { 
    alert('⛔ Incorrect password.'); 
    return; 
  }

  currentUser = { name: driverName, email: ALLOWED_USERS[driverName].email || '' };
  sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
  applyUserUI();
}

function signOut() {
  currentUser = null;
  sessionStorage.removeItem('currentUser');
  applyUserUI();
}

function applyUserUI() {
  const loginForm = document.getElementById('loginForm');
  const userInfo = document.getElementById('userInfo');
  if (currentUser) {
    if (loginForm) loginForm.style.display = 'none';
    if (userInfo) userInfo.style.display = 'block';
    document.getElementById('userName').textContent = currentUser.name;

    const profile = DRIVER_PROFILES[encodeKey(currentUser.name)];
    const photoContainer = document.getElementById('userPhotoContainer');
    const photoElement = document.getElementById('userProfilePhoto');
    const numberBadge = document.getElementById('userNumberBadge');
    const iconFallback = document.getElementById('userIconFallback');

    if (profile && profile.photoUrl) {
      photoElement.src = normalizePhotoUrl(profile.photoUrl);
      numberBadge.textContent = profile.number || '?';
      photoContainer.style.display = 'block';
      iconFallback.style.display = 'none';
    } else {
      photoContainer.style.display = 'none';
      iconFallback.style.display = 'block';
    }
  } else {
    if (loginForm) loginForm.style.display = 'flex';
    if (userInfo) userInfo.style.display = 'none';
    document.getElementById('driverNameInput').value = '';
    document.getElementById('passwordInput').value = '';
  }
  updateSubmitTabVisibility();
  updateAdminTabVisibility();
}

function updateSubmitTabVisibility() {
  const submitTab = document.querySelector('.tab-button[onclick*="submit"]');
  const setupTab = document.querySelector('.tab-button[onclick*="setup"]');
  const authWarning = document.getElementById('authWarning');
  const lapTimeFormContainer = document.getElementById('lapTimeFormContainer');
  
  if (currentUser) { 
    if (submitTab) submitTab.style.display = ''; 
    if (setupTab) setupTab.style.display = ''; 
    if (authWarning) authWarning.style.display = 'none'; 
    if (lapTimeFormContainer) {
      lapTimeFormContainer.style.display = 'block';
      // Setup dynamic total time preview
      setTimeout(() => setupTotalTimePreview(), 100);
    }
  } else { 
    if (submitTab) submitTab.style.display = 'none'; 
    if (setupTab) setupTab.style.display = 'none'; 
    if (authWarning) authWarning.style.display = 'block'; 
    if (lapTimeFormContainer) lapTimeFormContainer.style.display = 'none'; 
  }
}

async function checkExistingSession() {
  const stored = sessionStorage.getItem('currentUser');
  if (!stored) {
    updateSubmitTabVisibility();
    return;
  }
  currentUser = JSON.parse(stored);
  await waitFor(()=> Object.keys(DRIVER_PROFILES).length > 0, 2000);
  applyUserUI();
}

