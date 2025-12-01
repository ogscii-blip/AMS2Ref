/* =========================================================
   Global Application State
   ========================================================= */

/* -----------------------------
   Global app state
   ----------------------------- */
let ALLOWED_USERS = {};      // { username: { email, password } } - email may be empty in your config
let DRIVER_PROFILES = {};    // { usernameKey: { name, surname, number, photoUrl, bio } }
let DRIVER_PROFILE_INDICES = {}; // { usernameKey: arrayIndex } - for array-based storage
let APPS_SCRIPT_URL = null;
let currentUser = null;      // { name: username, email? }

// Admin filter state
let currentAdminFilters = {
  driver: '',
  season: '',
  round: ''
};

let adminSortAscending = true;
let currentAdminTab = 'time-submissions';

