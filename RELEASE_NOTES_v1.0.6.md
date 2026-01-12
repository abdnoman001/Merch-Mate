# MerchMate v1.0.6 - Mobile Excel & Update Notifications 📱

**Release Date:** January 12, 2026

## ✨ What's New

### 1. **Mobile-Compatible Excel Exports** 📊
- Excel exports now use `.xlsx` format for better mobile device compatibility
- Fixed issue where Excel files couldn't open on mobile devices
- Improved file structure for cross-platform compatibility

### 2. **Automatic Update Notifications** 🔔
- Added automatic update checking when the app launches
- Users receive notifications when new versions are available
- Easy one-tap download of updates directly from the app
- Non-intrusive notification banner that can be dismissed

### 3. **Version Display Improvements** 🏷️
- Fixed version display inconsistencies across all screens
- Centralized version configuration for easier maintenance
- Version now correctly shows in About screen and update checks

## 🐛 Bug Fixes

- Fixed version mismatch between app screens
- Resolved Excel export failures on certain mobile devices
- Improved error handling in export functions
- Fixed edge cases in update notification system

## 📊 Improvements

- Better file naming conventions for exported documents
- Enhanced Excel export structure for improved readability
- Optimized update check to avoid excessive API calls
- Cleaner notification UI that matches app theme

## 🔧 Technical Changes

### Files Added:
- `frontend/src/components/UpdateNotificationBanner.js` - Update notification UI component
- `frontend/src/utils/updateChecker.js` - Update checking logic
- `frontend/src/utils/versionConfig.js` - Centralized version configuration

### Files Modified:
- `frontend/src/utils/exportersXLSX.js` - Fixed mobile Excel compatibility
- `frontend/src/screens/AboutScreen.js` - Version display updates
- `frontend/src/screens/LandingScreen.js` - Added update notification banner
- `frontend/app.json` - Version bump to 1.0.6
- `frontend/package.json` - Version bump to 1.0.6
- `version.json` - Updated release information

## 📥 Download

- **Android APK:** [MerchMate-v1.0.6.apk](https://github.com/abdnoman001/Merch-Mate/releases/download/v1.0.6/MerchMate-v1.0.6.apk)

## 🔄 Upgrade Instructions

1. Download the latest APK from the link above
2. Install over your existing app (data will be preserved)
3. Or use the in-app update notification to download directly

---

**Full Changelog:** [v1.0.5...v1.0.6](https://github.com/abdnoman001/Merch-Mate/compare/v1.0.5...v1.0.6)
