import { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getCostSheetHistory } from '../utils/calculations';

const HistoryScreen = ({ navigation }) => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadHistory();

        // Refresh history when screen comes into focus
        const unsubscribe = navigation.addListener('focus', () => {
            loadHistory();
        });

        return unsubscribe;
    }, [navigation]);

    const loadHistory = async () => {
        setLoading(true);
        const data = await getCostSheetHistory();
        setHistory(data);
        setLoading(false);
    };

    const formatDate = (isoString) => {
        const date = new Date(isoString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    };

    const renderItem = ({ item }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('Result', {
                breakdown: item.breakdown,
                inputs: item.inputs
            })}
        >
            <View style={styles.cardHeader}>
                <Text style={styles.styleName}>{item.inputs.style_name}</Text>
                <Text style={styles.fobPrice}>$ {item.breakdown.final_fob_per_pc}/pc</Text>
            </View>
            <View style={styles.cardBody}>
                <Text style={styles.detailText}>Buyer: {item.inputs.buyer_name}</Text>
                <Text style={styles.detailText}>Fabric: {item.inputs.fabric_type} {item.inputs.gsm}g</Text>
                <Text style={styles.detailText}>Consumption: {item.breakdown.total_fabric_req_kg_doz} kg/dz</Text>
            </View>
            <Text style={styles.timestamp}>{formatDate(item.timestamp)}</Text>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            {loading ? (
                <Text style={styles.loadingText}>Loading...</Text>
            ) : history.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>No calculations yet</Text>
                    <Text style={styles.emptySubText}>Create your first cost sheet to see it here</Text>
                </View>
            ) : (
                <FlatList
                    data={history}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    listContent: {
        padding: 15,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 15,
        marginBottom: 15,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    styleName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    fobPrice: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#007bff',
    },
    cardBody: {
        marginBottom: 10,
    },
    detailText: {
        fontSize: 14,
        color: '#666',
        marginBottom: 3,
    },
    timestamp: {
        fontSize: 12,
        color: '#999',
        fontStyle: 'italic',
    },
    loadingText: {
        textAlign: 'center',
        marginTop: 50,
        fontSize: 16,
        color: '#666',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#666',
        marginBottom: 10,
    },
    emptySubText: {
        fontSize: 14,
        color: '#999',
    },
});

export default HistoryScreen;
