# AI Model Integrations Design Spec

## Goal
Integrate the backend `AIEngine` (powered by NVIDIA NIM) natively into the Xiaoxiao Trading Bot Dashboard frontend, providing pervasive AI assistance without breaking the current workflow.

## 1. AI Copilot Sidebar (Global)
- **Concept:** A sliding panel accessible via a floating action button (bottom-right) across all tabs.
- **Functionality:** 
  - Chat interface to talk with the AI assistant.
  - Contextual awareness: Can analyze the current active symbol or market data.
- **Integration:** Calls `/api/ai/chat`.

## 2. Dedicated "AI Studio" Tab
- **Concept:** A top-level navigation tab alongside Dashboard, Strategy Builder, and Settings.
- **Functionality:**
  - Full-screen environment for deep AI interactions.
  - Market Analysis Panel (Calls `/api/ai/analyze`).
  - Strategy Generation Panel (Calls `/api/ai/suggest` and `/api/ai/generate`).
  - Ability to save generated strategies directly into the `StrategyManager`.

## 3. Contextual AI Buttons
- **Concept:** Inject AI interactions directly into existing components.
- **Components:**
  - **Charts:** "AI Analyze" button near the timeframe selector. Overlays an AI summary on the chart.
  - **Strategy Builder:** "AI Improve" button that sends the current code to `/api/ai/improve` and displays the suggested improvements.
  - **Backtester:** "AI Explain" button on backtest results to explain trades (calls `/api/ai/explain`).

## Architecture & Data Flow
- **Frontend:** Vanilla JS/HTML. We will add a new global CSS file or inline styles for the sidebar and the new AI Studio tab.
- **Backend:** Existing `server.py` endpoints (`/api/ai/*`) will be utilized. No major backend changes are required, just robust frontend fetch handlers.
- **Error Handling:** If `NVIDIA_API_KEY` is not set, the frontend will gracefully display a message asking the user to configure it in the `.env` file or Settings tab.
