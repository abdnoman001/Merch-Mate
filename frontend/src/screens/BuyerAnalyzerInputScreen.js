/**
 * Buyer-Centric Cost & Margin Analyzer - Input Screen
 * 
 * Collects all pricing, order, and cost structure inputs.
 * Integrates with existing FOB and Fabric Analyzer data.
 */

import { useEffect, useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { calculateMarginAnalysis, CURRENCIES, INCOTERMS, saveMarginAnalysis } from '../utils/marginAnalyzer';

const BuyerAnalyzerInputScreen = ({ navigation, route }) => {
    const editData = route?.params?.editData;
    const importedFobData = route?.params?.fobData; // Data from FOB calculator
    const importedFabricData = route?.params?.fabricData; // Data from Fabric Analyzer

    // ========== PRICING & ORDER CONTEXT ==========
    const [buyerTargetFob, setBuyerTargetFob] = useState('');
    const [quotedFob, setQuotedFob] = useState('');
    const [orderQuantity, setOrderQuantity] = useState('');
    const [currency, setCurrency] = useState('USD');
    const [incoterm, setIncoterm] = useState('FOB');
    const [styleName, setStyleName] = useState('');
    const [buyerName, setBuyerName] = useState('');

    // ========== COST STRUCTURE ==========
    const [fabricCost, setFabricCost] = useState('');
    const [trimsCost, setTrimsCost] = useState('');
    const [packagingCost, setPackagingCost] = useState('');
    const [cmCost, setCmCost] = useState('');
    const [washingCost, setWashingCost] = useState('');
    const [testingCost, setTestingCost] = useState('');
    const [logisticsCost, setLogisticsCost] = useState('');
    const [overheadCost, setOverheadCost] = useState('');
    const [targetProfitPercent, setTargetProfitPercent] = useState('15');

    // ========== COST TOGGLES (for scenario analysis) ==========
    const [costToggles, setCostToggles] = useState({
        fabric: true,
        trims: true,
        packaging: true,
        cm: true,
        washing: true,
        testing: true,
        logistics: true,
        overhead: true,
    });

    const [loading, setLoading] = useState(false);
    const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
    const [showIncotermPicker, setShowIncotermPicker] = useState(false);

    // Load edit data or imported data
    useEffect(() => {
        if (editData?.inputs) {
            const inputs = editData.inputs;
            setBuyerTargetFob(inputs.buyerTargetFob?.toString() || '');
            setQuotedFob(inputs.quotedFob?.toString() || '');
            setOrderQuantity(inputs.orderQuantity?.toString() || '');
            setCurrency(inputs.currency || 'USD');
            setIncoterm(inputs.incoterm || 'FOB');
            setStyleName(inputs.styleName || '');
            setBuyerName(inputs.buyerName || '');
            setFabricCost(inputs.fabricCost?.toString() || '');
            setTrimsCost(inputs.trimsCost?.toString() || '');
            setPackagingCost(inputs.packagingCost?.toString() || '');
            setCmCost(inputs.cmCost?.toString() || '');
            setWashingCost(inputs.washingCost?.toString() || '');
            setTestingCost(inputs.testingCost?.toString() || '');
            setLogisticsCost(inputs.logisticsCost?.toString() || '');
            setOverheadCost(inputs.overheadCost?.toString() || '');
            setTargetProfitPercent(inputs.targetProfitPercent?.toString() || '15');
            if (inputs.costToggles) setCostToggles(inputs.costToggles);
        }
    }, [editData]);

    // Import from FOB Calculator
    useEffect(() => {
        if (importedFobData) {
            const { inputs, breakdown } = importedFobData;
            setQuotedFob(breakdown.final_fob_per_pc?.toFixed(2) || '');
            setStyleName(inputs.style_name || '');
            setBuyerName(inputs.buyer_name || '');
            setFabricCost(breakdown.fabric_cost_per_pc?.toFixed(2) || '');
            setTrimsCost((inputs.accessories_cost_per_pc || 0).toFixed(2));
            setCmCost((inputs.cm_cost_per_pc || 0).toFixed(2));
            setWashingCost(((inputs.washing_cost_per_pc || 0) + (inputs.aop_print_cost_per_pc || 0)).toFixed(2));
            setTestingCost((inputs.testing_cost_per_pc || 0).toFixed(2));
            setLogisticsCost((inputs.commercial_cost_per_pc || 0).toFixed(2));
            setTargetProfitPercent((inputs.profit_margin_percent || 15).toString());

            // Show success notification
            Alert.alert(
                '✅ Import Successful',
                `FOB sheet "${inputs.style_name || 'Untitled'}" imported.\nQuoted FOB: $${breakdown.final_fob_per_pc?.toFixed(2)}/pc`,
                [{ text: 'OK' }]
            );
        }
    }, [importedFobData]);

    // Import from Fabric Analyzer (kept for future use)
    useEffect(() => {
        if (importedFabricData) {
            setFabricCost(importedFabricData.fabricCostPerPiece?.toFixed(2) || '');
            if (importedFabricData.styleName) setStyleName(importedFabricData.styleName);
            if (importedFabricData.buyerName) setBuyerName(importedFabricData.buyerName);
            if (importedFabricData.orderQuantity) setOrderQuantity(importedFabricData.orderQuantity.toString());
        }
    }, [importedFabricData]);

    const handleNumericChange = (setter) => (value) => {
        if (value === '' || value === '-' || value === '.' || /^-?\d*\.?\d*$/.test(value)) {
            setter(value);
        }
    };

    const toggleCost = (key) => {
        setCostToggles(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const calculateTotalCost = () => {
        let total = 0;
        if (costToggles.fabric) total += parseFloat(fabricCost) || 0;
        if (costToggles.trims) total += parseFloat(trimsCost) || 0;
        if (costToggles.packaging) total += parseFloat(packagingCost) || 0;
        if (costToggles.cm) total += parseFloat(cmCost) || 0;
        if (costToggles.washing) total += parseFloat(washingCost) || 0;
        if (costToggles.testing) total += parseFloat(testingCost) || 0;
        if (costToggles.logistics) total += parseFloat(logisticsCost) || 0;
        if (costToggles.overhead) total += parseFloat(overheadCost) || 0;
        return total;
    };

    const handleAnalyze = async () => {
        // Validation
        if (!buyerTargetFob || parseFloat(buyerTargetFob) <= 0) {
            Alert.alert('Missing Input', 'Please enter the Buyer Target FOB price.');
            return;
        }

        const totalCost = calculateTotalCost();
        if (totalCost <= 0) {
            Alert.alert('Missing Input', 'Please enter at least one cost component.');
            return;
        }

        setLoading(true);
        try {
            const inputs = {
                buyerTargetFob: parseFloat(buyerTargetFob),
                quotedFob: parseFloat(quotedFob) || 0,
                orderQuantity: parseInt(orderQuantity) || 1000,
                currency,
                incoterm,
                styleName,
                buyerName,
                fabricCost: parseFloat(fabricCost) || 0,
                trimsCost: parseFloat(trimsCost) || 0,
                packagingCost: parseFloat(packagingCost) || 0,
                cmCost: parseFloat(cmCost) || 0,
                washingCost: parseFloat(washingCost) || 0,
                testingCost: parseFloat(testingCost) || 0,
                logisticsCost: parseFloat(logisticsCost) || 0,
                overheadCost: parseFloat(overheadCost) || 0,
                targetProfitPercent: parseFloat(targetProfitPercent) || 15,
                costToggles,
            };

            const analysis = calculateMarginAnalysis(inputs);
            await saveMarginAnalysis(inputs, analysis);

            setLoading(false);
            navigation.navigate('BuyerAnalyzerResult', { inputs, analysis });
        } catch (error) {
            setLoading(false);
            console.error(error);
            Alert.alert('Error', 'Analysis failed. Please check your inputs.');
        }
    };

    const currencySymbol = CURRENCIES[currency]?.symbol || '$';
    const totalCost = calculateTotalCost();
    const previewMargin = parseFloat(buyerTargetFob) > 0
        ? ((parseFloat(buyerTargetFob) - totalCost) / parseFloat(buyerTargetFob) * 100).toFixed(1)
        : '0.0';

    const renderCostInput = (label, value, setter, emoji, toggleKey) => {
        const isEnabled = costToggles[toggleKey];
        const numValue = parseFloat(value) || 0;
        const percentOfTarget = parseFloat(buyerTargetFob) > 0
            ? ((numValue / parseFloat(buyerTargetFob)) * 100).toFixed(1)
            : '0.0';

        return (
            <View style={[styles.costRow, !isEnabled && styles.costRowDisabled]}>
                <View style={styles.costToggle}>
                    <Switch
                        value={isEnabled}
                        onValueChange={() => toggleCost(toggleKey)}
                        trackColor={{ false: '#ddd', true: '#007bff40' }}
                        thumbColor={isEnabled ? '#007bff' : '#999'}
                    />
                </View>
                <View style={styles.costContent}>
                    <View style={styles.costLabelRow}>
                        <Text style={styles.costEmoji}>{emoji}</Text>
                        <Text style={[styles.costLabel, !isEnabled && styles.costLabelDisabled]}>{label}</Text>
                        {numValue > 0 && isEnabled && (
                            <View style={styles.percentBadge}>
                                <Text style={styles.percentText}>{percentOfTarget}%</Text>
                            </View>
                        )}
                    </View>
                    <View style={styles.costInputWrapper}>
                        <Text style={styles.currencyPrefix}>{currencySymbol}</Text>
                        <TextInput
                            style={[styles.costInput, !isEnabled && styles.costInputDisabled]}
                            keyboardType="decimal-pad"
                            value={value}
                            onChangeText={handleNumericChange(setter)}
                            placeholder="0.00"
                            placeholderTextColor="#aaa"
                            editable={isEnabled}
                        />
                        <Text style={styles.unitSuffix}>/pc</Text>
                    </View>
                </View>
            </View>
        );
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.headerIcon}>📊</Text>
                    <Text style={styles.headerTitle}>Margin Analyzer</Text>
                    <Text style={styles.headerSubtitle}>Buyer-Centric Cost & Margin Analysis</Text>
                </View>

                {/* Style Info Card */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Text style={styles.cardIcon}>🏷️</Text>
                        <Text style={styles.cardTitle}>Style Information</Text>
                    </View>
                    <View style={styles.cardContent}>
                        <View style={styles.inputRow}>
                            <View style={styles.inputHalf}>
                                <Text style={styles.inputLabel}>Style Name</Text>
                                <TextInput
                                    style={styles.input}
                                    value={styleName}
                                    onChangeText={setStyleName}
                                    placeholder="e.g. SS24-001"
                                    placeholderTextColor="#aaa"
                                />
                            </View>
                            <View style={styles.inputHalf}>
                                <Text style={styles.inputLabel}>Buyer</Text>
                                <TextInput
                                    style={styles.input}
                                    value={buyerName}
                                    onChangeText={setBuyerName}
                                    placeholder="e.g. H&M"
                                    placeholderTextColor="#aaa"
                                />
                            </View>
                        </View>
                    </View>
                </View>

                {/* Pricing Context Card */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Text style={styles.cardIcon}>💰</Text>
                        <Text style={styles.cardTitle}>Pricing & Order</Text>
                    </View>
                    <View style={styles.cardContent}>
                        {/* Currency & Incoterm Row */}
                        <View style={styles.inputRow}>
                            <View style={styles.inputHalf}>
                                <Text style={styles.inputLabel}>Currency</Text>
                                <TouchableOpacity
                                    style={styles.pickerButton}
                                    onPress={() => setShowCurrencyPicker(!showCurrencyPicker)}
                                >
                                    <Text style={styles.pickerButtonText}>
                                        {CURRENCIES[currency]?.symbol} {currency}
                                    </Text>
                                    <Text style={styles.pickerArrow}>▼</Text>
                                </TouchableOpacity>
                                {showCurrencyPicker && (
                                    <View style={styles.pickerDropdown}>
                                        {Object.entries(CURRENCIES).map(([key, val]) => (
                                            <TouchableOpacity
                                                key={key}
                                                style={[styles.pickerOption, currency === key && styles.pickerOptionActive]}
                                                onPress={() => { setCurrency(key); setShowCurrencyPicker(false); }}
                                            >
                                                <Text style={[styles.pickerOptionText, currency === key && styles.pickerOptionTextActive]}>
                                                    {val.symbol} {key}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                )}
                            </View>
                            <View style={styles.inputHalf}>
                                <Text style={styles.inputLabel}>Incoterm</Text>
                                <TouchableOpacity
                                    style={styles.pickerButton}
                                    onPress={() => setShowIncotermPicker(!showIncotermPicker)}
                                >
                                    <Text style={styles.pickerButtonText}>{incoterm}</Text>
                                    <Text style={styles.pickerArrow}>▼</Text>
                                </TouchableOpacity>
                                {showIncotermPicker && (
                                    <View style={styles.pickerDropdown}>
                                        {Object.keys(INCOTERMS).map((key) => (
                                            <TouchableOpacity
                                                key={key}
                                                style={[styles.pickerOption, incoterm === key && styles.pickerOptionActive]}
                                                onPress={() => { setIncoterm(key); setShowIncotermPicker(false); }}
                                            >
                                                <Text style={[styles.pickerOptionText, incoterm === key && styles.pickerOptionTextActive]}>
                                                    {key}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                )}
                            </View>
                        </View>

                        {/* Target & Quoted FOB */}
                        <View style={styles.inputRow}>
                            <View style={styles.inputHalf}>
                                <Text style={styles.inputLabel}>Buyer Target FOB *</Text>
                                <View style={styles.currencyInputWrapper}>
                                    <Text style={styles.currencyPrefix}>{currencySymbol}</Text>
                                    <TextInput
                                        style={styles.currencyInput}
                                        keyboardType="decimal-pad"
                                        value={buyerTargetFob}
                                        onChangeText={handleNumericChange(setBuyerTargetFob)}
                                        placeholder="0.00"
                                        placeholderTextColor="#aaa"
                                    />
                                </View>
                            </View>
                            <View style={styles.inputHalf}>
                                <Text style={styles.inputLabel}>Your Quoted FOB</Text>
                                <View style={styles.currencyInputWrapper}>
                                    <Text style={styles.currencyPrefix}>{currencySymbol}</Text>
                                    <TextInput
                                        style={styles.currencyInput}
                                        keyboardType="decimal-pad"
                                        value={quotedFob}
                                        onChangeText={handleNumericChange(setQuotedFob)}
                                        placeholder="0.00"
                                        placeholderTextColor="#aaa"
                                    />
                                </View>
                            </View>
                        </View>

                        {/* Order Quantity */}
                        <View style={styles.inputWrapper}>
                            <Text style={styles.inputLabel}>Order Quantity (pieces)</Text>
                            <TextInput
                                style={styles.input}
                                keyboardType="number-pad"
                                value={orderQuantity}
                                onChangeText={handleNumericChange(setOrderQuantity)}
                                placeholder="e.g. 5000"
                                placeholderTextColor="#aaa"
                            />
                        </View>
                    </View>
                </View>

                {/* Cost Structure Card */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Text style={styles.cardIcon}>📋</Text>
                        <Text style={styles.cardTitle}>Cost Structure</Text>
                        <View style={styles.cardBadge}>
                            <Text style={styles.cardBadgeText}>per piece</Text>
                        </View>
                    </View>
                    <Text style={styles.cardHint}>
                        Toggle costs on/off for scenario analysis. Percentages show share of buyer target FOB.
                    </Text>
                    <View style={styles.costList}>
                        {renderCostInput('Fabric Cost', fabricCost, setFabricCost, '🧵', 'fabric')}
                        {renderCostInput('Trims & Accessories', trimsCost, setTrimsCost, '🔘', 'trims')}
                        {renderCostInput('Packaging', packagingCost, setPackagingCost, '📦', 'packaging')}
                        {renderCostInput('CM / Making Cost', cmCost, setCmCost, '✂️', 'cm')}
                        {renderCostInput('Washing / Print / Embellishment', washingCost, setWashingCost, '💧', 'washing')}
                        {renderCostInput('Testing & Compliance', testingCost, setTestingCost, '🔬', 'testing')}
                        {renderCostInput('Logistics & Documentation', logisticsCost, setLogisticsCost, '🚢', 'logistics')}
                        {renderCostInput('Overhead Allocation', overheadCost, setOverheadCost, '🏢', 'overhead')}
                    </View>
                </View>

                {/* Target Profit */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Text style={styles.cardIcon}>🎯</Text>
                        <Text style={styles.cardTitle}>Target Profit</Text>
                    </View>
                    <View style={styles.profitRow}>
                        <View style={styles.profitInputWrapper}>
                            <TextInput
                                style={styles.profitInput}
                                keyboardType="decimal-pad"
                                value={targetProfitPercent}
                                onChangeText={handleNumericChange(setTargetProfitPercent)}
                            />
                            <Text style={styles.profitPercent}>%</Text>
                        </View>
                        <View style={styles.profitPresets}>
                            {[10, 15, 20, 25].map(preset => (
                                <TouchableOpacity
                                    key={preset}
                                    style={[
                                        styles.presetButton,
                                        parseFloat(targetProfitPercent) === preset && styles.presetButtonActive
                                    ]}
                                    onPress={() => setTargetProfitPercent(preset.toString())}
                                >
                                    <Text style={[
                                        styles.presetText,
                                        parseFloat(targetProfitPercent) === preset && styles.presetTextActive
                                    ]}>{preset}%</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                </View>

                {/* Live Preview Card */}
                <View style={[styles.card, styles.previewCard]}>
                    <View style={styles.previewRow}>
                        <View style={styles.previewItem}>
                            <Text style={styles.previewLabel}>Total Cost</Text>
                            <Text style={styles.previewValue}>{currencySymbol}{totalCost.toFixed(2)}</Text>
                        </View>
                        <View style={styles.previewDivider} />
                        <View style={styles.previewItem}>
                            <Text style={styles.previewLabel}>Preview Margin</Text>
                            <Text style={[
                                styles.previewValue,
                                parseFloat(previewMargin) < 10 && styles.previewValueRed,
                                parseFloat(previewMargin) >= 15 && styles.previewValueGreen,
                            ]}>{previewMargin}%</Text>
                        </View>
                    </View>
                </View>

                {/* Import Button - FOB Sheet only */}
                <View style={styles.importSection}>
                    <Text style={styles.importTitle}>Import from MerchMate</Text>
                    <TouchableOpacity
                        style={styles.importButtonFull}
                        onPress={() => navigation.navigate('History', { returnTo: 'BuyerAnalyzerInput', type: 'fob' })}
                    >
                        <View style={styles.importButtonContent}>
                            <Text style={styles.importIcon}>📝</Text>
                            <View style={styles.importTextContainer}>
                                <Text style={styles.importTextMain}>Import FOB Sheet</Text>
                                <Text style={styles.importTextSub}>Load data from saved cost sheets</Text>
                            </View>
                        </View>
                        <Text style={styles.importArrow}>→</Text>
                    </TouchableOpacity>
                </View>

                {/* Analyze Button */}
                <TouchableOpacity
                    style={[styles.analyzeButton, loading && styles.analyzeButtonDisabled]}
                    onPress={handleAnalyze}
                    disabled={loading}
                >
                    <Text style={styles.analyzeButtonText}>
                        {loading ? 'Analyzing...' : '📊 Analyze Margin'}
                    </Text>
                </TouchableOpacity>

                <View style={styles.bottomPadding} />
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f0f2f5' },

    // Header
    header: {
        alignItems: 'center',
        paddingTop: 20,
        paddingBottom: 24,
        backgroundColor: '#fff',
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
    },
    headerIcon: { fontSize: 40, marginBottom: 8 },
    headerTitle: { fontSize: 24, fontWeight: '700', color: '#1a1a2e' },
    headerSubtitle: { fontSize: 14, color: '#666', marginTop: 4 },

    // Cards
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        marginHorizontal: 16,
        marginTop: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
        elevation: 2,
    },
    cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    cardIcon: { fontSize: 20, marginRight: 10 },
    cardTitle: { fontSize: 16, fontWeight: '700', color: '#1a1a2e', flex: 1 },
    cardBadge: { backgroundColor: '#007bff15', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    cardBadgeText: { fontSize: 11, color: '#007bff', fontWeight: '600' },
    cardContent: {},
    cardHint: { fontSize: 12, color: '#888', marginBottom: 12, lineHeight: 18 },

    // Inputs
    inputWrapper: { marginBottom: 12 },
    inputRow: { flexDirection: 'row', marginBottom: 12 },
    inputHalf: { flex: 1, marginRight: 8 },
    inputLabel: { fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 6 },
    input: {
        backgroundColor: '#f8f9fa',
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 15,
        color: '#333',
        borderWidth: 1,
        borderColor: '#e9ecef',
    },

    // Currency Input
    currencyInputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#e9ecef',
    },
    currencyPrefix: {
        fontSize: 16,
        fontWeight: '600',
        color: '#007bff',
        paddingLeft: 14,
        minWidth: 24,
    },
    currencyInput: {
        flex: 1,
        paddingHorizontal: 8,
        paddingVertical: 12,
        fontSize: 15,
        color: '#333'
    },

    // Pickers
    pickerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#f8f9fa',
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderWidth: 1,
        borderColor: '#e9ecef',
    },
    pickerButtonText: { fontSize: 15, color: '#333', fontWeight: '500' },
    pickerArrow: { fontSize: 10, color: '#888' },
    pickerDropdown: {
        position: 'absolute',
        top: 72,
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        borderRadius: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
        zIndex: 100,
    },
    pickerOption: { paddingHorizontal: 14, paddingVertical: 12 },
    pickerOptionActive: { backgroundColor: '#007bff15' },
    pickerOptionText: { fontSize: 14, color: '#333' },
    pickerOptionTextActive: { color: '#007bff', fontWeight: '600' },

    // Cost Structure
    costList: {},
    costRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    costRowDisabled: { opacity: 0.5 },
    costToggle: { marginRight: 12 },
    costContent: { flex: 1 },
    costLabelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
    costEmoji: { fontSize: 16, marginRight: 8 },
    costLabel: { fontSize: 14, fontWeight: '500', color: '#333', flex: 1 },
    costLabelDisabled: { color: '#999' },
    percentBadge: { backgroundColor: '#f0f0f0', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
    percentText: { fontSize: 11, color: '#666', fontWeight: '600' },
    costInputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
        paddingHorizontal: 10,
    },
    costInput: {
        flex: 1,
        paddingVertical: 8,
        paddingHorizontal: 4,
        fontSize: 15,
        color: '#333',
    },
    costInputDisabled: { color: '#999' },
    unitSuffix: { fontSize: 12, color: '#888' },

    // Profit
    profitRow: { flexDirection: 'row', alignItems: 'center' },
    profitInputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        borderRadius: 10,
        paddingHorizontal: 14,
        marginRight: 12,
    },
    profitInput: {
        width: 60,
        paddingVertical: 12,
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        textAlign: 'center',
    },
    profitPercent: { fontSize: 16, fontWeight: '600', color: '#007bff' },
    profitPresets: { flexDirection: 'row', flex: 1, justifyContent: 'flex-end' },
    presetButton: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        backgroundColor: '#f0f0f0',
        marginLeft: 6,
    },
    presetButtonActive: { backgroundColor: '#007bff' },
    presetText: { fontSize: 13, fontWeight: '600', color: '#666' },
    presetTextActive: { color: '#fff' },

    // Preview Card
    previewCard: { backgroundColor: '#1a1a2e' },
    previewRow: { flexDirection: 'row', alignItems: 'center' },
    previewItem: { flex: 1, alignItems: 'center' },
    previewLabel: { fontSize: 12, color: '#aaa', marginBottom: 4 },
    previewValue: { fontSize: 22, fontWeight: '700', color: '#fff' },
    previewValueRed: { color: '#ff6b6b' },
    previewValueGreen: { color: '#51cf66' },
    previewDivider: { width: 1, height: 40, backgroundColor: '#333' },

    // Import Section
    importSection: { marginHorizontal: 16, marginTop: 20 },
    importTitle: { fontSize: 13, fontWeight: '600', color: '#888', marginBottom: 10, textAlign: 'center' },
    importButtonFull: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#fff',
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: '#9c27b0',
        borderStyle: 'dashed',
    },
    importButtonContent: { flexDirection: 'row', alignItems: 'center' },
    importIcon: { fontSize: 24, marginRight: 12 },
    importTextContainer: { flexDirection: 'column' },
    importTextMain: { fontSize: 15, fontWeight: '600', color: '#333' },
    importTextSub: { fontSize: 12, color: '#888', marginTop: 2 },
    importArrow: { fontSize: 20, color: '#9c27b0', fontWeight: '700' },

    // Analyze Button
    analyzeButton: {
        backgroundColor: '#007bff',
        marginHorizontal: 16,
        marginTop: 20,
        paddingVertical: 16,
        borderRadius: 14,
        alignItems: 'center',
        shadowColor: '#007bff',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    analyzeButtonDisabled: { opacity: 0.6 },
    analyzeButtonText: { fontSize: 17, fontWeight: '700', color: '#fff' },

    bottomPadding: { height: 40 },
});

export default BuyerAnalyzerInputScreen;
