/**
 * IDS Hackathon 2026 - All Projects Page
 * Displays grouped projects by name with all their links
 * Version: 2.0 - Grouping by project name
 */

console.log('🚀 All Projects v2.0 - Grouping by project name loaded');

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
 * Normalize a URL for comparison
 * Removes protocol, www, trailing slashes, and lowercases
 */
function normalizeUrl(str) {
  return str
    .toLowerCase()
    .replace(/^https?:\/\//, '')  // Remove http:// or https://
    .replace(/^www\./, '')         // Remove www.
    .replace(/\/+$/, '')           // Remove trailing slashes
    .trim();
}

/**
 * Normalize a project name for comparison
 * Only lowercases and trims whitespace
 */
function normalizeName(str) {
  return str
    .toLowerCase()
    .trim();
}

/**
 * Shuffle an array using Fisher-Yates algorithm
 */
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Group projects by normalized name (case-insensitive)
 * Each group contains a title and an array of unique URLs
 */
function getGroupedProjects(participants) {
  const projectGroups = new Map();
  
  participants.forEach(participant => {
    if (participant.projectUrl && participant.projectName) {
      // Use normalized name as key to group projects with same title
      const normalizedName = normalizeName(participant.projectName);
      
      // Debug logging
      console.log(`Processing: "${participant.projectName}" -> normalized: "${normalizedName}"`);
      
      if (!projectGroups.has(normalizedName)) {
        projectGroups.set(normalizedName, {
          title: participant.projectName, // Keep original casing for display
          urls: new Map() // Use Map to deduplicate URLs
        });
        console.log(`  Created new group for: "${normalizedName}"`);
      } else {
        console.log(`  Adding to existing group: "${normalizedName}"`);
      }
      
      // Add URL to this group (normalized URL as key to avoid duplicates)
      const group = projectGroups.get(normalizedName);
      const normalizedUrl = normalizeUrl(participant.projectUrl);
      if (!group.urls.has(normalizedUrl)) {
        group.urls.set(normalizedUrl, participant.projectUrl);
        console.log(`    Added URL: ${participant.projectUrl}`);
      } else {
        console.log(`    Skipped duplicate URL: ${participant.projectUrl}`);
      }
    }
  });
  
  // Log final groups
  console.log('\nFinal grouped projects:');
  projectGroups.forEach((group, key) => {
    console.log(`  "${key}": ${group.urls.size} URL(s)`);
  });
  
  // Convert to array format and randomize order
  const groupsArray = Array.from(projectGroups.values()).map(group => ({
    title: group.title,
    urls: Array.from(group.urls.values())
  }));
  
  return shuffleArray(groupsArray);
}

// ============================================
// Project Rendering
// ============================================

/**
 * Create a project card with title and multiple links
 */
function createProjectCard(projectGroup) {
  const li = document.createElement('li');
  li.className = 'project-card';
  
  // Create title heading
  const title = document.createElement('h2');
  title.className = 'project-card-title';
  title.textContent = projectGroup.title;
  li.appendChild(title);
  
  // Create list of links
  const linksList = document.createElement('ul');
  linksList.className = 'project-links-list';
  linksList.setAttribute('aria-label', `Links for ${projectGroup.title}`);
  
  projectGroup.urls.forEach(url => {
    const linkItem = document.createElement('li');
    
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.className = 'project-link';
    
    link.innerHTML = `
      <span class="project-url">${url}</span>
      <span class="visually-hidden">(opens in new tab)</span>
    `;
    
    linkItem.appendChild(link);
    linksList.appendChild(linkItem);
  });
  
  li.appendChild(linksList);
  return li;
}

/**
 * Render all grouped projects
 */
async function renderAllProjects() {
  projectsList.innerHTML = '';
  
  try {
    const participants = await fetchAllParticipants();
    const groupedProjects = getGroupedProjects(participants);
    
    if (groupedProjects.length === 0) {
      const emptyMessage = document.createElement('li');
      emptyMessage.className = 'empty-message';
      emptyMessage.textContent = 'No projects have been submitted yet.';
      projectsList.appendChild(emptyMessage);
      announce('No projects found');
      return;
    }
    
    // Count total links across all groups
    const totalLinks = groupedProjects.reduce((sum, group) => sum + group.urls.length, 0);
    
    // Render each project group
    groupedProjects.forEach((projectGroup, index) => {
      const card = createProjectCard(projectGroup);
      card.style.animationDelay = `${index * 50}ms`;
      projectsList.appendChild(card);
    });
    
    announce(`Loaded ${groupedProjects.length} projects with ${totalLinks} links`);
    
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
