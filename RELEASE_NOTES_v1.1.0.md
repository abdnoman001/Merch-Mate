# MerchMate v1.1.0 - Export Features Update

## 🎉 What's New

### Professional Excel Export
Generate beautifully formatted Excel spreadsheets with your FOB costing data:
- **Color-coded design** - Blue brand header, dark gray section headers
- **Professional formatting** - Currency symbols, proper alignment, borders
- **Organized sections** - Style Information, Cost Breakdown, Totals, Consumption Details
- **Highlighted totals** - Yellow background on Final FOB for emphasis
- **Smart alignment** - Text left-aligned, numbers right-aligned with currency format

### PDF Receipt Generation
Create professional receipt-style PDF documents:
- **Clean layout** - MerchMate branding with modern design
- **Complete information** - Style, Buyer, Garment Type, and Date
- **Cost table** - All components with prices in structured format
- **Summary totals** - Total Cost, Profit Margin, and Final FOB clearly displayed
- **Consumption details** - Fabric requirements included

### Enhanced Sharing Options
Three ways to share your costing data:
1. **Share Excel** - Professional spreadsheet for detailed analysis
2. **Share/Download PDF** - Receipt format for formal documentation
3. **Share Quote** - Quick text summary for messaging apps

### Additional Improvements
- ✅ **Buyer Information** - Now included in all export formats (Excel, PDF, Share Quote)
- ✅ **Improved Input Fields** - Better label styling and alignment in the "Other Costs" section
- ✅ **Better UX** - Clear error messages if sharing is unavailable

## 📦 New Dependencies
- `expo-print@^13.0.0` - PDF generation
- `expo-sharing@^13.0.0` - System share sheet integration
- `xlsx@^0.18.5` - Excel file generation

## 🛠️ Technical Details
- Fixed FileSystem API compatibility with Expo SDK 54
- Professional styling for Excel cells with colors, borders, and formatting
- Responsive PDF HTML layout with modern design
- Proper error handling for export operations

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
npx expo install expo-print expo-sharing
npm install xlsx
npx expo start
```

## 🐛 Bug Fixes
- Fixed input field alignment issues
- Corrected Excel row styling indices
- Resolved FileSystem encoding compatibility

## 🔄 Upgrade Notes
If upgrading from v1.0.1:
1. Run `npm install` to install new dependencies
2. The app will automatically use the new export features
3. All previous data and calculations remain intact

## 📸 Screenshots
Check the `/screenshots` folder for updated images showing the new export features.

## 🙏 Acknowledgments
Built with feedback from the garment manufacturing industry to provide the most useful export formats for merchandisers and buyers.

---

**Full Changelog**: v1.0.1...v1.1.0
**Download**: [Latest APK Build](https://expo.dev/accounts/shahriartamim2/projects/merchmate/builds/)
