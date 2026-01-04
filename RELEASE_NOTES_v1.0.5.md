# MerchMate v1.0.5 - Buyer Margin Analyzer & Styled Exports 📊

## 🆕 Major New Features

### 1. **Buyer-Centric Cost & Margin Analyzer** 🎯
A powerful new module for analyzing buyer price targets and profit feasibility:

- **Target Price Analysis** - Enter buyer's target FOB to analyze margins
- **Feasibility Score** - Clear Go/Caution/No-Go indicators
- **FOB Sheet Import** - Pull existing FOB costing data directly from history
- **Detailed Cost Breakdown** - See exactly where money goes
- **Margin Visualization** - Understand profit vs cost distribution

#### New Screens Added:
- `BuyerAnalyzerInputScreen` - Enter buyer target and import FOB data
- `BuyerAnalyzerResultScreen` - View margin analysis with two tabs:
  - **Margin Tab** - Feasibility score, profit analysis, margin metrics
  - **Cost Tab** - Complete cost breakdown visualization

### 2. **Professional Styled Excel Exports** 📈
All Excel exports now feature professional formatting:

#### FOB Costing Excel:
- **Blue theme** (#007bff) matching app branding
- Colored table headers with white text
- Section headers in dark gray (#495057)
- Alternating row colors for readability
- Highlighted summary rows
- Final FOB price prominently styled
- Visible borders on all cells
- Professional font hierarchy (20px title → 12px data)

#### Fabric Analysis Excel:
- **Green theme** (#28a745) for fabric module
- Key metrics highlighted with light green background
- Color-coded efficiency metrics (red warning if waste >10%)
- Complete section breakdown with professional tables
- FOB impact section when applicable

#### Margin Analysis Excel:
- **Purple theme** (#6f42c1) for margin module
- Feasibility status with color-coded badge
- Profit/loss indicators in green/red
- Clear margin metrics presentation
- Cost breakdown with visual hierarchy

### 3. **Streamlined User Experience** ✨
- Removed feature bloat for cleaner interface
- Focused on core functionality
- Faster navigation between modules
- Simplified result screens

## 🔧 Technical Changes

### Files Added:
- `frontend/src/screens/BuyerAnalyzerInputScreen.js`
- `frontend/src/screens/BuyerAnalyzerResultScreen.js`
- `frontend/src/utils/marginAnalyzer.js`

### Files Modified:
- `frontend/src/utils/exporters.js` - Complete Excel export rewrite with HTML styling
- `frontend/App.js` - Added new routes for Margin Analyzer
- `frontend/src/screens/LandingScreen.js` - Added Margin Analyzer card
- `frontend/src/screens/HistoryScreen.js` - Added import mode for FOB data

### Export Technology:
- Changed from XLSX library cell arrays to HTML table format
- File extension changed from `.xlsx` to `.xls` for styling support
- Excel opens HTML-based .xls files with full formatting intact
- Supports colors, borders, fonts, and cell styling

## 📊 Margin Analyzer Features

### Input Options:
- Manual cost entry OR import from FOB history
- Buyer target price (per piece)
- Order quantity for total calculations
- Automatic data population from imported FOB

### Analysis Output:
- **Feasibility Score** - Visual indicator with status
- **Actual Margin** - Calculated profit percentage
- **Profit per Piece** - Dollar value breakdown
- **Total Order Profit** - Based on quantity
- **Cost vs Margin Split** - Visual breakdown
- **Detailed Cost Components** - Per piece and percentage

### Feasibility Ratings:
| Score | Status | Color | Description |
|-------|--------|-------|-------------|
| 70-100 | Excellent | Green | Highly profitable |
| 40-69 | Acceptable | Yellow | Proceed with caution |
| 0-39 | Not Viable | Red | Needs renegotiation |

## 🐛 Bug Fixes & Cleanup

- ✅ Removed unused Scenario Simulator feature
- ✅ Removed Insights tab (feature bloat)
- ✅ Cleaned up unused dependencies (@react-native-community/slider)
- ✅ Fixed navigation flow for FOB import
- ✅ Improved error handling in exports

## 📱 Navigation Flow

```
Landing Screen
    ├── FOB Costing
    │   └── Input → Result → Export
    ├── Fabric Analyzer
    │   └── Input → Result → Export
    └── Margin Analyzer (NEW)
        └── Input (with FOB Import) → Result → Export
```

## 🔄 Upgrade Notes

If upgrading from v1.0.4:
1. Run `npm install` to ensure all dependencies
2. The app will automatically include new features
3. All previous FOB history data can be imported to Margin Analyzer
4. Excel exports will now have professional styling

## 📲 Installation

### Download APK
Get the latest build from the releases page or use EAS Build:
```bash
eas build --platform android --profile preview
```

### For Developers
```bash
cd frontend
npm install
npx expo start
```

---

**Full Changelog**: v1.0.4...v1.0.5
**Download**: [Latest APK Build](https://expo.dev/accounts/shahriartamim2/projects/merchmate/builds/)
