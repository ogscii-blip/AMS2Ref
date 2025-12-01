/* =========================================================
   Profile: Load & Save (by username key)
   ========================================================= */

/* -----------------------------
   Profile: load & save (by username key)
   ----------------------------- */
async function loadProfile() {
  const profileContent = document.getElementById('profileContent');
  const profileWarning = document.getElementById('profileAuthWarning');
  if (!currentUser) { 
    profileWarning.style.display = 'block'; 
    profileContent.style.display = 'none'; 
    return; 
  }
  profileWarning.style.display = 'none'; 
  profileContent.style.display = 'block';

  const profile = DRIVER_PROFILES[encodeKey(currentUser.name)] || {};
  
  // Load basic profile
  document.getElementById('profileName').value = profile.name || '';
  document.getElementById('profileSurname').value = profile.surname || '';
  document.getElementById('profileNumber').value = profile.number || '';
  document.getElementById('profilePhotoUrl').value = profile.photoUrl || '';
  document.getElementById('profileBio').value = profile.bio || '';

  if (profile.photoUrl) {
    document.getElementById('photoPreviewImg').src = normalizePhotoUrl(profile.photoUrl);
    document.getElementById('photoPreview').style.display = 'block';
  }
  
  // Load equipment data (NEW)
  const equipment = profile.equipment || {};
  document.getElementById('equipWheel').value = equipment.wheel || '';
  document.getElementById('equipWheelImage').value = equipment.wheelImage || '';
  document.getElementById('equipWheelbase').value = equipment.wheelbase || '';
  document.getElementById('equipWheelbaseImage').value = equipment.wheelbaseImage || '';
  document.getElementById('equipPedals').value = equipment.pedals || '';
  document.getElementById('equipPedalsImage').value = equipment.pedalsImage || '';
  document.getElementById('equipShifter').value = equipment.shifter || '';
  document.getElementById('equipShifterImage').value = equipment.shifterImage || '';
  document.getElementById('equipCockpit').value = equipment.cockpit || '';
  document.getElementById('equipCockpitImage').value = equipment.cockpitImage || '';
  document.getElementById('equipSeat').value = equipment.seat || '';
  document.getElementById('equipSeatImage').value = equipment.seatImage || '';
  document.getElementById('equipOther').value = equipment.other || '';
  document.getElementById('equipOtherImage').value = equipment.otherImage || '';
  
  // Show image previews if URLs exist (NEW)
  if (equipment.wheelImage) showEquipmentPreview('wheel', equipment.wheelImage);
  if (equipment.wheelbaseImage) showEquipmentPreview('wheelbase', equipment.wheelbaseImage);
  if (equipment.pedalsImage) showEquipmentPreview('pedals', equipment.pedalsImage);
  if (equipment.shifterImage) showEquipmentPreview('shifter', equipment.shifterImage);
  if (equipment.cockpitImage) showEquipmentPreview('cockpit', equipment.cockpitImage);
  if (equipment.seatImage) showEquipmentPreview('seat', equipment.seatImage);
  if (equipment.otherImage) showEquipmentPreview('other', equipment.otherImage);
  
  // Load email preferences
  setTimeout(() => loadEmailPreferences(), 100);
}

document.getElementById('profileForm')?.addEventListener('submit', async function(e){
  e.preventDefault();
  if (!currentUser) { alert('Please sign in to update your profile'); return; }
  
  const messageDiv = document.getElementById('profileMessage'); 
  messageDiv.style.display = 'block'; 
  messageDiv.textContent = '⏳ Saving profile...';

  try {
    const profileData = {
      Name: document.getElementById('profileName').value.trim(),
      Surname: document.getElementById('profileSurname').value.trim(),
      Number: parseInt(document.getElementById('profileNumber').value),
      Photo_URL: document.getElementById('profilePhotoUrl').value.trim(),
      Bio: document.getElementById('profileBio').value.trim(),
      // NEW: Equipment data
      equipment: {
        wheel: document.getElementById('equipWheel').value.trim(),
        wheelImage: document.getElementById('equipWheelImage').value.trim(),
        wheelbase: document.getElementById('equipWheelbase').value.trim(),
        wheelbaseImage: document.getElementById('equipWheelbaseImage').value.trim(),
        pedals: document.getElementById('equipPedals').value.trim(),
        pedalsImage: document.getElementById('equipPedalsImage').value.trim(),
        shifter: document.getElementById('equipShifter').value.trim(),
        shifterImage: document.getElementById('equipShifterImage').value.trim(),
        cockpit: document.getElementById('equipCockpit').value.trim(),
        cockpitImage: document.getElementById('equipCockpitImage').value.trim(),
        seat: document.getElementById('equipSeat').value.trim(),
        seatImage: document.getElementById('equipSeatImage').value.trim(),
        other: document.getElementById('equipOther').value.trim(),
        otherImage: document.getElementById('equipOtherImage').value.trim()
      }
    };
    
    // Get email preferences
    const emailPrefs = {
      newRound: document.getElementById('email-newRound').checked,
      fastestLap: document.getElementById('email-fastestLap').checked,
      weeklyResults: document.getElementById('email-weeklyResults').checked
    };

    const usernameKey = encodeKey(currentUser.name);
    const arrayIndex = DRIVER_PROFILE_INDICES[usernameKey];
    
    let profileRef;
    
    if (arrayIndex !== undefined) {
      profileRef = window.firebaseRef(window.firebaseDB, `Driver_Profiles/${arrayIndex}`);
      const existingSnapshot = await window.firebaseGet(profileRef);
      const existingProfile = existingSnapshot.val() || {};
      
      await window.firebaseSet(profileRef, {
        Name: profileData.Name,
        Surname: profileData.Surname,
        Number: profileData.Number,
        Photo_URL: profileData.Photo_URL,
        Bio: profileData.Bio,
        Email: existingProfile.Email || '',
        emailNotifications: emailPrefs,
        equipment: profileData.equipment // NEW
      });
    } else {
      profileRef = window.firebaseRef(window.firebaseDB, `Driver_Profiles/${usernameKey}`);
      await window.firebaseSet(profileRef, {
        Name: profileData.Name,
        Surname: profileData.Surname,
        Number: profileData.Number,
        Photo_URL: profileData.Photo_URL,
        Bio: profileData.Bio,
        emailNotifications: emailPrefs,
        equipment: profileData.equipment // NEW
      });
    }

    DRIVER_PROFILES[usernameKey] = {
      name: profileData.Name,
      surname: profileData.Surname,
      number: String(profileData.Number),
      photoUrl: profileData.Photo_URL,
      bio: profileData.Bio,
      equipment: profileData.equipment // NEW
    };

    messageDiv.style.background='#d4edda'; 
    messageDiv.style.color='#155724'; 
    messageDiv.textContent='✅ Profile saved!';
    
    setTimeout(() => {
      messageDiv.style.display = 'none';
      const profile = DRIVER_PROFILES[usernameKey];
      const photoContainer = document.getElementById('userPhotoContainer');
      const photoElement = document.getElementById('userProfilePhoto');
      const numberBadge = document.getElementById('userNumberBadge');
      const iconFallback = document.getElementById('userIconFallback');
      if (profile && profile.photoUrl) {
        photoElement.src = normalizePhotoUrl(profile.photoUrl);
        numberBadge.textContent = profile.number || '?';
        photoContainer.style.display = 'block';
        iconFallback.style.display = 'none';
      }
    }, 2000);

  } catch (err) {
    console.error('profile save error', err);
    messageDiv.style.background='#f8d7da'; 
    messageDiv.style.color='#721c24'; 
    messageDiv.textContent='❌ ' + err.message;
  }
});

document.getElementById('photoFile')?.addEventListener('change', function(e) {
  const file = e.target.files[0];
  if (!file) return;
  if (!file.type.startsWith('image/')) { alert('Please select an image file'); return; }
  const reader = new FileReader();
  reader.onload = function(e) {
    document.getElementById('photoPreviewImg').src = e.target.result;
    document.getElementById('photoPreview').style.display = 'block';
    alert('⚠️ Photo upload to storage not yet implemented. Please upload to Google Drive and paste the sharing link in the Photo URL field.');
  };
  reader.readAsDataURL(file);
});

function showEquipmentPreview(equipmentType, imageUrl) {
  const previewImg = document.getElementById(`equipPreview_${equipmentType}_img`);
  const previewContainer = document.getElementById(`equipPreview_${equipmentType}`);
  
  if (previewImg && previewContainer && imageUrl) {
    previewImg.src = normalizePhotoUrl(imageUrl);
    previewContainer.style.display = 'block';
  }
}

