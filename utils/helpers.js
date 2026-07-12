/**
 * StadiumIQ — Utility Helpers
 * Common utility functions for FIFA World Cup 2026 stadium operations.
 */

/**
 * Debounce function for performance optimization
 */
export function debounce(fn, delay = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Throttle function for real-time updates
 */
export function throttle(fn, limit = 1000) {
  let inThrottle;
  return (...args) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Format number with locale
 */
export function formatNumber(num, locale = 'en-US') {
  return new Intl.NumberFormat(locale).format(num);
}

/**
 * Format percentage
 */
export function formatPercent(value, total) {
  return Math.round((value / total) * 100);
}

/**
 * Generate random number in range (for simulation)
 */
export function randomInRange(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Calculate crowd density color
 */
export function densityColor(percent) {
  if (percent < 40) return '#10b981'; // green
  if (percent < 70) return '#f59e0b'; // amber
  if (percent < 85) return '#f97316'; // orange
  return '#ef4444'; // red
}

/**
 * Calculate density label
 */
export function densityLabel(percent) {
  if (percent < 40) return 'Low';
  if (percent < 70) return 'Moderate';
  if (percent < 85) return 'High';
  return 'Critical';
}

/**
 * Format time
 */
export function formatTime(date = new Date()) {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

/**
 * Format datetime for display
 */
export function formatDateTime(date = new Date()) {
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Sanitize HTML to prevent XSS
 */
export function sanitizeHTML(str) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}

/**
 * Parse markdown-like text to basic HTML
 */
export function parseMarkdown(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/#{1,3}\s(.+)/g, '<h4>$1</h4>')
    .replace(/\n- (.+)/g, '\n<li>$1</li>')
    .replace(/\n/g, '<br>')
    .replace(/(<li>.*<\/li>\s*)+/g, '<ul>$&</ul>');
}

/**
 * Generate unique ID
 */
export function generateId(prefix = 'id') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (e) {
    // Fallback
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    return true;
  }
}

/**
 * Text-to-speech
 */
export function speak(text, lang = 'en-US') {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 0.9;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  }
}

/**
 * Local storage helpers with error handling
 */
export const storage = {
  get(key, defaultValue = null) {
    try {
      const val = localStorage.getItem(key);
      return val ? JSON.parse(val) : defaultValue;
    } catch {
      return defaultValue;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  },
  remove(key) {
    try {
      localStorage.removeItem(key);
    } catch { /* ignore */ }
  }
};

/**
 * Show a toast notification
 */
export function showToast(message, type = 'info', duration = 3000) {
  const existing = document.getElementById('toast-container');
  if (!existing) {
    const container = document.createElement('div');
    container.id = 'toast-container';
    container.style.cssText = `
      position: fixed; bottom: 20px; right: 20px; z-index: 9999;
      display: flex; flex-direction: column; gap: 8px;
    `;
    document.body.appendChild(container);
  }

  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  const colors = {
    info: '#3b82f6',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444'
  };

  toast.style.cssText = `
    padding: 12px 18px; border-radius: 10px; color: white;
    background: ${colors[type] || colors.info};
    font-size: 14px; font-weight: 500; box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    animation: slideIn 0.3s ease; max-width: 300px;
    display: flex; align-items: center; gap: 8px;
  `;

  const icons = { info: 'ℹ️', success: '✅', warning: '⚠️', error: '❌' };
  toast.innerHTML = `${icons[type] || ''} ${sanitizeHTML(message)}`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

/**
 * Animate number counting
 */
export function animateCount(element, start, end, duration = 1000) {
  const startTime = performance.now();
  const update = (currentTime) => {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
    const current = Math.round(start + (end - start) * eased);
    element.textContent = formatNumber(current);
    if (progress < 1) requestAnimationFrame(update);
  };
  requestAnimationFrame(update);
}

/**
 * FIFA World Cup 2026 venue data
 */
export const VENUES = [
  { id: 'metlife', name: 'MetLife Stadium', city: 'East Rutherford, NJ', capacity: 82500, country: 'USA', lat: 40.8135, lng: -74.0745 },
  { id: 'sofi', name: 'SoFi Stadium', city: 'Inglewood, CA', capacity: 70240, country: 'USA', lat: 33.9535, lng: -118.3392 },
  { id: 'att', name: 'AT&T Stadium', city: 'Arlington, TX', capacity: 80000, country: 'USA', lat: 32.7480, lng: -97.0930 },
  { id: 'azteca', name: 'Estadio Azteca', city: 'Mexico City', capacity: 87523, country: 'MEX', lat: 19.3030, lng: -99.1505 },
  { id: 'bbandt', name: 'Caesars Superdome', city: 'New Orleans, LA', capacity: 76468, country: 'USA', lat: 29.9511, lng: -90.0812 },
  { id: 'bmo', name: 'BMO Field', city: 'Toronto', capacity: 30000, country: 'CAN', lat: 43.6333, lng: -79.4190 },
  { id: 'estadio', name: 'Estadio BBVA', city: 'Monterrey', capacity: 53500, country: 'MEX', lat: 25.6697, lng: -100.2463 },
  { id: 'arrowhead', name: 'Arrowhead Stadium', city: 'Kansas City, MO', capacity: 76416, country: 'USA', lat: 39.0489, lng: -94.4840 }
];

/**
 * Match schedule data
 */
export const MATCH_SCHEDULE = [
  { id: 1, home: 'USA', away: 'Mexico', venue: 'MetLife Stadium', date: '2026-06-11', time: '20:00', stage: 'Group A', status: 'upcoming' },
  { id: 2, home: 'Brazil', away: 'Germany', venue: 'SoFi Stadium', date: '2026-06-12', time: '18:00', stage: 'Group B', status: 'upcoming' },
  { id: 3, home: 'France', away: 'Argentina', venue: 'AT&T Stadium', date: '2026-06-13', time: '20:00', stage: 'Group C', status: 'upcoming' },
  { id: 4, home: 'Spain', away: 'Portugal', venue: 'Azteca', date: '2026-06-14', time: '17:00', stage: 'Group D', status: 'upcoming' },
  { id: 5, home: 'England', away: 'Japan', venue: 'MetLife Stadium', date: '2026-06-15', time: '19:00', stage: 'Group E', status: 'upcoming' },
  { id: 6, home: 'Italy', away: 'Netherlands', venue: 'SoFi Stadium', date: '2026-06-16', time: '20:00', stage: 'Group F', status: 'upcoming' }
];

/**
 * Stadium sections for MetLife (primary demo venue)
 */
export const STADIUM_SECTIONS = [
  { id: 'A', name: 'Section A', gate: 1, level: 'Field', type: 'premium', capacity: 5000, services: ['VIP lounge', 'Premium dining', 'Concierge'] },
  { id: 'B', name: 'Section B', gate: 2, level: 'Lower', type: 'general', capacity: 8000, services: ['Concession', 'First Aid', 'Restrooms'] },
  { id: 'C', name: 'Section C', gate: 3, level: 'Lower', type: 'general', capacity: 8000, services: ['Concession', 'Souvenir shop', 'Restrooms'] },
  { id: 'D', name: 'Section D', gate: 4, level: 'Mid', type: 'general', capacity: 10000, services: ['Food court', 'Bar', 'Restrooms'] },
  { id: 'E', name: 'Section E', gate: 5, level: 'Mid', type: 'general', capacity: 10000, services: ['Concession', 'First Aid', 'Restrooms'] },
  { id: 'F', name: 'Section F', gate: 6, level: 'Upper', type: 'budget', capacity: 12000, services: ['Concession', 'Restrooms'] },
  { id: 'G', name: 'Section G', gate: 7, level: 'Upper', type: 'budget', capacity: 12000, services: ['Concession', 'Vegan options', 'Restrooms'] },
  { id: 'H', name: 'Section H', gate: 8, level: 'Upper', type: 'accessible', capacity: 5000, services: ['Wheelchair accessible', 'First Aid', 'Family restroom', 'Hearing loop'] }
];
