// Version Configuration for MerchMate App
// This file centralizes version information and update checking configuration

export const APP_VERSION = '1.0.6';
export const APP_NAME = 'MerchMate';

// GitHub repository information
export const GITHUB_OWNER = 'abdnoman001';
export const GITHUB_REPO = 'Merch-Mate';

// Update checking configuration
export const UPDATE_CHECK_CONFIG = {
    // GitHub API endpoint for latest release
    GITHUB_RELEASES_API: `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest`,

    // Alternative: Host a simple version.json file
    // VERSION_JSON_URL: 'https://raw.githubusercontent.com/abdnoman001/Merch-Mate/main/version.json',

    // Check for updates frequency (in milliseconds)
    // 86400000 ms = 24 hours
    CHECK_INTERVAL: 86400000,

    // Local storage key for last update check
    LAST_CHECK_KEY: '@last_update_check',

    // Local storage key for dismissed updates
    DISMISSED_UPDATES_KEY: '@dismissed_updates',
};

// Helper function to compare versions (semantic versioning)
// Returns: 1 if v1 > v2, -1 if v1 < v2, 0 if equal
export const compareVersions = (v1, v2) => {
    const normalize = (v) => v.replace(/^v/, '').split('.').map(Number);
    const parts1 = normalize(v1);
    const parts2 = normalize(v2);

    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
        const num1 = parts1[i] || 0;
        const num2 = parts2[i] || 0;

        if (num1 > num2) return 1;
        if (num1 < num2) return -1;
    }

    return 0;
};

// Helper to check if update check is needed based on time interval
export const shouldCheckForUpdates = async (AsyncStorage) => {
    try {
        const lastCheck = await AsyncStorage.getItem(UPDATE_CHECK_CONFIG.LAST_CHECK_KEY);

        if (!lastCheck) return true;

        const lastCheckTime = parseInt(lastCheck, 10);
        const currentTime = Date.now();
        const timeDiff = currentTime - lastCheckTime;

        return timeDiff >= UPDATE_CHECK_CONFIG.CHECK_INTERVAL;
    } catch (error) {
        console.log('Error checking last update time:', error);
        return true; // Check on error to be safe
    }
};

// Helper to update last check timestamp
export const updateLastCheckTime = async (AsyncStorage) => {
    try {
        await AsyncStorage.setItem(
            UPDATE_CHECK_CONFIG.LAST_CHECK_KEY,
            Date.now().toString()
        );
    } catch (error) {
        console.log('Error updating last check time:', error);
    }
};
