/**
 * InstantDB Integration for IDS Hackathon 2026 Participants
 * 
 * Schema:
 * participants: {
 *   id: string,
 *   name: string,
 *   linkedinUrl: string,
 *   portfolioUrl: string | null,
 *   projectUrl: string | null,
 *   projectName: string | null,
 *   avatarBase64: string | null,
 *   createdAt: number
 * }
 */

// Import InstantDB from CDN (jsDelivr)
import { init, id as generateInstantId } from 'https://cdn.jsdelivr.net/npm/@instantdb/core/+esm';

// InstantDB App ID
const APP_ID = 'd009da22-e355-4244-bc84-66887c8c8482';

// Initialize InstantDB
const db = init({ appId: APP_ID });

/**
 * Fetch all participants from the database
 * @returns {Promise<Array>} Array of participant objects
 */
export async function fetchAllParticipants() {
  return new Promise((resolve, reject) => {
    const unsubscribe = db.subscribeQuery(
      { participants: {} },
      (resp) => {
        if (resp.error) {
          unsubscribe();
          reject(resp.error);
          return;
        }
        unsubscribe();
        resolve(resp.data?.participants || []);
      }
    );
  });
}

/**
 * Fetch a random subset of participants
 * @param {number} count - Number of participants to fetch
 * @returns {Promise<Array>} Array of randomly selected participant objects
 */
export async function fetchRandomParticipants(count) {
  const allParticipants = await fetchAllParticipants();
  
  if (allParticipants.length <= count) {
    return shuffleArray([...allParticipants]);
  }
  
  // Shuffle and take the first 'count' participants
  const shuffled = shuffleArray([...allParticipants]);
  return shuffled.slice(0, count);
}

/**
 * Get the total count of participants
 * @returns {Promise<number>} Total number of participants
 */
export async function getParticipantCount() {
  const participants = await fetchAllParticipants();
  return participants.length;
}

/**
 * Add a new participant to the database
 * @param {Object} data - Participant data
 * @param {string} data.name - Participant name
 * @param {string} data.linkedinUrl - LinkedIn profile URL
 * @param {string|null} data.portfolioUrl - Portfolio URL (optional)
 * @param {string|null} data.projectUrl - Hackathon project URL (optional)
 * @param {string|null} data.projectName - Hackathon project display name (optional)
 * @param {string|null} data.avatarBase64 - Base64 encoded avatar image (optional)
 * @returns {Promise<Object>} The created participant object
 */
export async function addParticipant(data) {
  const participantId = generateId();
  const participant = {
    id: participantId,
    name: data.name,
    linkedinUrl: data.linkedinUrl,
    portfolioUrl: data.portfolioUrl || null,
    projectUrl: data.projectUrl || null,
    projectName: data.projectName || null,
    avatarBase64: data.avatarBase64 || null,
    createdAt: Date.now()
  };
  
  await db.transact(
    db.tx.participants[participantId].update(participant)
  );
  
  return participant;
}

/**
 * Fetch a single participant by ID
 * @param {string} participantId - Participant ID
 * @returns {Promise<Object|null>} Participant object or null if not found
 */
export async function fetchParticipantById(participantId) {
  const participants = await fetchAllParticipants();
  return participants.find(p => p.id === participantId) || null;
}

/**
 * Subscribe to real-time participant updates
 * @param {Function} callback - Callback function called with updated participants array
 * @returns {Function} Unsubscribe function
 */
export function subscribeToParticipants(callback) {
  return db.subscribeQuery(
    { participants: {} },
    (resp) => {
      if (resp.error) {
        console.error('InstantDB subscription error:', resp.error);
        callback([]);
        return;
      }
      callback(resp.data?.participants || []);
    }
  );
}

/**
 * Generate a unique ID using InstantDB's id helper
 * @returns {string} A unique identifier
 */
function generateId() {
  return generateInstantId();
}

/**
 * Fisher-Yates shuffle algorithm
 * @param {Array} array - Array to shuffle
 * @returns {Array} Shuffled array
 */
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// Export the db instance for direct access if needed
export { db };
