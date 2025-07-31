// src/layout/dialogs.js
import { showToast } from './sidebar.js'; // Assuming showToast is now exported from sidebar.js
import { updateTimeEntry, formatDuration, parseDuration } from './entrylist.js';

// Sample data for projects and tags - initialized as empty arrays
let projectList = [];
let tagList = [];

// Local Storage Keys
const PROJECTS_STORAGE_KEY = 'clockifyProjects';
const TAGS_STORAGE_KEY = 'clockifyTags';

// Load projects from local storage
const loadProjects = () => {
  const storedProjects = localStorage.getItem(PROJECTS_STORAGE_KEY);
  if (storedProjects) {
    projectList = JSON.parse(storedProjects);
  }
};

// Save projects to local storage
const saveProjects = () => {
  localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projectList));
};

// Load tags from local storage
const loadTags = () => {
  const storedTags = localStorage.getItem(TAGS_STORAGE_KEY);
  if (storedTags) {
    tagList = JSON.parse(storedTags);
  }
};

// Save tags to local storage
const saveTags = () => {
  localStorage.setItem(TAGS_STORAGE_KEY, JSON.stringify(tagList));
};

// Initial load
loadProjects();
loadTags();

// Function to render the "Create Task" modal
export function renderCreateTaskModal(projectName, onSave) {
  if (document.querySelector('.dialog__overlay')) {
    document.querySelector('.dialog__overlay').remove();
  }

  const modal = document.createElement('div');
  modal.className = 'dialog__overlay';
  modal.innerHTML = `
    <div class="dialog__content">
      <div class="dialog__header">
        <span class="dialog__header--title">Create Task for "${projectName}"</span>
        <span class="dialog__close">&times;</span>
      </div>
      <div class="dialog__body">
        <input type="text" id="task-name-input" class="dialog__form-control" placeholder="Task name">
      </div>
      <div class="dialog__footer">
        <button class="dialog__footer--cancel">Cancel</button>
        <button class="dialog__footer--save">SAVE</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  const taskNameInput = modal.querySelector('#task-name-input');
  const closeButton = modal.querySelector('.dialog__close');
  const cancelButton = modal.querySelector('.dialog__footer--cancel');
  const saveButton = modal.querySelector('.dialog__footer--save');

  const closeModal = () => {
    modal.remove();
  };

  closeButton.addEventListener('click', closeModal);
  cancelButton.addEventListener('click', closeModal);
  saveButton.addEventListener('click', () => {
    const taskName = taskNameInput.value.trim(); // Corrected Trim() to trim()
    if (taskName) {
      if (onSave && typeof onSave === 'function') {
        onSave(taskName);
      }
      closeModal();
      showToast('Task created successfully!');
    } else {
      showToast('Task name cannot be empty.', "error");
    }
  });

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });
}

// Function to render the "Create new Project" modal
export function renderCreateProjectModal(onSave) {
  if (document.querySelector('.dialog__overlay')) {
    document.querySelector('.dialog__overlay').remove();
  }

  const modal = document.createElement('div');
  modal.className = 'dialog__overlay';
  modal.innerHTML = `
    <div class="dialog__content">
      <div class="dialog__header">
        <span class="dialog__header--title">Create new Project</span>
        <span class="dialog__close">&times;</span>
      </div>
      <div class="dialog__body">
        <div class="dialog__form-row">
          <div class="dialog__form-group">
            <label for="project-name" class="dialog__form-label">Project name</label>
            <input type="text" id="project-name-input" class="dialog__form-control" placeholder="Enter Project name">
          </div>
          <div class="dialog__form-group">
            <label for="client-select" class="dialog__form-label">Client</label>
            <select id="client-select" class="dialog__form-control">
              <option value="">Select client</option>
              <option value="client1">Client A</option>
              <option value="client2">Client B</option>
            </select>
          </div>
        </div>
        <div class="dialog__form-row">
          <div class="dialog__form-group">
            <label for="color-picker" class="dialog__form-label">Color</label>
            <div class="dialog__color-picker">
              <input type="color" id="color-picker" value="#03a9f4">
              <div class="dialog__color-box" style="background-color: #03a9f4;"></div>
            </div>
          </div>
          <div class="dialog__form-group">
            <label for="template-select" class="dialog__form-label">Template</label>
            <select id="template-select" class="dialog__form-control">
              <option value="">No template</option>
              <option value="template1">Template 1</option>
              <option value="template2">Template 2</option>
            </select>
          </div>
        </div>
        <div class="dialog__form-row dialog__form-row--last">
          <div class="dialog__form-group">
            <input type="checkbox" id="public-checkbox" class="dialog__checkbox">
            <label for="public-checkbox" class="dialog__form-label">Public</label>
            <img src="assets/icons/info-icon.svg" alt="Info" style="width:16px; height:16px;">
          </div>
        </div>
      </div>
      <div class="dialog__footer">
        <button class="dialog__footer--cancel">Cancel</button>
        <button class="dialog__footer--save">CREATE</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  const projectNameInput = modal.querySelector('#project-name-input');
  const colorPicker = modal.querySelector('#color-picker');
  const colorBox = modal.querySelector('.dialog__color-box');
  const closeButton = modal.querySelector('.dialog__close');
  const cancelButton = modal.querySelector('.dialog__footer--cancel');
  const saveButton = modal.querySelector('.dialog__footer--save');

  colorPicker.addEventListener('input', (e) => {
    colorBox.style.backgroundColor = e.target.value;
  });

  const closeModal = () => {
    modal.remove();
  };

  closeButton.addEventListener('click', closeModal);
  cancelButton.addEventListener('click', closeModal);
  saveButton.addEventListener('click', () => {
    const newProjectName = projectNameInput.value.trim(); // Corrected Trim() to trim()
    const newProjectColor = colorPicker.value;
    if (newProjectName) {
      const newProject = {
        id: `p${Date.now()}`,
        name: newProjectName,
        color: newProjectColor
      };
      projectList.push(newProject);
      saveProjects();
      if (onSave && typeof onSave === 'function') {
        onSave(newProject.id, newProject.name, null, newProject.color);
      }
      closeModal();
      showToast('Project created successfully!');
    } else {
      showToast('Project name cannot be empty.', "error");
    }
  });

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });
}

export function renderProjectDialog(targetElement, onSelect) {
  loadProjects();

  const existingDialog = document.querySelector('.dropdown-dialog.project-dialog');
  if (existingDialog) {
    existingDialog.remove();
    if (existingDialog._outsideClickListener) {
      document.removeEventListener('click', existingDialog._outsideClickListener);
    }
  }

  const dialog = document.createElement('div');
  dialog.className = 'dropdown-dialog project-dialog'; // Use dropdown-dialog class
  dialog.innerHTML = `
    <div class="dialog__content">
      <input type="text" class="dialog__form-control dialog__search-input" placeholder="Search Project or Client" id="project-search-input">
      <div class="dialog__item-list" id="project-item-list">
        <div class="dialog__item" data-project-id="no-project" data-project-name="No Project" data-project-color="#ccc">
          <span class="dialog__item-text">NO PROJECT</span>
        </div>
        ${projectList.map(project => `
          <div class="dialog__item" data-project-id="${project.id}" data-project-name="${project.name}" data-project-color="${project.color}">
            <div class="dialog__item-icon" style="background-color: ${project.color}; border-radius: 50%; width: 10px; height: 10px;"></div>
            <span class="dialog__item-text">${project.name}</span>
            <a href="#" class="dialog__create-task">Create Task</a>
          </div>
        `).join('')}
      </div>
      <div class="dialog__create-new" id="create-new-project">
        <img src="assets/icons/plus-blue.svg" alt="Create New" class="dialog__item-icon">
        <span class="dialog__create-text">Create new Project</span>
      </div>
    </div>
  `;
  const rect = targetElement.getBoundingClientRect();
  dialog.style.position = 'absolute';
  dialog.style.top = `${rect.bottom + 5}px`;
  dialog.style.left = `${rect.left}px`;
  document.body.appendChild(dialog);

  const projectSearchInput = dialog.querySelector('#project-search-input');
  const projectItemList = dialog.querySelector('#project-item-list');
  const createNewProjectButton = dialog.querySelector('#create-new-project');

  const closeDialog = () => {
    dialog.remove();
    document.removeEventListener('click', handleOutsideClick);
  };

  const filterProjects = () => {
    const searchTerm = projectSearchInput.value.toLowerCase();
    projectItemList.innerHTML = `
      <div class="dialog__item" data-project-id="no-project" data-project-name="No Project" data-project-color="#ccc">
        <span class="dialog__item-text">NO PROJECT</span>
      </div>
      ${projectList.filter(p => p.name.toLowerCase().includes(searchTerm)).map(project => `
        <div class="dialog__item" data-project-id="${project.id}" data-project-name="${project.name}" data-project-color="${project.color}">
          <div class="dialog__item-icon" style="background-color: ${project.color}; border-radius: 50%; width: 10px; height: 10px;"></div>
          <span class="dialog__item-text">${project.name}</span>
          <a href="#" class="dialog__create-task">Create Task</a>
          </div>
        `).join('')}
      `;
    attachProjectItemListeners();
    // Show "Create new Project" if search term is not empty and no exact match
    if (searchTerm && !projectList.some(p => p.name.toLowerCase() === searchTerm)) {
      createNewProjectButton.style.display = 'flex';
      createNewProjectButton.querySelector('.dialog__create-text').textContent = `Create new Project "${searchTerm}"`;
    } else {
      createNewProjectButton.style.display = 'none';
    }
  };

  const attachProjectItemListeners = () => {
    dialog.querySelectorAll('.dialog__item').forEach(item => {
      item.addEventListener('click', (e) => {
        if (e.target.classList.contains('dialog__create-task')) {
          const projectName = item.dataset.projectName;
          renderCreateTaskModal(projectName, (taskName) => {
            if (onSelect && typeof onSelect === 'function') {
              onSelect(item.dataset.projectId, item.dataset.projectName, taskName, item.dataset.projectColor);
            }
            closeDialog();
          });
          e.preventDefault();
          e.stopPropagation(); // Stop propagation to prevent immediate closing of project dialog
          return;
        }
        const projectId = item.dataset.projectId;
        const projectName = item.dataset.projectName;
        const projectColor = item.dataset.projectColor;
        if (onSelect && typeof onSelect === 'function') {
          onSelect(projectId, projectName, null, projectColor);
        }
        closeDialog();
      });
    });
  };

  projectSearchInput.addEventListener('input', filterProjects);
  createNewProjectButton.addEventListener('click', () => {
    renderCreateProjectModal((newProjectId, newProjectName, newTaskName, newProjectColor) => {
      if (onSelect && typeof onSelect === 'function') {
        onSelect(newProjectId, newProjectName, newTaskName, newProjectColor);
      }
      closeDialog();
    });
  });
  attachProjectItemListeners();
  filterProjects(); // Initial filter/render

  const handleOutsideClick = (e) => {
    if (!dialog.contains(e.target) && !targetElement.contains(e.target) && !e.target.closest('.dialog__overlay')) {
      closeDialog();
    }
  };
  dialog._outsideClickListener = handleOutsideClick;
  document.addEventListener('click', handleOutsideClick);
}

export function renderTagDialog(targetElement, onSelect) {
  loadTags();

  const existingDialog = document.querySelector('.dropdown-dialog.tag-dialog');
  if (existingDialog) {
    existingDialog.remove();
    if (existingDialog._outsideClickListener) {
      document.removeEventListener('click', existingDialog._outsideClickListener);
    }
  }

  const dialog = document.createElement('div');
  dialog.className = 'dropdown-dialog tag-dialog'; // Use dropdown-dialog class
  dialog.innerHTML = `
    <div class="dialog__content">
      <input type="text" class="dialog__form-control dialog__search-input" placeholder="Add/Search tags" id="tag-search-input">
      <div class="dialog__item-list" id="tag-item-list"></div>
      <div class="dialog__create-new" id="create-new-tag" style="display: none;">
        <img src="assets/icons/plus-blue.svg" alt="Create New" class="dialog__item-icon">
        <span class="dialog__create-text">Create new Tag</span>
      </div>
    </div>
  `;
  const rect = targetElement.getBoundingClientRect();
  dialog.style.position = 'absolute';
  dialog.style.top = `${rect.bottom + 5}px`;
  dialog.style.left = `${rect.left}px`;
  document.body.appendChild(dialog);

  const tagSearchInput = dialog.querySelector('#tag-search-input');
  const tagItemList = dialog.querySelector('#tag-item-list');
  const createNewTagButton = dialog.querySelector('#create-new-tag');
  let currentSelectedTags = new Set(targetElement.dataset.selectedTags ? JSON.parse(targetElement.dataset.selectedTags) : []);

  const closeDialog = () => {
    dialog.remove();
    document.removeEventListener('click', handleOutsideClick);
  };

  const renderTags = (searchTerm = '') => {
    const filteredTags = tagList.filter(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    if (filteredTags.length === 0 && !searchTerm) {
      tagItemList.innerHTML = `
        <div class="dialog__item">
          <span class="dialog__item-text">No tags yet</span>
          <span class="dialog__item-subtext">Start typing to create one.</span>
        </div>
      `;
    } else {
      tagItemList.innerHTML = filteredTags.map(tag => `
        <div class="dialog__item">
          <input type="checkbox" id="tag-${tag}" data-tag-name="${tag}" ${currentSelectedTags.has(tag) ? 'checked' : ''}>
          <label for="tag-${tag}">${tag}</label>
        </div>
      `).join('');
    }
    tagItemList.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
      checkbox.addEventListener('change', (e) => {
        const tagName = e.target.dataset.tagName;
        if (e.target.checked) {
          currentSelectedTags.add(tagName);
        } else {
          currentSelectedTags.delete(tagName);
        }
        // Immediately notify parent about tag selection change
        if (onSelect && typeof onSelect === 'function') {
          onSelect(Array.from(currentSelectedTags));
        }
      });
    });
    // Show "Create new Tag" if search term is not empty and no exact match
    if (searchTerm && !tagList.some(tag => tag.toLowerCase() === searchTerm.toLowerCase())) {
      createNewTagButton.style.display = 'flex';
      createNewTagButton.querySelector('.dialog__create-text').textContent = `Create new Tag "${searchTerm}"`;
    } else {
      createNewTagButton.style.display = 'none';
    }
  };

  tagSearchInput.addEventListener('input', (e) => renderTags(e.target.value));
  createNewTagButton.addEventListener('click', () => {
    const newTagName = tagSearchInput.value.trim(); // Corrected Trim() to trim()
    if (newTagName && !tagList.some(tag => tag.toLowerCase() === newTagName.toLowerCase())) {
      tagList.push(newTagName);
      saveTags();
      currentSelectedTags.add(newTagName); // Auto-select newly created tag
      // No need to call renderTags here, just update the selectedTags and notify
      if (onSelect && typeof onSelect === 'function') {
        onSelect(Array.from(currentSelectedTags));
      }
      tagSearchInput.value = ''; // Clear input
      renderTags(); // Re-render to show new tag and updated selection
      showToast('Tag created successfully!');
      // closeDialog(); // You might want to keep the dialog open after creating a tag
    } else if (tagList.some(tag => tag.toLowerCase() === newTagName.toLowerCase())) {
      showToast('Tag already exists.', "info"); // Changed to info, not an error that blocks
    } else {
      showToast('Tag name cannot be empty.', "error");
    }
  });
  renderTags(); // Initial render of tags

  const handleOutsideClick = (e) => {
    if (!dialog.contains(e.target) && !targetElement.contains(e.target) && !e.target.closest('.dialog__overlay')) {
      closeDialog();
    }
  };
  dialog._outsideClickListener = handleOutsideClick;
  document.addEventListener('click', handleOutsideClick);
}

// Function to render the Calendar dropdown dialog
export function renderCalendarDialog(targetElement, onSelect) {
  const existingDialog = document.querySelector('.dropdown-dialog.calendar-dialog');
  if (existingDialog) {
    existingDialog.remove();
    if (existingDialog._outsideClickListener) {
      document.removeEventListener('click', existingDialog._outsideClickListener);
    }
  }

  const dialog = document.createElement('div');
  dialog.className = 'dropdown-dialog calendar-dialog';
  dialog.style.zIndex = '1001';
  const today = new Date();
  let currentMonth = today.getMonth();
  let currentYear = today.getFullYear();

  const closeDialog = () => {
    dialog.remove();
    document.removeEventListener('click', handleOutsideClick);
  };

  function renderCalendar(month, year) {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay(); // 0 = Sunday, 1 = Monday, ...

    // Adjust startDayOfWeek to make Monday the first day (0)
    const adjustedStartDayOfWeek = (startDayOfWeek === 0) ? 6 : startDayOfWeek - 1;

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const dayNames = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

    let calendarHTML = `
      <div class="dialog__content">
        <div class="dialog__calendar-header">
          <img src="assets/icons/chevron-left-solid.png" alt="Previous Month" class="dialog__calendar-nav" id="prev-month">
          <span class="dialog__calendar-month">${monthNames[month]} ${year}</span>
          <img src="assets/icons/chevron-right-solid.png" alt="Next Month" class="dialog__calendar-nav" id="next-month">
        </div>
        <div class="dialog__calendar">
          ${dayNames.map(day => `<span class="dialog__calendar-day-name">${day}</span>`).join('')}
    `;
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < adjustedStartDayOfWeek; i++) {
      calendarHTML += '<span></span>';
    }
    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      const isToday = i === today.getDate() && month === today.getMonth() && year === today.getFullYear();
      calendarHTML += `<span class="dialog__calendar-day ${isToday ? 'dialog__calendar-day--today' : ''}" data-day="${i}">${i}</span>`;
    }
    calendarHTML += `</div></div>`;
    dialog.innerHTML = calendarHTML;

    const prevMonthButton = dialog.querySelector('#prev-month');
    const nextMonthButton = dialog.querySelector('#next-month');
    const calendarDays = dialog.querySelectorAll('.dialog__calendar-day');

    prevMonthButton.addEventListener('click', (e) => {
      e.stopPropagation();
      currentMonth--;
      if (currentMonth < 0) { currentMonth = 11; currentYear--; }
      renderCalendar(currentMonth, currentYear);
    });
    nextMonthButton.addEventListener('click', (e) => {
      e.stopPropagation();
      currentMonth++;
      if (currentMonth > 11) { currentMonth = 0; currentYear++; }
      renderCalendar(currentMonth, currentYear);
    });
    calendarDays.forEach(dayEl => {
      dayEl.addEventListener('click', (e) => {
        e.stopPropagation();
        const day = dayEl.dataset.day;
        // Ensure month and day are 2 digits
        const selectedDate = `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        onSelect(selectedDate);
        closeDialog();
      });
    });
  }
  renderCalendar(currentMonth, currentYear);
  const rect = targetElement.getBoundingClientRect();
  dialog.style.position = 'absolute';
  // Use window.scrollY and window.scrollX for accurate positioning relative to the viewport
  dialog.style.top = `${rect.bottom + window.scrollY + 5}px`;
  dialog.style.left = `${rect.left + window.scrollX}px`;
  document.body.appendChild(dialog);

  const handleOutsideClick = (e) => {
    // Check if the click is outside the dialog AND outside the target element AND not on another dialog overlay
    if (!dialog.contains(e.target) && !targetElement.contains(e.target) && !e.target.closest('.dialog__overlay') && !e.target.closest('.dropdown-dialog')) {
      closeDialog();
    }
  };
  dialog._outsideClickListener = handleOutsideClick;
  // Use setTimeout to ensure the click that opens the dialog doesn't immediately close it
  setTimeout(() => document.addEventListener('click', handleOutsideClick), 0);
}

export function renderConfirmModal(message, onConfirm, onCancel) {
  if (document.querySelector('.dialog__overlay.confirm-modal')) {
    document.querySelector('.dialog__overlay.confirm-modal').remove();
  }

  const modal = document.createElement('div');
  modal.className = 'dialog__overlay confirm-modal';
  modal.innerHTML = `
    <div class="dialog__content">
      <p>${message}</p>
      <div class="dialog__footer">
        <button class="dialog__footer--cancel">Cancel</button>
        <button class="dialog__footer--save">Confirm</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  const confirmButton = modal.querySelector('.dialog__footer--save');
  const cancelButton = modal.querySelector('.dialog__footer--cancel');

  confirmButton.addEventListener('click', () => {
    onConfirm();
    modal.remove();
  });

  cancelButton.addEventListener('click', () => {
    onCancel();
    modal.remove();
  });

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      onCancel(); // Call cancel if clicked outside
      modal.remove();
    }
  });
}

export function renderBulkEditModal(selectedEntryCount, onSaveCallback, onCancelCallback, entriesToEdit) {
  const existingModal = document.querySelector('.dialog__overlay.bulk-edit-modal');
  if (existingModal) {
    existingModal.remove();
  }

  const modal = document.createElement('div');
  modal.className = 'dialog__overlay bulk-edit-modal';
  const firstEntry = entriesToEdit[0] || {}; // Use first entry for initial display values

  // Helper to format date for display
  const formatDateForDisplay = (dateString) => {
    if (!dateString) return 'Select date';
    try {
      return new Date(dateString).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch (e) {
      console.error("Invalid date string:", dateString, e);
      return 'Select date';
    }
  };


  modal.innerHTML = `
    <div class="dialog__content">
      <div class="dialog__header">
        <span class="dialog__header--title">Bulk edit ${selectedEntryCount} entries</span>
        <span class="dialog__close">&times;</span>
      </div>
      <div class="dialog__body">
        <div class="dialog__form-row">
          <div class="dialog__form-group">
            <input type="checkbox" id="edit-description-checkbox" class="dialog__checkbox">
            <label for="edit-description-checkbox" class="dialog__form-label">Description</label>
          </div>
          <input type="text" id="bulk-description-input" class="dialog__form-control dialog__form-control--disabled" value="${firstEntry.description || ''}" placeholder="Add description" disabled>
        </div>
        <div class="dialog__form-row">
          <div class="dialog__form-group">
            <input type="checkbox" id="edit-project-checkbox" class="dialog__checkbox">
            <label for="edit-project-checkbox" class="dialog__form-label">Project</label>
          </div>
          <button class="dialog__form-control dialog__form-control--project-button dialog__form-control--disabled" id="bulk-project-button" disabled
            data-project-id="${firstEntry.projectId || 'no-project'}"
            data-project-name="${firstEntry.project || 'No Project'}"
            data-task-name="${firstEntry.taskName || ''}"
            data-project-color="${firstEntry.projectColor || '#ccc'}">
            <span class="dialog__project-color-dot" style="background-color: ${firstEntry.projectColor || '#ccc'};"></span>
            <span>${firstEntry.taskName ? `${firstEntry.project || 'No Project'}: ${firstEntry.taskName}` : (firstEntry.project || 'No Project')}</span>
          </button>
        </div>
        <div class="dialog__form-row">
          <div class="dialog__form-group">
            <input type="checkbox" id="edit-tags-checkbox" class="dialog__checkbox">
            <label for="edit-tags-checkbox" class="dialog__form-label">Tags</label>
          </div>
          <button class="dialog__form-control dialog__form-control--tags-button dialog__form-control--disabled" id="bulk-tags-button" disabled
            data-selected-tags='${JSON.stringify(firstEntry.tags || [])}'>
            <img src="assets/icons/tags.svg" alt="Tags">
            <span>${(firstEntry.tags && firstEntry.tags.length > 0) ? firstEntry.tags.join(', ') : 'Add tags'}</span>
          </button>
        </div>
        <div class="dialog__tags-options" style="display: flex;">
          <input type="radio" id="tags-add-radio" name="tags-option" value="add" checked>
          <label for="tags-add-radio">Add to existing</label>
          <input type="radio" id="tags-overwrite-radio" name="tags-option" value="overwrite">
          <label for="tags-overwrite-radio">Overwrite existing</label>
        </div>
        <div class="dialog__form-row">
          <div class="dialog__form-group">
            <input type="checkbox" id="edit-billable-checkbox" class="dialog__checkbox">
            <label for="edit-billable-checkbox" class="dialog__form-label">Billable</label>
          </div>
          <div class="dialog__billable-toggle-container">
            <span class="dialog__billable-label">No</span>
            <label class="dialog__billable-toggle ${!firstEntry.isBillable ? 'dialog__billable-toggle--disabled' : ''}" id="bulk-billable-toggle">
              <input type="checkbox" id="bulk-billable-input" ${firstEntry.isBillable ? 'checked' : ''} disabled>
              <span class="dialog__billable-toggle-slider"></span>
            </label>
            <span class="dialog__billable-label">Yes</span>
          </div>
        </div>
        <div class="dialog__form-row">
          <div class="dialog__form-group">
            <input type="checkbox" id="edit-time-checkbox" class="dialog__checkbox">
            <label for="edit-time-checkbox" class="dialog__form-label">Time</label>
          </div>
          <div class="dialog__time-inputs">
            <input type="time" class="dialog__form-control dialog__time-input" id="bulk-start-time-input" value="${firstEntry.startTime || ''}" step="60" disabled>
            <span>-</span>
            <input type="time" class="dialog__form-control dialog__time-input" id="bulk-end-time-input" value="${firstEntry.endTime || ''}" step="60" disabled>
          </div>
        </div>
        <div class="dialog__form-row dialog__form-row--last">
          <div class="dialog__form-group">
            <input type="checkbox" id="edit-date-checkbox" class="dialog__checkbox">
            <label for="edit-date-checkbox" class="dialog__form-label">Date</label>
          </div>
          <button class="dialog__form-control dialog__form-control--date-button dialog__form-control--disabled" id="bulk-date-button" disabled
            data-selected-date="${firstEntry.date || ''}">
            <img src="assets/icons/calendar.svg" alt="Calendar">
            <span>${formatDateForDisplay(firstEntry.date)}</span>
          </button>
        </div>
      </div>
      <div class="dialog__footer">
        <button class="dialog__footer--cancel">Cancel</button>
        <button class="dialog__footer--save">Save</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  const closeButton = modal.querySelector('.dialog__close');
  const cancelButton = modal.querySelector('.dialog__footer--cancel');
  const saveButton = modal.querySelector('.dialog__footer--save');
  const editDescriptionCheckbox = modal.querySelector('#edit-description-checkbox');
  const bulkDescriptionInput = modal.querySelector('#bulk-description-input');
  const editProjectCheckbox = modal.querySelector('#edit-project-checkbox');
  const bulkProjectButton = modal.querySelector('#bulk-project-button');
  const editTagsCheckbox = modal.querySelector('#edit-tags-checkbox');
  const bulkTagsButton = modal.querySelector('#bulk-tags-button');
  const tagsOptions = modal.querySelector('.dialog__tags-options');
  const tagsAddRadio = modal.querySelector('#tags-add-radio');
  const tagsOverwriteRadio = modal.querySelector('#tags-overwrite-radio');
  const editBillableCheckbox = modal.querySelector('#edit-billable-checkbox');
  const bulkBillableToggle = modal.querySelector('#bulk-billable-toggle');
  const bulkBillableInput = modal.querySelector('#bulk-billable-input');
  const editTimeCheckbox = modal.querySelector('#edit-time-checkbox');
  const bulkStartTimeInput = modal.querySelector('#bulk-start-time-input');
  const bulkEndTimeInput = modal.querySelector('#bulk-end-time-input');
  const editDateCheckbox = modal.querySelector('#edit-date-checkbox');
  const bulkDateButton = modal.querySelector('#bulk-date-button');

  const updateControlStates = () => {
    enableField(editDescriptionCheckbox, bulkDescriptionInput, editDescriptionCheckbox.checked);
    enableField(editProjectCheckbox, bulkProjectButton, editProjectCheckbox.checked);
    enableField(editTagsCheckbox, bulkTagsButton, editTagsCheckbox.checked);

    if (editBillableCheckbox.checked) {
      bulkBillableInput.disabled = false;
      bulkBillableToggle.classList.remove('dialog__billable-toggle--disabled');
      bulkBillableToggle.style.cursor = 'pointer';
    } else {
      bulkBillableInput.disabled = true;
      bulkBillableToggle.classList.add('dialog__billable-toggle--disabled');
      bulkBillableToggle.style.cursor = 'not-allowed';
    }

    enableField(editTimeCheckbox, bulkStartTimeInput, editTimeCheckbox.checked);
    enableField(editTimeCheckbox, bulkEndTimeInput, editTimeCheckbox.checked);
    enableField(editDateCheckbox, bulkDateButton, editDateCheckbox.checked);

    // Show/hide tags options based on checkbox
    if (editTagsCheckbox.checked) {
      tagsOptions.style.display = 'flex';
    } else {
      tagsOptions.style.display = 'none';
    }
  };
  updateControlStates(); // Initial call to set states

  const closeModal = () => {
    modal.remove();
    if (onCancelCallback && typeof onCancelCallback === 'function') {
      onCancelCallback();
    }
  };

  const enableField = (checkboxElement, inputElement, enabled) => {
    inputElement.disabled = !enabled;
    inputElement.classList.toggle('dialog__form-control--enabled', enabled);
    inputElement.classList.toggle('dialog__form-control--disabled', !enabled);
    if (inputElement.tagName === 'BUTTON' || inputElement.type === 'color') { // Also handle color pickers if applicable
      inputElement.style.cursor = enabled ? 'pointer' : 'not-allowed';
    }
  };

  editDescriptionCheckbox.addEventListener('change', updateControlStates);
  editProjectCheckbox.addEventListener('change', updateControlStates);
  editTagsCheckbox.addEventListener('change', updateControlStates);
  editBillableCheckbox.addEventListener('change', updateControlStates);
  editTimeCheckbox.addEventListener('change', updateControlStates);
  editDateCheckbox.addEventListener('change', updateControlStates);


  bulkProjectButton.addEventListener('click', (e) => {
    if (e.currentTarget.disabled) {
      return;
    }
    e.preventDefault();
    renderProjectDialog(e.currentTarget, (projectId, projectName, taskName, projectColor) => {
      bulkProjectButton.querySelector('span:last-child').textContent = taskName ? `${projectName}: ${taskName}` : projectName;
      bulkProjectButton.querySelector('.dialog__project-color-dot').style.backgroundColor = projectColor;
      bulkProjectButton.dataset.projectId = projectId;
      bulkProjectButton.dataset.projectName = projectName;
      bulkProjectButton.dataset.taskName = taskName;
      bulkProjectButton.dataset.projectColor = projectColor;
    });
  });

  bulkTagsButton.addEventListener('click', (e) => {
    if (e.currentTarget.disabled) {
      return;
    }
    e.preventDefault();
    const currentTagsText = bulkTagsButton.querySelector('span').textContent;
    // Initial tags from dataset, or empty array if "Add tags"
    const initialTags = JSON.parse(bulkTagsButton.dataset.selectedTags || '[]');

    renderTagDialog(e.currentTarget, (selectedTags) => {
      bulkTagsButton.querySelector('span').textContent = selectedTags.length > 0 ? selectedTags.join(', ') : 'Add tags';
      bulkTagsButton.dataset.selectedTags = JSON.stringify(selectedTags);
    });
  });

  bulkDateButton.addEventListener('click', (e) => {
    if (e.currentTarget.disabled) {
      return;
    }
    e.preventDefault();
    renderCalendarDialog(e.currentTarget, (selectedDateISO) => {
      bulkDateButton.querySelector('span').textContent = formatDateForDisplay(selectedDateISO);
      bulkDateButton.dataset.selectedDate = selectedDateISO;
    });
  });

  tagsAddRadio.addEventListener('change', updateControlStates); // Call updateControlStates to ensure tags options visibility is correct
  tagsOverwriteRadio.addEventListener('change', updateControlStates); // Call updateControlStates

  // Function to calculate duration for time inputs
  const calculateDurationFromTimeInputs = () => {
    const startTimeStr = bulkStartTimeInput.value;
    const endTimeStr = bulkEndTimeInput.value;

    if (!startTimeStr || !endTimeStr) {
      return '00:00:00';
    }

    const [startH, startM] = startTimeStr.split(':').map(Number);
    const [endH, endM] = endTimeStr.split(':').map(Number);

    let startMinutes = startH * 60 + startM;
    let endMinutes = endH * 60 + endM;

    // Handle overnight durations
    if (endMinutes < startMinutes) {
      endMinutes += 24 * 60; // Add 24 hours if end time is on the next day
    }
    const durationInMinutes = endMinutes - startMinutes;
    return formatDuration(durationInMinutes * 60); // Convert minutes to seconds for formatDuration
  };

  // Optional: Update duration display instantly when time inputs change
  bulkStartTimeInput.addEventListener('input', () => {
    // No need to update a duration display directly in the bulk edit modal for time.
    // The calculated duration will be saved on "Save"
  });
  bulkEndTimeInput.addEventListener('input', () => {
    // No need to update a duration display directly in the bulk edit modal for time.
    // The calculated duration will be saved on "Save"
  });


  saveButton.addEventListener('click', () => {
    const updates = {};
    if (editDescriptionCheckbox.checked) {
      updates.description = bulkDescriptionInput.value.trim(); // Corrected Trim()
    }
    if (editProjectCheckbox.checked) {
      updates.project = bulkProjectButton.dataset.projectName || 'No Project';
      updates.projectColor = bulkProjectButton.dataset.projectColor || '#ccc';
      updates.taskName = bulkProjectButton.dataset.taskName || null;
      updates.projectId = bulkProjectButton.dataset.projectId || 'no-project'; // Pass projectId too
    }
    if (editTagsCheckbox.checked) {
      const selectedTagsArray = JSON.parse(bulkTagsButton.dataset.selectedTags || '[]');
      const tagsOption = modal.querySelector('input[name="tags-option"]:checked').value;
      // Pass mode and newTags for logic in updateTimeEntry
      updates.tags = { mode: tagsOption, newTags: selectedTagsArray };
    }
    if (editBillableCheckbox.checked) {
      updates.isBillable = bulkBillableInput.checked;
    }
    if (editTimeCheckbox.checked) {
      updates.startTime = bulkStartTimeInput.value;
      updates.endTime = bulkEndTimeInput.value;
      // Calculate duration here based on potentially new start/end times
      updates.duration = calculateDurationFromTimeInputs();
    }
    if (editDateCheckbox.checked) {
      updates.date = bulkDateButton.dataset.selectedDate || new Date().toISOString().split('T')[0];
    }
    
    if (Object.keys(updates).length > 0) {
      // Pass updates to the callback. The callback will iterate through selected entries
      // and call updateTimeEntry for each.
      if (onSaveCallback && typeof onSaveCallback === 'function') {
        onSaveCallback(updates); // Callback in entrylist.js will handle iterating entries
      }
      showToast('Entries updated successfully!'); // Success toast for bulk edit
    } else {
      showToast('No changes made.', "info");
    }
    closeModal();
  });

  closeButton.addEventListener('click', closeModal);
  cancelButton.addEventListener('click', closeModal);

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });
}