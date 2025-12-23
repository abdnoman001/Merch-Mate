## MerchMate v1.1.0 - Professional Export Features 📊

### New Features

#### 🟢 Excel Export
Generate professional `.xlsx` files with:
- Color-coded headers and sections
- Formatted currency values
- Organized cost breakdown tables
- Highlighted final FOB price

#### 🔴 PDF Export
Create receipt-style PDF documents with:
- MerchMate branding
- Complete cost breakdown
- Buyer and style information
- Professional table layout

#### 🔵 Enhanced Sharing
Three export options on Result Screen:
- **Share Excel** - Detailed spreadsheet
- **Share/Download PDF** - Professional receipt
- **Share Quote** - Quick text summary

### Improvements
- ✅ Buyer information in all export formats
- ✅ Improved input field alignment
- ✅ Better error handling

### Dependencies
```json
"expo-print": "^13.0.0",
"expo-sharing": "^13.0.0",
"xlsx": "^0.18.5"
```

### Installation
Download the APK from the build link or install via:
```bash
npm install
npx expo install expo-print expo-sharing
npm install xlsx
```

### Changes
- Added `frontend/src/utils/exporters.js` - Export utilities
- Updated `frontend/src/screens/ResultScreen.js` - New share buttons
- Updated `frontend/package.json` - New dependencies
- Updated `README.md` - Documentation

**APK Build**: https://expo.dev/accounts/shahriartamim2/projects/merchmate/builds/5d2bae18-e75e-4ac7-88a4-c0af40b4d531
