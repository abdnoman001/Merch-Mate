import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function DeveloperScreen() {
    const openLink = (url) => Linking.openURL(url);

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            {/* Profile Section */}
            <View style={styles.profileSection}>
                <View style={styles.avatarContainer}>
                    <Text style={styles.avatarText}>👨‍💻</Text>
                </View>
                <Text style={styles.name}>Abdullah Noman</Text>
                <Text style={styles.title}>Developer</Text>
                <Text style={styles.location}>📍 Bangladesh</Text>
            </View>

            {/* Bio Section */}
            <View style={styles.card}>
                <Text style={styles.cardTitle}>About</Text>
                <Text style={styles.bio}>
                    Passionate developer specializing in mobile and web applications.
                    Experienced in React Native, React.js, Node.js, and Python.
                    Dedicated to building efficient solutions for the garment and textile industry.
                </Text>
            </View>

            {/* Skills Section */}
            <View style={styles.card}>
                <Text style={styles.cardTitle}>Skills</Text>
                <View style={styles.skillsContainer}>
                    <View style={styles.skillChip}><Text style={styles.skillText}>React Native</Text></View>
                    <View style={styles.skillChip}><Text style={styles.skillText}>React.js</Text></View>
                    <View style={styles.skillChip}><Text style={styles.skillText}>Node.js</Text></View>
                    <View style={styles.skillChip}><Text style={styles.skillText}>Python</Text></View>
                    <View style={styles.skillChip}><Text style={styles.skillText}>JavaScript</Text></View>
                    <View style={styles.skillChip}><Text style={styles.skillText}>MongoDB</Text></View>
                </View>
            </View>

            {/* Contact Section */}
            <View style={styles.card}>
                <Text style={styles.cardTitle}>Get in Touch</Text>
                <TouchableOpacity style={styles.contactItem} onPress={() => openLink('mailto:abdnoman001@gmail.com')}>
                    <Text style={styles.contactIcon}>✉️</Text>
                    <View style={styles.contactInfo}>
                        <Text style={styles.contactLabel}>Email</Text>
                        <Text style={styles.contactValue}>abdnoman001@gmail.com</Text>
                    </View>
                    <Text style={styles.contactArrow}>→</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.contactItem} onPress={() => openLink('https://github.com/abdnoman001')}>
                    <Text style={styles.contactIcon}>🐙</Text>
                    <View style={styles.contactInfo}>
                        <Text style={styles.contactLabel}>GitHub</Text>
                        <Text style={styles.contactValue}>@abdnoman001</Text>
                    </View>
                    <Text style={styles.contactArrow}>→</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.contactItem} onPress={() => openLink('https://linkedin.com/in/me-noman')}>
                    <Text style={styles.contactIcon}>💼</Text>
                    <View style={styles.contactInfo}>
                        <Text style={styles.contactLabel}>LinkedIn</Text>
                        <Text style={styles.contactValue}>Abdullah Noman</Text>
                    </View>
                    <Text style={styles.contactArrow}>→</Text>
                </TouchableOpacity>
            </View>

            {/* Support Section */}
            <View style={styles.card}>
                <Text style={styles.cardTitle}>Support This Project</Text>
                <Text style={styles.supportText}>
                    If you find MerchMate helpful, consider supporting the development by sharing it with others or leaving a review!
                </Text>
                <TouchableOpacity style={styles.supportButton} onPress={() => openLink('mailto:abdnoman001@gmail.com?subject=MerchMate%20Feedback')}>
                    <Text style={styles.supportButtonText}>💬 Send Feedback</Text>
                </TouchableOpacity>
            </View>

            {/* Footer */}
            <Text style={styles.footer}>Made with ❤️</Text>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f0f2f5' },
    content: { padding: 16, paddingBottom: 32 },
    profileSection: { alignItems: 'center', backgroundColor: '#fff', borderRadius: 20, padding: 24, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
    avatarContainer: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#007bff15', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
    avatarText: { fontSize: 50 },
    name: { fontSize: 24, fontWeight: '800', color: '#1a1a2e', marginBottom: 4 },
    title: { fontSize: 16, color: '#007bff', fontWeight: '600', marginBottom: 8 },
    location: { fontSize: 14, color: '#888' },
    card: { backgroundColor: '#fff', borderRadius: 16, padding: 18, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
    cardTitle: { fontSize: 16, fontWeight: '700', color: '#1a1a2e', marginBottom: 12 },
    bio: { fontSize: 14, color: '#555', lineHeight: 22 },
    skillsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    skillChip: { backgroundColor: '#007bff15', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
    skillText: { fontSize: 13, color: '#007bff', fontWeight: '600' },
    contactItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
    contactIcon: { fontSize: 24, marginRight: 14 },
    contactInfo: { flex: 1 },
    contactLabel: { fontSize: 12, color: '#888', marginBottom: 2 },
    contactValue: { fontSize: 15, color: '#333', fontWeight: '500' },
    contactArrow: { fontSize: 18, color: '#ccc' },
    supportText: { fontSize: 14, color: '#666', lineHeight: 20, marginBottom: 14 },
    supportButton: { backgroundColor: '#007bff', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
    supportButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
    footer: { textAlign: 'center', fontSize: 13, color: '#aaa', marginTop: 8 },
});
