# 🏝️ CarbonTwin — Your Lifestyle, Visualized

**CarbonTwin** is an interactive carbon footprint tracker and simulator that visualizes daily lifestyle choices as a living digital twin island ecosystem. Rather than displaying dry numbers and complex spreadsheets, CarbonTwin gamifies environmental awareness, mapping your transportation, food, energy, and shopping data onto an HTML5 Canvas-based island that reacts to your ecological footprint in real time.

---

## 🌟 Core Features

*   **Dynamic Island Canvas (Digital Twin)**: 
    *   A beautiful, animated Ghibli-esque island that evolves dynamically based on your carbon footprint.
    *   **Pristine Actions**: Log green choices to sprout new trees, bloom colorful flowers, and trigger gold/green sparkle particles.
    *   **Heavy Footprint**: Log high-emission choices to generate smoke particles, murky water, and semi-transparent smog overlays.
    *   Twinkling stars at night, floating clouds, and a day/night arc that updates in real time.
*   **Habitat Simulator**:
    *   An interactive sandbox panel in the main dashboard where you can manually unlock and adjust the time of day, simulate wind speeds (swaying vegetation), and toggle the rendering of a digital twin modern Eco-Cottage equipped with solar panels.
*   **Frictionless Quick Logging**:
    *   Categorized logging panel for **Transport** (car, transit, air), **Food** (beef, chicken, vegetarian, vegan), **Energy** (AC/heating hours, shower time, laundry), and **Shopping** (clothing, electronics, imports).
*   **Personalized Carbon Insights**:
    *   Automatic rule-based analytics highlighting highest-impact footprint drivers and recommending specific, actionable daily swaps.
*   **AI-Powered Weekly Stories**:
    *   Integrates with **Google Gemini 1.5 Flash** to draft custom, poetic weekly narratives summarizing how the user's choices impacted their digital twin ecosystem.
*   **Rigorous Footprint Science**:
    *   Footprint factors are verified against actual emission databases (IPCC, UK DEFRA, US EPA) and per-capita targets are contrasted against regional benchmarks (IEA per-capita estimates).

---

## 🛠️ Technology Stack

*   **Frontend**: React (v19) & Vite
*   **Styling**: Custom CSS (modern dark-mode glassmorphic theme)
*   **Visuals**: Vanilla HTML5 Canvas (60fps animation loops via `requestAnimationFrame`)
*   **AI Engine**: Official `@google/generative-ai` SDK calling the Gemini API

---

## 🚀 Quick Start

### 1. Clone & Install Dependencies
```bash
# Clone the repository
git clone https://github.com/rudrakshia30/carbon-emission-tracker.git
cd carbon-emission-tracker

# Install dependencies
npm install
```

### 2. Configure Gemini API Key
To enable the AI Weekly Story generation, you can configure your Gemini API Key in two ways:

*   **Environment Method**: Copy `.env.example` to `.env` and enter your key:
    ```env
    VITE_GEMINI_API_KEY=AIzaSyYourGeminiApiKeyHere
    ```
*   **UI Settings Method**: Run the app, click the **Dashboard** tab, scroll to the bottom of the page, click the `⚙️ Set Gemini API Key` button inside the story card, and paste your key.

### 3. Run the Development Server
```bash
npm run dev
```
Open **[http://localhost:5173/](http://localhost:5173/)** in your browser to view the application.

---

## 📚 Scientific Citations & Methodology

All emission calculations and benchmarks are backed by rigorous carbon methodologies:
*   **Transportation & Energy Factors**: Calculated based on the **UK DEFRA/DESNZ GHG Conversion Factors (2024)** and the **US EPA Greenhouse Gas Emission Factors Hub**.
*   **Dietary Impact & Food Offsets**: Factored from **Poore & Nemecek (Science 2018)** meta-analysis of food lifecycle assessments (LCA).
*   **National Benchmarks**: Daily averages and target thresholds are benchmarked using **IEA per-capita statistical databases**, contrasting high-income targets (22 kg/day) against India's national per-capita average baseline (~5.6 kg/day).
