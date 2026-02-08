/**
 * IDS Hackathon 2026 - All Participants Page
 * Displays all participants in a random order
 */

import { fetchAllParticipants, addParticipant } from './db.js';

// Maximum file size for avatar upload (500KB)
const MAX_AVATAR_SIZE = 500 * 1024;

// ============================================
// Configuration
// ============================================

// Fruit emojis with matching background colors
const FRUIT_AVATARS = [
  { emoji: '🍎', color: '#FF6B6B' },  // Red apple
  { emoji: '🍋', color: '#FFE66D' },  // Lemon (yellow)
  { emoji: '🥝', color: '#88D498' },  // Kiwi (green)
  { emoji: '🍇', color: '#9B5DE5' },  // Grapes (purple)
  { emoji: '🍊', color: '#FF9F43' },  // Orange
  { emoji: '🍓', color: '#EE5A5A' },  // Strawberry (red)
  { emoji: '🍑', color: '#FFBE76' },  // Peach
  { emoji: '🍌', color: '#F9E04B' },  // Banana (yellow)
  { emoji: '🫐', color: '#5F7ADB' },  // Blueberry
  { emoji: '🍉', color: '#FF7979' },  // Watermelon
];

// ============================================
// DOM Elements
// ============================================

const cardGrid = document.getElementById('card-grid');
const statusAnnouncer = document.getElementById('status');
const addYourselfBtn = document.getElementById('add-yourself-btn');
const formPage = document.getElementById('form-page');
const backBtn = document.getElementById('back-btn');
const participantForm = document.getElementById('participant-form');
const formView = document.getElementById('form-view');
const successView = document.getElementById('success-view');
const successCloseBtn = document.getElementById('success-close-btn');

// Form fields
const nameInput = document.getElementById('name');
const linkedinInput = document.getElementById('linkedin');
const portfolioInput = document.getElementById('portfolio');
const projectUrlInput = document.getElementById('project-url');
const projectNameInput = document.getElementById('project-name');
const avatarInput = document.getElementById('avatar');
const submitBtn = document.getElementById('submit-btn');

// State
let previousFocus = null;

// Track available fruits to avoid repeats within a render
let availableFruits = [];

// ============================================
// Utility Functions
// ============================================

/**
 * Reset the available fruits pool (call at start of each render)
 */
function resetAvailableFruits() {
  availableFruits = [...FRUIT_AVATARS];
}

/**
 * Get a random fruit avatar without repeating within a single render
 * Once all fruits are used, reset the pool
 */
function getRandomFruitAvatar() {
  // If we've used all fruits, reset the pool
  if (availableFruits.length === 0) {
    availableFruits = [...FRUIT_AVATARS];
  }
  
  // Pick a random fruit from available ones
  const index = Math.floor(Math.random() * availableFruits.length);
  const fruit = availableFruits[index];
  
  // Remove this fruit from available pool
  availableFruits.splice(index, 1);
  
  return fruit;
}

/**
 * Announce a message to screen readers
 * @param {string} message - The message to announce
 * @param {Function} [onComplete] - Optional callback when announcement is likely complete
 */
function announce(message, onComplete) {
  statusAnnouncer.textContent = message;
  
  // Estimate reading time: average screen reader speed is ~150-200 words per minute
  // We use a conservative estimate of ~120 words per minute for clarity
  // Plus a small buffer for screen reader processing
  const wordCount = message.split(/\s+/).length;
  const estimatedReadingTime = Math.max(2000, (wordCount / 120) * 60 * 1000 + 500);
  
  // Clear after announcement
  setTimeout(() => {
    statusAnnouncer.textContent = '';
    if (onComplete) {
      onComplete();
    }
  }, estimatedReadingTime);
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

// ============================================
// Card Rendering
// ============================================

/**
 * Create a filled participant card
 */
function createFilledCard(participant) {
  const card = document.createElement('article');
  card.className = 'card';
  card.setAttribute('role', 'listitem');
  
  // Avatar
  const avatar = document.createElement('div');
  avatar.className = 'card-avatar';
  
  if (participant.avatarBase64) {
    const img = document.createElement('img');
    img.src = participant.avatarBase64;
    img.alt = `${participant.name}'s avatar`;
    avatar.appendChild(img);
  } else {
    const fruit = getRandomFruitAvatar();
    avatar.style.backgroundColor = fruit.color;
    avatar.textContent = fruit.emoji;
    avatar.setAttribute('aria-hidden', 'true');
  }
  
  // Name
  const name = document.createElement('h2');
  name.className = 'card-name';
  name.textContent = participant.name;
  
  // Links
  const links = document.createElement('nav');
  links.className = 'card-links';
  links.setAttribute('aria-label', `${participant.name}'s links`);
  
  // LinkedIn link
  const linkedinLink = document.createElement('a');
  linkedinLink.href = participant.linkedinUrl;
  linkedinLink.target = '_blank';
  linkedinLink.rel = 'noopener noreferrer';
  linkedinLink.innerHTML = 'LinkedIn <span class="visually-hidden">(opens in new tab)</span>';
  links.appendChild(linkedinLink);
  
  // Portfolio link (optional)
  if (participant.portfolioUrl) {
    const portfolioLink = document.createElement('a');
    portfolioLink.href = participant.portfolioUrl;
    portfolioLink.target = '_blank';
    portfolioLink.rel = 'noopener noreferrer';
    portfolioLink.innerHTML = 'Portfolio <span class="visually-hidden">(opens in new tab)</span>';
    links.appendChild(portfolioLink);
  }
  
  // Project link (optional)
  if (participant.projectUrl && participant.projectName) {
    const projectLink = document.createElement('a');
    projectLink.href = participant.projectUrl;
    projectLink.target = '_blank';
    projectLink.rel = 'noopener noreferrer';
    projectLink.innerHTML = `${participant.projectName} <span class="visually-hidden">(opens in new tab)</span>`;
    links.appendChild(projectLink);
  }
  
  card.appendChild(avatar);
  card.appendChild(name);
  card.appendChild(links);
  
  return card;
}

/**
 * Render all participants in random order
 */
async function renderAllParticipants() {
  cardGrid.innerHTML = '';
  
  // Reset fruit pool at the start of each render to ensure no repeats
  resetAvailableFruits();
  
  try {
    const participants = await fetchAllParticipants();
    
    if (participants.length === 0) {
      const emptyMessage = document.createElement('p');
      emptyMessage.className = 'empty-message';
      emptyMessage.textContent = 'No participants yet. Be the first to join!';
      emptyMessage.style.cssText = 'text-align: center; grid-column: 1 / -1; padding: 2rem; color: rgba(255, 255, 255, 0.6);';
      cardGrid.appendChild(emptyMessage);
      announce('No participants found');
      return;
    }
    
    // Shuffle participants for random order
    const shuffledParticipants = shuffleArray(participants);
    
    // Render each participant card
    shuffledParticipants.forEach((participant, index) => {
      const card = createFilledCard(participant);
      card.style.animationDelay = `${index * 30}ms`;
      cardGrid.appendChild(card);
    });
    
    announce(`Loaded ${participants.length} participants`);
    
  } catch (error) {
    console.error('Error loading participants:', error);
    announce('Error loading participants');
    
    const errorMessage = document.createElement('p');
    errorMessage.className = 'error-message';
    errorMessage.textContent = 'Failed to load participants. Please try again later.';
    errorMessage.style.cssText = 'text-align: center; grid-column: 1 / -1; padding: 2rem; color: #ff6b6b;';
    cardGrid.appendChild(errorMessage);
  }
}

// ============================================
// Form Page Management
// ============================================

/**
 * Convert file to Base64
 */
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Validate URL format
 */
function isValidUrl(string) {
  try {
    const url = new URL(string);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Open the form page
 */
function openFormPage() {
  previousFocus = document.activeElement;
  
  // Reset form and views
  participantForm.reset();
  clearAllErrors();
  formView.hidden = false;
  successView.hidden = true;
  
  // Show form page
  formPage.hidden = false;
  
  // Focus first input
  setTimeout(() => {
    nameInput.focus();
  }, 100);
  
  // Announce to screen readers
  announce('Join the hackathon form opened');
}

/**
 * Close the form page and go back to participants
 */
function closeFormPage() {
  formPage.hidden = true;
  
  // Return focus to previous element
  if (previousFocus) {
    previousFocus.focus();
  }
  
  announce('Returned to participants view');
}

/**
 * Show success view and auto-redirect back to participants list
 * Redirects after the announcement is complete
 */
function showSuccessView() {
  formView.hidden = true;
  successView.hidden = false;
  successCloseBtn.focus();
  
  const successMessage = 'Success! Your card has been added to the hackathon.';
  
  // Announce and redirect after the announcement is complete
  announce(successMessage, () => {
    redirectToParticipants();
  });
}

/**
 * Redirect back to participants list and refresh
 */
async function redirectToParticipants() {
  // If form page is already hidden, don't do anything
  if (formPage.hidden) {
    return;
  }
  
  // Close the form page
  formPage.hidden = true;
  
  // Refresh the grid to show the new participant
  await renderAllParticipants();
  
  // Focus on the main content for accessibility
  const main = document.getElementById('main');
  if (main) {
    main.focus();
  }
  
  announce('Your card has been added to the list.');
}

/**
 * Handle keyboard navigation on form page
 */
function handleFormPageKeydown(e) {
  if (formPage.hidden) return;
  
  if (e.key === 'Escape') {
    closeFormPage();
  }
}

// ============================================
// Form Validation
// ============================================

/**
 * Show error for a field
 */
function showError(input, errorElement, message) {
  input.setAttribute('aria-invalid', 'true');
  input.parentElement.classList.add('field--error');
  errorElement.textContent = message;
  errorElement.hidden = false;
}

/**
 * Clear error for a field
 */
function clearError(input, errorElement) {
  input.setAttribute('aria-invalid', 'false');
  input.parentElement.classList.remove('field--error');
  errorElement.textContent = '';
  errorElement.hidden = true;
}

/**
 * Clear all form errors
 */
function clearAllErrors() {
  const inputs = participantForm.querySelectorAll('input');
  inputs.forEach(input => {
    const errorId = input.getAttribute('aria-describedby')?.split(' ').find(id => id.includes('error'));
    if (errorId) {
      const errorElement = document.getElementById(errorId);
      if (errorElement) {
        clearError(input, errorElement);
      }
    }
  });
}

/**
 * Validate the form
 */
function validateForm() {
  let isValid = true;
  clearAllErrors();
  
  // Name validation
  const nameError = document.getElementById('name-error');
  if (!nameInput.value.trim()) {
    showError(nameInput, nameError, 'Please enter your name');
    isValid = false;
  }
  
  // LinkedIn validation
  const linkedinError = document.getElementById('linkedin-error');
  if (!linkedinInput.value.trim()) {
    showError(linkedinInput, linkedinError, 'Please enter your LinkedIn URL');
    isValid = false;
  } else if (!isValidUrl(linkedinInput.value.trim())) {
    showError(linkedinInput, linkedinError, 'Please enter a valid URL (starting with http:// or https://)');
    isValid = false;
  }
  
  // Portfolio validation (optional, but must be valid URL if provided)
  const portfolioError = document.getElementById('portfolio-error');
  if (portfolioInput.value.trim() && !isValidUrl(portfolioInput.value.trim())) {
    showError(portfolioInput, portfolioError, 'Please enter a valid URL');
    isValid = false;
  }
  
  // Project URL validation
  const projectUrlError = document.getElementById('project-url-error');
  const projectNameError = document.getElementById('project-name-error');
  
  const hasProjectUrl = projectUrlInput.value.trim();
  const hasProjectName = projectNameInput.value.trim();
  
  if (hasProjectUrl && !isValidUrl(projectUrlInput.value.trim())) {
    showError(projectUrlInput, projectUrlError, 'Please enter a valid URL');
    isValid = false;
  }
  
  // If project URL is provided, project name is required
  if (hasProjectUrl && !hasProjectName) {
    showError(projectNameInput, projectNameError, 'Please enter a display name for your project');
    isValid = false;
  }
  
  // If project name is provided without URL, show error
  if (hasProjectName && !hasProjectUrl) {
    showError(projectUrlInput, projectUrlError, 'Please enter a project URL or remove the project name');
    isValid = false;
  }
  
  // Avatar validation
  const avatarError = document.getElementById('avatar-error');
  const file = avatarInput.files[0];
  if (file) {
    if (file.size > MAX_AVATAR_SIZE) {
      showError(avatarInput, avatarError, 'File is too large. Maximum size is 500KB');
      isValid = false;
    }
    
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      showError(avatarInput, avatarError, 'Invalid file type. Please upload a JPG, PNG, GIF, or WebP image');
      isValid = false;
    }
  }
  
  return isValid;
}

// ============================================
// Form Submission
// ============================================

/**
 * Handle form submission
 */
async function handleSubmit(e) {
  e.preventDefault();
  
  if (!validateForm()) {
    // Focus first error field
    const firstError = participantForm.querySelector('[aria-invalid="true"]');
    if (firstError) {
      firstError.focus();
    }
    return;
  }
  
  // Show loading state
  const originalText = submitBtn.textContent;
  submitBtn.textContent = 'Submitting...';
  submitBtn.disabled = true;
  
  try {
    // Prepare data
    const data = {
      name: nameInput.value.trim(),
      linkedinUrl: linkedinInput.value.trim(),
      portfolioUrl: portfolioInput.value.trim() || null,
      projectUrl: projectUrlInput.value.trim() || null,
      projectName: projectNameInput.value.trim() || null,
      avatarBase64: null
    };
    
    // Convert avatar to Base64 if provided
    const file = avatarInput.files[0];
    if (file) {
      data.avatarBase64 = await fileToBase64(file);
    }
    
    // Save to database
    await addParticipant(data);
    
    // Show success
    showSuccessView();
    
  } catch (error) {
    console.error('Error adding participant:', error);
    announce('Error: Could not add participant. Please try again.');
    
    // Show generic error
    const nameError = document.getElementById('name-error');
    showError(nameInput, nameError, 'Something went wrong. Please try again.');
    
  } finally {
    // Reset button state
    submitBtn.textContent = originalText;
    submitBtn.disabled = false;
  }
}

// ============================================
// Event Listeners
// ============================================

// Add yourself button
addYourselfBtn.addEventListener('click', openFormPage);

// Back button on form page
backBtn.addEventListener('click', closeFormPage);

// Success close button - immediate redirect
successCloseBtn.addEventListener('click', async () => {
  await redirectToParticipants();
});

// Keyboard navigation (Escape to go back)
document.addEventListener('keydown', handleFormPageKeydown);

// Form submission
participantForm.addEventListener('submit', handleSubmit);

// ============================================
// Initialization
// ============================================

async function init() {
  announce('Loading all participants...');
  await renderAllParticipants();
}

// Start the app
init();
