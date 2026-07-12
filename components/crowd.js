/**
 * StadiumIQ — Crowd Management Component
 * Real-time crowd density monitoring, heatmap visualization, and AI-powered alerts.
 */

import { randomInRange, densityColor, densityLabel, formatNumber, formatTime, animateCount } from '../utils/helpers.js';
import GeminiAPI from '../utils/gemini.js';

const CrowdComponent = (() => {
  let container = null;
  let updateInterval = null;
  let heatmapCanvas = null;
  let ctx = null;

  // Stadium zones simulation data
  const ZONES = [
    { id: 'gate1', name: 'Gate 1 - North', x: 50, y: 10, base: 75, radius: 40 },
    { id: 'gate2', name: 'Gate 2 - NE', x: 80, y: 25, base: 55, radius: 35 },
    { id: 'gate3', name: 'Gate 3 - East', x: 90, y: 50, base: 60, radius: 38 },
    { id: 'gate4', name: 'Gate 4 - SE', x: 80, y: 75, base: 45, radius: 32 },
    { id: 'gate5', name: 'Gate 5 - South', x: 50, y: 90, base: 85, radius: 45 },
    { id: 'gate6', name: 'Gate 6 - SW', x: 20, y: 75, base: 50, radius: 33 },
    { id: 'gate7', name: 'Gate 7 - West', x: 10, y: 50, base: 40, radius: 30 },
    { id: 'gate8', name: 'Gate 8 - NW', x: 20, y: 25, base: 65, radius: 37 },
    { id: 'pitch', name: 'Pitch Level', x: 50, y: 50, base: 95, radius: 55 },
    { id: 'concessions', name: 'Concession Area', x: 35, y: 60, base: 70, radius: 40 },
    { id: 'food_court', name: 'Food Court', x: 65, y: 40, base: 68, radius: 38 },
    { id: 'parking', name: 'Main Parking', x: 50, y: 0, base: 55, radius: 50 }
  ];

  let currentOccupancy = 64300;
  const TOTAL_CAPACITY = 82500;
  let alertMessages = [];
  let crowdData = {};

  /**
   * Initialize crowd management component
   */
  function init(containerEl) {
    container = containerEl;
    initCrowdData();
    render();
    startUpdates();
  }

  /**
   * Initialize crowd data
   */
  function initCrowdData() {
    ZONES.forEach(zone => {
      crowdData[zone.id] = {
        ...zone,
        current: Math.min(100, Math.max(0, zone.base + randomInRange(-10, 10)))
      };
    });
  }

  /**
   * Render the crowd management interface
   */
  function render() {
    container.innerHTML = `
      <div class="crowd-wrapper">
        <!-- Stats Row -->
        <div class="crowd-stats-row">
          <div class="crowd-stat-card" id="stat-occupancy">
            <div class="stat-icon">👥</div>
            <div class="stat-content">
              <div class="stat-value" id="occ-value">${formatNumber(currentOccupancy)}</div>
              <div class="stat-label">Current Occupancy</div>
              <div class="stat-sub">${Math.round((currentOccupancy / TOTAL_CAPACITY) * 100)}% of ${formatNumber(TOTAL_CAPACITY)}</div>
            </div>
          </div>
          <div class="crowd-stat-card" id="stat-density">
            <div class="stat-icon">🌡️</div>
            <div class="stat-content">
              <div class="stat-value" id="density-value" style="color: ${densityColor(78)}">HIGH</div>
              <div class="stat-label">Overall Density</div>
              <div class="stat-sub">78% average</div>
            </div>
          </div>
          <div class="crowd-stat-card" id="stat-alerts">
            <div class="stat-icon">🚨</div>
            <div class="stat-content">
              <div class="stat-value" id="alerts-count">2</div>
              <div class="stat-label">Active Alerts</div>
              <div class="stat-sub">1 critical, 1 warning</div>
            </div>
          </div>
          <div class="crowd-stat-card" id="stat-flow">
            <div class="stat-icon">➡️</div>
            <div class="stat-content">
              <div class="stat-value" id="flow-value">+1,240</div>
              <div class="stat-label">Entry Rate</div>
              <div class="stat-sub">fans/hour</div>
            </div>
          </div>
        </div>

        <!-- Main content: Heatmap + Alerts -->
        <div class="crowd-main-grid">
          <!-- Heatmap -->
          <div class="crowd-heatmap-panel">
            <div class="panel-header">
              <h3>🔥 Live Crowd Heatmap</h3>
              <span class="live-badge">LIVE</span>
            </div>
            <div class="heatmap-container" aria-label="Stadium crowd heatmap">
              <canvas id="heatmap-canvas" width="500" height="400" role="img" aria-label="Stadium crowd density visualization"></canvas>
              <div class="heatmap-legend">
                <span class="legend-item"><span class="legend-dot" style="background:#10b981"></span>Low</span>
                <span class="legend-item"><span class="legend-dot" style="background:#f59e0b"></span>Moderate</span>
                <span class="legend-item"><span class="legend-dot" style="background:#f97316"></span>High</span>
                <span class="legend-item"><span class="legend-dot" style="background:#ef4444"></span>Critical</span>
              </div>
            </div>
          </div>

          <!-- Zone breakdown + alerts -->
          <div class="crowd-right-panel">
            <!-- Alerts -->
            <div class="alerts-panel">
              <div class="panel-header">
                <h3>⚡ Real-Time Alerts</h3>
                <button class="btn-ai-analyze" id="ai-analyze-btn" aria-label="Run AI crowd analysis">
                  🤖 AI Analyze
                </button>
              </div>
              <div class="alerts-list" id="alerts-list">
                ${renderAlerts()}
              </div>
            </div>

            <!-- Zone list -->
            <div class="zones-panel">
              <div class="panel-header">
                <h3>📍 Zone Status</h3>
                <span class="update-time" id="update-time">Updated: ${formatTime()}</span>
              </div>
              <div class="zones-list" id="zones-list">
                ${renderZoneList()}
              </div>
            </div>
          </div>
        </div>

        <!-- AI Insight Panel -->
        <div class="ai-insight-panel" id="ai-insight-panel" style="display:none;">
          <div class="panel-header">
            <h3>🤖 AI Operational Intelligence</h3>
            <button class="btn-icon" id="close-insight">✕</button>
          </div>
          <div class="insight-content" id="insight-content">
            <div class="insight-loading">Analyzing crowd patterns...</div>
          </div>
        </div>
      </div>
    `;

    // Initialize canvas
    heatmapCanvas = document.getElementById('heatmap-canvas');
    if (heatmapCanvas) {
      ctx = heatmapCanvas.getContext('2d');
      drawHeatmap();
    }

    // Bind events
    document.getElementById('ai-analyze-btn')?.addEventListener('click', runAIAnalysis);
    document.getElementById('close-insight')?.addEventListener('click', () => {
      document.getElementById('ai-insight-panel').style.display = 'none';
    });
  }

  /**
   * Render alert messages
   */
  function renderAlerts() {
    const alerts = [
      { level: 'critical', icon: '🚨', text: 'Gate 5 (South) at 89% capacity — redirect fans to Gate 7', time: '2 min ago' },
      { level: 'warning', icon: '⚠️', text: 'Concession area congestion detected — 15+ min wait time', time: '5 min ago' },
      { level: 'info', icon: 'ℹ️', text: 'Shuttle Schedule: Next bus from North Lot in 8 minutes', time: '8 min ago' }
    ];

    return alerts.map(a => `
      <div class="alert-item alert-${a.level}" role="alert">
        <span class="alert-icon">${a.icon}</span>
        <div class="alert-body">
          <span class="alert-text">${a.text}</span>
          <span class="alert-time">${a.time}</span>
        </div>
      </div>
    `).join('');
  }

  /**
   * Render zone list
   */
  function renderZoneList() {
    return Object.values(crowdData).slice(0, 8).map(zone => {
      const color = densityColor(zone.current);
      const label = densityLabel(zone.current);
      return `
        <div class="zone-item" data-zone="${zone.id}">
          <div class="zone-name">${zone.name}</div>
          <div class="zone-bar-wrapper">
            <div class="zone-bar" style="width:${zone.current}%; background:${color};"></div>
          </div>
          <div class="zone-stats">
            <span class="zone-pct" style="color:${color}">${Math.round(zone.current)}%</span>
            <span class="zone-label" style="color:${color}">${label}</span>
          </div>
        </div>
      `;
    }).join('');
  }

  /**
   * Draw heatmap on canvas
   */
  function drawHeatmap() {
    if (!ctx) return;

    const width = heatmapCanvas.width;
    const height = heatmapCanvas.height;

    // Clear
    ctx.clearRect(0, 0, width, height);

    // Background (stadium shape)
    ctx.fillStyle = '#0f1923';
    ctx.fillRect(0, 0, width, height);

    // Draw stadium oval
    ctx.beginPath();
    ctx.ellipse(width / 2, height / 2, width * 0.45, height * 0.45, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#1a2535';
    ctx.fill();
    ctx.strokeStyle = '#2d4a6e';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw pitch
    ctx.beginPath();
    ctx.ellipse(width / 2, height / 2, width * 0.25, height * 0.25, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#1a4a2a';
    ctx.fill();
    ctx.strokeStyle = '#ffffff22';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Pitch lines
    ctx.strokeStyle = '#ffffff33';
    ctx.beginPath();
    ctx.ellipse(width / 2, height / 2, width * 0.18, height * 0.18, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(width / 2, height / 2 - height * 0.25);
    ctx.lineTo(width / 2, height / 2 + height * 0.25);
    ctx.stroke();

    // Draw heat blobs
    Object.values(crowdData).forEach(zone => {
      const x = (zone.x / 100) * width;
      const y = (zone.y / 100) * height;
      const radius = (zone.radius / 100) * Math.min(width, height) * 0.8;
      const intensity = zone.current / 100;

      const grad = ctx.createRadialGradient(x, y, 0, x, y, radius);
      const color = getHeatColor(intensity);

      grad.addColorStop(0, color.replace(')', `, ${intensity * 0.85})`).replace('rgb', 'rgba'));
      grad.addColorStop(0.5, color.replace(')', `, ${intensity * 0.4})`).replace('rgb', 'rgba'));
      grad.addColorStop(1, 'rgba(0,0,0,0)');

      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();
    });

    // Zone labels
    ctx.font = 'bold 10px Inter, sans-serif';
    ctx.fillStyle = '#ffffffcc';
    ctx.textAlign = 'center';

    const labelZones = [
      { name: 'N', x: 50, y: 8 },
      { name: 'S', x: 50, y: 92 },
      { name: 'E', x: 92, y: 50 },
      { name: 'W', x: 8, y: 50 }
    ];

    labelZones.forEach(lz => {
      ctx.fillText(lz.name, (lz.x / 100) * width, (lz.y / 100) * height);
    });
  }

  /**
   * Get heat color based on intensity
   */
  function getHeatColor(intensity) {
    if (intensity < 0.4) return 'rgb(16, 185, 129)';
    if (intensity < 0.7) return 'rgb(245, 158, 11)';
    if (intensity < 0.85) return 'rgb(249, 115, 22)';
    return 'rgb(239, 68, 68)';
  }

  /**
   * Update crowd data with simulation
   */
  function updateCrowdData() {
    let totalOccupancy = 0;

    Object.keys(crowdData).forEach(id => {
      const zone = crowdData[id];
      // Simulate gradual changes
      const delta = randomInRange(-5, 5);
      zone.current = Math.min(100, Math.max(5, zone.current + delta * 0.3));
      totalOccupancy += zone.current;
    });

    // Update global occupancy
    const avgDensity = totalOccupancy / Object.keys(crowdData).length;
    currentOccupancy = Math.round((avgDensity / 100) * TOTAL_CAPACITY);
    currentOccupancy += randomInRange(-500, 500);
    currentOccupancy = Math.min(TOTAL_CAPACITY, Math.max(50000, currentOccupancy));
  }

  /**
   * Update UI elements
   */
  function updateUI() {
    // Update occupancy count
    const occEl = document.getElementById('occ-value');
    if (occEl) {
      const prev = parseInt(occEl.textContent.replace(/,/g, '')) || currentOccupancy;
      animateCount(occEl, prev, currentOccupancy, 800);
    }

    // Update density
    const densityPct = Math.round((currentOccupancy / TOTAL_CAPACITY) * 100);
    const densityEl = document.getElementById('density-value');
    if (densityEl) {
      densityEl.textContent = densityLabel(densityPct).toUpperCase();
      densityEl.style.color = densityColor(densityPct);
    }

    // Update flow rate
    const flowEl = document.getElementById('flow-value');
    if (flowEl) {
      const flow = randomInRange(800, 1600);
      flowEl.textContent = `+${formatNumber(flow)}`;
    }

    // Update zones list
    const zonesList = document.getElementById('zones-list');
    if (zonesList) {
      zonesList.innerHTML = renderZoneList();
    }

    // Update time
    const timeEl = document.getElementById('update-time');
    if (timeEl) timeEl.textContent = `Updated: ${formatTime()}`;

    // Redraw heatmap
    drawHeatmap();
  }

  /**
   * Run AI crowd analysis
   */
  async function runAIAnalysis() {
    const insightPanel = document.getElementById('ai-insight-panel');
    const insightContent = document.getElementById('insight-content');

    if (insightPanel) insightPanel.style.display = 'block';
    if (insightContent) {
      insightContent.innerHTML = `
        <div class="insight-loading">
          <div class="spinner"></div>
          <span>Analyzing crowd patterns with AI...</span>
        </div>
      `;
    }

    const data = {
      totalOccupancy: currentOccupancy,
      capacity: TOTAL_CAPACITY,
      occupancyPercent: Math.round((currentOccupancy / TOTAL_CAPACITY) * 100),
      zones: Object.values(crowdData).map(z => ({ name: z.name, density: Math.round(z.current) })),
      timestamp: new Date().toISOString()
    };

    const insight = await GeminiAPI.generateOperationalInsight(data);

    if (insightContent) {
      if (insight) {
        const severityColors = { low: '#10b981', medium: '#f59e0b', high: '#ef4444' };
        insightContent.innerHTML = `
          <div class="insight-result">
            <div class="insight-severity" style="background:${severityColors[insight.severity] || '#3b82f6'}22; border-color:${severityColors[insight.severity] || '#3b82f6'}">
              Severity: <strong>${(insight.severity || 'LOW').toUpperCase()}</strong>
            </div>
            <div class="insight-summary">
              <h4>📊 Summary</h4>
              <p>${insight.summary || 'Analysis complete.'}</p>
            </div>
            ${insight.alerts && insight.alerts.length ? `
              <div class="insight-alerts">
                <h4>⚠️ Alerts</h4>
                <ul>${insight.alerts.map(a => `<li>${a}</li>`).join('')}</ul>
              </div>
            ` : ''}
            ${insight.recommendation ? `
              <div class="insight-recommendation">
                <h4>💡 Recommendation</h4>
                <p>${insight.recommendation}</p>
              </div>
            ` : ''}
          </div>
        `;
      } else {
        // Demo fallback
        insightContent.innerHTML = `
          <div class="insight-result">
            <div class="insight-severity" style="background:#f59e0b22; border-color:#f59e0b">
              Severity: <strong>MEDIUM</strong>
            </div>
            <div class="insight-summary">
              <h4>📊 Summary</h4>
              <p>Stadium is at ${Math.round((currentOccupancy / TOTAL_CAPACITY) * 100)}% capacity. Gate 5 experiencing above-normal traffic. Crowd flow is manageable with minor bottlenecks at south entrance.</p>
            </div>
            <div class="insight-alerts">
              <h4>⚠️ Alerts</h4>
              <ul>
                <li>Gate 5 South at 89% — recommend opening additional lanes</li>
                <li>Concession queues exceeding 12-minute threshold</li>
              </ul>
            </div>
            <div class="insight-recommendation">
              <h4>💡 Recommendation</h4>
              <p>Deploy 4 additional crowd marshals to Gate 5. Activate secondary concession stations in Sections D and F. Send fan notification to use Gate 7 for smoother entry.</p>
            </div>
          </div>
        `;
      }
    }

    // Scroll to insight panel
    insightPanel?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  /**
   * Start periodic updates
   */
  function startUpdates() {
    updateInterval = setInterval(() => {
      updateCrowdData();
      updateUI();
    }, 3000);
  }

  /**
   * Cleanup
   */
  function destroy() {
    if (updateInterval) clearInterval(updateInterval);
  }

  return { init, destroy };
})();

export default CrowdComponent;
