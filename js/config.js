/* =========================================================
   Configuration & Firebase Listeners
   ========================================================= */

/* -----------------------------
   Config & initial listeners
   ----------------------------- */
async function loadConfig() {
  try {
    const configRef = window.firebaseRef(window.firebaseDB, 'Config');
    // Use onValue to keep ALLOWED_USERS updated live
    window.firebaseOnValue(configRef, (snapshot) => {
      const configData = snapshot.val();
      if (!configData) return;

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
      console.log('Config loaded. Users:', Object.keys(ALLOWED_USERS).length);
    });

    // Load driver profiles (object keyed by username if available)
    // We'll use onValue so profile edits are reflected live
const profilesRef = window.firebaseRef(window.firebaseDB, 'Driver_Profiles');
window.firebaseOnValue(profilesRef, (snapshot) => {
    const profilesData = snapshot.val();
    if (!profilesData) return;

    DRIVER_PROFILES = {};
    DRIVER_PROFILE_INDICES = {}; // Also track array indices
    
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
                equipment: profile['equipment'] || {}  // ✅ INCLUDE EQUIPMENT
            };
            
            // Also store by username key for easy lookup
            DRIVER_PROFILES[usernameKey] = DRIVER_PROFILES[email];
            
            // Track array index for saving
            DRIVER_PROFILE_INDICES[usernameKey] = index;
        }
    });

    console.log('Driver profiles loaded from Firebase:', Object.keys(DRIVER_PROFILES).length);
});

  } catch (err) {
    console.error('loadConfig error', err);
  }
}

