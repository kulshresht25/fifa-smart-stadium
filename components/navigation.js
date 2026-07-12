/**
 * StadiumIQ — Stadium Navigation Component
 * Interactive stadium map with wayfinding, accessibility routes, and real-time gate status.
 */

import { STADIUM_SECTIONS, densityColor, densityLabel, randomInRange } from '../utils/helpers.js';

const NavigationComponent = (() => {
  let container = null;
  let selectedSection = null;

  // Gate status simulation
  const GATE_STATUS = [
    { id: 1, name: 'Gate 1 - North Main', status: 'open', wait: 3, queue: 'short', services: ['Entry', 'Security', 'Info desk'] },
    { id: 2, name: 'Gate 2 - North East', status: 'open', wait: 7, queue: 'medium', services: ['Entry', 'Security', 'Accessible'] },
    { id: 3, name: 'Gate 3 - East', status: 'open', wait: 12, queue: 'long', services: ['Entry', 'Security', 'Souvenir'] },
    { id: 4, name: 'Gate 4 - South East', status: 'open', wait: 5, queue: 'short', services: ['Entry', 'Security'] },
    { id: 5, name: 'Gate 5 - South Main', status: 'busy', wait: 22, queue: 'critical', services: ['Entry', 'Security', 'VIP'] },
    { id: 6, name: 'Gate 6 - South West', status: 'open', wait: 6, queue: 'medium', services: ['Entry', 'Security', 'Family'] },
    { id: 7, name: 'Gate 7 - West', status: 'open', wait: 2, queue: 'short', services: ['Entry', 'Security'] },
    { id: 8, name: 'Gate 8 - North West', status: 'open', wait: 8, queue: 'medium', services: ['Entry', 'Security', 'Accessible'] }
  ];

  const SERVICES = [
    { id: 'food', icon: '🍔', name: 'Food & Beverage', locations: ['Section B', 'Section D', 'Section F', 'Section G'], color: '#f59e0b' },
    { id: 'restroom', icon: '🚻', name: 'Restrooms', locations: ['Every Section', 'Near all Gates'], color: '#3b82f6' },
    { id: 'firstaid', icon: '🏥', name: 'First Aid', locations: ['Section B', 'Section E', 'Section H'], color: '#ef4444' },
    { id: 'accessible', icon: '♿', name: 'Accessible Areas', locations: ['Section H', 'Gate 2', 'Gate 8'], color: '#10b981' },
    { id: 'atm', icon: '💰', name: 'ATMs', locations: ['Gate 1', 'Gate 3', 'Gate 5', 'Gate 7'], color: '#8b5cf6' },
    { id: 'souvenir', icon: '🛍️', name: 'Souvenir Shop', locations: ['Gate 3', 'Section C', 'Section F'], color: '#ec4899' },
    { id: 'info', icon: 'ℹ️', name: 'Information Desk', locations: ['Gate 1', 'Gate 5', 'Main Concourse'], color: '#6366f1' },
    { id: 'parking', icon: '🅿️', name: 'Parking', locations: ['North Lot A/B', 'South Lot C', 'East Lot D'], color: '#64748b' }
  ];

  function init(containerEl) {
    container = containerEl;
    render();
  }

  function render() {
    container.innerHTML = `
      <div class="nav-wrapper">
        <!-- Search & Filters -->
        <div class="nav-search-bar">
          <div class="search-input-wrapper">
            <span class="search-icon">🔍</span>
            <input
              type="text"
              id="nav-search"
              class="nav-search-input"
              placeholder="Search for seats, services, gates..."
              aria-label="Search stadium navigation"
            />
          </div>
          <div class="service-filters" role="group" aria-label="Filter by service type">
            ${SERVICES.map(s => `
              <button class="service-filter-btn" data-service="${s.id}" style="--accent:${s.color}" aria-label="Filter ${s.name}">
                ${s.icon} ${s.name}
              </button>
            `).join('')}
          </div>
        </div>

        <div class="nav-main-grid">
          <!-- Stadium Map (SVG) -->
          <div class="stadium-map-panel">
            <div class="panel-header">
              <h3>🏟️ MetLife Stadium — Interactive Map</h3>
              <div class="map-controls">
                <button class="btn-map-control" id="zoom-in" aria-label="Zoom in">+</button>
                <button class="btn-map-control" id="zoom-out" aria-label="Zoom out">−</button>
                <button class="btn-map-control" id="map-reset" aria-label="Reset view">⟲</button>
              </div>
            </div>
            <div class="map-container" id="map-container" role="img" aria-label="Interactive stadium map">
              ${renderStadiumSVG()}
            </div>
          </div>

          <!-- Right panel: Gates + Section Info -->
          <div class="nav-right-panel">
            <!-- Gate status -->
            <div class="gates-panel">
              <div class="panel-header">
                <h3>🚪 Gate Status</h3>
              </div>
              <div class="gates-list" id="gates-list">
                ${renderGateList()}
              </div>
            </div>

            <!-- Section detail (shown when section selected) -->
            <div class="section-detail-panel" id="section-detail" style="display:none;">
              <div class="panel-header">
                <h3>📍 Section Details</h3>
                <button class="btn-icon" id="close-section-detail" aria-label="Close section details">✕</button>
              </div>
              <div id="section-detail-content"></div>
            </div>

            <!-- Services panel (shown when service filter active) -->
            <div class="services-panel" id="services-panel">
              <div class="panel-header">
                <h3>🗺️ Nearby Services</h3>
              </div>
              <div class="services-grid">
                ${SERVICES.map(s => `
                  <div class="service-card" style="--accent:${s.color}" data-service="${s.id}" tabindex="0" role="button" aria-label="${s.name}">
                    <span class="service-card-icon">${s.icon}</span>
                    <span class="service-card-name">${s.name}</span>
                    <div class="service-locations">
                      ${s.locations.slice(0, 2).map(l => `<span class="location-tag">${l}</span>`).join('')}
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
        </div>

        <!-- Directions panel -->
        <div class="directions-panel" id="directions-panel" style="display:none;">
          <div class="panel-header">
            <h3>🧭 Directions</h3>
            <button class="btn-icon" id="close-directions" aria-label="Close directions">✕</button>
          </div>
          <div id="directions-content"></div>
        </div>
      </div>
    `;

    bindMapEvents();
  }

  /**
   * Render SVG stadium map
   */
  function renderStadiumSVG() {
    const sections = STADIUM_SECTIONS;

    // Create octagon-like stadium shape
    const centerX = 250, centerY = 200;
    const outerRx = 220, outerRy = 170;
    const innerRx = 130, innerRy = 100;

    // Section positions around the oval
    const sectionAngles = {
      A: 270, B: 315, C: 0, D: 45, E: 90, F: 135, G: 180, H: 225
    };

    const getSectionPos = (angle, rx, ry) => ({
      x: centerX + rx * Math.cos((angle - 90) * Math.PI / 180),
      y: centerY + ry * Math.sin((angle - 90) * Math.PI / 180)
    });

    const sectionSVGs = sections.map(sec => {
      const angle = sectionAngles[sec.id] || 0;
      const midR = (outerRx + innerRx) / 2;
      const midRY = (outerRy + innerRy) / 2;
      const pos = getSectionPos(angle, midR * 0.75, midRY * 0.75);
      const density = randomInRange(40, 95);
      const color = densityColor(density);

      return `
        <g class="stadium-section" data-section="${sec.id}" data-density="${density}" role="button" tabindex="0" aria-label="Section ${sec.id}: ${densityLabel(density)} density">
          <text x="${pos.x}" y="${pos.y + 4}" text-anchor="middle" class="section-label" fill="${color}">${sec.id}</text>
        </g>
      `;
    });

    return `
      <svg viewBox="0 0 500 400" xmlns="http://www.w3.org/2000/svg" class="stadium-svg" id="stadium-svg" role="img" aria-label="MetLife Stadium seating map">
        <defs>
          <radialGradient id="pitchGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" style="stop-color:#22543d"/>
            <stop offset="100%" style="stop-color:#1a4a2a"/>
          </radialGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>

        <!-- Background -->
        <rect width="500" height="400" fill="#0a0f1a"/>

        <!-- Outer stadium ring -->
        <ellipse cx="${centerX}" cy="${centerY}" rx="${outerRx}" ry="${outerRy}" fill="#1e293b" stroke="#334155" stroke-width="2"/>

        <!-- Section arcs (colored by density) -->
        ${generateSectionArcs(centerX, centerY, outerRx, outerRy, innerRx, innerRy)}

        <!-- Inner ring (concourse) -->
        <ellipse cx="${centerX}" cy="${centerY}" rx="${innerRx}" ry="${innerRy}" fill="#0f1f2e" stroke="#1e40af" stroke-width="2"/>

        <!-- Pitch -->
        <ellipse cx="${centerX}" cy="${centerY}" rx="90" ry="70" fill="url(#pitchGrad)" stroke="#22543d" stroke-width="1"/>

        <!-- Pitch lines -->
        <line x1="${centerX - 90}" y1="${centerY}" x2="${centerX + 90}" y2="${centerY}" stroke="#ffffff22" stroke-width="1"/>
        <ellipse cx="${centerX}" cy="${centerY}" rx="30" ry="25" fill="none" stroke="#ffffff22" stroke-width="1"/>
        <circle cx="${centerX}" cy="${centerY}" r="4" fill="#ffffff33"/>

        <!-- Goal posts -->
        <rect x="${centerX - 12}" y="${centerY - 70}" width="24" height="6" fill="#ffffff22" rx="2"/>
        <rect x="${centerX - 12}" y="${centerY + 64}" width="24" height="6" fill="#ffffff22" rx="2"/>

        <!-- Gate indicators -->
        ${GATE_STATUS.map((gate, i) => {
          const angle = (i / GATE_STATUS.length) * 360;
          const pos = {
            x: centerX + (outerRx + 15) * Math.cos((angle - 90) * Math.PI / 180),
            y: centerY + (outerRy + 12) * Math.sin((angle - 90) * Math.PI / 180)
          };
          const color = gate.status === 'busy' ? '#ef4444' : '#10b981';
          return `
            <g class="gate-indicator" data-gate="${gate.id}" role="button" tabindex="0" aria-label="Gate ${gate.id}: ${gate.status}">
              <circle cx="${pos.x}" cy="${pos.y}" r="10" fill="${color}33" stroke="${color}" stroke-width="1.5"/>
              <text x="${pos.x}" y="${pos.y + 4}" text-anchor="middle" fill="${color}" font-size="9" font-weight="bold">${gate.id}</text>
            </g>
          `;
        }).join('')}

        <!-- Section labels -->
        ${sectionSVGs.join('')}

        <!-- North/South/East/West labels -->
        <text x="${centerX}" y="15" text-anchor="middle" fill="#64748b" font-size="11">NORTH</text>
        <text x="${centerX}" y="392" text-anchor="middle" fill="#64748b" font-size="11">SOUTH</text>
        <text x="490" y="${centerY + 4}" text-anchor="end" fill="#64748b" font-size="11">EAST</text>
        <text x="10" y="${centerY + 4}" text-anchor="start" fill="#64748b" font-size="11">WEST</text>

        <!-- You Are Here indicator (default: Section E) -->
        <g id="you-are-here" filter="url(#glow)">
          <circle cx="${centerX + 60}" cy="${centerY}" r="8" fill="#3b82f6" stroke="#fff" stroke-width="2"/>
          <text x="${centerX + 60}" y="${centerY + 4}" text-anchor="middle" fill="white" font-size="8" font-weight="bold">YOU</text>
        </g>
      </svg>
    `;
  }

  /**
   * Generate colored section arcs
   */
  function generateSectionArcs(cx, cy, rx, ry, irx, iry) {
    const sections = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    const sectionSize = 360 / sections.length;

    return sections.map((sec, i) => {
      const startAngle = i * sectionSize - 90;
      const endAngle = startAngle + sectionSize;
      const density = randomInRange(40, 95);
      const color = densityColor(density);

      // Generate arc path
      const path = describeArc(cx, cy, rx, ry, irx, iry, startAngle + 2, endAngle - 2);

      return `
        <path
          d="${path}"
          fill="${color}40"
          stroke="${color}80"
          stroke-width="1"
          class="section-arc"
          data-section="${sec}"
          data-density="${density}"
          style="cursor:pointer; transition: fill 0.3s ease;"
          onmouseover="this.style.fill='${color}70'"
          onmouseout="this.style.fill='${color}40'"
          role="button"
          tabindex="0"
          aria-label="Section ${sec}"
        />
        <text
          x="${labelPos(cx, cy, (rx + irx) / 2, (ry + iry) / 2, startAngle + sectionSize / 2).x}"
          y="${labelPos(cx, cy, (rx + irx) / 2, (ry + iry) / 2, startAngle + sectionSize / 2).y + 4}"
          text-anchor="middle"
          fill="${color}"
          font-size="14"
          font-weight="bold"
          class="section-text"
          style="pointer-events:none"
        >${sec}</text>
      `;
    }).join('');
  }

  function labelPos(cx, cy, rx, ry, angleDeg) {
    const rad = (angleDeg * Math.PI) / 180;
    return { x: cx + rx * Math.cos(rad), y: cy + ry * Math.sin(rad) };
  }

  function polarToCartesian(cx, cy, rx, ry, angleDeg) {
    const rad = (angleDeg * Math.PI) / 180;
    return { x: cx + rx * Math.cos(rad), y: cy + ry * Math.sin(rad) };
  }

  function describeArc(cx, cy, rx, ry, irx, iry, startAngle, endAngle) {
    const start = polarToCartesian(cx, cy, rx, ry, startAngle);
    const end = polarToCartesian(cx, cy, rx, ry, endAngle);
    const innerStart = polarToCartesian(cx, cy, irx, iry, endAngle);
    const innerEnd = polarToCartesian(cx, cy, irx, iry, startAngle);

    const largeArc = endAngle - startAngle > 180 ? 1 : 0;

    return [
      `M ${start.x} ${start.y}`,
      `A ${rx} ${ry} 0 ${largeArc} 1 ${end.x} ${end.y}`,
      `L ${innerStart.x} ${innerStart.y}`,
      `A ${irx} ${iry} 0 ${largeArc} 0 ${innerEnd.x} ${innerEnd.y}`,
      'Z'
    ].join(' ');
  }

  /**
   * Render gate list
   */
  function renderGateList() {
    return GATE_STATUS.map(gate => {
      const queueColors = { short: '#10b981', medium: '#f59e0b', long: '#f97316', critical: '#ef4444' };
      const queueColor = queueColors[gate.queue] || '#64748b';
      return `
        <div class="gate-item" data-gate="${gate.id}" tabindex="0" role="button" aria-label="${gate.name}: ${gate.wait} minute wait">
          <div class="gate-indicator-dot" style="background:${gate.status === 'busy' ? '#ef4444' : '#10b981'}"></div>
          <div class="gate-info">
            <div class="gate-name">${gate.name}</div>
            <div class="gate-services">${gate.services.join(' · ')}</div>
          </div>
          <div class="gate-wait">
            <span class="wait-time" style="color:${queueColor}">${gate.wait}m</span>
            <span class="wait-label">wait</span>
          </div>
        </div>
      `;
    }).join('');
  }

  /**
   * Show section details
   */
  function showSectionDetail(sectionId, density) {
    const section = STADIUM_SECTIONS.find(s => s.id === sectionId);
    if (!section) return;

    const detailEl = document.getElementById('section-detail');
    const contentEl = document.getElementById('section-detail-content');

    if (!detailEl || !contentEl) return;

    const color = densityColor(density);
    const label = densityLabel(density);

    contentEl.innerHTML = `
      <div class="section-detail-card">
        <div class="section-header-info">
          <span class="section-badge" style="background:${color}22; color:${color}; border-color:${color}">
            Section ${section.id}
          </span>
          <span class="density-badge" style="color:${color}">${label} (${density}%)</span>
        </div>
        <div class="section-meta">
          <div class="meta-item"><span class="meta-label">Gate</span><span class="meta-value">Gate ${section.gate}</span></div>
          <div class="meta-item"><span class="meta-label">Level</span><span class="meta-value">${section.level}</span></div>
          <div class="meta-item"><span class="meta-label">Type</span><span class="meta-value">${section.type.charAt(0).toUpperCase() + section.type.slice(1)}</span></div>
          <div class="meta-item"><span class="meta-label">Capacity</span><span class="meta-value">${section.capacity.toLocaleString()}</span></div>
        </div>
        <div class="section-services">
          <h4>Available Services</h4>
          <ul>
            ${section.services.map(s => `<li>${s}</li>`).join('')}
          </ul>
        </div>
        <div class="section-directions">
          <h4>🧭 How to Get There</h4>
          <p>From the main entrance, enter through <strong>Gate ${section.gate}</strong>. 
          Follow signs to <strong>${section.level} Level</strong>. 
          Section ${section.id} is accessible via ${section.level === 'Field' ? 'field-level corridor' : section.level === 'Upper' ? 'elevators or stairs' : 'main concourse'}.
          ${section.type === 'accessible' ? '♿ Full wheelchair access available.' : ''}</p>
        </div>
        <button class="btn-primary btn-navigate" onclick="showDirections('${section.id}')" aria-label="Get directions to Section ${section.id}">
          🧭 Get Directions
        </button>
      </div>
    `;

    detailEl.style.display = 'block';
    selectedSection = sectionId;
  }

  /**
   * Bind map interaction events
   */
  function bindMapEvents() {
    // Section clicks
    document.addEventListener('click', (e) => {
      const arc = e.target.closest('.section-arc, .section-text, [data-section]');
      if (arc) {
        const secId = arc.dataset.section;
        const density = parseInt(arc.dataset.density) || randomInRange(40, 95);
        if (secId) showSectionDetail(secId, density);
      }

      // Gate clicks
      const gate = e.target.closest('.gate-item, .gate-indicator');
      if (gate) {
        const gateId = gate.dataset.gate;
        showGateInfo(parseInt(gateId));
      }
    });

    // Close buttons
    document.getElementById('close-section-detail')?.addEventListener('click', () => {
      document.getElementById('section-detail').style.display = 'none';
    });

    document.getElementById('close-directions')?.addEventListener('click', () => {
      document.getElementById('directions-panel').style.display = 'none';
    });

    // Search
    document.getElementById('nav-search')?.addEventListener('input', (e) => {
      handleSearch(e.target.value);
    });

    // Map zoom controls
    let scale = 1;
    const mapContainer = document.getElementById('map-container');

    document.getElementById('zoom-in')?.addEventListener('click', () => {
      scale = Math.min(scale + 0.2, 2.5);
      const svg = document.getElementById('stadium-svg');
      if (svg) svg.style.transform = `scale(${scale})`;
    });

    document.getElementById('zoom-out')?.addEventListener('click', () => {
      scale = Math.max(scale - 0.2, 0.6);
      const svg = document.getElementById('stadium-svg');
      if (svg) svg.style.transform = `scale(${scale})`;
    });

    document.getElementById('map-reset')?.addEventListener('click', () => {
      scale = 1;
      const svg = document.getElementById('stadium-svg');
      if (svg) svg.style.transform = 'scale(1)';
    });
  }

  /**
   * Show gate information
   */
  function showGateInfo(gateId) {
    const gate = GATE_STATUS.find(g => g.id === gateId);
    if (!gate) return;

    const detailEl = document.getElementById('section-detail');
    const contentEl = document.getElementById('section-detail-content');
    if (!detailEl || !contentEl) return;

    const queueColors = { short: '#10b981', medium: '#f59e0b', long: '#f97316', critical: '#ef4444' };
    const color = queueColors[gate.queue];

    contentEl.innerHTML = `
      <div class="section-detail-card">
        <div class="section-header-info">
          <span class="section-badge" style="background:${color}22; color:${color}; border-color:${color}">Gate ${gate.id}</span>
          <span class="density-badge" style="color:${color}">~${gate.wait} min wait</span>
        </div>
        <div class="section-meta">
          <div class="meta-item"><span class="meta-label">Status</span><span class="meta-value" style="color:${gate.status === 'busy' ? '#ef4444' : '#10b981'}">${gate.status.toUpperCase()}</span></div>
          <div class="meta-item"><span class="meta-label">Queue</span><span class="meta-value" style="color:${color}">${gate.queue.toUpperCase()}</span></div>
        </div>
        <div class="section-services">
          <h4>Services at this Gate</h4>
          <ul>${gate.services.map(s => `<li>${s}</li>`).join('')}</ul>
        </div>
        ${gate.queue === 'critical' ? `
          <div class="alert-callout">
            ⚠️ This gate is extremely busy. Consider using <strong>Gate 7 (West)</strong> for faster entry — only 2 min wait.
          </div>
        ` : ''}
      </div>
    `;

    detailEl.style.display = 'block';
  }

  /**
   * Handle search
   */
  function handleSearch(query) {
    if (!query) return;
    const q = query.toLowerCase();

    // Highlight matching sections or services
    if (q.includes('section') || /^[a-h]$/.test(q.trim())) {
      const secId = q.replace('section', '').trim().toUpperCase();
      if (secId) {
        const density = randomInRange(40, 95);
        showSectionDetail(secId, density);
      }
    }
  }

  // Global function for directions button
  window.showDirections = (sectionId) => {
    const directionsPanel = document.getElementById('directions-panel');
    const directionsContent = document.getElementById('directions-content');

    if (!directionsPanel || !directionsContent) return;

    const section = STADIUM_SECTIONS.find(s => s.id === sectionId);
    if (!section) return;

    directionsContent.innerHTML = `
      <div class="directions-steps">
        <div class="step"><span class="step-num">1</span> <span>Enter through <strong>Gate ${section.gate}</strong> on the ${getDirectionName(section.gate)} side</span></div>
        <div class="step"><span class="step-num">2</span> <span>Pass through security screening (Est. ${randomInRange(2, 8)} min wait)</span></div>
        <div class="step"><span class="step-num">3</span> <span>Follow signs for <strong>${section.level} Level</strong></span></div>
        ${section.level === 'Upper' ? '<div class="step"><span class="step-num">4</span> <span>Take elevator or stairs to upper deck</span></div>' : ''}
        <div class="step"><span class="step-num">${section.level === 'Upper' ? 5 : 4}</span> <span>Find <strong>Section ${sectionId}</strong> — look for the large section markers</span></div>
        <div class="step success"><span>✅</span> <span>You've arrived! Enjoy the match!</span></div>
      </div>
      ${section.type === 'accessible' ? `
        <div class="accessible-note">
          ♿ <strong>Accessibility Note:</strong> Wheelchair access available at all levels. 
          Staff assistance available at Gate ${section.gate}. Hearing loops active in this section.
        </div>
      ` : ''}
    `;

    directionsPanel.style.display = 'block';
    directionsPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  function getDirectionName(gateId) {
    const dirs = { 1: 'North', 2: 'Northeast', 3: 'East', 4: 'Southeast', 5: 'South', 6: 'Southwest', 7: 'West', 8: 'Northwest' };
    return dirs[gateId] || '';
  }

  return { init };
})();

export default NavigationComponent;
