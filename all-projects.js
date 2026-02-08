/**
 * IDS Hackathon 2026 - All Projects Page
 * Displays unique project links without duplicates
 */

import { fetchAllParticipants } from './db.js';

// ============================================
// DOM Elements
// ============================================

const projectsList = document.getElementById('projects-list');
const statusAnnouncer = document.getElementById('status');

// ============================================
// Utility Functions
// ============================================

/**
 * Announce a message to screen readers
 */
function announce(message) {
  statusAnnouncer.textContent = message;
  setTimeout(() => {
    statusAnnouncer.textContent = '';
  }, 1000);
}

/**
 * Extract unique projects from participants
 * Uses projectUrl as the unique key to avoid duplicates
 */
function getUniqueProjects(participants) {
  const projectMap = new Map();
  
  participants.forEach(participant => {
    if (participant.projectUrl && participant.projectName) {
      // Use projectUrl as key to deduplicate
      if (!projectMap.has(participant.projectUrl)) {
        projectMap.set(participant.projectUrl, {
          url: participant.projectUrl,
          name: participant.projectName
        });
      }
    }
  });
  
  // Convert map values to array and sort by project name
  return Array.from(projectMap.values()).sort((a, b) => 
    a.name.toLowerCase().localeCompare(b.name.toLowerCase())
  );
}

// ============================================
// Project Rendering
// ============================================

/**
 * Create a project list item
 */
function createProjectItem(project) {
  const li = document.createElement('li');
  li.className = 'project-item';
  
  const link = document.createElement('a');
  link.href = project.url;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.className = 'project-link';
  link.innerHTML = `${project.name} <span class="visually-hidden">(opens in new tab)</span>`;
  
  li.appendChild(link);
  return li;
}

/**
 * Render all unique projects
 */
async function renderAllProjects() {
  projectsList.innerHTML = '';
  
  try {
    const participants = await fetchAllParticipants();
    const uniqueProjects = getUniqueProjects(participants);
    
    if (uniqueProjects.length === 0) {
      const emptyMessage = document.createElement('li');
      emptyMessage.className = 'empty-message';
      emptyMessage.textContent = 'No projects have been submitted yet.';
      projectsList.appendChild(emptyMessage);
      announce('No projects found');
      return;
    }
    
    // Render each project
    uniqueProjects.forEach((project, index) => {
      const item = createProjectItem(project);
      item.style.animationDelay = `${index * 50}ms`;
      projectsList.appendChild(item);
    });
    
    announce(`Loaded ${uniqueProjects.length} projects`);
    
  } catch (error) {
    console.error('Error loading projects:', error);
    announce('Error loading projects');
    
    const errorMessage = document.createElement('li');
    errorMessage.className = 'error-message';
    errorMessage.textContent = 'Failed to load projects. Please try again later.';
    projectsList.appendChild(errorMessage);
  }
}

// ============================================
// Initialization
// ============================================

async function init() {
  announce('Loading all projects...');
  await renderAllProjects();
}

// Start the app
init();
