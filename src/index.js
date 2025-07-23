import { renderSidebar } from './layout/sidebar.js';
import { renderHeader } from './layout/header.js';

document.addEventListener('DOMContentLoaded', () => {
  const app = document.createElement('div');
  app.id = 'app';
  document.body.appendChild(app);

  renderHeader();
  renderSidebar();
});
