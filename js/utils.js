/* =========================================================
   Small Utilities & Initialization
   ========================================================= */

/* -----------------------------
   Small utilities & init
   ----------------------------- */
function wait(ms) { return new Promise(res => setTimeout(res, ms)); }
function waitFor(predicate, timeout = 3000) {
  return new Promise(resolve => {
    const start = Date.now();
    const id = setInterval(()=> {
      if (predicate()) { clearInterval(id); resolve(true); }
      else if (Date.now() - start > timeout) { clearInterval(id); resolve(false); }
    }, 80);
  });
}

/* -----------------------------
   Basic DOM helpers (sector inputs etc.)
   ----------------------------- */
function setupSectorTimeInputs() {
  const sectorInputs = document.querySelectorAll('.time-input-split-field');
  sectorInputs.forEach(input => {
    input.addEventListener('input', function(e) {
      const maxLen = parseInt(this.getAttribute('maxlength'));
      if (this.value.length >= maxLen) {
        const nextInput = this.nextElementSibling?.nextElementSibling;
        if (nextInput && nextInput.classList.contains('time-input-split-field')) nextInput.focus();
      }
    });
    input.addEventListener('keydown', function(e) {
      if (e.key === 'Backspace' && this.value.length === 0) {
        const prevInput = this.previousElementSibling?.previousElementSibling;
        if (prevInput && prevInput.classList.contains('time-input-split-field')) {
          prevInput.focus();
          prevInput.setSelectionRange(prevInput.value.length, prevInput.value.length);
        }
      }
    });
  });
}

function handleResponsiveUI() {
  const desktopLogo = document.getElementById('desktopLogo');
  const mobileLogo = document.getElementById('mobileLogo');
  if (window.innerWidth <= 480) {
    if (desktopLogo) desktopLogo.style.display = 'none';
    if (mobileLogo) mobileLogo.style.display = 'block';
  } else {
    if (desktopLogo) desktopLogo.style.display = 'block';
    if (mobileLogo) mobileLogo.style.display = 'none';
  }
}

window.addEventListener('resize', handleResponsiveUI);

document.addEventListener('DOMContentLoaded', function() {
  updateSubmitTabVisibility();
  handleResponsiveUI();
  
  const passwordInput = document.getElementById('passwordInput');
  const driverNameInput = document.getElementById('driverNameInput');
  
  if (passwordInput) {
    passwordInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') login();
    });
  }
  
  if (driverNameInput) {
    driverNameInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') login();
    });
  }

  if (window.innerWidth <= 480) {
    const leaderboardBody = document.getElementById('leaderboard-body');
    if (leaderboardBody) {
      leaderboardBody.addEventListener('click', function(e) {
        const row = e.target.closest('tr');
        if (row) {
