# Update Notification System - Setup Guide

## Overview
MerchMate now includes an automated update notification system that checks for new versions from GitHub Releases and notifies users with a dismissible banner.

## System Components

### 1. **Version Configuration** (`frontend/src/utils/versionConfig.js`)
- Centralized version management
- Current version: **1.0.5**
- GitHub repository configuration
- Update check frequency: 24 hours

### 2. **Update Checker Service** (`frontend/src/utils/updateChecker.js`)
- Checks GitHub Releases API for latest version
- Compares semantic versions
- Manages dismissed updates
- Handles update check intervals

### 3. **Update Notification Banner** (`frontend/src/components/UpdateNotificationBanner.js`)
- Dismissible green banner
- Shows when new version is available
- "What's New" button to view release notes
- "Download Update" button to open download URL

## Setup Instructions

### Option A: Using GitHub Releases (Recommended)

#### Step 1: Create a GitHub Release
1. Go to your GitHub repository: https://github.com/abdnoman001/Merch-Mate
2. Click on "Releases" (right sidebar)
3. Click "Draft a new release" or "Create a new release"

#### Step 2: Configure Release
Fill in the release form:
- **Tag version**: `v1.0.6` (or next version number)
- **Release title**: `MerchMate v1.0.6 - Brief Description`
- **Description**: Add release notes describing what's new
  ```markdown
  ## What's New in v1.0.6
  
  ### ✨ Enhancements
  - Excel exports now use .xlsx format for better mobile compatibility
  - Added automatic update notifications
  - Fixed version display inconsistencies
  
  ### 🐛 Bug Fixes
  - Fixed Excel file opening issues on mobile devices
  
  ### 📦 Downloads
  Download the appropriate file for your platform below.
  ```

#### Step 3: Upload Build Files
1. Build your Android APK:
   ```bash
   cd frontend
   eas build --platform android --profile production
   ```
2. Download the built APK from EAS
3. Attach the APK file to the release
4. Name it something clear like: `MerchMate-v1.0.6.apk`

#### Step 4: Publish Release
1. Check "Set as the latest release"
2. Click "Publish release"

### Option B: Using Custom version.json File

If you prefer to host a simple JSON file instead of using GitHub Releases API:

#### Step 1: Create version.json
Create a file named `version.json` in the root of your repository:

```json
{
  "version": "1.0.6",
  "versionName": "MerchMate v1.0.6",
  "releaseNotes": "- Excel exports now compatible with mobile devices\n- Added automatic update notifications\n- Various bug fixes and improvements",
  "downloadUrl": "https://github.com/abdnoman001/Merch-Mate/releases/download/v1.0.6/MerchMate-v1.0.6.apk",
  "releaseDate": "2026-01-10",
  "minimumVersion": "1.0.0"
}
```

#### Step 2: Update versionConfig.js
Uncomment the VERSION_JSON_URL in `frontend/src/utils/versionConfig.js`:

```javascript
export const UPDATE_CHECK_CONFIG = {
  // Comment out GitHub Releases API
  // GITHUB_RELEASES_API: `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest`,
  
  // Use custom version.json file
  VERSION_JSON_URL: 'https://raw.githubusercontent.com/abdnoman001/Merch-Mate/main/version.json',
  
  CHECK_INTERVAL: 86400000,
  LAST_CHECK_KEY: '@last_update_check',
  DISMISSED_UPDATES_KEY: '@dismissed_updates',
};
```

#### Step 3: Update updateChecker.js
Modify the `checkForUpdates()` function to fetch from VERSION_JSON_URL instead of GITHUB_RELEASES_API.

## How It Works

### User Experience Flow
1. User opens the app (LandingScreen)
2. Update checker runs in the background (max once per 24 hours)
3. If new version is available:
   - Green banner appears at top of landing screen
   - User can click "What's New" to see release notes
   - User can click "Download Update" to open download link
   - User can dismiss the banner (won't show again for this version)
4. If no update or check was recent, nothing shows

### Update Check Frequency
- **First launch**: Always checks
- **Subsequent launches**: Checks if 24+ hours since last check
- **Manual check**: Can force check by clearing app data or adding a "Check for Updates" button

### Version Comparison Logic
The system uses semantic versioning (major.minor.patch):
- Compares each part numerically
- Example: 1.0.6 > 1.0.5 > 1.0.4
- Handles versions with or without 'v' prefix

## Testing the Update System

### Test 1: Simulate New Version Available
1. In `versionConfig.js`, temporarily change APP_VERSION to "1.0.4"
2. Create a GitHub Release with version "1.0.5"
3. Launch the app
4. You should see the update banner

### Test 2: Dismiss Update
1. When banner appears, click the X button
2. Close and reopen the app
3. Banner should not appear for same version
4. Create a new release (v1.0.6)
5. Banner should appear again for new version

### Test 3: 24-Hour Check Interval
1. Launch app (first check happens)
2. Close and reopen immediately
3. No network request should be made (check logs)
4. Clear AsyncStorage or wait 24 hours
5. Next launch will check again

## Maintenance Checklist

### When Releasing a New Version

1. **Update Version in Code**
   - Edit `frontend/package.json`: Update `version` field
   - The app will auto-read from `versionConfig.js` (already set to 1.0.5)

2. **Build the App**
   ```bash
   cd frontend
   # For Android
   eas build --platform android --profile production
   
   # For iOS
   eas build --platform ios --profile production
   ```

3. **Create GitHub Release**
   - Tag: `v1.0.X` (next version)
   - Title: Clear, descriptive name
   - Description: Detailed release notes
   - Upload: Attach APK/IPA files

4. **Test the Update Flow**
   - Install current version on test device
   - Publish new release
   - Open app and verify banner appears
   - Test download link works

5. **Announce Update**
   - Post on social media
   - Email existing users
   - Update website/documentation

## Troubleshooting

### Banner Not Showing
- Check network connectivity
- Verify GitHub release is published (not draft)
- Check if version in release is higher than APP_VERSION
- Clear AsyncStorage: `@last_update_check` and `@dismissed_updates`
- Check console logs for errors

### Download Link Not Working
- Ensure APK is properly attached to GitHub release
- Verify the asset is public and downloadable
- Check if download URL in release data is correct
- Test URL in browser first

### Version Comparison Issues
- Ensure versions follow semantic versioning (X.Y.Z)
- Don't use extra text in version strings
- Remove 'v' prefix from version in code (handled automatically)

## Advanced Configuration

### Change Check Frequency
Edit `UPDATE_CHECK_CONFIG.CHECK_INTERVAL` in `versionConfig.js`:
- 1 hour: `3600000`
- 12 hours: `43200000`
- 24 hours: `86400000` (default)
- 1 week: `604800000`

### Add Manual "Check for Updates" Button
```javascript
import { forceCheckForUpdates } from '../utils/updateChecker';

const handleCheckUpdates = async () => {
  const update = await forceCheckForUpdates();
  if (update && update.hasUpdate) {
    Alert.alert('Update Available', `Version ${update.latestVersion} is available!`);
  } else {
    Alert.alert('Up to Date', 'You are using the latest version.');
  }
};
```

### Customize Banner Appearance
Edit `UpdateNotificationBanner.js` styles to change:
- Colors
- Position
- Animation
- Button styles

## Security Considerations

- GitHub Releases API requires no authentication for public repos
- Download URLs are direct links from GitHub's CDN
- App doesn't auto-download or auto-install (user action required)
- Version checking happens over HTTPS
- No sensitive data transmitted

## Future Enhancements

Potential improvements:
1. **In-app update**: Directly download and prompt install (Android)
2. **Force update**: Block app use until minimum version installed
3. **Phased rollout**: Show update to percentage of users
4. **Update categories**: Critical, recommended, optional
5. **Regional releases**: Different updates per region
6. **Analytics**: Track update adoption rates

## Support

For issues or questions:
- **Email**: abdnoman001@gmail.com
- **GitHub Issues**: https://github.com/abdnoman001/Merch-Mate/issues
- **Bug Reports**: Use the "Report Issue" option in the app menu

---

**Last Updated**: January 10, 2026  
**Document Version**: 1.0  
**MerchMate Version**: 1.0.5
