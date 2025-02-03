document.addEventListener('DOMContentLoaded', () => {
  const createBackupBtn = document.getElementById('createBackupBtn');
  const restoreBackupInput = document.getElementById('restoreBackupInput');
  const restoreBackupBtn = document.getElementById('restoreBackupBtn');
  
  // Email Sync Elements
  const emailSyncInput = document.getElementById('emailSync');
  const syncFrequencySelect = document.getElementById('syncFrequency');
  const saveSyncSettingsBtn = document.getElementById('saveSyncSettingsBtn');
  
  // New Email Management Elements
  const currentSavedEmail = document.getElementById('currentSavedEmail');
  const savedEmailDisplay = document.getElementById('savedEmailDisplay');
  const emailInputContainer = document.getElementById('emailInputContainer');
  const editEmailBtn = document.getElementById('editEmailBtn');
  const deleteEmailBtn = document.getElementById('deleteEmailBtn');
  const saveEmailBtn = document.getElementById('saveEmailBtn');
  const syncNowBtn = document.getElementById('syncNowBtn');

  // Backup Functionality
  createBackupBtn.addEventListener('click', () => {
    const backupData = {
      projects: JSON.parse(localStorage.getItem('smartDesignProjects') || '[]'),
      largeProjects: JSON.parse(localStorage.getItem('smartDesignLargeProjects') || '[]'),
      projectSheets: JSON.parse(localStorage.getItem('projectSheets') || '[]'),
      projectSheetSections: JSON.parse(localStorage.getItem('projectSheetSections') || '[]')
    };

    const blob = new Blob([JSON.stringify(backupData)], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `smartdesign_backup_${new Date().toISOString().replace(/:/g, '-')}.smartdesign`;
    a.click();
    URL.revokeObjectURL(url);
  });

  // Restore Functionality
  restoreBackupBtn.addEventListener('click', () => {
    const file = restoreBackupInput.files[0];
    if (!file) {
      alert('Please select a backup file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const backupData = JSON.parse(e.target.result);
        
        // Restore data
        localStorage.setItem('smartDesignProjects', JSON.stringify(backupData.projects));
        localStorage.setItem('smartDesignLargeProjects', JSON.stringify(backupData.largeProjects));
        localStorage.setItem('projectSheets', JSON.stringify(backupData.projectSheets));
        localStorage.setItem('projectSheetSections', JSON.stringify(backupData.projectSheetSections));
        
        alert('Backup successfully restored!');
        window.location.reload();
      } catch (error) {
        alert('Invalid backup file');
        console.error(error);
      }
    };
    reader.readAsText(file);
  });

  // Email Management Functions
  function initializeEmailSettings() {
    const savedEmail = localStorage.getItem('syncEmail');
    const savedSyncFrequency = localStorage.getItem('syncFrequency');

    if (savedEmail) {
      currentSavedEmail.textContent = savedEmail;
      savedEmailDisplay.style.display = 'flex';
      emailInputContainer.style.display = 'none';
    } else {
      currentSavedEmail.textContent = 'No email saved';
      savedEmailDisplay.style.display = 'none';
      emailInputContainer.style.display = 'block';
    }

    if (savedSyncFrequency) {
      syncFrequencySelect.value = savedSyncFrequency;
    }
  }

  // Edit Email Button
  editEmailBtn.addEventListener('click', () => {
    emailSyncInput.value = currentSavedEmail.textContent;
    savedEmailDisplay.style.display = 'none';
    emailInputContainer.style.display = 'block';
  });

  // Delete Email Button
  deleteEmailBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to delete the saved email?')) {
      localStorage.removeItem('syncEmail');
      initializeEmailSettings();
    }
  });

  // Save Email Button
  saveEmailBtn.addEventListener('click', () => {
    const email = emailSyncInput.value.trim();
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      alert('Please enter a valid email address');
      return;
    }

    localStorage.setItem('syncEmail', email);
    initializeEmailSettings();
  });

  // Sync Now Button
  syncNowBtn.addEventListener('click', () => {
    const savedEmail = localStorage.getItem('syncEmail');
    
    if (!savedEmail) {
      alert('Please save an email address first');
      return;
    }

    // Create backup data
    const backupData = {
      projects: JSON.parse(localStorage.getItem('smartDesignProjects') || '[]'),
      largeProjects: JSON.parse(localStorage.getItem('smartDesignLargeProjects') || '[]'),
      projectSheets: JSON.parse(localStorage.getItem('projectSheets') || '[]'),
      projectSheetSections: JSON.parse(localStorage.getItem('projectSheetSections') || '[]')
    };

    const backupFileName = `smartdesign_backup_${new Date().toISOString().replace(/:/g, '-')}.smartdesign`;
    const backupBlob = new Blob([JSON.stringify(backupData)], {type: 'application/json'});

    // Simulate email send (in a real app, this would use a backend email service)
    const emailSubject = encodeURIComponent('Your Smart Design Application Backup');
    const emailBody = encodeURIComponent(`
      Hello,

      Please find attached your Smart Design application backup file.
      
      Backup created on: ${new Date().toLocaleString()}
      
      Note: To restore this backup, go to the app's Settings and use the "Restore Backup" feature.

      Best regards,
      Smart Design Team
    `);

    // Simulate email with mailto link (for demonstration)
    const mailtoLink = `mailto:${savedEmail}?subject=${emailSubject}&body=${emailBody}`;
    
    // Create a temporary link to trigger file download
    const url = URL.createObjectURL(backupBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = backupFileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    // Open email client
    window.open(mailtoLink);
    
    alert(`Backup file created and email prepared to be sent to ${savedEmail}`);
  });

  // Synchronization Settings
  saveSyncSettingsBtn.addEventListener('click', () => {
    const savedEmail = localStorage.getItem('syncEmail');
    const frequency = syncFrequencySelect.value;

    if (!savedEmail) {
      alert('Please save an email address first');
      return;
    }

    localStorage.setItem('syncFrequency', frequency);
    alert('Synchronization settings saved successfully!');

    // Start or update sync process
    startAutomaticSync(savedEmail, parseInt(frequency));
  });

  function startAutomaticSync(email, frequency) {
    // Stop any existing sync interval
    const existingInterval = localStorage.getItem('syncInterval');
    if (existingInterval) {
      clearInterval(parseInt(existingInterval));
    }

    // Start new sync interval
    const syncInterval = setInterval(() => {
      if (navigator.onLine) {
        performSync(email);
      }
    }, frequency);

    // Store interval to allow stopping later if needed
    localStorage.setItem('syncInterval', syncInterval.toString());
  }

  function performSync(email) {
    const syncData = {
      projects: JSON.parse(localStorage.getItem('smartDesignProjects') || '[]'),
      largeProjects: JSON.parse(localStorage.getItem('smartDesignLargeProjects') || '[]'),
      projectSheets: JSON.parse(localStorage.getItem('projectSheets') || '[]')
    };

    // Placeholder: In a real app, this would send data to a cloud service
    console.log('Syncing data:', syncData);
    // Example cloud sync would involve an API call here
  }

  // Initialize settings on page load
  initializeEmailSettings();
});