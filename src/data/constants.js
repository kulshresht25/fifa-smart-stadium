/**
 * StadiumIQ — Shared Application Constants
 *
 * Single source of truth for all static data arrays used across
 * components, the main app script, and tests. Extracted from
 * both index.html's inline <script> and the original utils/helpers.js.
 *
 * @module src/data/constants
 */

/** Total stadium capacity for MetLife Stadium (primary demo venue). */
export const TOTAL_CAPACITY = 82500;

/**
 * FIFA World Cup 2026 venue data.
 * @type {Array<{name: string, city: string, country: string, cap: number}>}
 */
export const VENUES = [
  { name: 'MetLife Stadium', city: 'East Rutherford, NJ', country: 'USA', cap: 82500 },
  { name: 'SoFi Stadium', city: 'Inglewood, CA', country: 'USA', cap: 70240 },
  { name: 'AT&T Stadium', city: 'Arlington, TX', country: 'USA', cap: 80000 },
  { name: 'Estadio Azteca', city: 'Mexico City', country: 'MEX', cap: 87523 },
  { name: 'Caesars Superdome', city: 'New Orleans, LA', country: 'USA', cap: 76468 },
  { name: 'BMO Field', city: 'Toronto', country: 'CAN', cap: 30000 },
  { name: 'Estadio BBVA', city: 'Monterrey', country: 'MEX', cap: 53500 },
  { name: 'Arrowhead Stadium', city: 'Kansas City', country: 'USA', cap: 76416 },
];

/**
 * FIFA World Cup 2026 match schedule.
 * @type {Array<{home: string, away: string, venue: string, date: string, time: string, stage: string}>}
 */
export const MATCHES = [
  { home: 'USA 🇺🇸', away: 'Mexico 🇲🇽', venue: 'MetLife Stadium', date: 'Jun 11', time: '20:00', stage: 'Group A' },
  { home: 'Brazil 🇧🇷', away: 'Germany 🇩🇪', venue: 'SoFi Stadium', date: 'Jun 12', time: '18:00', stage: 'Group B' },
  { home: 'France 🇫🇷', away: 'Argentina 🇦🇷', venue: 'AT&T Stadium', date: 'Jun 13', time: '20:00', stage: 'Group C' },
  { home: 'Spain 🇪🇸', away: 'Portugal 🇵🇹', venue: 'Azteca', date: 'Jun 14', time: '17:00', stage: 'Group D' },
  { home: 'England 🏴󠁧󠁢󠁥󠁮󠁧󠁿', away: 'Japan 🇯🇵', venue: 'MetLife Stadium', date: 'Jun 15', time: '19:00', stage: 'Group E' },
];

/**
 * Stadium sections for MetLife (primary demo venue).
 * @type {Array<{id: string, gate: number, level: string, type: string, cap: number, services: string[]}>}
 */
export const SECTIONS = [
  { id: 'A', gate: 1, level: 'Field', type: 'premium', cap: 5000, services: ['VIP Lounge', 'Premium Dining', 'Concierge'] },
  { id: 'B', gate: 2, level: 'Lower', type: 'general', cap: 8000, services: ['Concession', 'First Aid', 'Restrooms'] },
  { id: 'C', gate: 3, level: 'Lower', type: 'general', cap: 8000, services: ['Concession', 'Souvenir Shop', 'Restrooms'] },
  { id: 'D', gate: 4, level: 'Mid', type: 'general', cap: 10000, services: ['Food Court', 'Bar', 'Restrooms'] },
  { id: 'E', gate: 5, level: 'Mid', type: 'general', cap: 10000, services: ['Concession', 'First Aid', 'Restrooms'] },
  { id: 'F', gate: 6, level: 'Upper', type: 'budget', cap: 12000, services: ['Concession', 'Restrooms'] },
  { id: 'G', gate: 7, level: 'Upper', type: 'budget', cap: 12000, services: ['Concession', 'Vegan Options', 'Restrooms'] },
  { id: 'H', gate: 8, level: 'Upper', type: 'accessible', cap: 5000, services: ['Wheelchair Access', 'First Aid', 'Family Restroom', 'Hearing Loop'] },
];

/**
 * Gate status data with wait times and queue levels.
 * @type {Array<{id: number, name: string, wait: number, queue: string, services: string[]}>}
 */
export const GATES = [
  { id: 1, name: 'Gate 1 - North Main', wait: 3, queue: 'short', services: ['Entry', 'Security', 'Info Desk'] },
  { id: 2, name: 'Gate 2 - North East', wait: 7, queue: 'medium', services: ['Entry', 'Security', 'Accessible'] },
  { id: 3, name: 'Gate 3 - East', wait: 12, queue: 'long', services: ['Entry', 'Security', 'Souvenir'] },
  { id: 4, name: 'Gate 4 - South East', wait: 5, queue: 'short', services: ['Entry', 'Security'] },
  { id: 5, name: 'Gate 5 - South Main', wait: 22, queue: 'critical', services: ['Entry', 'Security', 'VIP'] },
  { id: 6, name: 'Gate 6 - South West', wait: 6, queue: 'medium', services: ['Entry', 'Security', 'Family'] },
  { id: 7, name: 'Gate 7 - West', wait: 2, queue: 'short', services: ['Entry', 'Security'] },
  { id: 8, name: 'Gate 8 - North West', wait: 8, queue: 'medium', services: ['Entry', 'Security', 'Accessible'] },
];

/**
 * Crowd zone simulation data. Each zone has a (x,y) position in % coordinates
 * relative to the canvas, a base crowd density, and a heat-blob radius.
 */
export const ZONE_DATA = [
  { id: 'gate1', name: 'Gate 1 - North', x: 50, y: 10, base: 75, r: 40 },
  { id: 'gate2', name: 'Gate 2 - NE', x: 80, y: 25, base: 55, r: 35 },
  { id: 'gate3', name: 'Gate 3 - East', x: 90, y: 50, base: 60, r: 38 },
  { id: 'gate4', name: 'Gate 4 - SE', x: 80, y: 75, base: 45, r: 32 },
  { id: 'gate5', name: 'Gate 5 - South', x: 50, y: 90, base: 89, r: 45 },
  { id: 'gate6', name: 'Gate 6 - SW', x: 20, y: 75, base: 50, r: 33 },
  { id: 'gate7', name: 'Gate 7 - West', x: 10, y: 50, base: 40, r: 30 },
  { id: 'gate8', name: 'Gate 8 - NW', x: 20, y: 25, base: 65, r: 37 },
  { id: 'pitch', name: 'Pitch Level', x: 50, y: 50, base: 95, r: 55 },
  { id: 'concessions', name: 'Concession Area', x: 35, y: 60, base: 70, r: 40 },
  { id: 'food', name: 'Food Court', x: 65, y: 40, base: 68, r: 38 },
  { id: 'parking', name: 'Main Parking', x: 50, y: 0, base: 55, r: 50 },
];

/**
 * Shuttle routes with real-time occupancy data.
 */
export const SHUTTLES = [
  { id: 1, name: 'Express - Downtown', icon: '🚌', color: '#3b82f6', stops: ['MetLife Stadium', 'Secaucus Junction', 'Penn Station NYC'], freq: 15, nextIn: 8, cap: 55, occ: 42 },
  { id: 2, name: 'Airport Express', icon: '✈️', color: '#8b5cf6', stops: ['MetLife Stadium', 'Newark Airport', 'JFK Terminal 4'], freq: 30, nextIn: 22, cap: 44, occ: 38 },
  { id: 3, name: 'North Shuttle', icon: '🚐', color: '#10b981', stops: ['MetLife Stadium', 'North Lot A', 'North Lot B'], freq: 10, nextIn: 3, cap: 25, occ: 12 },
  { id: 4, name: 'Hotel Circuit', icon: '🏨', color: '#f59e0b', stops: ['MetLife Stadium', 'Marriott Meadowlands', 'Hilton East Rutherford'], freq: 20, nextIn: 14, cap: 44, occ: 31 },
  { id: 5, name: 'Fan Zone Link', icon: '⚽', color: '#ef4444', stops: ['MetLife Stadium', 'FIFA Fan Festival', 'Times Square'], freq: 25, nextIn: 19, cap: 55, occ: 55 },
];

/** Metro / bus lines serving the stadium. */
export const METRO = [
  { id: 'njtransit', name: 'NJ Transit - Meadowlands Line', color: '#ef4444', next: 6, dir: 'From Penn Station', plat: 'Platform 1, 2' },
  { id: 'bus139', name: 'NJ Transit Bus 139', color: '#3b82f6', next: 12, dir: 'From Port Authority', plat: 'Bus Bay 4' },
  { id: 'bus190', name: 'NJ Transit Bus 190', color: '#10b981', next: 18, dir: 'From Secaucus Junction', plat: 'Bus Bay 7' },
];

/** Parking lots with real-time availability. */
export const PARKING = [
  { id: 'A', name: 'Lot A - North', total: 2500, avail: 847, dist: '5 min', price: '$45', accessible: 80 },
  { id: 'B', name: 'Lot B - North', total: 2000, avail: 312, dist: '8 min', price: '$45', accessible: 60 },
  { id: 'C', name: 'Lot C - South', total: 3000, avail: 1205, dist: '10 min', price: '$40', accessible: 100 },
  { id: 'D', name: 'Lot D - East', total: 1500, avail: 0, dist: '12 min', price: '$40', accessible: 40 },
  { id: 'VIP', name: 'VIP Premium', total: 500, avail: 73, dist: '2 min', price: '$120', accessible: 50 },
];

/** Rotating sustainability tips shown in the Eco Tracker panel. */
export const ECO_TIPS = [
  '♻️ Use labeled recycling stations at every gate entrance.',
  '🚆 You saved ~2.5kg CO₂ by taking public transit today!',
  '💧 Refill stations at all concourse areas — bring your bottle.',
  '🥗 Try plant-based menu at Section G — great taste, greener planet!',
  '🔋 EV charging available at Parking Lot A (42 stations).',
  '📱 Go paperless — use your digital ticket to reduce paper waste.',
  '🌡️ Smart HVAC optimizes energy use in real-time across the stadium.',
  '🚶 Walking routes from transit are scenic and emission-free!',
];

/** Eco initiative cards with progress and targets. */
export const ECO_INITIATIVES = [
  { id: 'solar', icon: '☀️', title: 'Solar Power Grid', val: '8.4 MWh', desc: '12,000 solar panels on stadium roof', prog: 65, target: '15 MWh/day', color: '#f59e0b' },
  { id: 'waste', icon: '♻️', title: 'Zero Waste Program', val: '78% Recycled', desc: 'Smart sorting bins + fan awareness', prog: 78, target: '90% target', color: '#10b981' },
  { id: 'water', icon: '💧', title: 'Water Conservation', val: '23,400 L', desc: 'Greywater recycling saves water daily', prog: 60, target: '40,000 L/day', color: '#3b82f6' },
  { id: 'transport', icon: '🚆', title: 'Green Transport', val: '42% via transit', desc: 'Transit incentives reduce vehicle emissions', prog: 42, target: '60% target', color: '#8b5cf6' },
  { id: 'food', icon: '🥗', title: 'Sustainable Food', val: '35% plant-based', desc: 'Plant-based options reduce food carbon', prog: 35, target: '50% target', color: '#ec4899' },
  { id: 'carbon', icon: '🌳', title: 'Carbon Offset', val: '142.5t CO₂', desc: 'Equivalent to preserving 284 trees', prog: 55, target: '260t target', color: '#22c55e' },
];

/** Accessibility feature cards. */
export const ACC_FEATURES = [
  { icon: '♿', title: 'Wheelchair Access', desc: 'Designated viewing areas with unobstructed sightlines', locs: ['Section H', 'Sections 100-105', 'Sections 200-205'], color: '#3b82f6' },
  { icon: '👂', title: 'Hearing Assistance', desc: 'Hearing loops, sign language interpreters, visual alerts', locs: ['All Premium Areas', 'Gates 1, 3, 5'], color: '#8b5cf6' },
  { icon: '👁️', title: 'Visual Assistance', desc: 'Audio description, braille maps, guide dog relief areas', locs: ['On Request', 'Gates 2, 6'], color: '#ec4899' },
  { icon: '🚶', title: 'Mobility Support', desc: 'Accessible pathways, elevator priority, companion seating', locs: ['All Gates', 'Concourse Level'], color: '#10b981' },
  { icon: '🧠', title: 'Sensory Support', desc: 'Quiet zones, sensory kits, reduced stimulation areas', locs: ['Section H Lounge', 'First Aid Rooms'], color: '#f59e0b' },
  { icon: '👨‍👩‍👧', title: 'Family Assistance', desc: 'Family restrooms, baby changing, lost child protocol', locs: ['Gates 2, 4, 6, 8', 'Main Concourse'], color: '#f97316' },
];

/** Accessible routes from various entry points. */
export const ACC_ROUTES = [
  {
    from: 'Main Entrance',
    to: 'Section H Wheelchair',
    steps: ['Enter Gate 2', 'Turn left at security', 'Follow blue accessibility corridor', 'Take elevator to Level 1', 'Section H is clearly marked'],
    time: '8 min',
  },
  {
    from: 'Parking Lot A',
    to: 'Accessible Seating',
    steps: ['Use accessible parking spaces (P1)', 'Follow orange accessibility markers', 'Board accessible shuttle (every 10 min)', 'Enter via Gate 8 (accessible)'],
    time: '12 min',
  },
  {
    from: 'Metro Station',
    to: 'Stadium Entrance',
    steps: ['Exit Metro Line 3 at Stadium stop', 'Board accessible transit bridge', 'Follow tactile guide paths to Gate 2', 'Use dedicated accessible entry lane'],
    time: '6 min',
  },
];

/**
 * Persona-aware chat suggestion chips.
 * @type {Record<string, string[]>}
 */
export const PERSONA_SUGGESTIONS = {
  fan: ['🗺️ How do I get to Section 114?', '🍕 Where can I find food near Gate 3?', '🚌 When is the next shuttle downtown?', '♿ Where are accessible entrances?', '⚽ What time does the match start?', '🚻 Where is the nearest restroom?'],
  organizer: ['📊 Crowd density at Gate 2', '🚨 Current security alerts', '👥 Staff deployment status', '⚡ Emergency protocol Section B', '📈 Capacity utilization report', '🔄 Vendor coordination update'],
  volunteer: ['📍 Where is my station?', '🌐 How to help non-English speakers?', '🏥 How to get first aid?', '📋 My shift responsibilities', '🔗 How to contact security?', '♿ Accessibility assistance protocol'],
  staff: ['🔧 Report maintenance - Gate 4', '💡 Utility monitoring', '🚪 Access control override', '📦 Vendor delivery coordination', '🌡️ HVAC status check', '🔋 Power backup status'],
};

/**
 * System prompts for each AI persona.
 * @type {Record<string, string>}
 */
export const PERSONA_PROMPTS = {
  fan: `You are StadiumIQ, an intelligent FIFA World Cup 2026 assistant for fans. Help fans navigate stadiums, find seats, locate food/beverages, restrooms, first aid, fan zones, and transportation. Be friendly, enthusiastic about football, and use emojis where appropriate.`,
  organizer: `You are StadiumIQ, an operational intelligence assistant for FIFA World Cup 2026 organizers. Help manage stadium capacity, crowd flow, security alerts, vendor coordination, event scheduling, and emergency protocols. Be concise and professional.`,
  volunteer: `You are StadiumIQ, a smart support assistant for FIFA World Cup 2026 volunteers. Help volunteers understand their roles, locate stations, communicate with staff, handle fan queries, and manage multilingual interactions. Be clear and step-by-step.`,
  staff: `You are StadiumIQ, an operational assistant for FIFA World Cup 2026 venue staff. Assist with maintenance requests, facility management, access control, utility monitoring, and vendor logistics. Be technical and solution-oriented.`,
};
