/**
 * Scenario Simulator Screen
 * 
 * Interactive scenario simulation with adjustable sliders:
 * - Fabric price ± %
 * - Wastage % (linked to marker efficiency)
 * - Order quantity ± %
 * - Trims cost ± %
 * - CM cost ± %
 * 
 * Real-time updates for FOB, Margin %, and Risk level
 */

import Slider from '@react-native-community/slider';
import { useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import {
    CURRENCIES,
    getMarginStatusColor,
    runScenarioSimulation
} from '../utils/marginAnalyzer';

const ScenarioSimulatorScreen = ({ route, navigation }) => {
    const { inputs, analysis } = route.params;
    const currencySymbol = CURRENCIES[inputs.currency]?.symbol || '$';

    // Adjustment states (percentage changes)
    const [fabricPriceAdjust, setFabricPriceAdjust] = useState(0);
    const [wastageAdjust, setWastageAdjust] = useState(0);
    const [orderQuantityAdjust, setOrderQuantityAdjust] = useState(0);
    const [trimsCostAdjust, setTrimsCostAdjust] = useState(0);
    const [cmCostAdjust, setCmCostAdjust] = useState(0);

    // Run scenario simulation
    const scenario = runScenarioSimulation(analysis, {
        fabricPriceAdjust,
        wastageAdjust,
        orderQuantityAdjust,
        trimsCostAdjust,
        cmCostAdjust,
    });

    const resetAll = () => {
        setFabricPriceAdjust(0);
        setWastageAdjust(0);
        setOrderQuantityAdjust(0);
        setTrimsCostAdjust(0);
        setCmCostAdjust(0);
    };

    const renderSlider = (label, value, setter, emoji, color, min = -30, max = 30) => {
        const isPositive = value > 0;
        const isNegative = value < 0;

        return (
            <View style={styles.sliderCard}>
                <View style={styles.sliderHeader}>
                    <Text style={styles.sliderEmoji}>{emoji}</Text>
                    <Text style={styles.sliderLabel}>{label}</Text>
                    <View style={[
                        styles.sliderValueBadge,
                        isPositive && styles.valueBadgePositive,
                        isNegative && styles.valueBadgeNegative,
                    ]}>
                        <Text style={[
                            styles.sliderValue,
                            isPositive && styles.valuePositive,
                            isNegative && styles.valueNegative,
                        ]}>
                            {value > 0 ? '+' : ''}{value.toFixed(0)}%
                        </Text>
                    </View>
                </View>
                <Slider
                    style={styles.slider}
                    minimumValue={min}
                    maximumValue={max}
                    step={1}
                    value={value}
                    onValueChange={setter}
                    minimumTrackTintColor={color}
                    maximumTrackTintColor="#e9ecef"
                    thumbTintColor={color}
                />
                <View style={styles.sliderLabels}>
                    <Text style={styles.sliderMinMax}>{min}%</Text>
                    <TouchableOpacity
                        style={styles.resetButton}
                        onPress={() => setter(0)}
                    >
                        <Text style={styles.resetButtonText}>Reset</Text>
                    </TouchableOpacity>
                    <Text style={styles.sliderMinMax}>+{max}%</Text>
                </View>
            </View>
        );
    };

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerIcon}>🎮</Text>
                <Text style={styles.headerTitle}>Scenario Simulator</Text>
                <Text style={styles.headerSubtitle}>Adjust variables to see margin impact</Text>
            </View>

            {/* Live Results Card */}
            <View style={styles.resultsCard}>
                <View style={styles.resultsRow}>
                    {/* Original vs Scenario Margin */}
                    <View style={styles.resultItem}>
                        <Text style={styles.resultLabel}>Original Margin</Text>
                        <Text style={styles.resultValueSmall}>{analysis.marginPercent.toFixed(1)}%</Text>
                    </View>

                    <View style={styles.resultArrow}>
                        <Text style={styles.resultArrowText}>→</Text>
                    </View>

                    <View style={styles.resultItem}>
                        <Text style={styles.resultLabel}>Scenario Margin</Text>
                        <Text style={[
                            styles.resultValueLarge,
                            { color: getMarginStatusColor(scenario.scenarioMarginPercent) }
                        ]}>
                            {scenario.scenarioMarginPercent.toFixed(1)}%
                        </Text>
                    </View>
                </View>

                {/* Change Indicator */}
                <View style={[
                    styles.changeIndicator,
                    scenario.isImproved ? styles.changePositive : styles.changeNegative
                ]}>
                    <Text style={styles.changeIcon}>
                        {scenario.isImproved ? '📈' : '📉'}
                    </Text>
                    <Text style={styles.changeText}>
                        {scenario.marginChange >= 0 ? '+' : ''}{scenario.marginChange.toFixed(1)}% margin change
                    </Text>
                </View>

                {/* Risk Level */}
                <View style={styles.riskRow}>
                    <Text style={styles.riskLabel}>Risk Level:</Text>
                    <View style={[styles.riskBadge, { backgroundColor: scenario.riskColor }]}>
                        <Text style={styles.riskBadgeText}>{scenario.riskLevel}</Text>
                    </View>
                </View>
            </View>

            {/* FOB Comparison Card */}
            <View style={styles.fobCard}>
                <View style={styles.fobRow}>
                    <View style={styles.fobItem}>
                        <Text style={styles.fobLabel}>Original FOB</Text>
                        <Text style={styles.fobValue}>
                            {currencySymbol}{analysis.targetFobWithProfit.toFixed(2)}
                        </Text>
                    </View>
                    <View style={styles.fobDivider} />
                    <View style={styles.fobItem}>
                        <Text style={styles.fobLabel}>Scenario FOB</Text>
                        <Text style={[
                            styles.fobValue,
                            scenario.scenarioFob > analysis.targetFobWithProfit
                                ? styles.fobHigher
                                : styles.fobLower
                        ]}>
                            {currencySymbol}{scenario.scenarioFob.toFixed(2)}
                        </Text>
                    </View>
                </View>
                <View style={styles.fobChangeRow}>
                    <Text style={styles.fobChangeLabel}>Cost Change:</Text>
                    <Text style={[
                        styles.fobChangeValue,
                        scenario.costChangePercent > 0 ? styles.costUp : styles.costDown
                    ]}>
                        {scenario.costChangePercent > 0 ? '↑' : '↓'}
                        {currencySymbol}{Math.abs(scenario.costChange).toFixed(2)}
                        ({scenario.costChangePercent > 0 ? '+' : ''}{scenario.costChangePercent.toFixed(1)}%)
                    </Text>
                </View>
            </View>

            {/* Scenario Sliders */}
            <View style={styles.slidersSection}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Adjust Variables</Text>
                    <TouchableOpacity style={styles.resetAllButton} onPress={resetAll}>
                        <Text style={styles.resetAllText}>Reset All</Text>
                    </TouchableOpacity>
                </View>

                {renderSlider('Fabric Price', fabricPriceAdjust, setFabricPriceAdjust, '🧵', '#007bff')}
                {renderSlider('Trims Cost', trimsCostAdjust, setTrimsCostAdjust, '🔘', '#28a745')}
                {renderSlider('CM / Making Cost', cmCostAdjust, setCmCostAdjust, '✂️', '#fd7e14')}
                {renderSlider('Order Quantity', orderQuantityAdjust, setOrderQuantityAdjust, '📦', '#6f42c1', -50, 100)}
            </View>

            {/* Adjusted Values Summary */}
            <View style={styles.summaryCard}>
                <View style={styles.summaryHeader}>
                    <Text style={styles.summaryIcon}>📋</Text>
                    <Text style={styles.summaryTitle}>Scenario Summary</Text>
                </View>

                <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Fabric Cost</Text>
                    <View style={styles.summaryValues}>
                        <Text style={styles.summaryOriginal}>
                            {currencySymbol}{analysis.costBreakdown.fabric.value.toFixed(2)}
                        </Text>
                        <Text style={styles.summaryArrow}>→</Text>
                        <Text style={[
                            styles.summaryNew,
                            scenario.adjustedCosts.fabric > analysis.costBreakdown.fabric.value
                                ? styles.valueUp : styles.valueDown
                        ]}>
                            {currencySymbol}{scenario.adjustedCosts.fabric.toFixed(2)}
                        </Text>
                    </View>
                </View>

                <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Trims Cost</Text>
                    <View style={styles.summaryValues}>
                        <Text style={styles.summaryOriginal}>
                            {currencySymbol}{analysis.costBreakdown.trims.value.toFixed(2)}
                        </Text>
                        <Text style={styles.summaryArrow}>→</Text>
                        <Text style={[
                            styles.summaryNew,
                            scenario.adjustedCosts.trims > analysis.costBreakdown.trims.value
                                ? styles.valueUp : styles.valueDown
                        ]}>
                            {currencySymbol}{scenario.adjustedCosts.trims.toFixed(2)}
                        </Text>
                    </View>
                </View>

                <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>CM Cost</Text>
                    <View style={styles.summaryValues}>
                        <Text style={styles.summaryOriginal}>
                            {currencySymbol}{analysis.costBreakdown.cm.value.toFixed(2)}
                        </Text>
                        <Text style={styles.summaryArrow}>→</Text>
                        <Text style={[
                            styles.summaryNew,
                            scenario.adjustedCosts.cm > analysis.costBreakdown.cm.value
                                ? styles.valueUp : styles.valueDown
                        ]}>
                            {currencySymbol}{scenario.adjustedCosts.cm.toFixed(2)}
                        </Text>
                    </View>
                </View>

                <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Order Qty</Text>
                    <View style={styles.summaryValues}>
                        <Text style={styles.summaryOriginal}>
                            {analysis.inputs.orderQuantity.toLocaleString()}
                        </Text>
                        <Text style={styles.summaryArrow}>→</Text>
                        <Text style={[
                            styles.summaryNew,
                            scenario.adjustedQuantity > analysis.inputs.orderQuantity
                                ? styles.valueDown : styles.valueUp
                        ]}>
                            {scenario.adjustedQuantity.toLocaleString()}
                        </Text>
                    </View>
                </View>

                <View style={styles.summaryDivider} />

                <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabelBold}>Total Cost</Text>
                    <View style={styles.summaryValues}>
                        <Text style={styles.summaryOriginal}>
                            {currencySymbol}{analysis.totalCost.toFixed(2)}
                        </Text>
                        <Text style={styles.summaryArrow}>→</Text>
                        <Text style={[
                            styles.summaryNewBold,
                            scenario.newTotalCost > analysis.totalCost
                                ? styles.valueUp : styles.valueDown
                        ]}>
                            {currencySymbol}{scenario.newTotalCost.toFixed(2)}
                        </Text>
                    </View>
                </View>
            </View>

            {/* Insights Card */}
            <View style={styles.insightsCard}>
                <Text style={styles.insightsTitle}>💡 Quick Insights</Text>

                {scenario.marginChange > 5 && (
                    <Text style={styles.insightPositive}>
                        ✓ This scenario significantly improves margins by {scenario.marginChange.toFixed(1)}%
                    </Text>
                )}

                {scenario.marginChange < -5 && (
                    <Text style={styles.insightNegative}>
                        ✗ This scenario would erode margins by {Math.abs(scenario.marginChange).toFixed(1)}%
                    </Text>
                )}

                {orderQuantityAdjust > 20 && (
                    <Text style={styles.insightInfo}>
                        ℹ️ Increasing order quantity improves efficiency but requires buyer commitment
                    </Text>
                )}

                {fabricPriceAdjust < -10 && (
                    <Text style={styles.insightWarning}>
                        ⚠️ Significant fabric cost reduction may require quality trade-offs
                    </Text>
                )}

                {scenario.riskLevel === 'Critical' && (
                    <Text style={styles.insightDanger}>
                        🚨 This scenario results in critically low margins - not recommended
                    </Text>
                )}
            </View>

            {/* Apply Button */}
            <TouchableOpacity
                style={styles.applyButton}
                onPress={() => navigation.goBack()}
            >
                <Text style={styles.applyButtonText}>← Back to Analysis</Text>
            </TouchableOpacity>

            <View style={styles.bottomPadding} />
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f0f2f5' },

    // Header
    header: {
        alignItems: 'center',
        paddingTop: 20,
        paddingBottom: 24,
        backgroundColor: '#6f42c1',
    },
    headerIcon: { fontSize: 40, marginBottom: 8 },
    headerTitle: { fontSize: 24, fontWeight: '700', color: '#fff' },
    headerSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 },

    // Results Card
    resultsCard: {
        backgroundColor: '#fff',
        marginHorizontal: 16,
        marginTop: -12,
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
    },
    resultsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
    resultItem: { alignItems: 'center', flex: 1 },
    resultLabel: { fontSize: 12, color: '#888', marginBottom: 4 },
    resultValueSmall: { fontSize: 20, fontWeight: '600', color: '#666' },
    resultValueLarge: { fontSize: 32, fontWeight: '800' },
    resultArrow: { paddingHorizontal: 16 },
    resultArrowText: { fontSize: 24, color: '#ccc' },

    changeIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 10,
        marginTop: 16,
    },
    changePositive: { backgroundColor: '#d4edda' },
    changeNegative: { backgroundColor: '#f8d7da' },
    changeIcon: { fontSize: 18, marginRight: 8 },
    changeText: { fontSize: 14, fontWeight: '600', color: '#333' },

    riskRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 12 },
    riskLabel: { fontSize: 13, color: '#666', marginRight: 8 },
    riskBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8 },
    riskBadgeText: { fontSize: 12, fontWeight: '700', color: '#fff' },

    // FOB Card
    fobCard: {
        backgroundColor: '#1a1a2e',
        marginHorizontal: 16,
        marginTop: 16,
        borderRadius: 14,
        padding: 16,
    },
    fobRow: { flexDirection: 'row', alignItems: 'center' },
    fobItem: { flex: 1, alignItems: 'center' },
    fobLabel: { fontSize: 11, color: '#888', marginBottom: 4 },
    fobValue: { fontSize: 22, fontWeight: '700', color: '#fff' },
    fobHigher: { color: '#ff6b6b' },
    fobLower: { color: '#51cf66' },
    fobDivider: { width: 1, height: 40, backgroundColor: '#333' },
    fobChangeRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 12 },
    fobChangeLabel: { fontSize: 12, color: '#888', marginRight: 8 },
    fobChangeValue: { fontSize: 13, fontWeight: '600' },
    costUp: { color: '#ff6b6b' },
    costDown: { color: '#51cf66' },

    // Sliders Section
    slidersSection: { marginTop: 16 },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginHorizontal: 16,
        marginBottom: 12,
    },
    sectionTitle: { fontSize: 15, fontWeight: '700', color: '#1a1a2e' },
    resetAllButton: {
        backgroundColor: '#e9ecef',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8
    },
    resetAllText: { fontSize: 12, fontWeight: '600', color: '#666' },

    // Slider Card
    sliderCard: {
        backgroundColor: '#fff',
        marginHorizontal: 16,
        marginBottom: 12,
        borderRadius: 12,
        padding: 16,
    },
    sliderHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    sliderEmoji: { fontSize: 20, marginRight: 10 },
    sliderLabel: { flex: 1, fontSize: 15, fontWeight: '600', color: '#333' },
    sliderValueBadge: {
        backgroundColor: '#f0f0f0',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 8,
        minWidth: 60,
        alignItems: 'center',
    },
    valueBadgePositive: { backgroundColor: '#ff6b6b20' },
    valueBadgeNegative: { backgroundColor: '#51cf6620' },
    sliderValue: { fontSize: 14, fontWeight: '700', color: '#666' },
    valuePositive: { color: '#dc3545' },
    valueNegative: { color: '#28a745' },
    slider: { width: '100%', height: 40 },
    sliderLabels: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    sliderMinMax: { fontSize: 11, color: '#aaa' },
    resetButton: {
        backgroundColor: '#f0f0f0',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6
    },
    resetButtonText: { fontSize: 11, fontWeight: '600', color: '#666' },

    // Summary Card
    summaryCard: {
        backgroundColor: '#fff',
        marginHorizontal: 16,
        marginTop: 4,
        borderRadius: 14,
        padding: 16,
    },
    summaryHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
    summaryIcon: { fontSize: 18, marginRight: 10 },
    summaryTitle: { fontSize: 15, fontWeight: '700', color: '#1a1a2e' },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
    },
    summaryLabel: { fontSize: 14, color: '#666' },
    summaryLabelBold: { fontSize: 14, fontWeight: '700', color: '#1a1a2e' },
    summaryValues: { flexDirection: 'row', alignItems: 'center' },
    summaryOriginal: { fontSize: 13, color: '#888', textDecorationLine: 'line-through' },
    summaryArrow: { fontSize: 12, color: '#ccc', marginHorizontal: 8 },
    summaryNew: { fontSize: 14, fontWeight: '600', color: '#333' },
    summaryNewBold: { fontSize: 15, fontWeight: '700' },
    valueUp: { color: '#dc3545' },
    valueDown: { color: '#28a745' },
    summaryDivider: { height: 1, backgroundColor: '#e9ecef', marginVertical: 8 },

    // Insights Card
    insightsCard: {
        backgroundColor: '#fff',
        marginHorizontal: 16,
        marginTop: 12,
        borderRadius: 14,
        padding: 16,
    },
    insightsTitle: { fontSize: 15, fontWeight: '700', color: '#1a1a2e', marginBottom: 12 },
    insightPositive: {
        fontSize: 13,
        color: '#155724',
        backgroundColor: '#d4edda',
        padding: 10,
        borderRadius: 8,
        marginBottom: 8,
    },
    insightNegative: {
        fontSize: 13,
        color: '#721c24',
        backgroundColor: '#f8d7da',
        padding: 10,
        borderRadius: 8,
        marginBottom: 8,
    },
    insightInfo: {
        fontSize: 13,
        color: '#0c5460',
        backgroundColor: '#d1ecf1',
        padding: 10,
        borderRadius: 8,
        marginBottom: 8,
    },
    insightWarning: {
        fontSize: 13,
        color: '#856404',
        backgroundColor: '#fff3cd',
        padding: 10,
        borderRadius: 8,
        marginBottom: 8,
    },
    insightDanger: {
        fontSize: 13,
        color: '#721c24',
        backgroundColor: '#f8d7da',
        padding: 10,
        borderRadius: 8,
        marginBottom: 8,
        fontWeight: '600',
    },

    // Apply Button
    applyButton: {
        backgroundColor: '#1a1a2e',
        marginHorizontal: 16,
        marginTop: 20,
        paddingVertical: 16,
        borderRadius: 14,
        alignItems: 'center',
    },
    applyButtonText: { fontSize: 16, fontWeight: '700', color: '#fff' },

    bottomPadding: { height: 40 },
});

export default ScenarioSimulatorScreen;
