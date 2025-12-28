import { useEffect, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { clearAllHistory, deleteCostSheet, deleteMultipleCostSheets, getCostSheetHistory } from '../utils/calculations';

const HistoryScreen = ({ navigation }) => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectionMode, setSelectionMode] = useState(false);
    const [selectedItems, setSelectedItems] = useState([]);

    useEffect(() => {
        loadHistory();

        // Refresh history when screen comes into focus
        const unsubscribe = navigation.addListener('focus', () => {
            loadHistory();
            setSelectionMode(false);
            setSelectedItems([]);
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

    const handleDelete = async (id) => {
        Alert.alert(
            'Delete Cost Sheet',
            'Are you sure you want to delete this cost sheet?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        const success = await deleteCostSheet(id);
                        if (success) {
                            loadHistory();
                        }
                    }
                }
            ]
        );
    };

    const handleDeleteSelected = async () => {
        if (selectedItems.length === 0) {
            Alert.alert('No items selected', 'Please select items to delete');
            return;
        }

        Alert.alert(
            'Delete Selected',
            `Delete ${selectedItems.length} selected item(s)?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        const success = await deleteMultipleCostSheets(selectedItems);
                        if (success) {
                            setSelectedItems([]);
                            setSelectionMode(false);
                            loadHistory();
                        }
                    }
                }
            ]
        );
    };

    const handleDeleteAll = async () => {
        Alert.alert(
            'Delete All',
            'Are you sure you want to delete all cost sheets? This cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete All',
                    style: 'destructive',
                    onPress: async () => {
                        const success = await clearAllHistory();
                        if (success) {
                            loadHistory();
                        }
                    }
                }
            ]
        );
    };

    const toggleSelection = (id) => {
        setSelectedItems(prev => {
            if (prev.includes(id)) {
                return prev.filter(item => item !== id);
            } else {
                return [...prev, id];
            }
        });
    };

    const handleEditItem = (item) => {
        navigation.navigate('Input', { editData: item });
    };

    const renderItem = ({ item }) => {
        const isSelected = selectedItems.includes(item.id);

        return (
            <View style={[styles.card, isSelected && styles.selectedCard]}>
                <TouchableOpacity
                    style={styles.cardContent}
                    onPress={() => {
                        if (selectionMode) {
                            toggleSelection(item.id);
                        } else {
                            navigation.navigate('Result', {
                                breakdown: item.breakdown,
                                inputs: item.inputs
                            });
                        }
                    }}
                    onLongPress={() => {
                        setSelectionMode(true);
                        toggleSelection(item.id);
                    }}
                >
                    {selectionMode && (
                        <View style={styles.checkbox}>
                            {isSelected && <View style={styles.checkboxSelected} />}
                        </View>
                    )}
                    <View style={styles.cardMain}>
                        <View style={styles.cardHeader}>
                            <Text style={styles.styleName}>{item.inputs.style_name}</Text>
                            <Text style={styles.fobPrice}>$ {(item.breakdown.final_fob_per_doz || (item.breakdown.final_fob_per_pc * 12))?.toFixed(2)}/dz</Text>
                        </View>
                        <View style={styles.cardBody}>
                            <Text style={styles.detailText}>Buyer: {item.inputs.buyer_name}</Text>
                            <Text style={styles.detailText}>Fabric: {item.inputs.fabric_type} {item.inputs.gsm}g</Text>
                            <Text style={styles.detailText}>Consumption: {item.breakdown.total_fabric_req_kg_doz} kg/dz</Text>
                            <Text style={styles.detailText}>Per piece: ${((item.breakdown.final_fob_per_doz || (item.breakdown.final_fob_per_pc * 12)) / 12).toFixed(2)}/pc</Text>
                        </View>
                        <Text style={styles.timestamp}>{formatDate(item.timestamp)}</Text>
                    </View>
                    {!selectionMode && (
                        <View style={styles.actionButtons}>
                            <TouchableOpacity
                                style={styles.iconButton}
                                onPress={() => handleEditItem(item)}
                            >
                                <Text style={styles.iconText}>✏️</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.iconButton}
                                onPress={() => handleDelete(item.id)}
                            >
                                <Text style={styles.iconText}>🗑️</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </TouchableOpacity>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            {history.length > 0 && (
                <View style={styles.toolbar}>
                    {selectionMode ? (
                        <>
                            <TouchableOpacity
                                style={styles.toolbarButton}
                                onPress={() => {
                                    setSelectionMode(false);
                                    setSelectedItems([]);
                                }}
                            >
                                <Text style={styles.toolbarButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.toolbarButton, styles.deleteButton]}
                                onPress={handleDeleteSelected}
                            >
                                <Text style={styles.toolbarButtonText}>Delete Selected ({selectedItems.length})</Text>
                            </TouchableOpacity>
                        </>
                    ) : (
                        <>
                            <TouchableOpacity
                                style={styles.toolbarButton}
                                onPress={() => setSelectionMode(true)}
                            >
                                <Text style={styles.toolbarButtonText}>Select</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.toolbarButton, styles.deleteButton]}
                                onPress={handleDeleteAll}
                            >
                                <Text style={styles.toolbarButtonText}>Delete All</Text>
                            </TouchableOpacity>
                        </>
                    )}
                </View>
            )}
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
    toolbar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 10,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    toolbarButton: {
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 5,
        backgroundColor: '#007bff',
    },
    deleteButton: {
        backgroundColor: '#ef4444',
    },
    toolbarButtonText: {
        color: '#fff',
        fontWeight: 'bold',
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
    selectedCard: {
        backgroundColor: '#e3f2fd',
        borderWidth: 2,
        borderColor: '#007bff',
    },
    cardContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#007bff',
        marginRight: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkboxSelected: {
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: '#007bff',
    },
    cardMain: {
        flex: 1,
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
        flex: 1,
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
    actionButtons: {
        flexDirection: 'row',
        gap: 5,
    },
    iconButton: {
        padding: 8,
        borderRadius: 5,
        backgroundColor: '#f0f0f0',
    },
    iconText: {
        fontSize: 20,
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
