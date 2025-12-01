/* =========================================================
   AMS2 Racing League - Main Script Entry Point
   This file loads all JavaScript modules in the correct order
   ========================================================= */

// Core modules (load first - no dependencies)
import './js/helpers.js';
import './js/state.js';

// Configuration and Firebase listeners
import './js/config.js';

// UI and Navigation
import './js/navigation.js';
import './js/dom.js';
import './js/utils.js';

// Data handling
import './js/seasons.js';
import './js/leaderboard.js';
import './js/rounds.js';
import './js/setup.js';

// Features
import './js/charts.js';
import './js/race-animation.js';
import './js/drivers.js';
import './js/profile.js';
import './js/submission.js';
import './js/admin.js';

// Authentication (load last)
import './js/auth.js';

console.log('✅ All AMS2 Racing League modules loaded successfully!');
