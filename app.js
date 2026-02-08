/**
 * IDS Hackathon 2026 Participants - Main Application
 */

import { 
  fetchRandomParticipants, 
  addParticipant, 
  getParticipantCount 
} from './db.js';

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
  { emoji: '🍒', color: '#E74C3C' },  // Cherries
  { emoji: '🍐', color: '#A8D5BA' },  // Pear
  { emoji: '🥭', color: '#F7B731' },  // Mango
  { emoji: '🍍', color: '#F5CD2F' },  // Pineapple
  { emoji: '🥥', color: '#C4A484' },  // Coconut
  { emoji: '🍈', color: '#B8E994' },  // Melon
  { emoji: '🫒', color: '#6B8E23' },  // Olive
  { emoji: '🥑', color: '#7CB342' },  // Avocado
  { emoji: '🍏', color: '#8BC34A' },  // Green Apple
];

// Maximum file size for avatar upload (500KB)
const MAX_AVATAR_SIZE = 500 * 1024;

// ============================================
// DOM Elements
// ============================================

const cardGrid = document.getElementById('card-grid');
const refreshBtn = document.getElementById('refresh-btn');
const formPage = document.getElementById('form-page');
const backBtn = document.getElementById('back-btn');
const participantForm = document.getElementById('participant-form');
const formView = document.getElementById('form-view');
const successView = document.getElementById('success-view');
const successCloseBtn = document.getElementById('success-close-btn');
const statusAnnouncer = document.getElementById('status');

// Form fields
const nameInput = document.getElementById('name');
const linkedinInput = document.getElementById('linkedin');
const portfolioInput = document.getElementById('portfolio');
const projectUrlInput = document.getElementById('project-url');
const projectNameInput = document.getElementById('project-name');
const avatarInput = document.getElementById('avatar');
const submitBtn = document.getElementById('submit-btn');

// ============================================
// State
// ============================================

let currentParticipants = [];
let cardCount = 0;
let previousFocus = null;
let newlyAddedParticipantId = null;
let availableFruits = []; // Track available fruits to avoid repeats within a render

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
 * Calculate how many cards fit in the viewport based on CSS grid variables
 */
function calculateCardCount() {
  // Read the CSS custom properties for grid columns and rows
  const styles = getComputedStyle(document.documentElement);
  const cols = parseInt(styles.getPropertyValue('--grid-cols')) || 4;
  const rows = parseInt(styles.getPropertyValue('--grid-rows')) || 3;
  
  return cols * rows;
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
  
  // LinkedIn link (always present, shows "LinkedIn")
  const linkedinLink = document.createElement('a');
  linkedinLink.href = participant.linkedinUrl;
  linkedinLink.target = '_blank';
  linkedinLink.rel = 'noopener noreferrer';
  linkedinLink.innerHTML = 'LinkedIn <span class="visually-hidden">(opens in new tab)</span>';
  links.appendChild(linkedinLink);
  
  // Portfolio link (optional, shows "Portfolio")
  if (participant.portfolioUrl) {
    const portfolioLink = document.createElement('a');
    portfolioLink.href = participant.portfolioUrl;
    portfolioLink.target = '_blank';
    portfolioLink.rel = 'noopener noreferrer';
    portfolioLink.innerHTML = 'Portfolio <span class="visually-hidden">(opens in new tab)</span>';
    links.appendChild(portfolioLink);
  }
  
  // Project link (optional, shows custom project name)
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
 * Create an empty card with add button
 * All empty cards now look the same as the featured "Your spot is waiting" style
 */
function createEmptyCard(isCenter = false) {
  const card = document.createElement('article');
  card.className = `card card--empty${isCenter ? ' card--center' : ''}`;
  card.setAttribute('role', 'listitem');
  card.setAttribute('tabindex', '0');
  card.setAttribute('aria-label', 'Add yourself to the hackathon');
  
  const content = document.createElement('div');
  content.className = 'empty-content';
  
  // Placeholder avatar with person silhouette SVG
  const placeholder = document.createElement('div');
  placeholder.className = 'empty-placeholder';
  placeholder.innerHTML = `<svg aria-hidden="true" width="40" height="40" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
  </svg>`;
  placeholder.setAttribute('aria-hidden', 'true');
  
  const text = document.createElement('p');
  text.className = 'empty-text';
  text.textContent = 'Your spot is waiting!';
  
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'add-btn';
  button.textContent = 'Add Yourself';
  
  content.appendChild(placeholder);
  content.appendChild(text);
  content.appendChild(button);
  card.appendChild(content);
  
  // Event listeners for opening form page
  const openForm = () => openFormPage();
  card.addEventListener('click', openForm);
  card.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openForm();
    }
  });
  
  return card;
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
 * Render the card grid
 */
async function renderGrid(participantsToShow = null) {
  cardGrid.innerHTML = '';
  cardCount = calculateCardCount();
  
  // Reset fruit pool at the start of each render to ensure no repeats
  resetAvailableFruits();
  
  // Reserve 1 slot for the center empty card
  const maxParticipants = cardCount - 1;
  
  // Get participants if not provided
  let participants = participantsToShow || await fetchRandomParticipants(maxParticipants);
  currentParticipants = participants;
  
  // Track if we have a newly added participant to highlight
  let newParticipant = null;
  
  // If we have a newly added participant, make sure they're included and shown first
  if (newlyAddedParticipantId) {
    // First, check if already in the list
    newParticipant = participants.find(p => p.id === newlyAddedParticipantId);
    
    if (!newParticipant) {
      // Fetch all participants to find the new one
      const allParticipants = await fetchRandomParticipants(maxParticipants + 5);
      newParticipant = allParticipants.find(p => p.id === newlyAddedParticipantId);
      
      if (newParticipant) {
        // Remove from current position if exists and add to front
        participants = participants.filter(p => p.id !== newlyAddedParticipantId);
        participants.unshift(newParticipant);
        if (participants.length > maxParticipants) {
          participants.pop();
        }
      }
    } else {
      // Move the new participant to the front of the list
      participants = participants.filter(p => p.id !== newlyAddedParticipantId);
      participants.unshift(newParticipant);
    }
    
    // Clear the ID after we've processed it
    newlyAddedParticipantId = null;
  }
  
  // Calculate the center position for the featured empty card
  const centerPosition = Math.floor(cardCount / 2);
  
  // Total positions available for participants and additional empty cards (excluding the center one)
  const availablePositions = cardCount - 1;
  
  // Determine how many positions will be filled vs empty
  const filledCount = Math.min(participants.length, availablePositions);
  const emptyCount = availablePositions - filledCount;
  
  // If we have a new participant, put them first, then shuffle the rest
  let orderedParticipants = [...participants];
  if (newParticipant && orderedParticipants.length > 1) {
    // Keep the new participant first, shuffle the rest
    const restParticipants = orderedParticipants.slice(1);
    orderedParticipants = [orderedParticipants[0], ...shuffleArray(restParticipants)];
  }
  
  // For positions: if we have a new participant, their card goes in position 0
  // Otherwise, shuffle positions as before
  let participantIndex = 0;
  
  // Build the cards array first, then insert the center card
  const cards = [];
  
  if (newParticipant) {
    // New participant's card goes first (position 0), no shuffling for that
    // Create the highlighted card for the new participant
    const highlightedCard = createFilledCard(orderedParticipants[0]);
    highlightedCard.classList.add('card--highlighted');
    cards.push(highlightedCard);
    participantIndex = 1;
    
    // Fill remaining positions with other participants and empty cards
    const remainingPositions = availablePositions - 1;
    const remainingFilled = Math.min(orderedParticipants.length - 1, remainingPositions);
    const remainingEmpty = remainingPositions - remainingFilled;
    
    const positionTypes = [
      ...Array(remainingFilled).fill(true),
      ...Array(remainingEmpty).fill(false)
    ];
    const shuffledPositions = shuffleArray(positionTypes);
    
    for (let i = 0; i < remainingPositions; i++) {
      let card;
      
      if (shuffledPositions[i] && participantIndex < orderedParticipants.length) {
        card = createFilledCard(orderedParticipants[participantIndex]);
        participantIndex++;
      } else {
        card = createEmptyCard(false);
      }
      
      cards.push(card);
    }
  } else {
    // Normal rendering with shuffled positions
    const positionTypes = [
      ...Array(filledCount).fill(true),
      ...Array(emptyCount).fill(false)
    ];
    const shuffledPositions = shuffleArray(positionTypes);
    
    for (let i = 0; i < availablePositions; i++) {
      let card;
      
      if (shuffledPositions[i] && participantIndex < participants.length) {
        card = createFilledCard(participants[participantIndex]);
        participantIndex++;
      } else {
        card = createEmptyCard(false);
      }
      
      cards.push(card);
    }
  }
  
  // Insert the featured center card at the center position
  const centerCard = createEmptyCard(true);
  cards.splice(centerPosition, 0, centerCard);
  
  // Add all cards to the grid with animation delays
  cards.forEach((card, index) => {
    card.style.animationDelay = `${index * 50}ms`;
    cardGrid.appendChild(card);
  });
}

// ============================================
// Form Page Management
// ============================================

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
 * Check if a screen reader is likely active
 * This uses heuristics since there's no reliable direct detection
 */
function isScreenReaderLikelyActive() {
  // Check for reduced motion preference (often enabled by screen reader users)
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  
  // Check if user has interacted with the page using keyboard only (no mouse events recently)
  // This is tracked when form was submitted
  return prefersReducedMotion || document.body.classList.contains('keyboard-user');
}

/**
 * Show success view and auto-redirect to homepage
 * Redirects immediately if no screen reader, or after announcement finishes if screen reader is active
 */
function showSuccessView() {
  formView.hidden = true;
  successView.hidden = false;
  successCloseBtn.focus();
  
  const successMessage = 'Success! Your card has been added to the hackathon.';
  
  // Announce and redirect after the announcement is complete
  announce(successMessage, () => {
    redirectToHomepage();
  });
}

/**
 * Redirect to homepage and show the newly added card
 */
async function redirectToHomepage() {
  // If already on homepage (form page is hidden), don't do anything
  if (formPage.hidden) {
    return;
  }
  
  // Close the form page
  formPage.hidden = true;
  
  // Refresh the grid to show the new participant
  await renderGrid();
  
  // Focus on the main content for accessibility
  const main = document.getElementById('main');
  if (main) {
    main.focus();
  }
  
  announce('Welcome back! Your card is now visible.');
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
    const newParticipant = await addParticipant(data);
    newlyAddedParticipantId = newParticipant.id;
    
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
// Refresh Functionality
// ============================================

/**
 * Refresh the grid with new random participants
 */
async function refreshGrid() {
  refreshBtn.classList.add('refreshing');
  announce('Refreshing participants...');
  
  try {
    const participants = await fetchRandomParticipants(cardCount - 1);
    await renderGrid(participants);
    announce('Participants refreshed');
  } catch (error) {
    console.error('Error refreshing:', error);
    announce('Error refreshing participants');
  } finally {
    setTimeout(() => {
      refreshBtn.classList.remove('refreshing');
    }, 500);
  }
}

// ============================================
// Event Listeners
// ============================================

// Refresh button
refreshBtn.addEventListener('click', refreshGrid);

// Back button on form page
backBtn.addEventListener('click', closeFormPage);

// Success close button - immediate redirect
successCloseBtn.addEventListener('click', async () => {
  await redirectToHomepage();
});

// Keyboard navigation (Escape to go back)
document.addEventListener('keydown', handleFormPageKeydown);

// Form submission
participantForm.addEventListener('submit', handleSubmit);

// Window resize - recalculate grid
let resizeTimeout;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    const newCardCount = calculateCardCount();
    if (newCardCount !== cardCount) {
      renderGrid();
    }
  }, 250);
});

// ============================================
// Initialization
// ============================================

async function init() {
  try {
    announce('Loading participants...');
    await renderGrid();
    announce('Participants loaded');
  } catch (error) {
    console.error('Error initializing:', error);
    announce('Error loading participants');
    
    // Show empty grid with add prompts
    cardCount = calculateCardCount();
    for (let i = 0; i < cardCount; i++) {
      // Last card is the featured "Add Yourself" card
      const isLast = i === cardCount - 1;
      cardGrid.appendChild(createEmptyCard(isLast));
    }
  }
}

// Start the app
init();
