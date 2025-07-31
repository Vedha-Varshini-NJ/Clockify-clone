// src/layout/entrylist.js
import { renderProjectDialog, renderTagDialog, renderCalendarDialog, renderConfirmModal, renderBulkEditModal } from './dialogs.js';
import { showToast } from './sidebar.js';

const localStorageKey = 'clockifyTimeEntries';
let timeEntries = [];
let selectedEntryIds = new Set();
export let isBulkEditModeActive = false;

// Console log to confirm this file is being loaded and exports are available
console.log('entrylist.js loaded. Exports: formatDuration, parseDuration, refreshWeeklyTotalDisplay, getFirstSelectedEntryBillableState, bulkEditSelected, updateRunningEntryDuration, loadEntries, addTimeEntry, updateTimeEntry, deleteTimeEntry, duplicateTimeEntry, toggleBulkEditMode');


export const formatDuration = (totalSeconds) => {
  const h = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
  const m = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
  const s = (totalSeconds % 60).toString().padStart(2, '0');
  return `${h}:${m}:${s}`;
};

export const parseDuration = (durationStr) => {
  const parts = durationStr.split(':').map(Number);
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  } else if (parts.length === 2) {
    return parts[0] * 3600 + parts[1] * 60;
  }
  return 0;
};

const formatDateForHeader = (dateString) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const date = new Date(dateString);
  date.setHours(0, 0, 0, 0);
  if (date.getTime() === today.getTime()) {
    return 'Today';
  } else if (date.getTime() === yesterday.getTime()) {
    return 'Yesterday';
  } else {
    return `${date.toLocaleString('default', { weekday: 'short'})}, ${date.toLocaleString('default', { month: 'short' })} ${date.getDate()}`;
  }
};

const getWeekRange = (dateString) => {
  const d = new Date(dateString);
  d.setHours(0, 0, 0, 0);
  const monday = new Date(d);
  // Adjust to Monday if current day is not Monday (Sunday = 0, Monday = 1, ..., Saturday = 6)
  const dayOfWeek = d.getDay(); // 0 for Sunday, 1 for Monday
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  monday.setDate(d.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(0, 0, 0, 0);

  const format = (dt) => {
    const m = dt.toLocaleString('default', { month: 'short' });
    const day = dt.getDate();
    return `${m} ${day}`;
  };
  return `${format(monday)} - ${format(sunday)}`;
};

const getWeekTotal = (entries) => {
  const weekTotalSeconds = entries.reduce((total, entry) => total + parseDuration(entry.duration), 0);
  return formatDuration(weekTotalSeconds);
};

const getDayTotal = (entries, date) => {
  const dayEntries = entries.filter(entry => entry.date === date);
  const dayTotalSeconds = dayEntries.reduce((total, entry) => total + parseDuration(entry.duration), 0);
  return formatDuration(dayTotalSeconds);
};

const saveEntries = () => {
  localStorage.setItem(localStorageKey, JSON.stringify(timeEntries));
};

export const loadEntries = () => {
  const storedEntries = localStorage.getItem(localStorageKey);
  if (storedEntries) {
    timeEntries = JSON.parse(storedEntries);
  }
  renderEntryList();
};

export const addTimeEntry = (newEntry) => {
  timeEntries.unshift(newEntry);
  saveEntries();
  renderEntryList();
};

export const updateTimeEntry = (id, updates) => {
  const index = timeEntries.findIndex(entry => entry.id === id);
  if (index !== -1) {
    timeEntries[index] = { ...timeEntries[index], ...updates };
    saveEntries();
    renderEntryList();
    showToast('Entry updated successfully!');
  }
};

export const deleteTimeEntry = (idToDelete) => {
  renderConfirmModal(
    'Are you sure you want to delete this entry?',
    () => {
      timeEntries = timeEntries.filter(entry => entry.id !== idToDelete); // Corrected filter logic
      selectedEntryIds.delete(idToDelete); // Ensure individual deletion also clears from selected
      saveEntries();
      renderEntryList();
      showToast('Entry deleted successfully!');
    },
    () => {
      showToast('Deletion cancelled.', "error");
    }
  );
};

export const duplicateTimeEntry = (idToDuplicate) => {
  const originalEntry = timeEntries.find(entry => entry.id === idToDuplicate);
  if (originalEntry) {
    const duplicatedEntry = {
      ...originalEntry,
      id: Date.now(),
    };
    addTimeEntry(duplicatedEntry);
    showToast('Entry duplicated successfully!');
  }
};

export const toggleBulkEditMode = () => {
  isBulkEditModeActive = !isBulkEditModeActive;
  if (!isBulkEditModeActive) {
    selectedEntryIds.clear();
  }
  renderEntryList();
  showToast(`Bulk edit mode ${isBulkEditModeActive ? 'enabled' : 'disabled'}!`);
};

const toggleEntrySelection = (entryId, isChecked) => {
  if (isChecked) {
    selectedEntryIds.add(entryId);
  } else {
    selectedEntryIds.delete(entryId);
  }
  updateDayHeaderCheckboxes();
};

const toggleDaySelection = (date, isChecked) => {
  const dayEntries = timeEntries.filter(entry => entry.date === date);
  dayEntries.forEach(entry => {
    const checkbox = document.querySelector(`.entry-list__time-entry__checkbox[data-id="${entry.id}"][data-date="${date}"]`);
    if (checkbox) {
      checkbox.checked = isChecked;
      toggleEntrySelection(entry.id, isChecked);
    }
  });
};

const bulkDeleteSelected = (date = null) => {
  let idsToDelete = [];
  if (date) {
    const dayEntries = timeEntries.filter(entry => entry.date === date);
    idsToDelete = dayEntries.filter(entry => selectedEntryIds.has(entry.id)).map(entry => entry.id);
  } else {
    idsToDelete = Array.from(selectedEntryIds);
  }
  if (idsToDelete.length === 0) {
    showToast("No entries selected for deletion.", "error");
    return;
  }
  renderConfirmModal(
    `Are you sure you want to delete ${idsToDelete.length} selected entries?`,
    () => {
      timeEntries = timeEntries.filter(entry => !idsToDelete.includes(entry.id));
      idsToDelete.forEach(id => selectedEntryIds.delete(id));
      saveEntries();
      renderEntryList();
      showToast(`${idsToDelete.length} entries deleted successfully!`);
    },
    () => {
      showToast('Bulk deletion cancelled.', "error");
    }
  );
};

export const getFirstSelectedEntryBillableState = () => {
    if (selectedEntryIds.size === 0) return null; // No entries selected

    let commonBillableState = null;
    let isFirst = true;

    for (const id of selectedEntryIds) {
        const entry = timeEntries.find(e => e.id === id);
        if (entry) {
            if (isFirst) {
                commonBillableState = entry.billable;
                isFirst = false;
            } else if (entry.billable !== commonBillableState) {
                return null; // Mixed billable states, return 'no-change'
            }
        }
    }
    return commonBillableState; // All selected entries have the same billable state
};


export const bulkEditSelected = (date = null) => {
  let entriesToEdit = [];
  if (date) {
    entriesToEdit = timeEntries.filter(entry => entry.date === date && selectedEntryIds.has(entry.id));
  } else {
    entriesToEdit = timeEntries.filter(entry => selectedEntryIds.has(entry.id));
  }
  if (entriesToEdit.length === 0) {
    showToast("No entries selected for bulk edit.", "error");
    return;
  }

  const initialBillableState = getFirstSelectedEntryBillableState();

  renderBulkEditModal(
    entriesToEdit.length,
    (updates) => {
      let changesAppliedCount = 0;
      entriesToEdit.forEach(entry => {
        const newEntryData = { ...entry };
        if (updates.hasOwnProperty('description')) {
          newEntryData.description = updates.description;
        }
        if (updates.hasOwnProperty('projectData')) { // Changed from 'project' to 'projectData'
          newEntryData.project = updates.projectData.projectName;
          newEntryData.projectColor = updates.projectData.projectColor;
          newEntryData.taskName = updates.projectData.taskName;
        }
        if (updates.hasOwnProperty('tags')) {
          // Assuming 'tags' update means overwrite for simplicity in bulk edit
          newEntryData.tags = updates.tags;
        }
        if (updates.hasOwnProperty('billable')) { // Changed from 'isBillable' to 'billable'
          newEntryData.billable = updates.billable;
        }
        if (updates.hasOwnProperty('startTime') && updates.hasOwnProperty('endTime')) {
          newEntryData.startTime = updates.startTime;
          newEntryData.endTime = updates.endTime;
          if (updates.startTime && updates.endTime) {
            const [startH, startM] = updates.startTime.split(':').map(Number);
            const [endH, endM] = updates.endTime.split(':').map(Number);
            let durationInMinutes = (endH * 60 + endM) - (startH * 60 + startM);
            if (durationInMinutes < 0) {
              durationInMinutes += 24 * 60;
            }
            newEntryData.duration = formatDuration(durationInMinutes * 60);
          }
        }
        if (updates.hasOwnProperty('date')) {
          newEntryData.date = updates.date;
        }
        const index = timeEntries.findIndex(e => e.id === entry.id);
        if (index !== -1) {
          timeEntries[index] = newEntryData;
          changesAppliedCount++;
        }
      });
      saveEntries();
      renderEntryList();
      showToast(`${changesAppliedCount} entries updated successfully!`);
      selectedEntryIds.clear();
      // Only toggle off bulk edit mode if it was active and we're done with bulk editing
      if (isBulkEditModeActive) {
        // Find the bulk edit toggle checkbox and uncheck it
        const bulkEditToggleCheckbox = document.getElementById('bulk-edit-toggle');
        if (bulkEditToggleCheckbox) {
          bulkEditToggleCheckbox.checked = false;
        }
        isBulkEditModeActive = false; // Manually set the flag
      }
    },
    () => {
      showToast('Bulk edit cancelled.', "error");
    },
    initialBillableState // Pass initialBillableState to the modal
  );
};

// Function to update only the "This week total"
export const updateWeeklyTotalDisplay = (runningEntryDate) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const getStartOfWeek = (dateString) => {
    const d = new Date(dateString);
    d.setHours(0, 0, 0, 0);
    const dayOfWeek = d.getDay();
    const diff = d.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Monday as first day
    const startOfWeek = new Date(d.getFullYear(), d.getMonth(), diff);
    startOfWeek.setHours(0, 0, 0, 0);
    return startOfWeek;
  };

  const startOfWeekForRunningEntry = getStartOfWeek(runningEntryDate);
  const runningEntryWeekIdentifier = startOfWeekForRunningEntry.toLocaleDateString('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '-');

  // Find all weekly headers to potentially update
  document.querySelectorAll('.entry-list__weekly-header').forEach(weeklyHeaderElement => {
    const weekTitleSpan = weeklyHeaderElement.querySelector('.entry-list__weekly-header--title');
    const weekTotalSpan = weeklyHeaderElement.querySelector('.entry-list__weekly-header--total');

    if (weekTitleSpan && weekTotalSpan) {
      let headerWeekIdentifier;
      if (weekTitleSpan.textContent === 'This week') {
        headerWeekIdentifier = getStartOfWeek(today.toISOString().split('T')[0]).toLocaleDateString('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '-');
      } else if (weekTitleSpan.textContent === 'Last week') {
        const lastWeekStart = new Date(getStartOfWeek(today.toISOString().split('T')[0]));
        lastWeekStart.setDate(lastWeekStart.getDate() - 7);
        headerWeekIdentifier = lastWeekStart.toLocaleDateString('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '-');
      } else {
        // For other week ranges, parse the date from the title if possible, or skip
        // This part assumes the week title format is consistent with getWeekRange
        const match = weekTitleSpan.textContent.match(/(\w{3} \d{1,2}) - (\w{3} \d{1,2})/);
        if (!match) {
            return; // If it doesn't match the expected format, skip live update for this header
        }
        // For a more robust solution, you would parse the actual dates from the header text
        // and compare them with the runningEntryWeekIdentifier.
        // For now, we'll rely on 'This week' and 'Last week' for dynamic updates.
        return;
      }

      if (headerWeekIdentifier === runningEntryWeekIdentifier) {
        const weekEntries = timeEntries.filter(entry => {
          const entryDate = new Date(entry.date);
          entryDate.setHours(0, 0, 0, 0);
          const entryWeekStart = getStartOfWeek(entry.date);
          return entryWeekStart.toLocaleDateString('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '-') === headerWeekIdentifier;
        });
        const newTotal = getWeekTotal(weekEntries);
        weekTotalSpan.textContent = `Week total: ${newTotal}`;
      }
    }
  });
};

// Live update for day total
export const updateDayTotalDisplay = (date, extraSeconds = 0) => {
  const dayHeader = document.querySelector(`.entry-list__day-header[data-date="${date}"]`);
  if (!dayHeader) return;
  const dayTotalSpan = dayHeader.querySelector('.entry-list__day-header__total');
  if (!dayTotalSpan) return;
  const dayEntries = timeEntries.filter(entry => entry.date === date);
  const dayTotalSeconds = dayEntries.reduce((total, entry) => total + parseDuration(entry.duration), 0) + extraSeconds;
  dayTotalSpan.textContent = `Total: ${formatDuration(dayTotalSeconds)}`;
};

// Live update for week total
export const updateWeeklyTotalDisplayLive = (runningEntryDate, extraSeconds = 0) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const getStartOfWeek = (dateString) => {
    const d = new Date(dateString);
    d.setHours(0, 0, 0, 0);
    const dayOfWeek = d.getDay();
    const diff = d.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const startOfWeek = new Date(d.getFullYear(), d.getMonth(), diff);
    startOfWeek.setHours(0, 0, 0, 0);
    return startOfWeek;
  };

  const startOfWeekForRunningEntry = getStartOfWeek(runningEntryDate);
  const runningEntryWeekIdentifier = startOfWeekForRunningEntry.toLocaleDateString('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '-');

  document.querySelectorAll('.entry-list__weekly-header').forEach(weeklyHeaderElement => {
    const weekTitleSpan = weeklyHeaderElement.querySelector('.entry-list__weekly-header--title');
    const weekTotalSpan = weeklyHeaderElement.querySelector('.entry-list__weekly-header--total');

    if (weekTitleSpan && weekTotalSpan) {
      let headerWeekIdentifier;
      if (weekTitleSpan.textContent === 'This week') {
        headerWeekIdentifier = getStartOfWeek(today.toISOString().split('T')[0]).toLocaleDateString('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '-');
      } else if (weekTitleSpan.textContent === 'Last week') {
        const lastWeekStart = new Date(getStartOfWeek(today.toISOString().split('T')[0]));
        lastWeekStart.setDate(lastWeekStart.getDate() - 7);
        headerWeekIdentifier = lastWeekStart.toLocaleDateString('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '-');
      } else {
        return;
      }

      if (headerWeekIdentifier === runningEntryWeekIdentifier) {
        const weekEntries = timeEntries.filter(entry => {
          const entryDate = new Date(entry.date);
          entryDate.setHours(0, 0, 0, 0);
          const entryWeekStart = getStartOfWeek(entry.date);
          return entryWeekStart.toLocaleDateString('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '-') === headerWeekIdentifier;
        });
        const weekTotalSeconds = weekEntries.reduce((total, entry) => total + parseDuration(entry.duration), 0) + extraSeconds;
        weekTotalSpan.textContent = `Week total: ${formatDuration(weekTotalSeconds)}`;
      }
    }
  });
};

// Helper to update both week and day totals for live timer
export const updateLiveTotalsForRunningTimer = (date, seconds) => {
  updateWeeklyTotalDisplayLive(date, seconds);
  updateDayTotalDisplay(date, seconds);
};

export const updateRunningEntryDuration = (id, formattedDuration) => {
  const index = timeEntries.findIndex(entry => entry.id === id);
  if (index !== -1) {
    timeEntries[index].duration = formattedDuration;

    // Update the specific time display span for the running entry
    const entryElement = document.querySelector(`.entry-list__time-entry[data-id="${id}"]`);
    if (entryElement) {
      const durationDisplaySpan = entryElement.querySelector('.entry-list__time-entry__time-display');
      if (durationDisplaySpan) {
        durationDisplaySpan.textContent = formattedDuration;
      }
    }

    // Update the "This week total" live (or whichever week the entry belongs to)
    updateWeeklyTotalDisplay(timeEntries[index].date);

    // No need to save to local storage every second, only when timer stops
    // No need to re-render the entire list here, as individual entry and weekly total are updated directly
  }
};


const updateDayHeaderCheckboxes = () => {
  if (!isBulkEditModeActive) return;
  const dayHeaders = document.querySelectorAll('.entry-list__day-header');
  dayHeaders.forEach(header => {
    const date = header.dataset.date;
    const dayEntries = timeEntries.filter(entry => entry.date === date);
    const dayEntryIds = new Set(dayEntries.map(entry => entry.id));
    let selectedCount = 0;
    dayEntryIds.forEach(id => {
      if (selectedEntryIds.has(id)) {
        selectedCount++;
      }
    });
    const dayHeaderCheckbox = header.querySelector('.entry-list__day-header__checkbox');
    if (dayHeaderCheckbox) {
      if (dayEntries.length === 0) {
        dayHeaderCheckbox.checked = false;
        dayHeaderCheckbox.indeterminate = false;
        dayHeaderCheckbox.disabled = true;
      } else {
        dayHeaderCheckbox.disabled = false;
        dayHeaderCheckbox.checked = (selectedCount === dayEntries.length);
        dayHeaderCheckbox.indeterminate = (selectedCount > 0 && selectedCount < dayEntries.length);
      }
    }
    const bulkActionsContainer = header.querySelector('.entry-list__day-header__bulk-actions');
    if (bulkActionsContainer) {
      const bulkEditButton = bulkActionsContainer.querySelector(`#bulk-edit-${date}`);
      const bulkDeleteButton = bulkActionsContainer.querySelector(`#bulk-delete-${date}`);
      if (selectedCount > 0) {
        bulkEditButton.style.display = 'inline-block';
        bulkDeleteButton.style.display = 'inline-block';
      } else {
        bulkEditButton.style.display = 'none';
        bulkDeleteButton.style.display = 'none';
      }
    }
  });
};

export const renderEntryList = () => {
  const entryListContainer = document.getElementById('entry-list-container');
  if (!entryListContainer) return;

  entryListContainer.innerHTML = '';

  const sortedEntries = [...timeEntries].sort((a, b) => new Date(b.date) - new Date(a.date));

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const startOfThisWeek = new Date(today);
  const dayOfWeek = startOfThisWeek.getDay();
  const diff = startOfThisWeek.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Adjust to Monday
  startOfThisWeek.setDate(diff);
  startOfThisWeek.setHours(0, 0, 0, 0);

  const startOfLastWeek = new Date(startOfThisWeek);
  startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);
  startOfLastWeek.setHours(0, 0, 0, 0);

  const getStartOfWeek = (dateString) => {
    const d = new Date(dateString);
    d.setHours(0, 0, 0, 0);
    const dayOfWeek = d.getDay();
    const diff = d.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Monday as first day
    const startOfWeek = new Date(d.getFullYear(), d.getMonth(), diff);
    startOfWeek.setHours(0, 0, 0, 0);
    return startOfWeek;
  };


  const groupedByWeek = sortedEntries.reduce((acc, entry) => {
    const entryDate = new Date(entry.date);
    entryDate.setHours(0, 0, 0, 0);
    const startOfWeekForEntry = getStartOfWeek(entry.date);
    const weekIdentifier = startOfWeekForEntry.toLocaleDateString('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '-');
    if (!acc[weekIdentifier]) {
      acc[weekIdentifier] = [];
    }
    acc[weekIdentifier].push(entry);
    return acc;
  }, {});

  Object.keys(groupedByWeek).sort((a, b) => new Date(b).getTime() - new Date(a).getTime()).forEach(weekIdentifier => {
    const weekEntries = groupedByWeek[weekIdentifier];
    const weeklyGroupDiv = document.createElement('div');
    weeklyGroupDiv.className = 'entry-list__weekly-group';

    const weeklyHeader = document.createElement('div');
    weeklyHeader.className = 'entry-list__weekly-header';
    const currentWeekStart = new Date(weekIdentifier);
    currentWeekStart.setHours(0, 0, 0, 0);
    let weekTitle = getWeekRange(weekIdentifier);
    if (currentWeekStart.getTime() === startOfThisWeek.getTime()) {
      weekTitle = 'This week';
    } else if (currentWeekStart.getTime() === startOfLastWeek.getTime()) {
      weekTitle = 'Last week';
    }
    weeklyHeader.innerHTML = `
      <span class="entry-list__weekly-header--title">${weekTitle}</span>
      <span class="entry-list__weekly-header--total">Week total: ${getWeekTotal(weekEntries)}</span>
    `;
    weeklyGroupDiv.appendChild(weeklyHeader);

    const groupedByDateInWeek = weekEntries.reduce((acc, entry) => {
      const date = entry.date;
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(entry);
      return acc;
    }, {});

    Object.keys(groupedByDateInWeek).sort((a, b) => new Date(b) - new Date(a)).forEach(date => {
      const dayEntries = groupedByDateInWeek[date];
      const dayGroup = document.createElement('div');
      dayGroup.className = 'entry-list__day-entry-group';

      const dayHeader = document.createElement('div');
      dayHeader.className = 'entry-list__day-header';
      dayHeader.setAttribute('data-date', date);
      let dayHeaderHtml = `
        <div class="entry-list__day-header__left">
          ${isBulkEditModeActive ? `<input type="checkbox" class="entry-list__day-header__checkbox" data-date="${date}">` : ''}
          <span class="entry-list__day-header__title">${formatDateForHeader(date)}</span>
        </div>
        <div class="entry-list__day-header__bulk-actions">
          ${isBulkEditModeActive ? `
            <button class="entry-list__day-header__bulk-button" id="bulk-edit-${date}">Bulk Edit</button>
            <button class="entry-list__day-header__bulk-button entry-list__day-header__bulk-button--delete" id="bulk-delete-${date}">Delete</button>
          ` : ''}
          <span class="entry-list__day-header__total">Total: ${getDayTotal(dayEntries, date)}</span>
          <img src="assets/icons/bulk-edit.svg" alt="Bulk Edit" class="entry-list__bulk-edit-icon" id="day-header-bulk-edit-icon-${date}">
        </div>
      `;
      dayHeader.innerHTML = dayHeaderHtml;
      dayGroup.appendChild(dayHeader);

      if (isBulkEditModeActive) {
        const dayHeaderCheckbox = dayHeader.querySelector('.entry-list__day-header__checkbox');
        if (dayHeaderCheckbox) {
          dayHeaderCheckbox.addEventListener('change', (e) => {
            toggleDaySelection(date, e.target.checked);
          });
        }
        const bulkEditButton = dayHeader.querySelector(`#bulk-edit-${date}`);
        if (bulkEditButton) {
          bulkEditButton.addEventListener('click', () => {
            bulkEditSelected(date);
          });
        }
        const bulkDeleteButton = dayHeader.querySelector(`#bulk-delete-${date}`);
        if (bulkDeleteButton) {
          bulkDeleteButton.addEventListener('click', () => {
            bulkDeleteSelected(date);
          });
        }
      }

      const dayHeaderBulkEditIcon = dayHeader.querySelector(`#day-header-bulk-edit-icon-${date}`);
      if (dayHeaderBulkEditIcon) {
        dayHeaderBulkEditIcon.addEventListener('click', () => {
          toggleBulkEditMode();
          const bulkEditToggleCheckbox = document.getElementById('bulk-edit-toggle');
          if (bulkEditToggleCheckbox) {
            bulkEditToggleCheckbox.checked = isBulkEditModeActive;
          }
        });
      }

      const groupedByDescription = dayEntries.reduce((acc, entry) => {
        const key = `${entry.description}-${entry.project}-${entry.billable}`; // Corrected to 'billable'
        if (!acc[key]) {
          acc[key] = {
            mainEntry: { ...entry, duration: '00:00:00', isGrouped: true, subEntries: [] },
            subEntries: []
          };
        }
        acc[key].subEntries.push(entry);
        acc[key].mainEntry.duration = formatDuration(parseDuration(acc[key].mainEntry.duration) + parseDuration(entry.duration));
        return acc;
      }, {});

      Object.values(groupedByDescription).forEach(group => {
        const mainEntry = group.mainEntry;
        const subEntries = group.subEntries.slice().sort((a, b) => new Date(`2000/01/01 ${b.startTime}`) - new Date(`2000/01/01 ${a.startTime}`));
        const entryWrapper = document.createElement('div');
        entryWrapper.className = 'entry-list__time-entry-wrapper';
        entryWrapper.appendChild(renderTimeEntry(mainEntry, subEntries.length > 1, false, date));

        if (subEntries.length > 1) {
          const subEntryListDiv = document.createElement('div');
          subEntryListDiv.className = 'entry-list__sub-entry-list hidden';
          subEntryListDiv.setAttribute('data-parent-id', mainEntry.id);
          subEntries.forEach(subEntry => {
            const subEntryDiv = document.createElement('div');
            subEntryDiv.className = 'entry-list__sub-entry';
            subEntryDiv.appendChild(renderTimeEntry(subEntry, false, true, date));
            subEntryListDiv.appendChild(subEntryDiv);
          });
          entryWrapper.appendChild(subEntryListDiv);
          const mainEntryElement = entryWrapper.querySelector(`.entry-list__time-entry[data-id="${mainEntry.id}"]`);
          if (mainEntryElement) {
            const toggleContainer = document.createElement('div');
            toggleContainer.className = 'entry-list__sub-entries-toggle entry-list__sub-entries-toggle--collapsed';
            toggleContainer.innerHTML = `
              <img src="assets/icons/chevron-down.svg" alt="Toggle">
              <span>${subEntries.length}</span>
            `;
            const checkbox = mainEntryElement.querySelector('.entry-list__time-entry__checkbox');
            if (checkbox) {
              mainEntryElement.insertBefore(toggleContainer, checkbox);
            } else {
              mainEntryElement.prepend(toggleContainer);
            }
            toggleContainer.addEventListener('click', (e) => {
              e.stopPropagation();
              subEntryListDiv.classList.toggle('hidden');
              toggleContainer.classList.toggle('entry-list__sub-entries-toggle--collapsed');
              const icon = toggleContainer.querySelector('img');
              icon.src = subEntryListDiv.classList.contains('hidden') ? 'assets/icons/chevron-down.svg' : 'assets/icons/chevron-up.svg';
            });
          }
        }
        dayGroup.appendChild(entryWrapper);
      });
      weeklyGroupDiv.appendChild(dayGroup);
    });
    entryListContainer.appendChild(weeklyGroupDiv);
  });
  updateDayHeaderCheckboxes();
};

const renderTimeEntry = (entry, hasSubEntries = false, isSubEntry = false, entryDate) => {
  const entryElement = document.createElement('div');
  entryElement.className = 'entry-list__time-entry';
  entryElement.setAttribute('data-id', entry.id);
  entryElement.setAttribute('data-date', entryDate);
  const showPlayButton = !hasSubEntries;
  const projectButtonText = entry.taskName ? `${entry.project || 'No Project'}: ${entry.taskName}` : (entry.project || 'No Project');
  entryElement.innerHTML = `
    ${isBulkEditModeActive ? `<input type="checkbox" class="entry-list__time-entry__checkbox" data-id="${entry.id}" data-date="${entryDate}" ${selectedEntryIds.has(entry.id) ? 'checked' : ''}>` : ''}
    <div class="entry-list__time-entry__details">
      ${isSubEntry ? '<div style="width: 16px; margin-right: 10px;"></div>' : ''}
      <input type="text" class="entry-list__time-entry__input" value="${entry.description}" placeholder="Add description">
      <div class="entry-list__time-entry__separator"></div>
      <button class="entry-list__time-entry__project-button">
        <span class="entry-list__project-color-dot" style="background-color: ${entry.projectColor || '#ccc'};"></span>
        <span style="color: ${entry.projectColor || '#4a5568'};">${projectButtonText}</span>
      </button>
      <div class="entry-list__time-entry__separator"></div>
      <button class="entry-list__time-entry__tags-button" data-selected-tags='${JSON.stringify(entry.tags || [])}'>
        <img src="assets/icons/tags.svg" alt="Tags">
        ${entry.tags && entry.tags.length > 0 ? `<span>${entry.tags.join(', ')}</span>` : ''}
      </button>
      <div class="entry-list__time-entry__separator"></div>
      <button class="entry-list__time-entry__billable-button ${entry.billable ? 'entry-list__time-entry__billable-button--billable-active' : ''}">$</button>
      <div class="entry-list__time-entry__separator"></div>
      <div class="entry-list__time-entry__time-range">
        <input type="time" class="entry-list__time-entry__time-input" value="${entry.startTime}" step="60">
        <span>-</span>
        <input type="time" class="entry-list__time-entry__time-input" value="${entry.endTime}" step="60">
      </div>
      <div class="entry-list__time-entry__separator"></div>
      <span class="entry-list__time-entry__time-display">${entry.duration}</span>
      <button class="entry-list__time-entry__calendar-button">
        <img src="assets/icons/calendar.svg" alt="Calendar">
      </button>
      ${showPlayButton ? `
        <button class="entry-list__time-entry__play-button">
          <img src="assets/icons/play.svg" alt="Start Timer">
        </button>
      ` : ''}
      <div class="entry-list__time-entry__more-options">
        <button class="entry-list__time-entry__more-options-button">
          <img src="assets/icons/menu-dots-vertical.svg" alt="More Options">
        </button>
        <div class="entry-list__time-entry__more-options-menu">
          <div class="entry-list__time-entry__more-options-item" data-action="duplicate">Duplicate</div>
          <div class="entry-list__time-entry__more-options-item entry-list__time-entry__more-options-item--delete" data-action="delete">Delete</div>
        </div>
      </div>
    </div>
  `;
  const descriptionInput = entryElement.querySelector('.entry-list__time-entry__input');
  if (descriptionInput) {
    descriptionInput.addEventListener('change', (e) => {
      updateTimeEntry(entry.id, { description: e.target.value });
    });
  }
  const billableButton = entryElement.querySelector('.entry-list__time-entry__billable-button');
  if (billableButton) {
    billableButton.addEventListener('click', () => {
      updateTimeEntry(entry.id, { billable: !entry.billable }); // Corrected property name to 'billable'
    });
  }
  const startTimeInput = entryElement.querySelector('.entry-list__time-entry__time-input:first-of-type');
  const endTimeInput = entryElement.querySelector('.entry-list__time-entry__time-input:last-of-type');
  const durationDisplay = entryElement.querySelector('.entry-list__time-entry__time-display');
  const updateEntryTimes = () => {
    const [startH, startM] = startTimeInput.value.split(':').map(Number);
    const [endH, endM] = endTimeInput.value.split(':').map(Number);
    let durationInMinutes = (endH * 60 + endM) - (startH * 60 + startM);
    if (durationInMinutes < 0) {
      durationInMinutes += 24 * 60;
    }
    const newDuration = formatDuration(durationInMinutes * 60);
    durationDisplay.textContent = newDuration;
    updateTimeEntry(entry.id, {
      startTime: startTimeInput.value,
      endTime: endTimeInput.value,
      duration: newDuration
    });
  };
  if (startTimeInput) startTimeInput.addEventListener('change', updateEntryTimes);
  if (endTimeInput) endTimeInput.addEventListener('change', updateEntryTimes);
  const playButton = entryElement.querySelector('.entry-list__time-entry__play-button');
  if (playButton) {
    playButton.addEventListener('click', () => {
      const event = new CustomEvent('startExistingTimer', {
        detail: {
          id: entry.id,
          description: entry.description,
          project: entry.project,
          projectColor: entry.projectColor,
          taskName: entry.taskName,
          tags: entry.tags,
          isBillable: entry.billable, // Corrected property name to 'billable'
          durationSeconds: 0
        }
      });
      document.dispatchEvent(event);
    });
  }
  const calendarButton = entryElement.querySelector('.entry-list__time-entry__calendar-button');
  if (calendarButton) {
    calendarButton.addEventListener('click', (e) => {
      e.preventDefault();
      renderCalendarDialog(e.currentTarget, (selectedDateISO) => {
        updateTimeEntry(entry.id, { date: selectedDateISO });
      });
    });
  }
  const moreOptionsButton = entryElement.querySelector('.entry-list__time-entry__more-options-button');
  const moreOptionsMenu = entryElement.querySelector('.entry-list__time-entry__more-options-menu');
  if (moreOptionsButton && moreOptionsMenu) {
    moreOptionsButton.addEventListener('click', (e) => {
      e.stopPropagation();
      document.querySelectorAll('.entry-list__time-entry__more-options-menu--show').forEach(menu => {
        if (menu !== moreOptionsMenu) {
          menu.classList.remove('entry-list__time-entry__more-options-menu--show');
        }
      });
      moreOptionsMenu.classList.toggle('entry-list__time-entry__more-options-menu--show');
    });
    document.addEventListener('click', (e) => {
      if (!moreOptionsMenu.contains(e.target) && !moreOptionsButton.contains(e.target)) {
        moreOptionsMenu.classList.remove('entry-list__time-entry__more-options-menu--show');
      }
    });
    moreOptionsMenu.addEventListener('click', (e) => {
      const action = e.target.dataset.action;
      if (action) {
        moreOptionsMenu.classList.remove('entry-list__time-entry__more-options-menu--show');
        if (action === 'duplicate') {
          duplicateTimeEntry(entry.id);
        } else if (action === 'delete') {
          deleteTimeEntry(entry.id);
        }
      }
    });
  }
  const projectButton = entryElement.querySelector('.entry-list__time-entry__project-button');
  if (projectButton) {
    projectButton.addEventListener('click', (e) => {
      e.preventDefault();
      renderProjectDialog(e.currentTarget, (projectId, projectName, taskName, projectColor) => {
        updateTimeEntry(entry.id, { project: projectName, projectColor: projectColor, taskName: taskName, description: entry.description });
      });
    });
  }
  const tagsButton = entryElement.querySelector('.entry-list__time-entry__tags-button');
  if (tagsButton) {
    tagsButton.addEventListener('click', (e) => {
      e.preventDefault();
      tagsButton.dataset.selectedTags = JSON.stringify(entry.tags || []);
      renderTagDialog(e.currentTarget, (selectedTags) => {
        updateTimeEntry(entry.id, { tags: selectedTags });
      });
    });
  }
  const checkbox = entryElement.querySelector('.entry-list__time-entry__checkbox');
  if (checkbox) {
    if (isBulkEditModeActive) {
      checkbox.style.display = 'block';
    } else {
      checkbox.style.display = 'none';
    }
    checkbox.addEventListener('change', (e) => {
      toggleEntrySelection(entry.id, e.target.checked);
    });
  }
  return entryElement;
};
