// src/layout/maincontent.js
import { renderProjectDialog, renderTagDialog, renderCalendarDialog, renderCreateTaskModal, renderCreateProjectModal, renderBulkEditModal } from './dialogs.js'; // Added renderBulkEditModal
import { addTimeEntry, loadEntries, formatDuration, parseDuration, toggleBulkEditMode, isBulkEditModeActive, updateLiveTotalsForRunningTimer } from './entrylist.js'; // Added isBulkEditModeActive
import { showToast } from './sidebar.js'; // Import showToast

let isTimerRunning = false;
let timerInterval = null;
let seconds = 0;
let currentTimerEntryId = null; // To store the ID of the entry being timed
let currentProjectName = 'Project'; // State for currently selected project in timer/manual mode
let currentProjectColor = '#ccc'; // Default grey color for 'No Project'
let currentTaskName = null; // State for currently selected task name
let currentTags = []; // State for currently selected tags in timer/manual mode
let isBillable = false; // State for billable status

// Helper to get current time in HH:MM (24-hour) format
const getCurrentTime = () => {
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

const getCurrentDateISO = () => {
  return new Date().toLocaleDateString('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '-');
};

export function renderMainContent(parentEl) {
  const mainContent = document.createElement('div');
  mainContent.className = 'app__main';
  mainContent.innerHTML = `
    <div class="timer-section" id="timer-section"></div>
    <div class="entry-list-container" id="entry-list-container"></div>
  `;
  parentEl.appendChild(mainContent);

  const timerSection = document.getElementById('timer-section');

  // Initial HTML for timer mode, reflecting current state
  const timerModeHTML = `
    <div class="timer-mode" id="timer-mode">
      <input type="text" class="timer__input" id="timer-input" placeholder="What are you working on?">
      <div class="timer__controls">
        <div class="timer__project-container">
          <button class="timer__icon-button timer__project-button" id="project-button">
            <img src="assets/icons/plus-blue.svg" alt="Add Project" class="project-add-icon" style="display: ${currentProjectName === 'Project' || currentProjectName === 'No Project' ? 'inline-block' : 'none'}; width: 20px; height: 20px; margin-right: 5px;">
            <span class="project-color-dot" style="background-color: ${currentProjectColor}; display: ${currentProjectName === 'Project' || currentProjectName === 'No Project' ? 'none' : 'inline-block'};"></span>
            <span style="color: ${currentProjectName === 'Project' || currentProjectName === 'No Project' ? 'var(--text-color)' : currentProjectColor};">${currentProjectName}</span>
          </button>
        </div>
        <div class="timer__separator"></div>
        <div class="timer__tags-container">
          <button class="timer__icon-button" id="tags-button">
            <img src="assets/icons/tags.svg" alt="Tags">
            <span class="tags-display">${currentTags.length > 0 ? currentTags.join(', ') : ''}</span>
          </button>
        </div>
        <div class="timer__separator"></div>
        <div class="timer__billable-container">
          <button class="timer__icon-button timer__billable-button ${isBillable ? 'billable-active' : ''}" id="billable-button">$</button>
        </div>
        <div class="timer__separator"></div>
        <div class="timer__time-display" id="timer-display">00:00:00</div>
        <button class="timer__action-button timer__action-button--start" id="timer-action-button">START</button>
      </div>
      <div class="timer__right-icons">
        <img src="assets/icons/clock-blue.svg" alt="Clock" class="timer__mode-icon timer__mode-icon--active" id="mode-timer-icon">
        <img src="assets/icons/list-gray.svg" alt="List" class="timer__mode-icon" id="mode-manual-icon">
      </div>
    </div>
  `;

  // Initial HTML for manual mode, reflecting current state
  const manualModeHTML = `
    <div class="manual-mode hidden" id="manual-mode">
      <input type="text" class="manual__input" id="manual-input" placeholder="What have you worked on?">
      <div class="manual__controls">
        <div class="manual__project-container">
          <button class="manual__icon-button manual__project-button" id="manual-project-button">
            <img src="assets/icons/plus-blue.svg" alt="Add Project" class="project-add-icon" style="display: ${currentProjectName === 'Project' || currentProjectName === 'No Project' ? 'inline-block' : 'none'}; width: 20px; height: 20px; margin-right: 5px;">
            <span class="project-color-dot" style="background-color: ${currentProjectColor}; display: ${currentProjectName === 'Project' || currentProjectName === 'No Project' ? 'none' : 'inline-block'};"></span>
            <span style="color: ${currentProjectName === 'Project' || currentProjectName === 'No Project' ? 'var(--text-color)' : currentProjectColor};">${currentProjectName}</span>
          </button>
        </div>
        <div class="manual__separator"></div>
        <div class="manual__tags-container">
          <button class="manual__icon-button" id="manual-tags-button">
            <img src="assets/icons/tags.svg" alt="Tags">
            <span class="tags-display">${currentTags.length > 0 ? currentTags.join(', ') : ''}</span>
          </button>
        </div>
        <div class="manual__separator"></div>
        <div class="manual__billable-container">
          <button class="manual__icon-button manual__billable-button ${isBillable ? 'billable-active' : ''}" id="manual-billable-button">$</button>
        </div>
        <div class="manual__separator"></div>
        <div class="manual__time-pickers">
          <input type="time" class="manual__time-input" id="start-time-input" step="60">
          <span>-</span>
          <input type="time" class="manual__time-input" id="end-time-input" step="60">
        </div>
        <div class="manual__separator"></div>
        <div class="manual__date-picker">
          <button class="manual__icon-button" id="date-picker-button">
            <img src="assets/icons/calendar.svg" alt="Calendar">
            <span>Today</span>
          </button>
        </div>
        <div class="manual__separator"></div>
        <div class="manual__duration-display" id="duration-display">00:00:00</div>
        <button class="manual__action-button" id="add-manual-entry">ADD</button>
      </div>
      <div class="manual__right-icons">
        <img src="assets/icons/clock-blue.svg" alt="Clock" class="manual__mode-icon" id="mode-timer-icon-manual">
        <img src="assets/icons/list-gray.svg" alt="List" class="manual__mode-icon manual__mode-icon--active" id="mode-manual-icon-manual">
      </div>
    </div>
  `;

  timerSection.innerHTML = timerModeHTML + manualModeHTML;

  const timerMode = document.getElementById('timer-mode');
  const manualMode = document.getElementById('manual-mode');
  const modeManualIcon = document.getElementById('mode-manual-icon');
  const modeTimerIconManual = document.getElementById('mode-timer-icon-manual');

  const timerInput = document.getElementById('timer-input');
  const timerDisplay = document.getElementById('timer-display');
  const timerActionButton = document.getElementById('timer-action-button');
  const timerBillableButton = document.getElementById('billable-button');
  const timerProjectButton = document.getElementById('project-button');
  const timerTagsButton = document.getElementById('tags-button');
  

  const manualInput = document.getElementById('manual-input');
  const startTimeInput = document.getElementById('start-time-input');
  const endTimeInput = document.getElementById('end-time-input');
  const durationDisplay = document.getElementById('duration-display');
  const manualBillableButton = document.getElementById('manual-billable-button');
  const manualProjectButton = document.getElementById('manual-project-button');
  const manualTagsButton = document.getElementById('manual-tags-button');
  const addManualEntryButton = document.getElementById('add-manual-entry');
  const datePickerButton = document.getElementById('date-picker-button');
  const datePickerSpan = datePickerButton.querySelector('span');
  let isManualBillable = false;
  let selectedDate = new Date().toLocaleDateString('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '-'); // Default to today in YYYY-MM-DD local

  // Set initial time for manual mode inputs to current time in 24-hour format
  startTimeInput.value = getCurrentTime();
  endTimeInput.value = getCurrentTime();

  const updateTimerDisplay = () => {
    timerDisplay.textContent = formatDuration(seconds);
  };

  const updateProjectDisplay = (projectBtn, name, color, taskName = null) => {
    let dot = projectBtn.querySelector('.project-color-dot');
    let span = projectBtn.querySelector('span');
    let addIcon = projectBtn.querySelector('.project-add-icon');
    
    // Ensure elements exist, though they should be in the initial HTML
    if (!dot) {
      dot = document.createElement('span');
      dot.className = 'project-color-dot';
      projectBtn.prepend(dot); 
    }
    if (!span) {
      span = document.createElement('span');
      projectBtn.appendChild(span);
    }
    if (!addIcon) {
      addIcon = document.createElement('img');
      addIcon.src = 'assets/icons/plus-blue.svg';
      addIcon.alt = 'Add Project';
      addIcon.className = 'project-add-icon';
      addIcon.style.width = '20px'; 
      addIcon.style.height = '20px';
      addIcon.style.marginRight = '5px';
      projectBtn.prepend(addIcon); 
    }
    
    // Update color dot and text color based on project selection
    dot.style.backgroundColor = color || '#ccc'; 
    span.style.color = (name === 'Project' || name === 'No Project') ? 'var(--text-color)' : (color || 'var(--text-color)'); 
    span.textContent = taskName ? `${name || 'Project'}: ${taskName}` : (name || 'Project');

    // Toggle visibility of the add icon and color dot
    if (name === 'Project' || name === 'No Project') { 
      addIcon.style.display = 'inline-block';
      dot.style.display = 'none'; 
    } else { 
      addIcon.style.display = 'none';
      dot.style.display = 'inline-block'; 
    }
  };

  const updateTagsDisplay = (tagsBtn, tags) => {
    let span = tagsBtn.querySelector('.tags-display');
    if (!span) {
      span = document.createElement('span');
      span.className = 'tags-display';
      tagsBtn.appendChild(span);
    }
    span.textContent = tags.length > 0 ? tags.join(', ') : '';
  };


  const startTimer = (initialSeconds = 0, entryToResume = null) => {
    if (isTimerRunning) {
      stopTimer();
    }

    isTimerRunning = true;
    seconds = initialSeconds;
    currentTimerEntryId = entryToResume ? entryToResume.id : null;

    timerActionButton.textContent = 'STOP';
    timerActionButton.classList.remove('timer__action-button--start');
    timerActionButton.classList.add('timer__action-button--stop');
    timerInput.classList.add('timer__input--active');
    
    // If resuming an entry, pre-fill the description and billable status
    if (entryToResume) {
      timerInput.value = entryToResume.description; // Description is general description
      currentProjectName = entryToResume.project || 'Project'; // Set current project from resumed entry
      currentProjectColor = entryToResume.projectColor || '#ccc'; // Set project color
      currentTaskName = entryToResume.taskName || null; // Set current task name
      updateProjectDisplay(timerProjectButton, currentProjectName, currentProjectColor, currentTaskName);

      currentTags = entryToResume.tags || []; // Set current tags
      updateTagsDisplay(timerTagsButton, currentTags);

      isBillable = entryToResume.isBillable; // Carry forward billable state
      timerBillableButton.classList.toggle('billable-active', isBillable);
    } else {
      // For a brand new timer, ensure the UI reflects the current state variables
      // (which would have been updated by dialog selections if any)
      updateProjectDisplay(timerProjectButton, currentProjectName, currentProjectColor, currentTaskName);
      updateTagsDisplay(timerTagsButton, currentTags);
      timerBillableButton.classList.toggle('billable-active', isBillable);
    }

    timerInterval = setInterval(() => {
      seconds++;
      updateTimerDisplay();

      // --- LIVE UPDATE WEEK AND DAY TOTALS ---
      const runningDate = getCurrentDateISO();
      updateLiveTotalsForRunningTimer(runningDate, seconds);
      // --------------------------------------
    }, 1000);
  };

  const stopTimer = () => {
    if (!isTimerRunning) return;

    isTimerRunning = false;
    clearInterval(timerInterval);

    const sessionEndTime = new Date();
    // Calculate the actual start time of this *session* based on current seconds
    const sessionStartTime = new Date(sessionEndTime.getTime() - seconds * 1000); 

    const newEntry = {
      id: Date.now(), // Unique ID for the new entry
      description: timerInput.value || '', // Main input is for general description
      project: currentProjectName, // Use current project state
      projectColor: currentProjectColor, // Store project color
      taskName: currentTaskName, // Store task name separately
      tags: currentTags, // Use current tags state
      isBillable: isBillable,
      date: sessionEndTime.toLocaleDateString('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '-'), // Date of the entry (YYYY-MM-DD local)
      // Ensure times are in HH:MM (24-hour) format
      startTime: `${sessionStartTime.getHours().toString().padStart(2, '0')}:${sessionStartTime.getMinutes().toString().padStart(2, '0')}`,
      endTime: `${sessionEndTime.getHours().toString().padStart(2, '0')}:${sessionEndTime.getMinutes().toString().padStart(2, '0')}`,
      duration: formatDuration(seconds),
      // If this was a continuation of an existing entry, link it as a sub-entry
      parentId: currentTimerEntryId // This will be null if it's a new main entry
    };
    
    console.log("New entry created in stopTimer:", newEntry); // Debugging log
    addTimeEntry(newEntry);
    showToast('Time entry added successfully!');

    // --- After stopping, update totals one last time ---
    const runningDate = getCurrentDateISO();
    updateLiveTotalsForRunningTimer(runningDate, 0);
    // ---------------------------------------------------

    // Reset timer UI inputs for the *next* fresh entry
    timerActionButton.textContent = 'START';
    timerActionButton.classList.remove('timer__action-button--stop');
    timerActionButton.classList.add('timer__action-button--start');
    timerInput.classList.remove('timer__input--active');
    seconds = 0;
    updateTimerDisplay();
    timerInput.value = '';
    
    // Reset the internal state variables for the *next* fresh entry
    currentTimerEntryId = null; 
    isBillable = false; 
    timerBillableButton.classList.remove('billable-active');
    currentProjectName = 'Project'; 
    currentProjectColor = '#ccc'; 
    currentTaskName = null; 
    updateProjectDisplay(timerProjectButton, currentProjectName, currentProjectColor, currentTaskName);
    currentTags = []; 
    updateTagsDisplay(timerTagsButton, currentTags);
  };

  const calculateDuration = () => {
    const [startH, startM] = startTimeInput.value.split(':').map(Number);
    const [endH, endM] = endTimeInput.value.split(':').map(Number);
    let durationInMinutes = (endH * 60 + endM) - (startH * 60 + startM);
    if (durationInMinutes < 0) {
      durationInMinutes += 24 * 60; // Handle overnight entries
    }
    durationDisplay.textContent = formatDuration(durationInMinutes * 60);
  };

  const addManualEntry = () => {
    const newEntry = {
      id: Date.now(),
      description: manualInput.value || '', // Main input is for general description
      project: currentProjectName, // Use current project state
      projectColor: currentProjectColor, // Store project color
      taskName: currentTaskName, // Store task name separately
      tags: currentTags, // Use current tags state
      isBillable: isManualBillable,
      date: selectedDate, // YYYY-MM-DD format (local)
      startTime: startTimeInput.value, // HH:MM format
      endTime: endTimeInput.value,     // HH:MM format
      duration: durationDisplay.textContent
    };
    addTimeEntry(newEntry); // Add the new entry to the list and save to localStorage
    showToast('Manual entry added successfully!'); // Show toast notification

    // Reset manual mode UI inputs for the *next* fresh entry
    manualInput.value = '';
    startTimeInput.value = getCurrentTime(); // Set to current time in 24hr format
    endTimeInput.value = getCurrentTime();   // Set to current time in 24hr format
    datePickerSpan.textContent = 'Today';
    selectedDate = new Date().toLocaleDateString('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '-'); // Reset to today's local date
    calculateDuration();

    // Reset the internal state variables for the *next* fresh entry
    isManualBillable = false; 
    manualBillableButton.classList.remove('billable-active');
    currentProjectName = 'Project'; 
    currentProjectColor = '#ccc'; 
    currentTaskName = null; 
    updateProjectDisplay(manualProjectButton, currentProjectName, currentProjectColor, currentTaskName);
    currentTags = []; 
    updateTagsDisplay(manualTagsButton, currentTags);
  };

  // Event Listeners for Timer/Manual Mode
  timerActionButton.addEventListener('click', () => {
    if (isTimerRunning) {
      stopTimer();
    } else {
      startTimer();
    }
  });

  addManualEntryButton.addEventListener('click', addManualEntry);

  timerBillableButton.addEventListener('click', () => {
    isBillable = !isBillable;
    timerBillableButton.classList.toggle('billable-active', isBillable);
    showToast(`Billable status ${isBillable ? 'enabled' : 'disabled'}.`);
  });
  manualBillableButton.addEventListener('click', () => {
    isManualBillable = !isManualBillable;
    manualBillableButton.classList.toggle('billable-active', isManualBillable);
    showToast(`Billable status ${isManualBillable ? 'enabled' : 'disabled'}.`);
  });

  modeManualIcon.addEventListener('click', () => {
    timerMode.classList.add('hidden');
    manualMode.classList.remove('hidden');
    if (isTimerRunning) {
      stopTimer(); // Stop timer if switching modes while it's running
    }
    showToast('Switched to manual mode.');
  });
  modeTimerIconManual.addEventListener('click', () => {
    manualMode.classList.add('hidden');
    timerMode.classList.remove('hidden');
    showToast('Switched to timer mode.');
  });

  startTimeInput.addEventListener('change', calculateDuration);
  endTimeInput.addEventListener('change', calculateDuration);
  calculateDuration(); // Calculate initial duration on load

  // Event listener for starting timer from an existing entry (from entrylist.js)
  document.addEventListener('startExistingTimer', (event) => {
    const { id, description, project, projectColor, tags, isBillable: entryIsBillable, durationSeconds, taskName } = event.detail;
    // Set the timer input and billable status from the existing entry
    timerInput.value = description; // This will be the general description
    currentProjectName = project || 'Project'; // Update current project state
    currentProjectColor = projectColor || '#ccc'; // Update current project color
    currentTaskName = taskName || null; // Update current task name
    updateProjectDisplay(timerProjectButton, currentProjectName, currentProjectColor, currentTaskName);
    currentTags = tags || []; // Update current tags state
    updateTagsDisplay(timerTagsButton, currentTags);
    isBillable = entryIsBillable; // Ensure billable state is transferred
    timerBillableButton.classList.toggle('billable-active', isBillable);
    startTimer(durationSeconds, { id, description, project, projectColor, tags, isBillable: entryIsBillable, taskName }); // Pass the entry details
    // Switch to timer mode if not already there
    manualMode.classList.add('hidden');
    timerMode.classList.remove('hidden');
    showToast('Timer resumed successfully!'); // Show toast notification
  });

  // Dialog button event listeners
  document.getElementById('project-button').addEventListener('click', (e) => {
    e.preventDefault();
    renderProjectDialog(e.currentTarget, (projectId, projectName, taskName, projectColor) => {
      currentProjectName = projectName; // Update state
      currentProjectColor = projectColor; // Update state
      currentTaskName = taskName; // Update task name state (will be null if project only selected)
      updateProjectDisplay(e.currentTarget, projectName, projectColor, taskName); // Update UI
      showToast('Project updated!'); // Show toast notification
    });
  });
  document.getElementById('manual-project-button').addEventListener('click', (e) => {
    e.preventDefault();
    renderProjectDialog(e.currentTarget, (projectId, projectName, taskName, projectColor) => {
      currentProjectName = projectName; // Update state
      currentProjectColor = projectColor; // Update state
      currentTaskName = taskName; // Update task name state (will be null if project only selected)
      updateProjectDisplay(e.currentTarget, projectName, projectColor, taskName); // Update UI
      showToast('Project updated!'); // Show toast notification
    });
  });
  document.getElementById('tags-button').addEventListener('click', (e) => {
    e.preventDefault();
    timerTagsButton.dataset.selectedTags = JSON.stringify(currentTags); // Pass current tags to dialog
    renderTagDialog(e.currentTarget, (selectedTags) => {
      currentTags = selectedTags; // Update state
      updateTagsDisplay(timerTagsButton, currentTags); // Update UI
      showToast('Tags updated!'); // Show toast notification
    });
  });
  document.getElementById('manual-tags-button').addEventListener('click', (e) => {
    e.preventDefault();
    manualTagsButton.dataset.selectedTags = JSON.stringify(currentTags); // Pass current tags to dialog
    renderTagDialog(e.currentTarget, (selectedTags) => {
      currentTags = selectedTags; // Update state
      updateTagsDisplay(manualTagsButton, currentTags); // Update UI
      showToast('Tags updated!'); // Show toast notification
    });
  });
  datePickerButton.addEventListener('click', (e) => {
    e.preventDefault();
    renderCalendarDialog(e.currentTarget, (selectedDateISO) => {
      selectedDate = selectedDateISO;
      // Convert YYYY-MM-DD to a more readable format like "Mon, Jul 29" for display
      const dateObj = new Date(selectedDateISO + 'T00:00:00'); // Add T00:00:00 to avoid timezone issues
      const options = { weekday: 'short', month: 'short', day: 'numeric' };
      datePickerSpan.textContent = dateObj.toLocaleDateString('en-US', options);
      calculateDuration(); // Recalculate duration if date changes
      showToast('Date updated!'); // Show toast notification
    });
  });

  // Explicitly update project display for initial render after elements are in DOM
  // This ensures the project name and color are correct from the start.
  updateProjectDisplay(document.getElementById('project-button'), currentProjectName, currentProjectColor, currentTaskName);
  updateProjectDisplay(document.getElementById('manual-project-button'), currentProjectName, currentProjectColor, currentTaskName);


  // Load entries when main content is rendered and ready
  loadEntries();
}
