import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import {
    shareFabricAnalysisAsExcel,
    shareFabricAnalysisAsPDF,
    shareFabricAnalysisAsText,
} from '../utils/exporters';
import { calculateFOBImpact } from '../utils/fabricConsumptionCalculator';

const FABRIC_ANALYSIS_STORAGE_KEY = '@fabric_analysis_history';

const FabricAnalyzerResultScreen = ({ navigation, route }) => {
    const { analysisData } = route.params;
    const [profitMargin, setProfitMargin] = useState(
        analysisData.profitMargin?.toString() || '10'
    );
    const [fobData, setFobData] = useState(null);
    const [isSaved, setIsSaved] = useState(false);

    // Calculate FOB impact on mount and when profit margin changes
    useEffect(() => {
        const margin = parseFloat(profitMargin) || 0;
        const fob = calculateFOBImpact(
            analysisData.fabricCostPerPiece,
            analysisData.otherCosts || 0,
            margin
        );
        setFobData(fob);
    }, [profitMargin, analysisData]);

    // Save to history
    const saveToHistory = async () => {
        try {
            const existingData = await AsyncStorage.getItem(FABRIC_ANALYSIS_STORAGE_KEY);
            let history = existingData ? JSON.parse(existingData) : [];

            // Check if updating existing entry
            const existingIndex = history.findIndex((item) => item.id === analysisData.id);

            const dataToSave = {
                ...analysisData,
                profitMargin: parseFloat(profitMargin) || 10,
                fobData,
                savedAt: new Date().toISOString(),
            };

            if (existingIndex >= 0) {
                history[existingIndex] = dataToSave;
            } else {
                history.unshift(dataToSave);
                // Keep only last 50 entries
                if (history.length > 50) {
                    history = history.slice(0, 50);
                }
            }

            await AsyncStorage.setItem(FABRIC_ANALYSIS_STORAGE_KEY, JSON.stringify(history));
            setIsSaved(true);
            Alert.alert('Success', 'Analysis saved to history!');
        } catch (error) {
            Alert.alert('Error', 'Failed to save analysis: ' + error.message);
        }
    };

    const handleShare = async (type) => {
        const dataToShare = {
            ...analysisData,
            profitMargin: parseFloat(profitMargin) || 10,
            fobData,
        };

        try {
            switch (type) {
                case 'text':
                    await shareFabricAnalysisAsText(dataToShare);
                    break;
                case 'excel':
                    await shareFabricAnalysisAsExcel(dataToShare);
                    break;
                case 'pdf':
                    await shareFabricAnalysisAsPDF(dataToShare);
                    break;
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to share: ' + error.message);
        }
    };

    const getGarmentIcon = (type) => {
        switch (type) {
            case 'knit': return '👕';
            case 'woven': return '👔';
            case 'denim': return '👖';
            default: return '📦';
        }
    };

    const getGarmentLabel = (type) => {
        switch (type) {
            case 'knit': return 'Knit (T-Shirt/Polo)';
            case 'woven': return 'Woven (Shirt/Blouse)';
            case 'denim': return 'Denim (Jeans/Jacket)';
            default: return type;
        }
    };

    const formatNumber = (num, decimals = 2) => {
        if (num === undefined || num === null) return '-';
        return Number(num).toFixed(decimals);
    };

    const renderHeader = () => (
        <View style={styles.heroCard}>
            <View style={styles.heroHeader}>
                <Text style={styles.heroIcon}>{getGarmentIcon(analysisData.garmentType)}</Text>
                <View style={styles.heroInfo}>
                    <Text style={styles.heroStyle}>{analysisData.styleName || 'Style Analysis'}</Text>
                    {analysisData.buyerName && (
                        <Text style={styles.heroBuyer}>{analysisData.buyerName}</Text>
                    )}
                </View>
            </View>
            <View style={styles.heroDivider} />
            <Text style={styles.heroLabel}>FABRIC CONSUMPTION</Text>
            <View style={styles.heroValueRow}>
                <Text style={styles.heroValue}>{formatNumber(analysisData.actualConsumptionPerPiece, 4)}</Text>
                <Text style={styles.heroUnit}>{analysisData.unit}/pc</Text>
            </View>
            <View style={styles.heroSubValue}>
                <Text style={styles.heroSubValueText}>
                    {formatNumber(analysisData.consumptionPerDozen, 4)} {analysisData.unit}/dozen
                </Text>
            </View>
            <View style={styles.garmentBadge}>
                <Text style={styles.garmentBadgeText}>{getGarmentLabel(analysisData.garmentType)}</Text>
            </View>
        </View>
    );

    const renderConsumptionSummary = () => {
        const unit = analysisData.unit;

        return (
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <Text style={styles.cardIcon}>📦</Text>
                    <Text style={styles.cardTitle}>Consumption Summary</Text>
                </View>
                <View style={styles.cardContent}>
                    <View style={styles.statGrid}>
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{formatNumber(analysisData.theoreticalConsumptionPerPiece, 4)}</Text>
                            <Text style={styles.statLabel}>Theoretical ({unit}/pc)</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{formatNumber(analysisData.actualConsumptionPerPiece, 4)}</Text>
                            <Text style={styles.statLabel}>Actual ({unit}/pc)</Text>
                        </View>
                    </View>

                    <View style={styles.tableContainer}>
                        <View style={styles.tableRow}>
                            <Text style={styles.tableLabel}>Waste per Piece</Text>
                            <Text style={[styles.tableValue, styles.wasteText]}>
                                {formatNumber(analysisData.wastePerPiece, 4)} {unit}
                            </Text>
                        </View>
                        {analysisData.garmentType === 'denim' && analysisData.weightOzPerPiece && (
                            <View style={styles.tableRow}>
                                <Text style={styles.tableLabel}>Weight per Piece</Text>
                                <Text style={styles.tableValue}>
                                    {formatNumber(analysisData.weightOzPerPiece)} oz
                                </Text>
                            </View>
                        )}
                    </View>
                </View>
            </View>
        );
    };

    const renderOrderRequirements = () => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <Text style={styles.cardIcon}>📋</Text>
                <Text style={styles.cardTitle}>Order Requirements</Text>
            </View>
            <View style={styles.cardContent}>
                <View style={styles.orderHighlightBox}>
                    <Text style={styles.orderQtyLabel}>Order Quantity</Text>
                    <Text style={styles.orderQtyValue}>{analysisData.orderQuantity?.toLocaleString()} pcs</Text>
                </View>

                <View style={styles.tableContainer}>
                    <View style={styles.tableRow}>
                        <View style={styles.tableLabelRow}>
                            <Text style={styles.tableEmoji}>🧵</Text>
                            <Text style={styles.tableLabel}>Total Fabric Required</Text>
                        </View>
                        <Text style={[styles.tableValue, styles.primaryValue]}>
                            {formatNumber(analysisData.totalFabricRequired)} {analysisData.unit}
                        </Text>
                    </View>
                    <View style={styles.tableRow}>
                        <View style={styles.tableLabelRow}>
                            <Text style={styles.tableEmoji}>📏</Text>
                            <Text style={styles.tableLabel}>Total in Meters</Text>
                        </View>
                        <Text style={styles.tableValue}>
                            {formatNumber(analysisData.totalFabricMeters)} m
                        </Text>
                    </View>
                    {analysisData.totalFabricKg && (
                        <View style={styles.tableRow}>
                            <View style={styles.tableLabelRow}>
                                <Text style={styles.tableEmoji}>⚖️</Text>
                                <Text style={styles.tableLabel}>Total Weight</Text>
                            </View>
                            <Text style={styles.tableValue}>
                                {formatNumber(analysisData.totalFabricKg)} kg
                            </Text>
                        </View>
                    )}
                    <View style={styles.tableRow}>
                        <View style={styles.tableLabelRow}>
                            <Text style={styles.tableEmoji}>🗑️</Text>
                            <Text style={styles.tableLabel}>Total Waste</Text>
                        </View>
                        <Text style={[styles.tableValue, styles.wasteText]}>
                            {formatNumber(analysisData.totalWaste)} {analysisData.unit}
                        </Text>
                    </View>
                </View>
            </View>
        </View>
    );

    const renderEfficiencyMetrics = () => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <Text style={styles.cardIcon}>⚡</Text>
                <Text style={styles.cardTitle}>Efficiency Metrics</Text>
            </View>
            <View style={styles.cardContent}>
                <View style={styles.metricsGrid}>
                    <View style={styles.metricBox}>
                        <Text style={styles.metricValue}>{analysisData.markerEfficiency}%</Text>
                        <Text style={styles.metricLabel}>Marker Efficiency</Text>
                    </View>
                    <View style={styles.metricBox}>
                        <Text style={styles.metricValue}>
                            {formatNumber(analysisData.fabricUtilization)}%
                        </Text>
                        <Text style={styles.metricLabel}>Fabric Utilization</Text>
                    </View>
                    <View style={[styles.metricBox, styles.wasteMetricBox]}>
                        <Text style={[styles.metricValue, styles.wasteMetricValue]}>
                            {formatNumber(analysisData.wastePercentage)}%
                        </Text>
                        <Text style={styles.metricLabel}>Total Waste</Text>
                    </View>
                </View>

                <View style={styles.tableContainer}>
                    <View style={styles.tableRow}>
                        <Text style={styles.tableLabel}>Shrinkage (L × W)</Text>
                        <Text style={styles.tableValue}>
                            {analysisData.inputs?.shrinkageLength}% × {analysisData.inputs?.shrinkageWidth}%
                        </Text>
                    </View>
                    <View style={styles.tableRow}>
                        <Text style={styles.tableLabel}>Wastage Allowance</Text>
                        <Text style={styles.tableValue}>{analysisData.inputs?.wastage}%</Text>
                    </View>
                </View>
            </View>
        </View>
    );

    const renderCostBreakdown = () => {
        const priceUnit = analysisData.unit === 'kg' ? '/kg' : '/yard';
        const price = analysisData.fabricPricePerKg || analysisData.fabricPricePerYard;

        return (
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <Text style={styles.cardIcon}>💰</Text>
                    <Text style={styles.cardTitle}>Cost Breakdown</Text>
                    <View style={styles.currencyBadge}>
                        <Text style={styles.currencyBadgeText}>USD</Text>
                    </View>
                </View>
                <View style={styles.cardContent}>
                    <View style={styles.costHighlight}>
                        <View style={styles.costHighlightItem}>
                            <Text style={styles.costHighlightLabel}>Per Piece</Text>
                            <Text style={styles.costHighlightValue}>${formatNumber(analysisData.fabricCostPerPiece)}</Text>
                        </View>
                        <View style={styles.costHighlightDivider} />
                        <View style={styles.costHighlightItem}>
                            <Text style={styles.costHighlightLabel}>Per Dozen</Text>
                            <Text style={styles.costHighlightValue}>${formatNumber(analysisData.fabricCostPerDozen)}</Text>
                        </View>
                    </View>

                    <View style={styles.tableContainer}>
                        <View style={styles.tableRow}>
                            <Text style={styles.tableLabel}>Fabric Price</Text>
                            <Text style={styles.tableValue}>${formatNumber(price)}{priceUnit}</Text>
                        </View>
                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>Total Fabric Cost</Text>
                            <Text style={styles.totalValue}>
                                ${formatNumber(analysisData.totalFabricCost)}
                            </Text>
                        </View>
                    </View>
                </View>
            </View>
        );
    };

    const renderFOBImpact = () => {
        if (!fobData) return null;

        return (
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <Text style={styles.cardIcon}>📈</Text>
                    <Text style={styles.cardTitle}>FOB Impact</Text>
                </View>
                <View style={styles.cardContent}>
                    <View style={styles.profitInputRow}>
                        <Text style={styles.profitInputLabel}>Profit Margin</Text>
                        <View style={styles.profitInputContainer}>
                            <TextInput
                                style={styles.profitInput}
                                value={profitMargin}
                                onChangeText={setProfitMargin}
                                keyboardType="numeric"
                                selectTextOnFocus
                            />
                            <Text style={styles.profitPercent}>%</Text>
                        </View>
                        <View style={styles.profitPresets}>
                            {[5, 10, 15].map((preset) => (
                                <TouchableOpacity
                                    key={preset}
                                    style={[
                                        styles.presetButton,
                                        parseFloat(profitMargin) === preset && styles.presetButtonActive
                                    ]}
                                    onPress={() => setProfitMargin(String(preset))}
                                >
                                    <Text style={[
                                        styles.presetText,
                                        parseFloat(profitMargin) === preset && styles.presetTextActive
                                    ]}>{preset}%</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    <View style={styles.fobHighlightBox}>
                        <View style={styles.fobItem}>
                            <Text style={styles.fobLabel}>FOB/Piece</Text>
                            <Text style={styles.fobValue}>${formatNumber(fobData.fobPerPiece)}</Text>
                        </View>
                        <View style={styles.fobDivider} />
                        <View style={styles.fobItem}>
                            <Text style={styles.fobLabel}>FOB/Dozen</Text>
                            <Text style={styles.fobValue}>${formatNumber(fobData.fobPerDozen)}</Text>
                        </View>
                    </View>

                    <View style={styles.tableContainer}>
                        <View style={styles.tableRow}>
                            <Text style={styles.tableLabel}>Fabric Cost/Piece</Text>
                            <Text style={styles.tableValue}>${formatNumber(fobData.fabricCostPerPiece)}</Text>
                        </View>
                        <View style={styles.tableRow}>
                            <Text style={styles.tableLabel}>Other Costs/Piece</Text>
                            <Text style={styles.tableValue}>${formatNumber(fobData.otherCostsPerPiece)}</Text>
                        </View>
                        <View style={styles.tableRow}>
                            <Text style={styles.tableLabel}>Total Cost/Piece</Text>
                            <Text style={styles.tableValue}>${formatNumber(fobData.totalCostPerPiece)}</Text>
                        </View>
                        <View style={styles.dividerLine} />
                        <View style={styles.tableRow}>
                            <Text style={styles.tableLabel}>Fabric % of Cost</Text>
                            <Text style={[styles.tableValue, styles.percentValue]}>{formatNumber(fobData.fabricPercentageOfCost)}%</Text>
                        </View>
                        <View style={styles.tableRow}>
                            <Text style={styles.tableLabel}>Fabric % of FOB</Text>
                            <Text style={[styles.tableValue, styles.percentValue]}>{formatNumber(fobData.fabricPercentageOfFOB)}%</Text>
                        </View>
                    </View>
                </View>
            </View>
        );
    };

    const renderPatternDetails = () => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <Text style={styles.cardIcon}>📐</Text>
                <Text style={styles.cardTitle}>Pattern Details</Text>
            </View>
            <View style={styles.cardContent}>
                <View style={styles.tableContainer}>
                    <View style={styles.tableRow}>
                        <Text style={styles.tableLabel}>Original Pattern</Text>
                        <Text style={styles.tableValue}>
                            {analysisData.inputs?.patternLength} × {analysisData.inputs?.patternWidth}{' '}
                            {analysisData.garmentType === 'knit' ? 'cm' : 'in'}
                        </Text>
                    </View>
                    <View style={styles.tableRow}>
                        <Text style={styles.tableLabel}>Adjusted (after shrinkage)</Text>
                        <Text style={styles.tableValue}>
                            {formatNumber(analysisData.adjustedPatternLength)} × {formatNumber(analysisData.adjustedPatternWidth)}{' '}
                            {analysisData.garmentType === 'knit' ? 'cm' : 'in'}
                        </Text>
                    </View>
                    <View style={styles.tableRow}>
                        <Text style={styles.tableLabel}>Fabric Width</Text>
                        <Text style={styles.tableValue}>
                            {analysisData.inputs?.fabricWidth}{' '}
                            {analysisData.garmentType === 'knit' ? 'cm' : 'in'}
                        </Text>
                    </View>
                    {analysisData.patternsAcrossFabric && (
                        <View style={styles.tableRow}>
                            <Text style={styles.tableLabel}>Patterns Across Width</Text>
                            <Text style={styles.tableValue}>{analysisData.patternsAcrossFabric}</Text>
                        </View>
                    )}
                    {analysisData.garmentType === 'knit' && (
                        <View style={styles.tableRow}>
                            <Text style={styles.tableLabel}>GSM</Text>
                            <Text style={styles.tableValue}>{analysisData.inputs?.gsm}</Text>
                        </View>
                    )}
                    {analysisData.garmentType === 'denim' && (
                        <View style={styles.tableRow}>
                            <Text style={styles.tableLabel}>Fabric Weight</Text>
                            <Text style={styles.tableValue}>{analysisData.inputs?.fabricWeight} oz/sq.yd</Text>
                        </View>
                    )}
                </View>
            </View>
        </View>
    );

    const renderActions = () => (
        <View style={styles.actionsSection}>
            <Text style={styles.actionsTitle}>Share & Export</Text>
            <View style={styles.actionsRow}>
                <TouchableOpacity
                    style={[styles.actionButton, styles.saveButton, isSaved && styles.savedButton]}
                    onPress={saveToHistory}
                >
                    <Text style={styles.actionIcon}>{isSaved ? '✓' : '💾'}</Text>
                    <Text style={styles.actionLabel}>{isSaved ? 'Saved' : 'Save'}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.actionButton, styles.shareButton]}
                    onPress={() => handleShare('text')}
                >
                    <Text style={styles.actionIcon}>📤</Text>
                    <Text style={styles.actionLabel}>Share</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.actionButton, styles.excelButton]}
                    onPress={() => handleShare('excel')}
                >
                    <Text style={styles.actionIcon}>📊</Text>
                    <Text style={styles.actionLabel}>Excel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.actionButton, styles.pdfButton]}
                    onPress={() => handleShare('pdf')}
                >
                    <Text style={styles.actionIcon}>📄</Text>
                    <Text style={styles.actionLabel}>PDF</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
        >
            {renderHeader()}
            {renderConsumptionSummary()}
            {renderOrderRequirements()}
            {renderEfficiencyMetrics()}
            {renderCostBreakdown()}
            {renderFOBImpact()}
            {renderPatternDetails()}
            {renderActions()}

            <TouchableOpacity
                style={styles.newAnalysisButton}
                onPress={() => navigation.navigate('FabricAnalyzerInput')}
            >
                <Text style={styles.newAnalysisIcon}>+</Text>
                <Text style={styles.newAnalysisButtonText}>New Analysis</Text>
            </TouchableOpacity>

            <View style={styles.bottomPadding} />
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f0f2f5',
    },
    scrollContent: {
        padding: 16,
    },

    // Hero Card
    heroCard: {
        backgroundColor: '#28a745',
        borderRadius: 20,
        padding: 24,
        marginBottom: 16,
        shadowColor: '#28a745',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 8,
    },
    heroHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    heroIcon: {
        fontSize: 40,
        marginRight: 12,
    },
    heroInfo: {
        flex: 1,
    },
    heroStyle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#fff',
    },
    heroBuyer: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)',
        marginTop: 2,
    },
    heroDivider: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.2)',
        marginBottom: 16,
    },
    heroLabel: {
        fontSize: 11,
        fontWeight: '600',
        color: 'rgba(255,255,255,0.8)',
        letterSpacing: 1,
        textAlign: 'center',
        marginBottom: 8,
    },
    heroValueRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'center',
    },
    heroValue: {
        fontSize: 42,
        fontWeight: '800',
        color: '#fff',
    },
    heroUnit: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.8)',
        marginBottom: 8,
        marginLeft: 6,
    },
    heroSubValue: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 20,
        alignSelf: 'center',
        marginTop: 12,
    },
    heroSubValueText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    garmentBadge: {
        position: 'absolute',
        top: 16,
        right: 16,
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 10,
    },
    garmentBadgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '600',
    },

    // Cards
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
        overflow: 'hidden',
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 14,
        backgroundColor: '#f8f9fa',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    cardIcon: {
        fontSize: 18,
        marginRight: 10,
    },
    cardTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#333',
        flex: 1,
    },
    cardContent: {
        padding: 16,
    },
    currencyBadge: {
        backgroundColor: '#28a74515',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 10,
    },
    currencyBadgeText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#28a745',
    },

    // Stat Grid
    statGrid: {
        flexDirection: 'row',
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statDivider: {
        width: 1,
        backgroundColor: '#e0e0e0',
        marginHorizontal: 16,
    },
    statValue: {
        fontSize: 20,
        fontWeight: '700',
        color: '#28a745',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 11,
        color: '#666',
        textAlign: 'center',
    },

    // Table
    tableContainer: {
        marginTop: 4,
    },
    tableRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    tableLabelRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    tableEmoji: {
        fontSize: 14,
        marginRight: 8,
    },
    tableLabel: {
        fontSize: 14,
        color: '#555',
    },
    tableValue: {
        fontSize: 14,
        color: '#333',
        fontWeight: '600',
    },
    primaryValue: {
        color: '#28a745',
        fontWeight: '700',
    },
    wasteText: {
        color: '#dc3545',
    },
    percentValue: {
        color: '#007bff',
    },

    // Order Highlight
    orderHighlightBox: {
        backgroundColor: '#e8f5e9',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        alignItems: 'center',
    },
    orderQtyLabel: {
        fontSize: 12,
        color: '#2e7d32',
        marginBottom: 4,
    },
    orderQtyValue: {
        fontSize: 22,
        fontWeight: '700',
        color: '#2e7d32',
    },

    // Metrics Grid
    metricsGrid: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 12,
    },
    metricBox: {
        flex: 1,
        backgroundColor: '#f0f7ff',
        borderRadius: 12,
        padding: 14,
        alignItems: 'center',
    },
    wasteMetricBox: {
        backgroundColor: '#fff5f5',
    },
    metricValue: {
        fontSize: 20,
        fontWeight: '700',
        color: '#007bff',
        marginBottom: 4,
    },
    wasteMetricValue: {
        color: '#dc3545',
    },
    metricLabel: {
        fontSize: 10,
        color: '#666',
        textAlign: 'center',
    },

    // Cost Highlight
    costHighlight: {
        flexDirection: 'row',
        backgroundColor: '#28a74515',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#28a74530',
    },
    costHighlightItem: {
        flex: 1,
        alignItems: 'center',
    },
    costHighlightDivider: {
        width: 1,
        backgroundColor: '#28a74530',
        marginHorizontal: 16,
    },
    costHighlightLabel: {
        fontSize: 12,
        color: '#666',
        marginBottom: 4,
    },
    costHighlightValue: {
        fontSize: 22,
        fontWeight: '700',
        color: '#28a745',
    },

    // Total Row
    totalRow: {
        marginTop: 8,
        paddingTop: 12,
        borderTopWidth: 2,
        borderTopColor: '#28a745',
        borderBottomWidth: 0,
    },
    totalLabel: {
        fontSize: 15,
        fontWeight: '700',
        color: '#333',
    },
    totalValue: {
        fontSize: 18,
        fontWeight: '800',
        color: '#28a745',
    },

    // Profit Input
    profitInputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
    },
    profitInputLabel: {
        fontSize: 14,
        color: '#333',
        fontWeight: '600',
        marginRight: 12,
    },
    profitInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    profitInput: {
        backgroundColor: '#fff',
        borderWidth: 1.5,
        borderColor: '#28a745',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 6,
        fontSize: 18,
        fontWeight: '700',
        color: '#28a745',
        width: 60,
        textAlign: 'center',
    },
    profitPercent: {
        fontSize: 16,
        color: '#666',
        marginLeft: 4,
    },
    profitPresets: {
        flexDirection: 'row',
        marginLeft: 'auto',
        gap: 6,
    },
    presetButton: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 16,
        backgroundColor: '#e8e8e8',
    },
    presetButtonActive: {
        backgroundColor: '#28a745',
    },
    presetText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#666',
    },
    presetTextActive: {
        color: '#fff',
    },

    // FOB Highlight
    fobHighlightBox: {
        flexDirection: 'row',
        backgroundColor: '#28a745',
        borderRadius: 12,
        padding: 18,
        marginBottom: 12,
    },
    fobItem: {
        flex: 1,
        alignItems: 'center',
    },
    fobDivider: {
        width: 1,
        backgroundColor: 'rgba(255,255,255,0.3)',
        marginHorizontal: 16,
    },
    fobLabel: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.8)',
        marginBottom: 4,
    },
    fobValue: {
        fontSize: 24,
        fontWeight: '800',
        color: '#fff',
    },

    dividerLine: {
        height: 1,
        backgroundColor: '#e0e0e0',
        marginVertical: 8,
    },

    // Actions
    actionsSection: {
        marginBottom: 16,
    },
    actionsTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
        marginBottom: 12,
        textAlign: 'center',
    },
    actionsRow: {
        flexDirection: 'row',
        gap: 10,
    },
    actionButton: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 14,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    saveButton: {
        backgroundColor: '#28a745',
    },
    savedButton: {
        backgroundColor: '#6c757d',
    },
    shareButton: {
        backgroundColor: '#17a2b8',
    },
    excelButton: {
        backgroundColor: '#10b981',
    },
    pdfButton: {
        backgroundColor: '#ef4444',
    },
    actionIcon: {
        fontSize: 22,
        marginBottom: 4,
    },
    actionLabel: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '700',
    },

    // New Analysis Button
    newAnalysisButton: {
        backgroundColor: '#28a745',
        borderRadius: 14,
        paddingVertical: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#28a745',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    newAnalysisIcon: {
        fontSize: 22,
        color: '#fff',
        fontWeight: '700',
        marginRight: 8,
    },
    newAnalysisButtonText: {
        color: '#fff',
        fontSize: 17,
        fontWeight: '700',
    },

    bottomPadding: {
        height: 40,
    },
});

export default FabricAnalyzerResultScreen;
