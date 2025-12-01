/* =========================================================
   Configuration & Firebase Listeners
   ========================================================= */

/* -----------------------------
   Config & initial listeners
   ----------------------------- */
let CONFIG_LOADED = false;

async function loadConfig() {
  try {
    console.log('🔄 Loading config from Firebase...');
    const configRef = window.firebaseRef(window.firebaseDB, 'Config');
    
    // First, do an immediate GET to load config synchronously
    const configSnapshot = await window.firebaseGet(configRef);
    const configData = configSnapshot.val();
    
    if (configData) {
      processConfigData(configData);
    } else {
      console.warn('⚠️ No config data found in Firebase');
    }
    
    // Then set up listener for live updates
    window.firebaseOnValue(configRef, (snapshot) => {
      const configData = snapshot.val();
      if (configData) {
        processConfigData(configData);
      }
    });

    // Load driver profiles
    await loadDriverProfiles();

  } catch (err) {
    console.error('❌ loadConfig error', err);
  }
}

function processConfigData(configData) {
  const cfgArr = toArray(configData);
  const configMap = {};
  cfgArr.forEach(row => {
    const setting = row['Setting']?.trim();
    const value = row['Value']?.trim();
    if (setting && (value !== undefined)) configMap[setting] = value;
  });

  APPS_SCRIPT_URL = configMap['apps_script_url'];

  // Set admin username
  updateAdminUsername(configMap);

  // Build ALLOWED_USERS from config allowed_name_i, allowed_email_i, allowed_password_i
  const allowed = {};
  for (let i = 1; i <= 20; i++) {
    const name = configMap[`allowed_name_${i}`];
    const email = configMap[`allowed_email_${i}`];
    const password = configMap[`allowed_password_${i}`];
    if (name && password) {
      allowed[name] = { email: email || '', password };
    }
  }
  ALLOWED_USERS = allowed;
  CONFIG_LOADED = true;
  console.log('✅ Config loaded. Users:', Object.keys(ALLOWED_USERS).length);
  console.log('   Available users:', Object.keys(ALLOWED_USERS).join(', '));
  
  // Update UI to show config is ready
  updateLoginButtonState();
}

async function loadDriverProfiles() {
  const profilesRef = window.firebaseRef(window.firebaseDB, 'Driver_Profiles');
  
  // First, do immediate GET
  const profilesSnapshot = await window.firebaseGet(profilesRef);
  const profilesData = profilesSnapshot.val();
  
  if (profilesData) {
    processProfilesData(profilesData);
  }
  
  // Then set up listener for live updates
  window.firebaseOnValue(profilesRef, (snapshot) => {
    const profilesData = snapshot.val();
    if (profilesData) {
      processProfilesData(profilesData);
    }
  });
}

function processProfilesData(profilesData) {
  DRIVER_PROFILES = {};
  DRIVER_PROFILE_INDICES = {};
  
  profilesData.forEach((profile, index) => {
    const email = profile['Email']?.trim();
    if (email) {
      const usernameKey = encodeKey(profile['Name']?.trim() || '');
      
      DRIVER_PROFILES[email] = {
        name: profile['Name']?.trim() || '',
        surname: profile['Surname']?.trim() || '',
        number: profile['Number']?.toString() || '',
        photoUrl: profile['Photo_URL']?.trim() || '',
        bio: profile['Bio']?.trim() || '',
        equipment: profile['equipment'] || {}
      };
      
      // Also store by username key for easy lookup
      DRIVER_PROFILES[usernameKey] = DRIVER_PROFILES[email];
      
      // Track array index for saving
      DRIVER_PROFILE_INDICES[usernameKey] = index;
    }
  });

  console.log('✅ Driver profiles loaded. Count:', Object.keys(DRIVER_PROFILES).length);
}

function updateLoginButtonState() {
  const loginButton = document.getElementById('signInButton') || document.querySelector('button[onclick="login()"]');
  if (loginButton && CONFIG_LOADED) {
    loginButton.style.opacity = '1';
    loginButton.style.cursor = 'pointer';
    loginButton.disabled = false;
    loginButton.textContent = 'Sign In';
    loginButton.title = 'Ready to login';
  }
}
