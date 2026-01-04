import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { clearAllHistory, deleteCostSheet, deleteMultipleCostSheets, getCostSheetHistory } from '../utils/calculations';

const FABRIC_ANALYSIS_STORAGE_KEY = '@fabric_analysis_history';

const HistoryScreen = ({ navigation, route }) => {
    // Check if we're in import mode (selecting to return data to another screen)
    const returnTo = route?.params?.returnTo;
    const importType = route?.params?.type;
    const isImportMode = !!returnTo;

    const [activeTab, setActiveTab] = useState(importType === 'fabric' ? 'fabric' : 'fob');
    const [fobHistory, setFobHistory] = useState([]);
    const [fabricHistory, setFabricHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectionMode, setSelectionMode] = useState(false);
    const [selectedItems, setSelectedItems] = useState([]);

    useEffect(() => {
        loadHistory();
        const unsubscribe = navigation.addListener('focus', () => {
            loadHistory();
            setSelectionMode(false);
            setSelectedItems([]);
        });
        return unsubscribe;
    }, [navigation]);

    const loadHistory = async () => {
        setLoading(true);
        const fobData = await getCostSheetHistory();
        setFobHistory(fobData);
        try {
            const fabricData = await AsyncStorage.getItem(FABRIC_ANALYSIS_STORAGE_KEY);
            setFabricHistory(fabricData ? JSON.parse(fabricData) : []);
        } catch (error) {
            setFabricHistory([]);
        }
        setLoading(false);
    };

    const history = activeTab === 'fob' ? fobHistory : fabricHistory;

    const formatDate = (isoString) => {
        const date = new Date(isoString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    const handleDeleteFob = async (id) => {
        Alert.alert('Delete Cost Sheet', 'Are you sure?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: async () => { await deleteCostSheet(id); loadHistory(); } }
        ]);
    };

    const handleDeleteFabric = async (id) => {
        Alert.alert('Delete Analysis', 'Are you sure?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete', style: 'destructive', onPress: async () => {
                    const updated = fabricHistory.filter(item => item.id !== id);
                    await AsyncStorage.setItem(FABRIC_ANALYSIS_STORAGE_KEY, JSON.stringify(updated));
                    loadHistory();
                }
            }
        ]);
    };

    const handleDeleteSelected = async () => {
        if (selectedItems.length === 0) return Alert.alert('No items selected');
        Alert.alert('Delete Selected', `Delete ${selectedItems.length} item(s)?`, [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete', style: 'destructive', onPress: async () => {
                    if (activeTab === 'fob') {
                        await deleteMultipleCostSheets(selectedItems);
                    } else {
                        const updated = fabricHistory.filter(item => !selectedItems.includes(item.id));
                        await AsyncStorage.setItem(FABRIC_ANALYSIS_STORAGE_KEY, JSON.stringify(updated));
                    }
                    setSelectedItems([]); setSelectionMode(false); loadHistory();
                }
            }
        ]);
    };

    const handleDeleteAll = async () => {
        Alert.alert('Delete All', `Delete all ${activeTab === 'fob' ? 'cost sheets' : 'analyses'}?`, [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete All', style: 'destructive', onPress: async () => {
                    if (activeTab === 'fob') { await clearAllHistory(); }
                    else { await AsyncStorage.setItem(FABRIC_ANALYSIS_STORAGE_KEY, JSON.stringify([])); }
                    loadHistory();
                }
            }
        ]);
    };

    const toggleSelection = (id) => setSelectedItems(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    const getGarmentIcon = (type) => ({ knit: '👕', woven: '👔', denim: '👖' }[type] || '🧵');

    // Handle item selection for import mode
    const handleImportSelect = (item) => {
        if (returnTo === 'BuyerAnalyzerInput') {
            // Pass FOB data back to Buyer Analyzer
            navigation.navigate('BuyerAnalyzerInput', { fobData: item });
        }
    };

    const renderFobItem = ({ item }) => {
        const isSelected = selectedItems.includes(item.id);
        const fobPerPc = (item.breakdown.final_fob_per_doz || (item.breakdown.final_fob_per_pc * 12)) / 12;

        // Handle press based on mode
        const handlePress = () => {
            if (isImportMode) {
                handleImportSelect(item);
            } else if (selectionMode) {
                toggleSelection(item.id);
            } else {
                navigation.navigate('Result', { breakdown: item.breakdown, inputs: item.inputs });
            }
        };

        return (
            <TouchableOpacity style={[styles.card, isSelected && styles.selectedCard, isImportMode && styles.importModeCard]}
                onPress={handlePress}
                onLongPress={() => !isImportMode && (setSelectionMode(true), toggleSelection(item.id))} activeOpacity={0.7}>
                {selectionMode && !isImportMode && <View style={styles.checkboxContainer}><View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>{isSelected && <Text style={styles.checkmark}>✓</Text>}</View></View>}
                {isImportMode && <View style={styles.importIndicator}><Text style={styles.importIndicatorText}>Tap to Import</Text></View>}
                <View style={styles.cardContent}>
                    <View style={styles.cardHeader}>
                        <View style={styles.cardLeft}><View style={styles.iconContainer}><Text style={styles.cardIcon}>📝</Text></View></View>
                        <View style={styles.cardInfo}>
                            <Text style={styles.cardTitle} numberOfLines={1}>{item.inputs.style_name || 'Untitled'}</Text>
                            <Text style={styles.cardSubtitle}>{item.inputs.buyer_name || 'No buyer'}</Text>
                        </View>
                        <View style={styles.priceContainer}><Text style={styles.priceLabel}>FOB</Text><Text style={styles.priceValueLarge}>${fobPerPc.toFixed(2)}</Text><Text style={styles.priceUnit}>/pc</Text></View>
                    </View>
                    <View style={styles.cardMeta}>
                        <View style={styles.metaItem}><Text style={styles.metaLabel}>Fabric</Text><Text style={styles.metaValue}>{item.inputs.fabric_type} {item.inputs.gsm}g</Text></View>
                        <View style={styles.metaDivider} />
                        <View style={styles.metaItem}><Text style={styles.metaLabel}>Consumption</Text><Text style={styles.metaValue}>{item.breakdown.total_fabric_req_kg_doz} kg/dz</Text></View>
                    </View>
                    <View style={styles.cardFooter}>
                        <Text style={styles.timestamp}>{formatDate(item.timestamp)}</Text>
                        {!selectionMode && !isImportMode && <View style={styles.actionRow}>
                            <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('Input', { editData: item })}><Text style={styles.actionIcon}>✏️</Text></TouchableOpacity>
                            <TouchableOpacity style={[styles.actionBtn, styles.deleteBtn]} onPress={() => handleDeleteFob(item.id)}><Text style={styles.actionIcon}>🗑️</Text></TouchableOpacity>
                        </View>}
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    const renderFabricItem = ({ item }) => {
        const isSelected = selectedItems.includes(item.id);
        return (
            <TouchableOpacity style={[styles.card, styles.fabricCard, isSelected && styles.selectedCard]}
                onPress={() => selectionMode ? toggleSelection(item.id) : navigation.navigate('FabricAnalyzerResult', { analysisData: item })}
                onLongPress={() => { setSelectionMode(true); toggleSelection(item.id); }} activeOpacity={0.7}>
                {selectionMode && <View style={styles.checkboxContainer}><View style={[styles.checkbox, styles.fabricCheckbox, isSelected && styles.fabricCheckboxSelected]}>{isSelected && <Text style={styles.checkmark}>✓</Text>}</View></View>}
                <View style={styles.cardContent}>
                    <View style={styles.cardHeader}>
                        <View style={styles.cardLeft}><View style={[styles.iconContainer, styles.fabricIconContainer]}><Text style={styles.cardIcon}>{getGarmentIcon(item.garmentType)}</Text></View></View>
                        <View style={styles.cardInfo}>
                            <Text style={styles.cardTitle} numberOfLines={1}>{item.styleName || 'Untitled'}</Text>
                            <Text style={styles.cardSubtitle}>{item.buyerName || 'No buyer'}</Text>
                        </View>
                        <View style={[styles.priceContainer, styles.fabricPriceContainer]}><Text style={[styles.priceLabel, styles.fabricPriceLabel]}>Cost</Text><Text style={[styles.priceValueLarge, styles.fabricPrice]}>${item.fabricCostPerPiece?.toFixed(2)}</Text><Text style={[styles.priceUnit, styles.fabricPriceUnit]}>/pc</Text></View>
                    </View>
                    <View style={styles.cardMeta}>
                        <View style={styles.metaItem}><Text style={styles.metaLabel}>Consumption</Text><Text style={[styles.metaValue, styles.fabricMetaValue]}>{item.actualConsumptionPerPiece?.toFixed(4)} {item.unit}/pc</Text></View>
                        <View style={styles.metaDivider} />
                        <View style={styles.metaItem}><Text style={styles.metaLabel}>Efficiency</Text><Text style={[styles.metaValue, styles.fabricMetaValue]}>{item.markerEfficiency}%</Text></View>
                    </View>
                    <View style={styles.cardFooter}>
                        <Text style={styles.timestamp}>{formatDate(item.savedAt || item.timestamp)}</Text>
                        {!selectionMode && <View style={styles.actionRow}>
                            <TouchableOpacity style={[styles.actionBtn, styles.fabricActionBtn]} onPress={() => navigation.navigate('FabricAnalyzerInput', { editData: item })}><Text style={styles.actionIcon}>✏️</Text></TouchableOpacity>
                            <TouchableOpacity style={[styles.actionBtn, styles.deleteBtn]} onPress={() => handleDeleteFabric(item.id)}><Text style={styles.actionIcon}>🗑️</Text></TouchableOpacity>
                        </View>}
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    const renderEmptyState = () => (
        <View style={styles.emptyContainer}>
            <View style={[styles.emptyIcon, activeTab === 'fabric' && styles.fabricEmptyIcon]}><Text style={styles.emptyIconText}>{activeTab === 'fob' ? '📝' : '🧵'}</Text></View>
            <Text style={styles.emptyTitle}>No {activeTab === 'fob' ? 'Cost Sheets' : 'Analyses'} Yet</Text>
            <Text style={styles.emptySubtitle}>{isImportMode ? 'Create a cost sheet first to import' : (activeTab === 'fob' ? 'Create your first FOB cost sheet' : 'Run a fabric analysis and save it')}</Text>
            {!isImportMode && <TouchableOpacity style={[styles.emptyButton, activeTab === 'fabric' && styles.fabricEmptyButton]} onPress={() => navigation.navigate(activeTab === 'fob' ? 'Input' : 'FabricAnalyzerInput')}>
                <Text style={styles.emptyButtonText}>{activeTab === 'fob' ? '+ Create Sheet' : '+ New Analysis'}</Text>
            </TouchableOpacity>}
        </View>
    );

    return (
        <View style={styles.container}>
            {isImportMode && (
                <View style={styles.importBanner}>
                    <Text style={styles.importBannerText}>📥 Select a FOB Sheet to Import</Text>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.cancelImportBtn}>
                        <Text style={styles.cancelImportText}>Cancel</Text>
                    </TouchableOpacity>
                </View>
            )}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>{isImportMode ? 'Select FOB Sheet' : 'History'}</Text>
                <Text style={styles.headerSubtitle}>{isImportMode ? 'Tap a sheet to import its data' : `${fobHistory.length + fabricHistory.length} saved items`}</Text>
            </View>
            {!isImportMode && <View style={styles.tabContainer}>
                <TouchableOpacity style={[styles.tab, activeTab === 'fob' && styles.tabActive]} onPress={() => { setActiveTab('fob'); setSelectionMode(false); setSelectedItems([]); }}>
                    <Text style={styles.tabIcon}>📝</Text><Text style={[styles.tabText, activeTab === 'fob' && styles.tabTextActive]}>FOB Costing</Text>
                    {fobHistory.length > 0 && <View style={[styles.tabBadge, activeTab === 'fob' && styles.tabBadgeActive]}><Text style={[styles.tabBadgeText, activeTab === 'fob' && styles.tabBadgeTextActive]}>{fobHistory.length}</Text></View>}
                </TouchableOpacity>
                <TouchableOpacity style={[styles.tab, activeTab === 'fabric' && styles.fabricTabActive]} onPress={() => { setActiveTab('fabric'); setSelectionMode(false); setSelectedItems([]); }}>
                    <Text style={styles.tabIcon}>🧵</Text><Text style={[styles.tabText, activeTab === 'fabric' && styles.fabricTabTextActive]}>Fabric Analysis</Text>
                    {fabricHistory.length > 0 && <View style={[styles.tabBadge, activeTab === 'fabric' && styles.fabricTabBadgeActive]}><Text style={[styles.tabBadgeText, activeTab === 'fabric' && styles.fabricTabBadgeTextActive]}>{fabricHistory.length}</Text></View>}
                </TouchableOpacity>
            </View>}
            {history.length > 0 && !isImportMode && <View style={styles.toolbar}>
                {selectionMode ? <>
                    <TouchableOpacity style={styles.toolbarBtn} onPress={() => { setSelectionMode(false); setSelectedItems([]); }}><Text style={styles.toolbarBtnText}>✕ Cancel</Text></TouchableOpacity>
                    <TouchableOpacity style={[styles.toolbarBtn, styles.toolbarDeleteBtn]} onPress={handleDeleteSelected}><Text style={styles.toolbarBtnTextWhite}>🗑️ Delete ({selectedItems.length})</Text></TouchableOpacity>
                </> : <>
                    <TouchableOpacity style={styles.toolbarBtn} onPress={() => setSelectionMode(true)}><Text style={styles.toolbarBtnText}>☑️ Select</Text></TouchableOpacity>
                    <TouchableOpacity style={[styles.toolbarBtn, styles.toolbarDeleteBtn]} onPress={handleDeleteAll}><Text style={styles.toolbarBtnTextWhite}>🗑️ Clear All</Text></TouchableOpacity>
                </>}
            </View>}
            {loading ? <View style={styles.loadingContainer}><Text style={styles.loadingText}>Loading...</Text></View>
                : history.length === 0 ? renderEmptyState()
                    : <FlatList data={isImportMode ? fobHistory : history} renderItem={activeTab === 'fob' || isImportMode ? renderFobItem : renderFabricItem} keyExtractor={(item) => item.id} contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false} />}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f0f2f5' },
    header: { backgroundColor: '#fff', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
    headerTitle: { fontSize: 28, fontWeight: '800', color: '#1a1a2e' },
    headerSubtitle: { fontSize: 13, color: '#888', marginTop: 2 },
    tabContainer: { flexDirection: 'row', backgroundColor: '#fff', paddingHorizontal: 16, paddingBottom: 12, gap: 10 },
    tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, paddingHorizontal: 12, borderRadius: 12, backgroundColor: '#f5f5f5', gap: 6 },
    tabActive: { backgroundColor: '#007bff15', borderWidth: 1.5, borderColor: '#007bff' },
    fabricTabActive: { backgroundColor: '#28a74515', borderWidth: 1.5, borderColor: '#28a745' },
    tabIcon: { fontSize: 16 },
    tabText: { fontSize: 13, fontWeight: '600', color: '#666' },
    tabTextActive: { color: '#007bff' },
    fabricTabTextActive: { color: '#28a745' },
    tabBadge: { backgroundColor: '#ddd', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, minWidth: 24, alignItems: 'center' },
    tabBadgeActive: { backgroundColor: '#007bff' },
    fabricTabBadgeActive: { backgroundColor: '#28a745' },
    tabBadgeText: { fontSize: 11, fontWeight: '700', color: '#666' },
    tabBadgeTextActive: { color: '#fff' },
    fabricTabBadgeTextActive: { color: '#fff' },
    toolbar: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee', gap: 10 },
    toolbarBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 10, backgroundColor: '#f5f5f5', gap: 6 },
    toolbarDeleteBtn: { backgroundColor: '#dc3545' },
    toolbarBtnText: { fontSize: 14, fontWeight: '600', color: '#333' },
    toolbarBtnTextWhite: { fontSize: 14, fontWeight: '600', color: '#fff' },
    listContent: { padding: 16, paddingBottom: 32 },
    card: { backgroundColor: '#fff', borderRadius: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3, overflow: 'hidden', borderLeftWidth: 4, borderLeftColor: '#007bff' },
    fabricCard: { borderLeftColor: '#28a745' },
    selectedCard: { backgroundColor: '#e3f2fd', borderWidth: 2, borderColor: '#007bff' },
    cardContent: { padding: 14 },
    cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    checkboxContainer: { position: 'absolute', top: 14, left: 14, zIndex: 10 },
    checkbox: { width: 26, height: 26, borderRadius: 13, borderWidth: 2, borderColor: '#007bff', backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
    fabricCheckbox: { borderColor: '#28a745' },
    checkboxSelected: { backgroundColor: '#007bff' },
    fabricCheckboxSelected: { backgroundColor: '#28a745' },
    checkmark: { color: '#fff', fontWeight: '700', fontSize: 14 },
    cardLeft: { marginRight: 12 },
    iconContainer: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#007bff15', alignItems: 'center', justifyContent: 'center' },
    fabricIconContainer: { backgroundColor: '#28a74515' },
    cardIcon: { fontSize: 22 },
    cardInfo: { flex: 1, marginRight: 10 },
    cardTitle: { fontSize: 16, fontWeight: '700', color: '#1a1a2e', marginBottom: 2 },
    cardSubtitle: { fontSize: 13, color: '#666' },
    cardMeta: { flexDirection: 'row', backgroundColor: '#f8f9fa', borderRadius: 10, padding: 10, marginBottom: 10 },
    metaItem: { flex: 1 },
    metaDivider: { width: 1, backgroundColor: '#e0e0e0', marginHorizontal: 12 },
    metaLabel: { fontSize: 10, color: '#999', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
    metaValue: { fontSize: 13, fontWeight: '600', color: '#007bff' },
    fabricMetaValue: { color: '#28a745' },
    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    timestamp: { fontSize: 11, color: '#aaa' },
    priceContainer: { alignItems: 'center', backgroundColor: '#007bff10', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
    fabricPriceContainer: { backgroundColor: '#28a74510' },
    priceLabel: { fontSize: 10, color: '#007bff', fontWeight: '600' },
    fabricPriceLabel: { color: '#28a745' },
    priceValueLarge: { fontSize: 20, fontWeight: '800', color: '#007bff' },
    fabricPrice: { color: '#28a745' },
    priceUnit: { fontSize: 11, color: '#007bff' },
    fabricPriceUnit: { color: '#28a745' },
    actionRow: { flexDirection: 'row', gap: 6, marginTop: 8 },
    actionBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#f0f0f0', alignItems: 'center', justifyContent: 'center' },
    fabricActionBtn: { backgroundColor: '#28a74515' },
    deleteBtn: { backgroundColor: '#fee' },
    actionIcon: { fontSize: 16 },
    loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    loadingText: { fontSize: 16, color: '#888' },
    emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
    emptyIcon: { width: 80, height: 80, borderRadius: 24, backgroundColor: '#007bff15', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
    fabricEmptyIcon: { backgroundColor: '#28a74515' },
    emptyIconText: { fontSize: 36 },
    emptyTitle: { fontSize: 20, fontWeight: '700', color: '#333', marginBottom: 8 },
    emptySubtitle: { fontSize: 14, color: '#888', textAlign: 'center', marginBottom: 24, lineHeight: 20 },
    emptyButton: { backgroundColor: '#007bff', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12 },
    fabricEmptyButton: { backgroundColor: '#28a745' },
    emptyButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
    // Import mode styles
    importBanner: { backgroundColor: '#9c27b0', paddingHorizontal: 20, paddingVertical: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    importBannerText: { color: '#fff', fontSize: 15, fontWeight: '600' },
    cancelImportBtn: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8 },
    cancelImportText: { color: '#fff', fontWeight: '600', fontSize: 13 },
    importModeCard: { borderLeftColor: '#9c27b0', borderWidth: 1, borderColor: '#9c27b015' },
    importIndicator: { position: 'absolute', top: 0, right: 0, backgroundColor: '#9c27b0', paddingHorizontal: 10, paddingVertical: 4, borderBottomLeftRadius: 10 },
    importIndicatorText: { color: '#fff', fontSize: 10, fontWeight: '700' },
});

export default HistoryScreen;
