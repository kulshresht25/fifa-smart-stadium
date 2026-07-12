/**
 * StadiumIQ — Sustainability & Eco Tracker Component
 * Real-time environmental monitoring and green initiatives for FIFA World Cup 2026.
 */

import { randomInRange, formatNumber, animateCount } from '../utils/helpers.js';

const SustainabilityComponent = (() => {
  let container = null;
  let updateInterval = null;

  // Current eco metrics (simulated real-time)
  let ecoData = {
    carbonSaved: 142.5,    // tonnes CO2 saved today
    wasteRecycled: 78,      // percentage
    energyRenewable: 65,    // percentage from renewable
    waterConserved: 23400,  // liters
    treesEquivalent: 284,   // trees equivalent of CO2 offset
    singleUsePlasticAvoided: 15200, // pieces
    evCharging: 42,         // EV cars charging now
    solarOutput: 8.4        // MWh solar today
  };

  const ECO_INITIATIVES = [
    {
      id: 'solar',
      icon: '☀️',
      title: 'Solar Power Grid',
      value: '8.4 MWh',
      description: 'Stadium roof generates clean energy via 12,000 solar panels',
      progress: 65,
      target: '15 MWh/day',
      color: '#f59e0b'
    },
    {
      id: 'waste',
      icon: '♻️',
      title: 'Zero Waste Program',
      value: '78% Recycled',
      description: 'Smart sorting bins + fan awareness reduce landfill waste',
      progress: 78,
      target: '90% target',
      color: '#10b981'
    },
    {
      id: 'water',
      icon: '💧',
      title: 'Water Conservation',
      value: '23,400 L',
      description: 'Greywater recycling and low-flow fixtures save water daily',
      progress: 60,
      target: '40,000 L/day',
      color: '#3b82f6'
    },
    {
      id: 'transport',
      icon: '🚆',
      title: 'Green Transport',
      value: '42% fans via transit',
      description: 'Public transit incentives reduce vehicle emissions',
      progress: 42,
      target: '60% target',
      color: '#8b5cf6'
    },
    {
      id: 'food',
      icon: '🥗',
      title: 'Sustainable Food',
      value: '35% plant-based',
      description: 'Plant-based menu options reduce food carbon footprint',
      progress: 35,
      target: '50% target',
      color: '#ec4899'
    },
    {
      id: 'carbon',
      icon: '🌳',
      title: 'Carbon Offset',
      value: '142.5t CO₂',
      description: 'Equivalent to preserving 284 trees for one year',
      progress: 55,
      target: '260t target',
      color: '#22c55e'
    }
  ];

  const ECO_TIPS = [
    '♻️ Use the labeled recycling stations at every gate entrance',
    '🚆 You saved ~2.5kg CO₂ by taking public transit today!',
    '💧 Refill stations available at all concourse areas — bring your bottle',
    '🥗 Try our plant-based menu at Section G — tastes great and saves the planet!',
    '🔋 EV charging available at Parking Lot A (42 stations)',
    '📱 Go paperless — use your digital ticket to reduce paper waste',
    '🌡️ Stadium uses smart HVAC to optimize energy use in real-time',
    '🚶 Walking routes from transit are scenic and emission-free!'
  ];

  let currentTipIndex = 0;

  function init(containerEl) {
    container = containerEl;
    render();
    startUpdates();
  }

  function render() {
    container.innerHTML = `
      <div class="eco-wrapper">
        <!-- Hero metrics -->
        <div class="eco-hero">
          <div class="eco-hero-content">
            <h2 class="eco-title">🌍 FIFA World Cup 2026<br>Sustainability Dashboard</h2>
            <p class="eco-subtitle">Making history — the greenest World Cup ever</p>
          </div>
          <div class="eco-hero-metrics">
            <div class="hero-metric">
              <span class="hero-metric-val" id="eco-carbon">${ecoData.carbonSaved}</span>
              <span class="hero-metric-unit">tonnes CO₂</span>
              <span class="hero-metric-label">Saved Today</span>
            </div>
            <div class="hero-metric">
              <span class="hero-metric-val" id="eco-plastic">${formatNumber(ecoData.singleUsePlasticAvoided)}</span>
              <span class="hero-metric-unit">pieces</span>
              <span class="hero-metric-label">Plastic Avoided</span>
            </div>
            <div class="hero-metric">
              <span class="hero-metric-val" id="eco-trees">${ecoData.treesEquivalent}</span>
              <span class="hero-metric-unit">trees</span>
              <span class="hero-metric-label">Equivalent Saved</span>
            </div>
          </div>
        </div>

        <!-- Initiative progress cards -->
        <div class="eco-initiatives-grid">
          ${ECO_INITIATIVES.map(init => `
            <div class="eco-initiative-card" style="--accent:${init.color}" tabindex="0" role="article" aria-label="${init.title}: ${init.value}">
              <div class="initiative-icon-wrap" style="background:${init.color}22">
                <span class="initiative-icon">${init.icon}</span>
              </div>
              <div class="initiative-content">
                <h4 class="initiative-title">${init.title}</h4>
                <div class="initiative-value" style="color:${init.color}" id="eco-${init.id}-val">${init.value}</div>
                <p class="initiative-desc">${init.description}</p>
                <div class="initiative-progress-wrapper">
                  <div class="initiative-progress-bar">
                    <div class="initiative-progress-fill" style="width:${init.progress}%; background:${init.color}" id="eco-${init.id}-bar"></div>
                  </div>
                  <div class="initiative-progress-text">
                    <span id="eco-${init.id}-pct">${init.progress}%</span> of <span>${init.target}</span>
                  </div>
                </div>
              </div>
            </div>
          `).join('')}
        </div>

        <!-- Live energy chart -->
        <div class="eco-energy-section">
          <div class="panel-header">
            <h3>⚡ Live Energy Mix</h3>
            <span class="live-badge">LIVE</span>
          </div>
          <div class="energy-chart-wrapper">
            <div class="energy-donut" id="energy-donut">
              ${renderEnergyDonut()}
            </div>
            <div class="energy-legend">
              <div class="energy-legend-item"><span class="legend-color" style="background:#f59e0b"></span>Solar (${ecoData.energyRenewable}%)</div>
              <div class="energy-legend-item"><span class="legend-color" style="background:#3b82f6"></span>Wind (15%)</div>
              <div class="energy-legend-item"><span class="legend-color" style="background:#10b981"></span>Other Renewable (10%)</div>
              <div class="energy-legend-item"><span class="legend-color" style="background:#475569"></span>Grid (${100 - ecoData.energyRenewable - 25}%)</div>
            </div>
          </div>
          <div class="energy-stats-row">
            <div class="energy-stat">
              <span class="e-val" id="solar-output">${ecoData.solarOutput} MWh</span>
              <span class="e-lbl">Solar Output Today</span>
            </div>
            <div class="energy-stat">
              <span class="e-val" id="ev-charging">${ecoData.evCharging}</span>
              <span class="e-lbl">EVs Charging Now</span>
            </div>
            <div class="energy-stat">
              <span class="e-val" id="energy-saved">~18 MWh</span>
              <span class="e-lbl">Energy vs. Coal Equivalent</span>
            </div>
          </div>
        </div>

        <!-- Eco tips rotating banner -->
        <div class="eco-tips-section">
          <div class="eco-tip-card" id="eco-tip-card" role="status" aria-live="polite">
            <span class="tip-label">💡 Eco Tip</span>
            <p class="tip-text" id="eco-tip-text">${ECO_TIPS[0]}</p>
          </div>
          <div class="eco-tip-controls">
            <button class="tip-nav-btn" id="prev-tip" aria-label="Previous tip">◀</button>
            <div class="tip-dots">
              ${ECO_TIPS.map((_, i) => `<span class="tip-dot ${i === 0 ? 'active' : ''}" data-tip="${i}"></span>`).join('')}
            </div>
            <button class="tip-nav-btn" id="next-tip" aria-label="Next tip">▶</button>
          </div>
        </div>

        <!-- Fan eco pledge -->
        <div class="eco-pledge-section">
          <h3>🤝 Take the Green Pledge</h3>
          <p>Join over <strong id="pledge-count">12,847</strong> fans who have pledged to go green at FIFA World Cup 2026!</p>
          <div class="pledge-options">
            <label class="pledge-check"><input type="checkbox" id="pledge-transit" aria-label="Pledge to use public transit"> I'll use public transit 🚆</label>
            <label class="pledge-check"><input type="checkbox" id="pledge-plastic" aria-label="Pledge to avoid single-use plastic"> I'll avoid single-use plastic ♻️</label>
            <label class="pledge-check"><input type="checkbox" id="pledge-water" aria-label="Pledge to bring a reusable water bottle"> I'll bring a reusable bottle 💧</label>
            <label class="pledge-check"><input type="checkbox" id="pledge-food" aria-label="Pledge to try plant-based food"> I'll try a plant-based meal 🥗</label>
          </div>
          <button class="btn-primary btn-pledge" id="take-pledge-btn" aria-label="Take the green pledge">
            🌍 Take the Pledge!
          </button>
          <div class="pledge-result" id="pledge-result" style="display:none;"></div>
        </div>
      </div>
    `;

    bindEcoEvents();
  }

  /**
   * Render energy donut SVG
   */
  function renderEnergyDonut() {
    const solar = ecoData.energyRenewable;
    const wind = 15;
    const other = 10;
    const grid = 100 - solar - wind - other;

    const segments = [
      { pct: solar, color: '#f59e0b' },
      { pct: wind, color: '#3b82f6' },
      { pct: other, color: '#10b981' },
      { pct: grid, color: '#475569' }
    ];

    let currentAngle = -90;
    const cx = 100, cy = 100, r = 75, strokeW = 28;
    const circumference = 2 * Math.PI * r;

    const paths = segments.map(seg => {
      const startAngle = currentAngle;
      const endAngle = currentAngle + (seg.pct / 100) * 360;
      currentAngle = endAngle;

      const startRad = (startAngle * Math.PI) / 180;
      const endRad = (endAngle * Math.PI) / 180;

      const x1 = cx + r * Math.cos(startRad);
      const y1 = cy + r * Math.sin(startRad);
      const x2 = cx + r * Math.cos(endRad);
      const y2 = cy + r * Math.sin(endRad);
      const largeArc = seg.pct > 50 ? 1 : 0;

      return `<path d="M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}" 
        fill="none" stroke="${seg.color}" stroke-width="${strokeW}" stroke-linecap="butt"/>`;
    }).join('');

    return `
      <svg viewBox="0 0 200 200" width="180" height="180" aria-label="Energy mix donut chart">
        <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#1e293b" stroke-width="${strokeW}"/>
        ${paths}
        <text x="${cx}" y="${cy - 8}" text-anchor="middle" fill="#f8fafc" font-size="22" font-weight="bold">${solar + wind + other}%</text>
        <text x="${cx}" y="${cy + 12}" text-anchor="middle" fill="#94a3b8" font-size="11">Renewable</text>
      </svg>
    `;
  }

  function bindEcoEvents() {
    // Tip navigation
    document.getElementById('next-tip')?.addEventListener('click', () => {
      currentTipIndex = (currentTipIndex + 1) % ECO_TIPS.length;
      updateTip();
    });

    document.getElementById('prev-tip')?.addEventListener('click', () => {
      currentTipIndex = (currentTipIndex - 1 + ECO_TIPS.length) % ECO_TIPS.length;
      updateTip();
    });

    document.querySelectorAll('.tip-dot').forEach(dot => {
      dot.addEventListener('click', () => {
        currentTipIndex = parseInt(dot.dataset.tip);
        updateTip();
      });
    });

    // Pledge
    document.getElementById('take-pledge-btn')?.addEventListener('click', () => {
      const pledges = ['transit', 'plastic', 'water', 'food'].filter(p =>
        document.getElementById(`pledge-${p}`)?.checked
      );

      if (pledges.length === 0) {
        const { showToast } = require('../utils/helpers.js');
        alert('Please select at least one pledge option!');
        return;
      }

      const pledgeResult = document.getElementById('pledge-result');
      const pledgeCount = document.getElementById('pledge-count');

      if (pledgeCount) {
        const current = parseInt(pledgeCount.textContent.replace(/,/g, ''));
        pledgeCount.textContent = formatNumber(current + 1);
      }

      if (pledgeResult) {
        pledgeResult.style.display = 'block';
        pledgeResult.innerHTML = `
          <div class="pledge-success">
            <span class="pledge-success-icon">🎉</span>
            <div>
              <strong>Thank you for pledging!</strong>
              <p>You committed to: ${pledges.join(', ')}. Together we make FIFA World Cup 2026 greener! 🌍</p>
            </div>
          </div>
        `;
      }
    });
  }

  function updateTip() {
    const tipText = document.getElementById('eco-tip-text');
    if (tipText) {
      tipText.style.opacity = '0';
      setTimeout(() => {
        tipText.textContent = ECO_TIPS[currentTipIndex];
        tipText.style.opacity = '1';
      }, 200);
    }

    document.querySelectorAll('.tip-dot').forEach((dot, i) => {
      dot.classList.toggle('active', i === currentTipIndex);
    });
  }

  function startUpdates() {
    // Auto-rotate tips
    const tipInterval = setInterval(() => {
      currentTipIndex = (currentTipIndex + 1) % ECO_TIPS.length;
      updateTip();
    }, 6000);

    // Update metrics
    updateInterval = setInterval(() => {
      ecoData.carbonSaved = Math.round((ecoData.carbonSaved + randomInRange(0, 3) * 0.1) * 10) / 10;
      ecoData.singleUsePlasticAvoided += randomInRange(5, 20);
      ecoData.treesEquivalent = Math.round(ecoData.carbonSaved * 2);
      ecoData.wasteRecycled = Math.min(100, Math.max(60, ecoData.wasteRecycled + randomInRange(-1, 2)));
      ecoData.solarOutput = Math.round((ecoData.solarOutput + randomInRange(-2, 3) * 0.1) * 10) / 10;
      ecoData.evCharging = Math.min(42, Math.max(30, ecoData.evCharging + randomInRange(-2, 3)));

      const carbonEl = document.getElementById('eco-carbon');
      if (carbonEl) carbonEl.textContent = ecoData.carbonSaved;

      const plasticEl = document.getElementById('eco-plastic');
      if (plasticEl) plasticEl.textContent = formatNumber(ecoData.singleUsePlasticAvoided);

      const treesEl = document.getElementById('eco-trees');
      if (treesEl) treesEl.textContent = ecoData.treesEquivalent;

      const solarEl = document.getElementById('solar-output');
      if (solarEl) solarEl.textContent = `${ecoData.solarOutput} MWh`;

      const evEl = document.getElementById('ev-charging');
      if (evEl) evEl.textContent = ecoData.evCharging;

    }, 4000);
  }

  function destroy() {
    if (updateInterval) clearInterval(updateInterval);
  }

  return { init, destroy };
})();

export default SustainabilityComponent;
