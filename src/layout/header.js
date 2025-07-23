export function renderHeader() {
  const header = document.createElement('div');
  header.className = 'app__header';

  // Left section
  const left = document.createElement('div');
  left.className = 'app__header-left';
  left.innerHTML = `
    <img src="assets/icons/menu.png" alt="Menu" class="app__header-icon">
    <img src="assets/icons/clockify-logo.svg" alt="Clockify Logo" class="app__header-logo">
    <div class="app__header-separator"></div>
    <span class="app__header-text">What are you working on?</span>
    <div class="app__header-separator"></div>
    <img src="assets/icons/menu-dots-vertical.svg" alt="More Options" class="app__header-icon">
    <button class="app__header-upgrade">UPGRADE</button>
  `;

  // Right section
  const right = document.createElement('div');
  right.className = 'app__header-right';
  right.innerHTML = `
    <div class="app__header-separator"></div>
    <img src="assets/icons/addon-grey-border.svg" alt="Add-ons" class="app__header-icon">
    <div class="app__header-separator"></div>
    <img src="assets/icons/notification.svg" alt="Notifications" class="app__header-icon">
    <div class="app__header-separator"></div>
    <img src="assets/icons/help.svg" alt="Help" class="app__header-icon">
    <div class="app__header-separator"></div>
    <div class="app__header-user-avatar">VE</div>
  `;

  header.appendChild(left);
  header.appendChild(right);
  document.getElementById('app').appendChild(header);
}
