## MerchMate v1.0.5 - Buyer Margin Analyzer & Styled Exports 📊

### 🆕 New Features

#### 🎯 Buyer-Centric Margin Analyzer
Analyze buyer price targets and profit feasibility:
- **Target Price Analysis** - Enter buyer's target FOB
- **Feasibility Score** - Go/Caution/No-Go indicators
- **FOB Import** - Pull existing costing data from history
- **Margin Visualization** - Profit vs cost breakdown
- **Two-Tab Results** - Margin analysis + Cost breakdown

#### 📈 Professional Styled Excel Exports
All Excel exports now beautifully formatted:
- **FOB Costing** - Blue theme with professional tables
- **Fabric Analysis** - Green theme with efficiency metrics
- **Margin Analysis** - Purple theme with feasibility badges
- Color-coded headers, visible borders, font hierarchy
- Alternating row colors, highlighted summaries

### ✨ Improvements
- ✅ Streamlined UI - Removed feature bloat
- ✅ FOB history import for quick analysis
- ✅ Better export formatting across all modules
- ✅ Cleaner navigation flow

### 🔧 Technical Changes
```
+ BuyerAnalyzerInputScreen.js
+ BuyerAnalyzerResultScreen.js
+ marginAnalyzer.js
~ exporters.js (styled HTML exports)
~ App.js (new routes)
~ LandingScreen.js (new card)
~ HistoryScreen.js (import mode)
- ScenarioSimulatorScreen.js (removed)
```

### 📊 Feasibility Ratings
| Score | Status | Action |
|-------|--------|--------|
| 70-100 | ✅ Excellent | Go ahead |
| 40-69 | ⚠️ Acceptable | Review costs |
| 0-39 | ❌ Not Viable | Renegotiate |

### 📲 Installation
```bash
cd frontend
npm install
npx expo start
```

**APK Build**: [Download from EAS](https://expo.dev/accounts/shahriartamim2/projects/merchmate/builds/)

---
**Full Changelog**: v1.0.4...v1.0.5
