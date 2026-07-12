/**
 * StadiumIQ — Accessibility Companion Component
 * Comprehensive accessibility support for FIFA World Cup 2026.
 */

import { showToast, speak } from '../utils/helpers.js';

const AccessibilityComponent = (() => {
  let container = null;
  let fontSize = 16;
  let highContrast = false;
  let screenReader = false;

  const ACCESSIBILITY_FEATURES = [
    {
      id: 'wheelchair',
      icon: '♿',
      title: 'Wheelchair Access',
      description: 'Designated wheelchair viewing areas with unobstructed sightlines',
      locations: ['Section H (Field Level)', 'Section 100-105', 'Section 200-205 (Upper)'],
      color: '#3b82f6',
      available: true
    },
    {
      id: 'hearing',
      icon: '👂',
      title: 'Hearing Assistance',
      description: 'Hearing loops, sign language interpreters, and visual alert systems',
      locations: ['All Premium Areas', 'Fan Information Desks', 'Gates 1, 3, 5'],
      color: '#8b5cf6',
      available: true
    },
    {
      id: 'vision',
      icon: '👁️',
      title: 'Visual Assistance',
      description: 'Audio description service, braille stadium maps, guide dog relief areas',
      locations: ['Available on Request', 'Information Desks', 'Gates 2, 6'],
      color: '#ec4899',
      available: true
    },
    {
      id: 'mobility',
      icon: '🚶',
      title: 'Mobility Support',
      description: 'Accessible pathways, elevator priority access, companion seating',
      locations: ['All Gates', 'Concourse Level', 'Premium Zones'],
      color: '#10b981',
      available: true
    },
    {
      id: 'sensory',
      icon: '🧠',
      title: 'Sensory Support',
      description: 'Quiet zones, sensory kits available, reduced stimulation areas',
      locations: ['Section H Lounge', 'First Aid Adjacent Rooms'],
      color: '#f59e0b',
      available: true
    },
    {
      id: 'family',
      icon: '👨‍👩‍👧',
      title: 'Family Assistance',
      description: 'Family restrooms, baby changing stations, lost child protocol',
      locations: ['Gates 2, 4, 6, 8', 'Main Concourse'],
      color: '#f97316',
      available: true
    }
  ];

  const ACCESSIBLE_ROUTES = [
    { from: 'Main Entrance', to: 'Section H (Wheelchair)', steps: ['Enter Gate 2', 'Turn left at security checkpoint', 'Follow blue accessibility corridor', 'Take elevator to Level 1', 'Section H is clearly marked'], time: '8 min' },
    { from: 'Parking Lot A', to: 'Accessible Seating', steps: ['Use accessible parking spaces (Level P1)', 'Follow orange accessibility markers', 'Board accessible shuttle (every 10 min)', 'Enter via Gate 8 (accessible)'], time: '12 min' },
    { from: 'Metro Station', to: 'Stadium Entrance', steps: ['Exit Metro Line 3 at Stadium stop', 'Board accessible transit bridge', 'Follow tactile guide paths to Gate 2', 'Dedicated accessible entry lane'], time: '6 min' }
  ];

  function init(containerEl) {
    container = containerEl;
    render();
    loadPreferences();
  }

  function render() {
    container.innerHTML = `
      <div class="access-wrapper">
        <!-- Quick accessibility tools bar -->
        <div class="access-toolbar" role="toolbar" aria-label="Accessibility tools">
          <button class="access-tool-btn" id="btn-font-decrease" aria-label="Decrease font size">A−</button>
          <button class="access-tool-btn" id="btn-font-increase" aria-label="Increase font size">A+</button>
          <button class="access-tool-btn ${highContrast ? 'active' : ''}" id="btn-high-contrast" aria-label="Toggle high contrast mode">
            🌓 High Contrast
          </button>
          <button class="access-tool-btn" id="btn-screen-reader" aria-label="Toggle screen reader mode">
            🔊 Read Aloud
          </button>
          <button class="access-tool-btn" id="btn-keyboard-nav" aria-label="Enable keyboard navigation guide">
            ⌨️ Keyboard Nav
          </button>
          <button class="access-tool-btn" id="btn-reset-access" aria-label="Reset accessibility settings">
            ↺ Reset
          </button>
        </div>

        <!-- Accessibility features grid -->
        <div class="access-section">
          <div class="panel-header">
            <h3>♿ Accessibility Features Available</h3>
            <span class="all-available-badge">All Active</span>
          </div>
          <div class="access-features-grid">
            ${ACCESSIBILITY_FEATURES.map(feature => `
              <div class="access-feature-card" data-feature="${feature.id}" style="--accent:${feature.color}" tabindex="0" role="article" aria-label="${feature.title}: ${feature.description}">
                <div class="feature-icon-wrap" style="background:${feature.color}22">
                  <span class="feature-icon">${feature.icon}</span>
                </div>
                <div class="feature-content">
                  <h4 class="feature-title">${feature.title}</h4>
                  <p class="feature-desc">${feature.description}</p>
                  <div class="feature-locations">
                    ${feature.locations.map(l => `<span class="loc-tag">${l}</span>`).join('')}
                  </div>
                </div>
                <div class="feature-status">
                  <span class="status-dot available"></span>
                  <span class="status-text">Available</span>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Accessible routes -->
        <div class="access-section">
          <div class="panel-header">
            <h3>🗺️ Accessible Routes & Pathways</h3>
          </div>
          <div class="routes-grid">
            ${ACCESSIBLE_ROUTES.map((route, i) => `
              <div class="route-card" tabindex="0" role="article" aria-label="Route from ${route.from} to ${route.to}">
                <div class="route-header">
                  <div class="route-endpoints">
                    <span class="route-from">📍 ${route.from}</span>
                    <span class="route-arrow">→</span>
                    <span class="route-to">🏟️ ${route.to}</span>
                  </div>
                  <span class="route-time">⏱️ ~${route.time}</span>
                </div>
                <ol class="route-steps" id="route-${i}">
                  ${route.steps.map(step => `<li>${step}</li>`).join('')}
                </ol>
                <button class="btn-route-speak" onclick="speakRoute(${i})" aria-label="Read route aloud">
                  🔊 Read Directions
                </button>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Emergency & Assistance Request -->
        <div class="access-section">
          <div class="panel-header">
            <h3>🆘 Request Assistance</h3>
          </div>
          <div class="assistance-grid">
            <button class="assistance-btn" id="btn-escort" aria-label="Request escort assistance">
              🧑‍🦯 Request Escort
            </button>
            <button class="assistance-btn" id="btn-wheelchair" aria-label="Request wheelchair service">
              ♿ Wheelchair Service
            </button>
            <button class="assistance-btn" id="btn-interpreter" aria-label="Request sign language interpreter">
              🤟 Sign Language Interpreter
            </button>
            <button class="assistance-btn emergency" id="btn-emergency" aria-label="Emergency assistance">
              🚨 Emergency Assistance
            </button>
          </div>
          <div class="assistance-note" role="note">
            <p>💡 All staff members are trained to assist fans with disabilities. Look for staff in <strong>blue vests</strong> for accessibility assistance.</p>
          </div>
        </div>

        <!-- Contact Info -->
        <div class="access-contact">
          <h4>📞 Accessibility Hotline</h4>
          <div class="contact-info">
            <span>Stadium: <strong>+1 (555) FIFA-ADA</strong></span>
            <span>Text: <strong>72782</strong></span>
            <span>Email: <strong>access@fifawc2026.com</strong></span>
          </div>
        </div>
      </div>
    `;

    bindAccessibilityEvents();
    // Store routes for speak functionality
    window._accessRoutes = ACCESSIBLE_ROUTES;
  }

  function bindAccessibilityEvents() {
    // Font size controls
    document.getElementById('btn-font-decrease')?.addEventListener('click', () => {
      fontSize = Math.max(12, fontSize - 2);
      document.documentElement.style.fontSize = fontSize + 'px';
      showToast(`Font size: ${fontSize}px`, 'info');
      savePreferences();
    });

    document.getElementById('btn-font-increase')?.addEventListener('click', () => {
      fontSize = Math.min(24, fontSize + 2);
      document.documentElement.style.fontSize = fontSize + 'px';
      showToast(`Font size: ${fontSize}px`, 'info');
      savePreferences();
    });

    // High contrast
    document.getElementById('btn-high-contrast')?.addEventListener('click', () => {
      highContrast = !highContrast;
      document.body.classList.toggle('high-contrast', highContrast);
      document.getElementById('btn-high-contrast').classList.toggle('active', highContrast);
      showToast(highContrast ? 'High contrast enabled' : 'High contrast disabled', 'info');
      savePreferences();
    });

    // Screen reader
    document.getElementById('btn-screen-reader')?.addEventListener('click', () => {
      const summary = `StadiumIQ Accessibility Summary for FIFA World Cup 2026. 
        ${ACCESSIBILITY_FEATURES.length} accessibility features are currently active including: 
        ${ACCESSIBILITY_FEATURES.map(f => f.title).join(', ')}. 
        For immediate assistance, contact staff in blue vests or call plus 1 555 FIFA ADA.`;
      speak(summary);
      showToast('Reading accessibility information...', 'info');
    });

    // Keyboard navigation guide
    document.getElementById('btn-keyboard-nav')?.addEventListener('click', () => {
      showToast('Tab: Navigate | Enter/Space: Activate | Esc: Close | Arrow keys: Scroll', 'info', 5000);
    });

    // Reset
    document.getElementById('btn-reset-access')?.addEventListener('click', () => {
      fontSize = 16;
      highContrast = false;
      document.documentElement.style.fontSize = '16px';
      document.body.classList.remove('high-contrast');
      document.getElementById('btn-high-contrast')?.classList.remove('active');
      showToast('Accessibility settings reset', 'success');
      savePreferences();
    });

    // Assistance buttons
    document.getElementById('btn-escort')?.addEventListener('click', () => {
      showToast('Escort request sent! A staff member will arrive within 5 minutes.', 'success', 5000);
    });

    document.getElementById('btn-wheelchair')?.addEventListener('click', () => {
      showToast('Wheelchair service requested! Please wait at your current gate.', 'success', 5000);
    });

    document.getElementById('btn-interpreter')?.addEventListener('click', () => {
      showToast('Sign language interpreter requested! Available within 10 minutes.', 'success', 5000);
    });

    document.getElementById('btn-emergency')?.addEventListener('click', () => {
      showToast('🚨 Emergency assistance dispatched! Help is on the way.', 'error', 8000);
    });
  }

  function savePreferences() {
    localStorage.setItem('stadiumiq_access', JSON.stringify({ fontSize, highContrast }));
  }

  function loadPreferences() {
    try {
      const prefs = JSON.parse(localStorage.getItem('stadiumiq_access') || '{}');
      if (prefs.fontSize) {
        fontSize = prefs.fontSize;
        document.documentElement.style.fontSize = fontSize + 'px';
      }
      if (prefs.highContrast) {
        highContrast = prefs.highContrast;
        document.body.classList.toggle('high-contrast', highContrast);
      }
    } catch { /* ignore */ }
  }

  // Global function for route speaking
  window.speakRoute = (routeIndex) => {
    const route = window._accessRoutes?.[routeIndex];
    if (!route) return;
    const text = `Directions from ${route.from} to ${route.to}. Estimated time: ${route.time}. Steps: ${route.steps.join('. ')}`;
    speak(text);
    showToast('Reading route directions...', 'info');
  };

  return { init };
})();

export default AccessibilityComponent;
