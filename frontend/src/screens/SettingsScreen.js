import { useEffect, useState } from 'react';
import { Linking, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { checkForUpdates } from '../utils/updateChecker';
import { APP_VERSION, GITHUB_REPO, GITHUB_OWNER } from '../utils/versionConfig';

export default function SettingsScreen({ navigation }) {
    const [updateInfo, setUpdateInfo] = useState(null);
    const { isDarkMode, toggleDarkMode, colors } = useTheme();

    useEffect(() => {
        loadUpdateStatus();
    }, []);

    const loadUpdateStatus = async () => {
        const info = await checkForUpdates();
        setUpdateInfo(info);
    };

    const handleDeveloperContact = () => {
        Linking.openURL('https://abdullahnomancv.netlify.app/contact');
    };

    const handleReportIssue = () => {
        Linking.openURL('mailto:abdnoman001@gmail.com?subject=MerchMate%20Bug%20Report');
    };

    const handleViewOnGitHub = () => {
        Linking.openURL(`https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}`);
    };

    const handleCheckUpdates = async () => {
        const info = await checkForUpdates();
        setUpdateInfo(info);
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
                <TouchableOpacity style={[styles.backButton, { backgroundColor: colors.card }]} onPress={() => navigation.goBack()}>
                    <Text style={[styles.backIcon, { color: colors.text }]}>←</Text>
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Settings</Text>
                <View style={styles.placeholder} />
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* MODULES & UPDATES */}
                <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>MODULES & UPDATES</Text>

                <View style={[styles.card, { backgroundColor: colors.card }]}>
                    <View style={styles.cardHeader}>
                        <Text style={[styles.cardTitle, { color: colors.text }]}>Up to date</Text>
                        <View style={[styles.statusBadge, updateInfo?.hasUpdate ? styles.updateAvailable : styles.upToDate]}>
                            <Text style={styles.statusText}>
                                {updateInfo?.hasUpdate ? `v${updateInfo.latestVersion} Available` : 'Current'}
                            </Text>
                        </View>
                    </View>
                    <Text style={[styles.cardDescription, { color: colors.textSecondary }]}>
                        {updateInfo?.hasUpdate
                            ? `A new version (${updateInfo.latestVersion}) is available for download.`
                            : 'You are using the latest version of MerchMate.'}
                    </Text>
                    {updateInfo?.hasUpdate && (
                        <TouchableOpacity style={styles.primaryButton} onPress={() => Linking.openURL(updateInfo.downloadUrl)}>
                            <Text style={styles.primaryButtonText}>Download Update</Text>
                        </TouchableOpacity>
                    )}
                </View>

                <TouchableOpacity style={[styles.listItem, { backgroundColor: colors.card }]} onPress={handleCheckUpdates}>
                    <Text style={styles.listItemIcon}>🔄</Text>
                    <Text style={[styles.listItemText, { color: colors.text }]}>Check for updates</Text>
                    <Text style={[styles.listItemArrow, { color: colors.textSecondary }]}>→</Text>
                </TouchableOpacity>

                {/* GENERAL SETTINGS
                <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>GENERAL SETTINGS</Text>

                <View style={[styles.listItem, { backgroundColor: colors.card }]}>
                    <Text style={styles.listItemIcon}>🌙</Text>
                    <Text style={[styles.listItemText, { color: colors.text }]}>Dark mode</Text>
                    <Switch
                        value={isDarkMode}
                        onValueChange={toggleDarkMode}
                        trackColor={{ false: '#e0e0e0', true: '#007bff' }}
                        thumbColor={isDarkMode ? '#fff' : '#f4f3f4'}
                    />
                </View>
                */}
                

                {/* SUPPORT & FEEDBACK */}
                <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>SUPPORT & FEEDBACK</Text>

                <TouchableOpacity style={[styles.listItem, { backgroundColor: colors.card }]} onPress={handleDeveloperContact}>
                    <Text style={styles.listItemIcon}>👨‍💻</Text>
                    <Text style={[styles.listItemText, { color: colors.text }]}>Contact developer</Text>
                    <Text style={[styles.listItemArrow, { color: colors.textSecondary }]}>→</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.listItem, { backgroundColor: colors.card }]} onPress={handleReportIssue}>
                    <Text style={styles.listItemIcon}>🐛</Text>
                    <Text style={[styles.listItemText, { color: colors.text }]}>Report an issue</Text>
                    <Text style={[styles.listItemArrow, { color: colors.textSecondary }]}>→</Text>
                </TouchableOpacity>

                

                {/* APPLICATION INFO */}
                <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>APPLICATION INFO</Text>

                <TouchableOpacity style={[styles.listItem, { backgroundColor: colors.card }]} onPress={handleViewOnGitHub}>
                    <Text style={styles.listItemIcon}>🔗</Text>
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.listItemText, { color: colors.text }]}>Application Info</Text>
                        <Text style={[styles.listItemSubtext, { color: colors.textSecondary }]}>Version {APP_VERSION} • View on GitHub</Text>
                    </View>
                    <Text style={[styles.listItemArrow, { color: colors.textSecondary }]}>→</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.listItem, { backgroundColor: colors.card }]} onPress={() => navigation.navigate('About')}>
                    <Text style={styles.listItemIcon}>ℹ️</Text>
                    <Text style={[styles.listItemText, { color: colors.text }]}>About MerchMate</Text>
                    <Text style={[styles.listItemArrow, { color: colors.textSecondary }]}>→</Text>
                </TouchableOpacity>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={[styles.footerText, { color: colors.primary }]}>MerchMate</Text>
                    <Text style={[styles.footerSubtext, { color: colors.textSecondary }]}>Professional Garment Costing Suite</Text>
                    </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 16,
        paddingTop: 48,
        borderBottomWidth: 1,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    backIcon: {
        fontSize: 24,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
    },
    placeholder: {
        width: 40,
    },
    content: {
        flex: 1,
        padding: 16,
    },
    sectionHeader: {
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 0.5,
        marginTop: 24,
        marginBottom: 12,
        paddingHorizontal: 4,
    },
    card: {
        borderRadius: 16,
        padding: 16,
        marginBottom: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '700',
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    upToDate: {
        backgroundColor: '#28a74520',
    },
    updateAvailable: {
        backgroundColor: '#ff930020',
    },
    statusText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#28a745',
    },
    cardDescription: {
        fontSize: 13,
        lineHeight: 20,
        marginBottom: 12,
    },
    primaryButton: {
        backgroundColor: '#007bff',
        borderRadius: 10,
        paddingVertical: 12,
        alignItems: 'center',
        marginTop: 4,
    },
    primaryButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#fff',
    },
    listItem: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12,
        padding: 16,
        marginBottom: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 1,
    },
    listItemIcon: {
        fontSize: 20,
        marginRight: 12,
    },
    listItemText: {
        flex: 1,
        fontSize: 15,
        fontWeight: '500',
    },
    listItemSubtext: {
        fontSize: 12,
        marginTop: 2,
    },
    listItemArrow: {
        fontSize: 18,
    },
    footer: {
        alignItems: 'center',
        paddingVertical: 32,
        paddingBottom: 48,
    },
    footerText: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 4,
    },
    footerSubtext: {
        fontSize: 12,
        marginBottom: 8,
    },
    footerCopyright: {
        fontSize: 11,
    },
});
