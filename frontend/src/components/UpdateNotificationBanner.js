// UpdateNotificationBanner Component
// Displays a dismissible banner when a new app version is available

import { useEffect, useState } from 'react';
import {
    Alert,
    Linking,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { checkForUpdates, dismissUpdate, isUpdateDismissed } from '../utils/updateChecker';

const UpdateNotificationBanner = () => {
    const [updateInfo, setUpdateInfo] = useState(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        checkForAppUpdates();
    }, []);

    const checkForAppUpdates = async () => {
        try {
            const update = await checkForUpdates();

            if (update && update.hasUpdate) {
                // Check if user has dismissed this version
                const isDismissed = await isUpdateDismissed(update.latestVersion);

                if (!isDismissed) {
                    setUpdateInfo(update);
                    setVisible(true);
                }
            }
        } catch (error) {
            console.log('Error checking for updates in banner:', error);
        }
    };

    const handleDownload = async () => {
        if (!updateInfo || !updateInfo.downloadUrl) {
            Alert.alert(
                'Download Not Available',
                'Unable to find download link. Please check the GitHub releases page.',
                [{ text: 'OK' }]
            );
            return;
        }

        try {
            const supported = await Linking.canOpenURL(updateInfo.downloadUrl);

            if (supported) {
                Alert.alert(
                    'Download Update',
                    `A new version (${updateInfo.latestVersion}) is available!\n\nYou will be redirected to download the latest version.`,
                    [
                        {
                            text: 'Cancel',
                            style: 'cancel',
                        },
                        {
                            text: 'Download',
                            onPress: async () => {
                                await Linking.openURL(updateInfo.downloadUrl);
                            },
                        },
                    ]
                );
            } else {
                Alert.alert(
                    'Cannot Open Link',
                    'Unable to open download link. Please manually visit the GitHub releases page.',
                    [{ text: 'OK' }]
                );
            }
        } catch (error) {
            console.log('Error opening download URL:', error);
            Alert.alert(
                'Error',
                'Failed to open download link. Please try again later.',
                [{ text: 'OK' }]
            );
        }
    };

    const handleDismiss = async () => {
        if (updateInfo) {
            await dismissUpdate(updateInfo.latestVersion);
            setVisible(false);
        }
    };

    const handleShowReleaseNotes = () => {
        if (updateInfo) {
            Alert.alert(
                `What's New in ${updateInfo.latestVersion}`,
                updateInfo.releaseNotes || 'No release notes available.',
                [{ text: 'OK' }]
            );
        }
    };

    if (!visible || !updateInfo) {
        return null;
    }

    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <View style={styles.headerRow}>
                    <Text style={styles.title}>🎉 Update Available</Text>
                    <TouchableOpacity onPress={handleDismiss} style={styles.closeButton}>
                        <Text style={styles.closeButtonText}>✕</Text>
                    </TouchableOpacity>
                </View>

                <Text style={styles.message}>
                    Version {updateInfo.latestVersion} is now available!
                </Text>

                <View style={styles.buttonRow}>
                    <TouchableOpacity
                        style={styles.releaseNotesButton}
                        onPress={handleShowReleaseNotes}
                    >
                        <Text style={styles.releaseNotesButtonText}>What's New</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.downloadButton}
                        onPress={handleDownload}
                    >
                        <Text style={styles.downloadButtonText}>Download Update</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#4CAF50',
        borderRadius: 12,
        marginHorizontal: 16,
        marginVertical: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    content: {
        padding: 16,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    closeButton: {
        padding: 4,
    },
    closeButtonText: {
        fontSize: 20,
        color: '#FFFFFF',
        fontWeight: 'bold',
    },
    message: {
        fontSize: 14,
        color: '#FFFFFF',
        marginBottom: 12,
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 8,
    },
    releaseNotesButton: {
        flex: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 8,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#FFFFFF',
    },
    releaseNotesButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
    },
    downloadButton: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 8,
        alignItems: 'center',
    },
    downloadButtonText: {
        color: '#4CAF50',
        fontSize: 14,
        fontWeight: 'bold',
    },
});

export default UpdateNotificationBanner;
