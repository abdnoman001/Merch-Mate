// Update Checker Service for MerchMate App
// Checks for new app versions from GitHub and manages update notifications

import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import {
    APP_VERSION,
    UPDATE_CHECK_CONFIG,
    compareVersions,
    shouldCheckForUpdates,
    updateLastCheckTime,
} from './versionConfig';

/**
 * Check for available app updates
 * @returns {Promise<Object|null>} Update information or null if no update available
 * Returns: { hasUpdate: boolean, latestVersion: string, downloadUrl: string, releaseNotes: string }
 */
export const checkForUpdates = async () => {
    try {
        // Check if we should perform update check based on time interval
        const shouldCheck = await shouldCheckForUpdates(AsyncStorage);

        if (!shouldCheck) {
            console.log('Skipping update check - checked recently');
            return null;
        }

        console.log('Checking for updates...');

        // Fetch latest release from GitHub
        const response = await axios.get(UPDATE_CHECK_CONFIG.GITHUB_RELEASES_API, {
            timeout: 10000, // 10 second timeout
            headers: {
                'Accept': 'application/vnd.github.v3+json',
            },
        });

        // Update last check timestamp
        await updateLastCheckTime(AsyncStorage);

        if (response.data) {
            const latestVersion = response.data.tag_name.replace(/^v/, ''); // Remove 'v' prefix if present
            const currentVersion = APP_VERSION;

            console.log(`Current version: ${currentVersion}, Latest version: ${latestVersion}`);

            // Compare versions
            const comparison = compareVersions(latestVersion, currentVersion);

            if (comparison > 0) {
                // New version available
                const updateInfo = {
                    hasUpdate: true,
                    latestVersion: latestVersion,
                    currentVersion: currentVersion,
                    downloadUrl: getDownloadUrl(response.data),
                    releaseNotes: response.data.body || 'No release notes available',
                    releaseName: response.data.name || `Version ${latestVersion}`,
                    publishedAt: response.data.published_at,
                };

                console.log('Update available:', updateInfo);
                return updateInfo;
            } else {
                console.log('App is up to date');
                return null;
            }
        }

        return null;
    } catch (error) {
        if (error.code === 'ECONNABORTED') {
            console.log('Update check timed out');
        } else if (error.response?.status === 404) {
            console.log('No releases found on GitHub');
        } else if (error.message === 'Network Error') {
            console.log('Network error - unable to check for updates');
        } else {
            console.log('Error checking for updates:', error.message);
        }

        // Update last check time even on error to avoid spamming
        await updateLastCheckTime(AsyncStorage);
        return null;
    }
};

/**
 * Extract download URL from GitHub release data
 * Prioritizes APK files for Android
 */
const getDownloadUrl = (releaseData) => {
    if (releaseData.assets && releaseData.assets.length > 0) {
        // Look for APK file first (Android)
        const apkAsset = releaseData.assets.find(asset =>
            asset.name.toLowerCase().endsWith('.apk')
        );

        if (apkAsset) {
            return apkAsset.browser_download_url;
        }

        // Look for IPA file (iOS)
        const ipaAsset = releaseData.assets.find(asset =>
            asset.name.toLowerCase().endsWith('.ipa')
        );

        if (ipaAsset) {
            return ipaAsset.browser_download_url;
        }

        // Return first asset if no APK/IPA found
        return releaseData.assets[0].browser_download_url;
    }

    // Fallback to release page URL
    return releaseData.html_url;
};

/**
 * Check if user has dismissed this specific version update
 */
export const isUpdateDismissed = async (version) => {
    try {
        const dismissedUpdates = await AsyncStorage.getItem(
            UPDATE_CHECK_CONFIG.DISMISSED_UPDATES_KEY
        );

        if (dismissedUpdates) {
            const dismissed = JSON.parse(dismissedUpdates);
            return dismissed.includes(version);
        }

        return false;
    } catch (error) {
        console.log('Error checking dismissed updates:', error);
        return false;
    }
};

/**
 * Mark a specific version update as dismissed
 */
export const dismissUpdate = async (version) => {
    try {
        const dismissedUpdates = await AsyncStorage.getItem(
            UPDATE_CHECK_CONFIG.DISMISSED_UPDATES_KEY
        );

        let dismissed = [];
        if (dismissedUpdates) {
            dismissed = JSON.parse(dismissedUpdates);
        }

        if (!dismissed.includes(version)) {
            dismissed.push(version);
            await AsyncStorage.setItem(
                UPDATE_CHECK_CONFIG.DISMISSED_UPDATES_KEY,
                JSON.stringify(dismissed)
            );
        }
    } catch (error) {
        console.log('Error dismissing update:', error);
    }
};

/**
 * Clear all dismissed updates (useful when user wants to see notifications again)
 */
export const clearDismissedUpdates = async () => {
    try {
        await AsyncStorage.removeItem(UPDATE_CHECK_CONFIG.DISMISSED_UPDATES_KEY);
    } catch (error) {
        console.log('Error clearing dismissed updates:', error);
    }
};

/**
 * Force update check (ignores time interval)
 * Useful for manual "Check for Updates" button
 */
export const forceCheckForUpdates = async () => {
    try {
        // Temporarily clear last check time to force check
        await AsyncStorage.removeItem(UPDATE_CHECK_CONFIG.LAST_CHECK_KEY);
        return await checkForUpdates();
    } catch (error) {
        console.log('Error forcing update check:', error);
        return null;
    }
};
