// src/index.js
import { renderHeader } from './layout/header.js';
import { renderSidebar } from './layout/sidebar.js';
import { renderMainContent } from './layout/maincontent.js';
import { loadEntries } from './layout/entrylist.js';

document.addEventListener('DOMContentLoaded', () => {
  const app = document.getElementById('app');
  renderHeader(app);

  const contentContainer = document.createElement('div');
  contentContainer.className = 'app__content-container';
  app.appendChild(contentContainer);

  renderSidebar(contentContainer);
  renderMainContent(contentContainer);

  const mainContentElement = document.getElementById('app-main-content');
  if (mainContentElement) {
    mainContentElement.classList.remove('hidden');
  }
});
