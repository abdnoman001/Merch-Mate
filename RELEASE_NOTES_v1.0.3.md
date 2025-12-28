# MerchMate v1.0.3 - Per Dozen Costing & Enhanced Features 🎯

## 🆕 Major Changes

### 1. **Per Dozen Costing System**
- All cost inputs now display in **per dozen** ($/dz) instead of per piece
- More industry-standard for garment costing
- Automatic conversion maintains calculation accuracy
- Both per dozen and per piece values shown in results

### 2. **Enhanced Status Bar**
- Dark status bar for better visibility
- Professional appearance across all screens
- Better contrast with app content

### 3. **Advanced History Management**
- ✅ Individual delete button (🗑️) for each item
- ✅ Multi-select mode for bulk deletion
- ✅ Delete all option with confirmation
- ✅ Long-press to enter selection mode
- ✅ Select/Cancel toolbar

### 4. **Full Edit Capability**
- Edit button (✏️) now opens complete input form
- Change all garment parameters, not just profit margin
- Pre-filled with existing data for easy modification
- Seamlessly navigate back after editing

### 5. **Improved Export Features**
- Excel shows both **per piece** AND **per dozen** columns
- PDF displays both values side-by-side
- Better formatted tables and layouts
- More professional appearance

### 6. **Enhanced Result Screen UI**
- Icon-based action buttons for better UX:
  - 📊 **Excel** - Download spreadsheet
  - 📄 **PDF** - Generate receipt
  - 💬 **Quote** - Share summary
- All three buttons aligned in single row
- Better visual hierarchy
- Improved touch targets

## 🔧 Technical Improvements

### Calculation System
- ✅ All calculations verified for accuracy
- ✅ Proper handling of per dozen to per piece conversions
- ✅ Backward compatibility with old data
- ✅ Fallback calculations for legacy history items
- ✅ T-Shirt (Knit) formula verified
- ✅ Woven Shirt formula verified
- ✅ Denim Jeans formula verified

### Data Flow
```
Input Layer (UI) → Per Dozen Display ($/dz)
         ↓
    Divide by 12
         ↓
Storage Layer → Per Piece Values ($/pc)
         ↓
Calculation Layer → Both Values Generated
         ↓
Display Layer → Per Dozen (Primary) + Per Piece (Secondary)
```

## 📊 Updated Cost Labels

All cost input labels updated from **($/pc)** to **($/dz)**:

**Other Costs (per Dozen)**
- AOP/Print ($/dz)
- Accessories ($/dz)
- CM Cost ($/dz)

**FOB-Essential Costs (per Dozen)**
- Washing ($/dz)
- Commercial ($/dz)
- Testing ($/dz)

## 🐛 Bug Fixes

- ✅ Fixed TypeError when selecting old history items
- ✅ Resolved undefined property errors for `final_fob_per_doz`
- ✅ Proper handling of legacy data without per dozen fields
- ✅ Correct display of costs in all export formats
- ✅ Edit form now properly converts per piece to per dozen for display

## 📱 Feature Status

| Feature | Status |
|---------|--------|
| T-Shirt (Knit) Calculation | ✅ Verified |
| Woven Shirt Calculation | ✅ Verified |
| Denim Jeans Calculation | ✅ Verified |
| Per Dozen Input/Display | ✅ Working |
| Per Piece Calculations | ✅ Accurate |
| Excel Export | ✅ Both Values |
| PDF Export | ✅ Both Values |
| History Edit | ✅ Full Form |
| Delete Functions | ✅ All Options |
| Status Bar | ✅ Dark Mode |
| Result UI | ✅ Icons Added |

## 🔄 Migration Notes

- Old history items automatically converted
- Per piece values multiplied by 12 for display
- No data loss from previous versions
- Seamless upgrade experience
- **Backward Compatible** with v1.0.2

## 📦 Dependencies

No new dependencies added. Current versions:
```json
{
  "@expo/ngrok": "^4.1.3",
  "@react-native-async-storage/async-storage": "^2.2.0",
  "@react-navigation/native": "^7.1.25",
  "@react-navigation/stack": "^7.6.12",
  "axios": "^1.13.2",
  "expo": "~54.0.29",
  "expo-print": "^13.0.0",
  "expo-sharing": "^13.0.0",
  "expo-status-bar": "~3.0.9",
  "react": "19.1.0",
  "react-native": "0.81.5",
  "react-native-gesture-handler": "2.28.0",
  "react-native-safe-area-context": "^5.6.2",
  "react-native-screens": "4.16.0",
  "xlsx": "^0.18.5"
}
```

## 🚀 Installation

```bash
cd frontend
npm install
npx expo start
```

For Android build:
```bash
cd frontend
eas build --platform android --profile production
```

## 📝 Breaking Changes

**None** - Fully backward compatible with v1.0.2

## 🎯 What's New in Detail

### Per Dozen Display
Users now enter costs in per dozen format, which is standard in the garment industry. The app automatically converts these to per piece for calculations, then displays both values in results.

**Example:**
- User enters: Accessories = $2.04/dz
- App stores: $0.17/pc (2.04 ÷ 12)
- Result shows: $2.04/dz ($0.17/pc)

### History Management
Enhanced history screen with professional deletion options:
- Tap item to view details
- Tap ✏️ to edit (opens full input form)
- Tap 🗑️ to delete single item
- Long-press to enter multi-select mode
- Select multiple items and delete at once
- "Delete All" button to clear entire history

### Export Improvements
Both Excel and PDF exports now show comprehensive data:
- **Excel**: Separate columns for per piece and per dozen
- **PDF**: Side-by-side display of both values
- Professional formatting with proper currency symbols
- Clear labeling of cost breakdown

## 📸 UI Improvements

### Before → After
- Text buttons → Icon buttons (📊 📄 💬)
- Separate rows → Single aligned row
- Plain delete → Multiple delete options
- Limited edit → Full form edit
- Light status bar → Dark status bar

## 🔧 Files Modified

- `frontend/App.js` - Added status bar
- `frontend/src/utils/calculations.js` - Per dozen support & delete functions
- `frontend/src/screens/HistoryScreen.js` - Enhanced UI & delete options
- `frontend/src/screens/ResultScreen.js` - Icon buttons & per dozen display
- `frontend/src/screens/InputScreen.js` - Per dozen labels & edit support
- `frontend/src/utils/exporters.js` - Both per dozen and per piece exports
- `frontend/package.json` - Version bump
- `frontend/app.json` - Version bump

## 📄 License

MIT License - See LICENSE file for details

---

**Full Changelog**: v1.0.2...v1.0.3
**Download**: [Releases Page](../../releases/tag/v1.0.3)
