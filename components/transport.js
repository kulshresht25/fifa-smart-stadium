/**
 * StadiumIQ — Transportation Hub Component
 * Smart transportation management for FIFA World Cup 2026.
 */

import { randomInRange, formatTime, showToast, animateCount, formatNumber } from '../utils/helpers.js';

const TransportComponent = (() => {
  let container = null;
  let updateInterval = null;

  const SHUTTLE_ROUTES = [
    { id: 1, name: 'Express - Downtown', icon: '🚌', color: '#3b82f6', stops: ['MetLife Stadium', 'Secaucus Junction', 'Penn Station NYC'], frequency: 15, nextIn: 8, capacity: 55, occupied: 42 },
    { id: 2, name: 'Airport Express', icon: '✈️', color: '#8b5cf6', stops: ['MetLife Stadium', 'Newark Airport', 'JFK Terminal 4'], frequency: 30, nextIn: 22, capacity: 44, occupied: 38 },
    { id: 3, name: 'North Shuttle', icon: '🚐', color: '#10b981', stops: ['MetLife Stadium', 'North Lot A', 'North Lot B', 'Meadowlands Race Track'], frequency: 10, nextIn: 3, capacity: 25, occupied: 12 },
    { id: 4, name: 'Hotel Circuit', icon: '🏨', color: '#f59e0b', stops: ['MetLife Stadium', 'Marriott Meadowlands', 'Hilton East Rutherford', 'DoubleTree Hasbrouck Heights'], frequency: 20, nextIn: 14, capacity: 44, occupied: 31 },
    { id: 5, name: 'Fan Zone Link', icon: '⚽', color: '#ef4444', stops: ['MetLife Stadium', 'FIFA Fan Festival', 'Times Square Fan Zone'], frequency: 25, nextIn: 19, capacity: 55, occupied: 55 }
  ];

  const PARKING_LOTS = [
    { id: 'A', name: 'Lot A - North', total: 2500, available: 847, distance: '5 min walk', price: '$45', accessible: 80 },
    { id: 'B', name: 'Lot B - North', total: 2000, available: 312, distance: '8 min walk', price: '$45', accessible: 60 },
    { id: 'C', name: 'Lot C - South', total: 3000, available: 1205, distance: '10 min walk', price: '$40', accessible: 100 },
    { id: 'D', name: 'Lot D - East', total: 1500, available: 0, distance: '12 min walk', price: '$40', accessible: 40 },
    { id: 'VIP', name: 'VIP Premium', total: 500, available: 73, distance: '2 min walk', price: '$120', accessible: 50 }
  ];

  const METRO_LINES = [
    { id: 'NJ Transit', name: 'NJ Transit - Meadowlands Line', color: '#ef4444', nextTrain: 6, direction: 'From Penn Station', platforms: ['Platform 1', 'Platform 2'] },
    { id: 'Bus 139', name: 'NJ Transit Bus 139', color: '#3b82f6', nextTrain: 12, direction: 'From Port Authority', platforms: ['Bus Bay 4'] },
    { id: 'Bus 190', name: 'NJ Transit Bus 190', color: '#10b981', nextTrain: 18, direction: 'From Secaucus Junction', platforms: ['Bus Bay 7'] }
  ];

  function init(containerEl) {
    container = containerEl;
    render();
    startUpdates();
  }

  function render() {
    container.innerHTML = `
      <div class="transport-wrapper">
        <!-- Quick stats -->
        <div class="transport-stats-row">
          <div class="transport-stat">
            <div class="stat-icon">🚌</div>
            <div class="stat-info">
              <div class="stat-val" id="t-shuttles">5</div>
              <div class="stat-lbl">Active Shuttles</div>
            </div>
          </div>
          <div class="transport-stat">
            <div class="stat-icon">🅿️</div>
            <div class="stat-info">
              <div class="stat-val" id="t-parking">${formatNumber(2364)}</div>
              <div class="stat-lbl">Spaces Available</div>
            </div>
          </div>
          <div class="transport-stat">
            <div class="stat-icon">🚆</div>
            <div class="stat-info">
              <div class="stat-val" id="t-train">6 min</div>
              <div class="stat-lbl">Next Train</div>
            </div>
          </div>
          <div class="transport-stat">
            <div class="stat-icon">🚗</div>
            <div class="stat-info">
              <div class="stat-val" id="t-rideshare">~12m</div>
              <div class="stat-lbl">Rideshare Wait</div>
            </div>
          </div>
        </div>

        <div class="transport-main-grid">
          <!-- Shuttle Schedule -->
          <div class="transport-panel">
            <div class="panel-header">
              <h3>🚌 Shuttle Services</h3>
              <span class="live-badge">LIVE</span>
            </div>
            <div class="shuttle-list" id="shuttle-list">
              ${renderShuttleList()}
            </div>
          </div>

          <!-- Transit Info -->
          <div class="transport-panel">
            <div class="panel-header">
              <h3>🚆 Public Transit</h3>
            </div>
            <div class="metro-list">
              ${METRO_LINES.map(line => `
                <div class="metro-item">
                  <div class="metro-indicator" style="background:${line.color}"></div>
                  <div class="metro-info">
                    <div class="metro-name">${line.name}</div>
                    <div class="metro-direction">${line.direction}</div>
                    <div class="metro-platforms">${line.platforms.join(' · ')}</div>
                  </div>
                  <div class="metro-next">
                    <span class="next-time" id="metro-${line.id}" style="color:${line.color}">${line.nextTrain} min</span>
                    <span class="next-label">next</span>
                  </div>
                </div>
              `).join('')}
            </div>

            <!-- Rideshare Info -->
            <div class="panel-header" style="margin-top:20px">
              <h3>🚗 Rideshare Zones</h3>
            </div>
            <div class="rideshare-list">
              <div class="rideshare-item">
                <span class="rideshare-logo">🟢</span>
                <div class="rideshare-info">
                  <span class="rs-name">Uber</span>
                  <span class="rs-zone">Pickup Zone: Lot A East</span>
                </div>
                <span class="rs-wait" style="color:#10b981">~8 min</span>
              </div>
              <div class="rideshare-item">
                <span class="rideshare-logo">🟡</span>
                <div class="rideshare-info">
                  <span class="rs-name">Lyft</span>
                  <span class="rs-zone">Pickup Zone: Gate 3 South</span>
                </div>
                <span class="rs-wait" style="color:#f59e0b">~14 min</span>
              </div>
              <div class="rideshare-item">
                <span class="rideshare-logo">🔵</span>
                <div class="rideshare-info">
                  <span class="rs-name">Via (Shuttle Share)</span>
                  <span class="rs-zone">Pickup: Transit Hub</span>
                </div>
                <span class="rs-wait" style="color:#3b82f6">~5 min</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Parking Lots -->
        <div class="parking-section">
          <div class="panel-header">
            <h3>🅿️ Parking Availability</h3>
            <button class="btn-refresh" id="refresh-parking" aria-label="Refresh parking data">⟳ Refresh</button>
          </div>
          <div class="parking-grid" id="parking-grid">
            ${renderParkingGrid()}
          </div>
        </div>

        <!-- Transport Planner -->
        <div class="planner-section">
          <div class="panel-header">
            <h3>🗺️ Journey Planner</h3>
          </div>
          <div class="planner-form">
            <div class="planner-inputs">
              <div class="planner-input-group">
                <label for="journey-from">From</label>
                <input type="text" id="journey-from" class="planner-input" placeholder="Your location (e.g. Manhattan)" aria-label="Journey starting location"/>
              </div>
              <div class="planner-arrow">→</div>
              <div class="planner-input-group">
                <label for="journey-to">To</label>
                <input type="text" id="journey-to" class="planner-input" value="MetLife Stadium" readonly aria-label="Journey destination"/>
              </div>
            </div>
            <div class="planner-options">
              <label><input type="radio" name="transport-mode" value="transit" checked> 🚆 Public Transit</label>
              <label><input type="radio" name="transport-mode" value="shuttle"> 🚌 Shuttle</label>
              <label><input type="radio" name="transport-mode" value="drive"> 🚗 Drive</label>
              <label><input type="radio" name="transport-mode" value="accessible"> ♿ Accessible</label>
            </div>
            <button class="btn-primary" id="plan-journey-btn" aria-label="Plan my journey">
              🗺️ Plan My Journey
            </button>
            <div class="journey-result" id="journey-result" style="display:none;"></div>
          </div>
        </div>
      </div>
    `;

    bindTransportEvents();
  }

  function renderShuttleList() {
    return SHUTTLE_ROUTES.map(route => {
      const pct = Math.round((route.occupied / route.capacity) * 100);
      const statusColor = pct >= 100 ? '#ef4444' : pct >= 80 ? '#f59e0b' : '#10b981';
      const statusText = pct >= 100 ? 'Full' : pct >= 80 ? 'Nearly Full' : 'Available';

      return `
        <div class="shuttle-item" data-shuttle="${route.id}" tabindex="0" role="article" aria-label="${route.name}: next in ${route.nextIn} minutes">
          <div class="shuttle-icon" style="background:${route.color}22; color:${route.color}">${route.icon}</div>
          <div class="shuttle-info">
            <div class="shuttle-name">${route.name}</div>
            <div class="shuttle-stops">${route.stops[0]} → ${route.stops[route.stops.length - 1]}</div>
            <div class="shuttle-freq">Every ${route.frequency} min</div>
          </div>
          <div class="shuttle-status">
            <div class="shuttle-next">
              <span class="next-bus" style="color:${route.nextIn <= 5 ? '#10b981' : route.nextIn <= 15 ? '#f59e0b' : '#64748b'}">${route.nextIn} min</span>
              <span class="next-bus-label">next</span>
            </div>
            <div class="capacity-bar-wrapper">
              <div class="capacity-bar" style="width:${pct}%; background:${statusColor}"></div>
            </div>
            <span class="shuttle-capacity-text" style="color:${statusColor}">${statusText} (${route.occupied}/${route.capacity})</span>
          </div>
        </div>
      `;
    }).join('');
  }

  function renderParkingGrid() {
    return PARKING_LOTS.map(lot => {
      const pct = Math.round(((lot.total - lot.available) / lot.total) * 100);
      const color = lot.available === 0 ? '#ef4444' : pct > 80 ? '#f59e0b' : '#10b981';
      const status = lot.available === 0 ? 'FULL' : lot.available < 200 ? 'Limited' : 'Available';

      return `
        <div class="parking-card" style="--accent:${color}" tabindex="0" role="article" aria-label="Parking Lot ${lot.name}: ${lot.available} spaces available">
          <div class="parking-header">
            <span class="parking-name">${lot.name}</span>
            <span class="parking-price">${lot.price}/event</span>
          </div>
          <div class="parking-meter">
            <div class="meter-fill" style="width:${pct}%; background:${color}"></div>
          </div>
          <div class="parking-stats">
            <span class="parking-available" style="color:${color}">${lot.available === 0 ? 'FULL' : formatNumber(lot.available)} spaces</span>
            <span class="parking-status" style="color:${color}">${status}</span>
          </div>
          <div class="parking-meta">
            <span>📍 ${lot.distance}</span>
            <span>♿ ${lot.accessible} accessible</span>
          </div>
          ${lot.available === 0 ? `<div class="parking-full-notice">Try Lot C or North Lot A</div>` : ''}
        </div>
      `;
    }).join('');
  }

  function bindTransportEvents() {
    document.getElementById('refresh-parking')?.addEventListener('click', () => {
      // Simulate refresh
      PARKING_LOTS.forEach(lot => {
        if (lot.available > 0) {
          lot.available = Math.max(0, lot.available + randomInRange(-50, 30));
        }
      });
      const grid = document.getElementById('parking-grid');
      if (grid) grid.innerHTML = renderParkingGrid();
      showToast('Parking data refreshed', 'success');
    });

    document.getElementById('plan-journey-btn')?.addEventListener('click', planJourney);
  }

  function planJourney() {
    const from = document.getElementById('journey-from')?.value?.trim() || '';
    const mode = document.querySelector('input[name="transport-mode"]:checked')?.value || 'transit';
    const resultEl = document.getElementById('journey-result');

    if (!from) {
      showToast('Please enter your starting location', 'warning');
      return;
    }

    const routes = {
      transit: {
        steps: [
          `🚶 Walk/Travel to nearest transit hub from ${from}`,
          '🚆 Board NJ Transit Meadowlands Line',
          '⏱️ ~35 min journey to Meadowlands Station',
          '🚶 5-minute walk to MetLife Stadium Gate 1'
        ],
        time: '45 min', cost: '$4.25', note: 'Most eco-friendly option ♻️'
      },
      shuttle: {
        steps: [
          `🚗 Travel to shuttle pickup at Penn Station from ${from}`,
          '🚌 Board MetLife Express Shuttle (Departs every 15 min)',
          '⏱️ ~25 min direct ride to stadium',
          '🏟️ Drops at Gate 1 Main Entrance'
        ],
        time: '35 min', cost: '$8.00', note: 'Pre-book recommended during peak hours'
      },
      drive: {
        steps: [
          `🚗 Navigate to NJ-3 East from ${from}`,
          '🛣️ Follow signs to MetLife Stadium / Meadowlands',
          '🅿️ Parking available in Lots A, B, C (book in advance)',
          '🚶 Walk from parking to stadium entrance'
        ],
        time: '30-60 min', cost: '$40-120', note: '⚠️ Expect heavy traffic 2 hours before kickoff'
      },
      accessible: {
        steps: [
          `♿ Accessible transit available via NJ Transit from ${from}`,
          '🚌 Accessible shuttle with ramp — departs every 20 min',
          '🏟️ Arrive at Gate 2 (fully accessible)',
          '♿ Stadium mobility assistance available on request'
        ],
        time: '40 min', cost: 'Free for mobility aid users', note: 'Book via accessibility hotline: +1 (555) FIFA-ADA'
      }
    };

    const route = routes[mode];
    if (!resultEl) return;

    resultEl.style.display = 'block';
    resultEl.innerHTML = `
      <div class="journey-plan">
        <div class="journey-summary">
          <span class="journey-time">⏱️ ${route.time}</span>
          <span class="journey-cost">💰 ${route.cost}</span>
        </div>
        <ol class="journey-steps">
          ${route.steps.map(s => `<li>${s}</li>`).join('')}
        </ol>
        <div class="journey-note">💡 ${route.note}</div>
      </div>
    `;
  }

  function startUpdates() {
    updateInterval = setInterval(() => {
      // Update shuttle next times
      SHUTTLE_ROUTES.forEach(route => {
        route.nextIn = Math.max(1, route.nextIn - 1);
        if (route.nextIn <= 0) route.nextIn = route.frequency;
        route.occupied = Math.min(route.capacity, Math.max(0, route.occupied + randomInRange(-3, 5)));
      });

      const shuttleList = document.getElementById('shuttle-list');
      if (shuttleList) shuttleList.innerHTML = renderShuttleList();

      // Update metro times
      METRO_LINES.forEach(line => {
        line.nextTrain = Math.max(1, line.nextTrain - 1);
        if (line.nextTrain <= 0) line.nextTrain = randomInRange(5, 20);
        const el = document.getElementById(`metro-${line.id}`);
        if (el) el.textContent = `${line.nextTrain} min`;
      });

      // Update rideshare wait
      const rsEl = document.getElementById('t-rideshare');
      if (rsEl) rsEl.textContent = `~${randomInRange(8, 18)}m`;

    }, 5000);
  }

  function destroy() {
    if (updateInterval) clearInterval(updateInterval);
  }

  return { init, destroy };
})();

export default TransportComponent;
