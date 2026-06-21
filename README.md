# 🛰️ PrithviTwin
### AI-Powered Climate Digital Twin & Explainable Decision-Support System
**PS5 — Bharatiya Antariksh Hackathon 2026 | ISRO**

---

## 📌 Project Overview
PrithviTwin is a district-level interactive decision-support system built using IMD and ISRO satellite data to simulate and visualize climate stability across India, with a deep-dive pilot region for **Karnataka**. 

It uses real-time parametric what-if simulation to recompute Climate Stability Scores (0–100) dynamically using z-scores, Standardised Precipitation Index (SPI) proxies, flood/drought risk projections, and monsoon spell classifications based on evolution patterns.

---

## 🎨 Core Features

1. **🌏 National Climate Index Map (India Home)**
   * interactive India map showing state-level stability summaries.
   * Color-coded score bands (Stable, Moderate, Elevated, Critical) with a satellite mission-control HUD overlay.

2. **📍 Karnataka District Twin (Karnataka PoC)**
   * High-resolution, actual district-boundary mapping with interactive pan/zoom.
   * **Monsoon Spell Tracker**: Evaluates active/break monsoon spell durations based on climatological averages.
   * **What-If Simulator**: Allows overrides of Rainfall (%), Temperature offset (°C), Dry days, Soil moisture, and active/break spells.
   * **Forensic Report**: Generates structured, evidence-based reports validating the model against the historic **2019 North Karnataka Floods (Belagavi)**.

3. **🧠 Explainable AI (XAI) & Methodology**
   * Clear visual flows explaining the pipeline: Input Overrides ➡️ Engine (LSTM spell model, Isolation Forest, JSD shift) ➡️ Score.

4. **📄 Research Paper Integration**
   * Visualizes long-term summer monsoon spell changes citing *Subrahmanyam, K.V. et al. (2023)* showing active spell compression and break spell expansion.

---

## 🛠️ Technology Stack

| Layer | Technology | Description |
|---|---|---|
| **Frontend** | **Next.js 14** (App Router) + **Tailwind CSS** | Static single-page application router, styled with deep-space navy telemetry design tokens. |
| **Mapping** | **react-simple-maps** (D3-geo / TopoJSON) | Client-side map rendering using local high-resolution state/district boundary GeoJSON files. |
| **Charts** | **Recharts** | Interactive timeline spell-line graphs. |
| **Backend** | **Python (FastAPI)** | Serves seed district tables + recompute JSON endpoints matching frontend mathematical engines. |

---

## 🚀 How to Run Locally

### 🖥️ Frontend (Next.js)

1. Navigate to the root directory:
   ```bash
   cd /Users/pradyumnakh/ISRO
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Run the Next.js development server:
   ```bash
   npm run dev
   ```
4. Access the web app at **[http://localhost:3000](http://localhost:3000)**.

---

### ⚙️ Backend API (FastAPI)

1. Navigate to the backend directory:
   ```bash
   cd /Users/pradyumnakh/ISRO/backend
   ```
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Run the FastAPI server:
   ```bash
   python3 -m uvicorn main:app --port 8000 --reload
   ```
4. View the Swagger API documentation at **[http://localhost:8000/docs](http://localhost:8000/docs)**.

---

## 📂 Project Structure

```
/Users/pradyumnakh/ISRO/
│
├── app/                  # Next.js App Router routes
│   ├── page.tsx          # India Map (Home)
│   ├── karnataka/        # Karnataka PoC Deep Dive
│   ├── xai/              # XAI Engine Explanations
│   └── research/         # Research Paper Citations
│
├── components/           # Reusable UI component modules
│   ├── GlassPanel.tsx    # Backdrop-blur container panels
│   ├── OrbitalRing.tsx   # Score visualization ring
│   ├── WhatIfSimulator.tsx # Parametric overrides panel
│   └── ForensicReport.tsx # Historic validation document modal
│
├── public/               # Local boundary datasets
│   ├── india-states.geojson
│   └── karnataka-districts.geojson
│
└── backend/              # FastAPI Python backend
    ├── main.py           # API endpoints
    ├── climate_engine.py # Python math port matching frontend
    └── seed_data.py      # Synced district/state lists
```
