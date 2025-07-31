// src/layout/sidebar.js

export function renderSidebar(parentEl) {
  const TOP_ITEMS = [
    { name: 'Time Tracker', icon: 'time-tracker.svg' },
    { name: 'Calendar', icon: 'calendar.svg' },
    { name: 'Analyze', isHeader: true },
    { name: 'Dashboard', icon: 'dashboard.svg' },
    { name: 'Reports', icon: 'reports.svg' },
    { name: 'Manage', isHeader: true },
    { name: 'Projects', icon: 'projects.svg' },
    { name: 'Team', icon: 'teams.svg' },
    { name: 'Clients', icon: 'clients.svg' },
    { name: 'Tags', icon: 'tags.svg' },
  ];

  const BOTTOM_ITEMS = [
    { name: 'Timesheet', icon: 'timesheet.svg' },
    { name: 'Kiosks', icon: 'Kiosk.svg' },
    { name: 'Schedule', icon: 'scheduling.svg' },
    { name: 'Expenses', icon: 'expenses.svg' },
    { name: 'Time Off', icon: 'time-off-sidebar.svg' },
    { name: 'Activity', icon: 'activity.svg' },
    { name: 'Approvals', icon: 'approvals.svg' },
    { name: 'Invoices', icon: 'invoices.svg' },
  ];

  const sidebar = document.createElement('nav');
  sidebar.className = 'sidebar';
  sidebar.innerHTML = `
    <div class="sidebar__menu" id="menu">
      ${TOP_ITEMS.map((item, index) => {
        if (item.isHeader) {
          return `<div class="sidebar__section-header">${item.name}</div>`;
        }
        return `
          <a href="#" class="sidebar__item" draggable="true" data-index="${index}">
            <img class="sidebar__item-icon" src="assets/icons/${item.icon}" alt="${item.name} icon" />
            <span class="sidebar__item-text">${item.name}</span>
            <img class="sidebar__drag-icon" src="assets/icons/drag-item.svg" alt="Drag Handle" />
          </a>
        `;
      }).join('')}

      <a href="#" class="sidebar__item" id="toggleItem">
        <img class="sidebar__item-icon" id="toggleIcon" src="assets/icons/chevron-down.svg" alt="Toggle Icon" />
        <span class="sidebar__item-text" id="toggleText">Show More</span>
        <img class="sidebar__drag-icon" src="assets/icons/drag-item.svg" alt="" style="visibility:hidden;" />
      </a>

      <div class="sidebar__more hidden" id="moreMenu">
        ${BOTTOM_ITEMS.map((item, index) => `
          <a href="#" class="sidebar__item" draggable="true" data-index="${index}">
            <img class="sidebar__item-icon" src="assets/icons/${item.icon}" alt="${item.name} icon" />
            <span class="sidebar__item-text">${item.name}</span>
            <img class="sidebar__drag-icon" src="assets/icons/drag-item.svg" alt="Drag Handle" />
          </a>
        `).join('')}
      </div>
    </div>

    <button class="sidebar__toggle-button" id="sidebarToggle">
      <img id="sidebarToggleIcon" src="assets/icons/sidebar-toggler-union-open.svg" alt="Toggle Sidebar" />
    </button>
  `;
  parentEl.appendChild(sidebar);

  // Toggle bottom menu
  const toggleItem = document.getElementById('toggleItem');
  const toggleIcon = document.getElementById('toggleIcon');
  const toggleText = document.getElementById('toggleText');
  const moreMenu = document.getElementById('moreMenu');

  toggleItem.addEventListener('click', (e) => {
    e.preventDefault();
    const isHidden = moreMenu.classList.toggle('hidden');
    toggleText.textContent = isHidden ? 'Show More' : 'Show Less';
    toggleIcon.src = isHidden ? 'assets/icons/chevron-down.svg' : 'assets/icons/chevron-up.svg';
  });

  // Sidebar collapse toggle
  const sidebarToggle = document.getElementById('sidebarToggle');
  const sidebarToggleIcon = document.getElementById('sidebarToggleIcon');

  sidebarToggle.addEventListener('click', () => {
    sidebar.classList.toggle('collapsed');
    const isCollapsed = sidebar.classList.contains('collapsed');
    sidebarToggleIcon.src = isCollapsed
      ? 'assets/icons/sidebar-toggler-union-close.svg'
      : 'assets/icons/sidebar-toggler-union-open.svg';
  });

  // Drag-and-drop logic
  let draggedItem = null;

  function enableDrag(containerId) {
    const container = document.getElementById(containerId);
    container.querySelectorAll('.sidebar__item[draggable="true"]').forEach(item => {
      item.addEventListener('dragstart', () => {
        draggedItem = item;
        item.classList.add('dragging');
      });

      item.addEventListener('dragend', () => {
        item.classList.remove('dragging');
        draggedItem = null;
      });

      item.addEventListener('dragover', (e) => {
        e.preventDefault();
      });

      item.addEventListener('drop', (e) => {
        e.preventDefault();
        if (draggedItem && draggedItem !== item) {
          const container = item.parentNode;
          const draggedIndex = [...container.children].indexOf(draggedItem);
          const targetIndex = [...container.children].indexOf(item);

          // Find the correct insertion point, avoiding headers and the toggle item
          const referenceNode = (draggedIndex < targetIndex) ? item.nextSibling : item;
          container.insertBefore(draggedItem, referenceNode);

          const itemName = draggedItem.querySelector('.sidebar__item-text')?.textContent || 'Item';
          showToast(`${itemName} reordered!`); // Use the global showToast
        }
      });
    });
  }

  enableDrag('menu');
  // Re-enable drag for the moreMenu after it's shown, as its content is dynamic
  toggleItem.addEventListener('click', () => {
    if (!moreMenu.classList.contains('hidden')) {
      enableDrag('moreMenu');
    }
  });
}

// Function to show a toast notification (global)
export function showToast(message, type = 'success') {
  let toast = document.getElementById('toast');
  if (!toast) {
    // Create toast element if it doesn't exist
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'toast';
    toast.innerHTML = `
      <img src="https://app.clockify.me/assets/ui-icons/checkmark-white-circle.svg" alt="Success" class="toast__icon">
      <span class="toast__message"></span>
    `;
    document.body.appendChild(toast);
  }

  const toastMessage = toast.querySelector('.toast__message');
  const toastIcon = toast.querySelector('.toast__icon');

  toastMessage.textContent = message;

  // Reset classes and apply type-specific styles
  toast.classList.remove('show', 'toast--success', 'toast--error');
  // Update icon source based on type
  if (type === 'success') {
    toast.classList.add('toast--success');
    toast.style.backgroundColor = '#38a169'; // Green for success
    toastIcon.src = 'https://app.clockify.me/assets/ui-icons/checkmark-white-circle.svg';
  } else if (type === 'error') {
    toast.classList.add('toast--error');
    toast.style.backgroundColor = '#e53e3e'; // Red for error
    toastIcon.src = 'assets/icons/x-circle.svg'; // Assuming you have an x-circle.svg for errors
  }

  toast.classList.add('show');

  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000); // Hide after 3 seconds
}
