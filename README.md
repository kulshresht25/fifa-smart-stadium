# StadiumIQ — FIFA World Cup 2026 Smart Stadium Intelligence Hub

<div align="center">
  <h3>⚽ AI-Powered Stadium Operations & Fan Experience Platform</h3>
  <p>Built for FIFA World Cup 2026 | Powered by Google Gemini AI</p>

  🌐 **Live Web URL:** **[https://fifa-smartstadium-2026.web.app](https://fifa-smartstadium-2026.web.app)**
  
  📁 **GitHub Code Repository:** **[https://github.com/kulshresht25/fifa-smart-stadium](https://github.com/kulshresht25/fifa-smart-stadium)**

  ![StadiumIQ](https://img.shields.io/badge/FIFA-World%20Cup%202026-blue?style=for-the-badge)
  ![AI](https://img.shields.io/badge/Powered%20by-Google%20Gemini-orange?style=for-the-badge)
  ![Accessibility](https://img.shields.io/badge/WCAG-2.1%20AA-green?style=for-the-badge)
  ![Languages](https://img.shields.io/badge/Languages-10%2B-purple?style=for-the-badge)
</div>

---

## 🎯 Project Vertical

**Smart Stadium Operations & Operational Intelligence**

StadiumIQ is a GenAI-enabled single-page application (SPA) designed to manage large crowd flows, optimize transportation routing, provide inclusive accessibility assistance, and enhance the matchday tournament experience for fans, organizers, volunteers, and staff.

---

## ✨ Features

### 🤖 AI Chat Assistant (Google Gemini)
*   **Persona-Aware Intelligence**: Switch between **Fan, Organizer, Volunteer, and Staff** modes. The AI matches its vocabulary, depth, and actions to your role.
*   **Gemini 2.0 API Key Support**: Works with standard `AIzaSy` keys and the **new Google AI Studio `AQ.` prefix format** keys.
*   **Voice Integration**: Voice recognition input and text-to-speech auto-speak functions.
*   **Offline/Demo Fallback**: Smart localized responses when running offline or without an API key.

### 👥 Live Crowd Management
*   **Canvas Crowd Heatmap**: Animated representation of live crowd densities across 12 main stadium zones.
*   **Predictive AI Analytics**: Under-3-second operational summaries identifying gates bottlenecks and concession stand queues.
*   **Operational Alerts**: Real-time alerts categorized by severity (Critical / Warning / Info).

### 🗺️ SVG Stadium Navigation
*   **Interactive Floor Plan**: Zoomable, clickable seating layout with instant gate wait times.
*   **Service Finder**: Category filters for food stalls, restrooms, first aid, ATMs, and accessible seating.
*   **Step-by-step Wayfinding**: Direct routing instructions based on entry gates.

### 🚌 Transportation Hub
*   **Shuttle Tracking**: Countdown times, route summaries, and occupancy capacity indicators.
*   **Public Transit**: Live countdown schedules for local trains and buses.
*   **Multi-modal Journey Planner**: Direct routes, costs, and travel notes from any starting location.

### ♿ Accessibility Companion
*   **Font Scaling & High Contrast**: Built-in WCAG 2.1 AA compliant styling adjustments.
*   **Accessible Routes**: Guided wheelchair pathways from transit/parking straight to designated seating.
*   **Assistance Dispatch**: One-click requests for escorts, sign-language interpreters, or medical assistance.

### 🌍 Sustainability Eco Tracker
*   **Live Renewable Energy Mix**: Real-time donut chart showing solar, wind, and grid power output.
*   **Metric Dashboard**: Live counter of CO₂ saved, plastic avoided, and trees preserved.
*   **Interactive Green Pledge**: Commitment tracker enabling fans to take eco pledges.

---

## 📁 Repository Structure
All core functionality is bundled into a single zero-dependency file (`index.html`) which can be opened directly in any browser by double-clicking it:

```
Smart Stadiums & Tournament Operations/
├── index.html                   # Self-contained SPA (contains HTML, inline CSS, and JS) — this is what's deployed
├── components/                  # Standalone modular reference implementation (see note below) — NOT loaded by index.html
├── utils/                       # Standalone modular reference implementation (see note below) — NOT loaded by index.html
├── styles/                      # Standalone CSS reference — NOT loaded by index.html
├── firebase.json                # Firebase Hosting configurations
├── .firebaserc                  # Firebase project aliases config
├── README.md                    # This documentation file
└── .gitignore                   # Git exclude rules
```

> **Note on `components/` and `utils/`:** these folders contain a modular rewrite of the same functionality that lives inline in `index.html`, kept as a reference for a future move away from the single-file architecture. They are **not** imported or executed by the deployed app — `index.html` is fully self-contained and is the only code that actually runs. If you're reviewing this repo, treat `index.html` as the source of truth.

---

## 🚀 How to Run & Test

### Option 1: Open the Live Link
Simply open **[https://fifa-smartstadium-2026.web.app](https://fifa-smartstadium-2026.web.app)** in your browser.

### Option 2: Run Locally (Double-click)
1. Clone the repository:
   ```bash
   git clone https://github.com/kulshresht25/fifa-smart-stadium.git
   cd fifa-smart-stadium
   ```
2. Double-click `index.html` to open it instantly in any modern web browser.

### Option 3: Local Server
If you prefer running a local server:
```bash
python -m http.server 8000
# Visit http://localhost:8000
```

---

## ⚙️ Setting Up Your API Key
1. Get a free API key at **[aistudio.google.com](https://aistudio.google.com/app/apikey)** (accepts keys starting with `AIzaSy` or `AQ.`).
2. Click **⚙️ Settings & API Key** in the sidebar.
3. Paste the key and click **Save Settings**.
4. The key is stored in your **browser's sessionStorage** (cleared automatically when you close the tab) and never sent to any external server other than Google's Gemini API endpoints.
