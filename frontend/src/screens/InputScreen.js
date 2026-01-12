import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { calculateFOB, saveCostSheet } from '../utils/calculations';

const InputScreen = ({ navigation, route }) => {
    const editData = route?.params?.editData;
    const [loading, setLoading] = useState(false);
    const [garmentType, setGarmentType] = useState(editData?.inputs?.garment_type || 'tshirt'); // tshirt, shirt, jeans
    const [formData, setFormData] = useState(editData?.inputs || {
        style_name: 'Style-001',
        buyer_name: 'Buyer-A',
        season: 'Summer 24',
        garment_type: 'tshirt',

        // T-Shirt (Knit) specific
        fabric_type: 'Single Jersey',
        gsm: 160,
        body_length: 72,
        sleeve_length: 24,
        chest_width: 54,
        wastage_percent: 10,
        fabric_allowance: 4, // cm for knit

        // Shirt (Woven) specific
        shirt_body_length: 30, // inches
        shirt_sleeve_length: 25, // inches
        shirt_chest_width: 22, // inches
        shirt_collar: 16, // inches
        fabric_width: 60, // inches
        shirt_wastage_percent: 5,
        shirt_fabric_allowance: 2, // inches for woven

        // Jeans (Woven) specific
        waist: 34, // inches
        inseam: 32, // inches
        thigh_width: 12, // inches
        front_rise: 11, // inches
        back_rise: 15, // inches
        leg_opening: 8, // inches
        denim_fabric_width: 60, // inches
        jeans_wastage_percent: 5,
        jeans_fabric_allowance: 2, // inches for denim

        // Common costs (now per dozen in UI)
        yarn_price_per_kg: 4.5,
        knitting_charge_per_kg: 0.5,
        dyeing_charge_per_kg: 1.2,
        fabric_price_per_yard: 3.5, // For woven fabrics
        aop_print_cost_per_pc: 0, // Displayed as per dozen in UI (0 * 12 = 0)
        accessories_cost_per_pc: 2.04, // Displayed as per dozen in UI (0.17 * 12)
        cm_cost_per_pc: 12.0, // Displayed as per dozen in UI (1.0 * 12)
        washing_cost_per_pc: 6.0, // Displayed as per dozen in UI (0.5 * 12)
        commercial_cost_per_pc: 9.6, // Displayed as per dozen in UI (0.8 * 12)
        testing_cost_per_pc: 3.6, // Displayed as per dozen in UI (0.3 * 12)
        profit_margin_percent: 15.0,
    });

    // Update form when edit data is passed
    useEffect(() => {
        if (editData?.inputs) {
            // Convert per piece values to per dozen for display
            const displayData = { ...editData.inputs };
            const perDozenFields = ['aop_print_cost_per_pc', 'accessories_cost_per_pc', 'cm_cost_per_pc',
                'washing_cost_per_pc', 'commercial_cost_per_pc', 'testing_cost_per_pc'];

            perDozenFields.forEach(field => {
                if (displayData[field] !== undefined) {
                    displayData[field] = parseFloat((displayData[field] * 12).toFixed(2));
                }
            });

            setFormData(displayData);
            setGarmentType(editData.inputs.garment_type);
        }
    }, [editData]);

    const handleGarmentTypeChange = (type) => {
        setGarmentType(type);
        setFormData({ ...formData, garment_type: type });
    };

    const handleChange = (name, value) => {
        setFormData({ ...formData, [name]: value });
    };

    const handleNumericChange = (name, value) => {
        // Allow empty string, just a minus sign, or ending with a decimal point
        if (value === '' || value === '-' || value === '.' || /^-?\d*\.?\d*$/.test(value)) {
            setFormData({ ...formData, [name]: value });
        }
    };

    const handleCalculate = async () => {
        // Define numeric fields based on garment type
        let numericFields = [
            'aop_print_cost_per_pc', 'accessories_cost_per_pc', 'cm_cost_per_pc',
            'washing_cost_per_pc', 'commercial_cost_per_pc', 'testing_cost_per_pc',
            'profit_margin_percent'
        ];

        if (garmentType === 'tshirt') {
            numericFields.push('gsm', 'body_length', 'sleeve_length', 'chest_width',
                'wastage_percent', 'fabric_allowance',
                'yarn_price_per_kg', 'knitting_charge_per_kg', 'dyeing_charge_per_kg');
        } else if (garmentType === 'shirt') {
            numericFields.push('shirt_body_length', 'shirt_sleeve_length', 'shirt_chest_width',
                'shirt_collar', 'fabric_width', 'shirt_wastage_percent', 'shirt_fabric_allowance',
                'fabric_price_per_yard');
        } else if (garmentType === 'jeans') {
            numericFields.push('waist', 'inseam', 'thigh_width', 'front_rise', 'back_rise',
                'leg_opening', 'denim_fabric_width', 'jeans_wastage_percent', 'jeans_fabric_allowance',
                'fabric_price_per_yard');
        }

        // Convert string values to numbers and validate
        const cleanedData = { ...formData };
        const perDozenFields = ['aop_print_cost_per_pc', 'accessories_cost_per_pc', 'cm_cost_per_pc',
            'washing_cost_per_pc', 'commercial_cost_per_pc', 'testing_cost_per_pc'];

        for (const field of numericFields) {
            const value = formData[field];
            if (value === '' || value === '-' || value === '.') {
                Alert.alert("Invalid Input", `Please enter a valid number for all fields.`);
                return;
            }
            const numValue = parseFloat(value);
            if (isNaN(numValue)) {
                Alert.alert("Invalid Input", `Please enter a valid number for all fields.`);
                return;
            }
            // Convert per dozen fields to per piece for calculations
            if (perDozenFields.includes(field)) {
                cleanedData[field] = numValue / 12;
            } else {
                cleanedData[field] = numValue;
            }
        }

        setLoading(true);
        try {
            // Calculate locally with cleaned numeric data
            const breakdown = calculateFOB(cleanedData);

            // Save to local storage
            await saveCostSheet(cleanedData, breakdown);

            setLoading(false);
            navigation.navigate('Result', {
                breakdown,
                inputs: cleanedData
            });
        } catch (error) {
            setLoading(false);
            console.error(error);
            Alert.alert("Error", "Calculation failed. Please check your inputs.");
        }
    };

    const getGarmentIcon = (type) => {
        switch (type) {
            case 'tshirt': return '👕';
            case 'shirt': return '👔';
            case 'jeans': return '👖';
            default: return '📦';
        }
    };

    const renderInput = (label, field, placeholder, unit = '') => (
        <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>{label} {unit && <Text style={styles.unitText}>({unit})</Text>}</Text>
            <TextInput
                style={styles.input}
                keyboardType="decimal-pad"
                value={String(formData[field])}
                onChangeText={t => handleNumericChange(field, t)}
                placeholder={placeholder}
                placeholderTextColor="#aaa"
            />
        </View>
    );

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerIcon}>📝</Text>
                <Text style={styles.headerTitle}>FOB Cost Sheet</Text>
                <Text style={styles.headerSubtitle}>Calculate accurate garment costing</Text>
            </View>

            {/* Style Info Card */}
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <Text style={styles.cardIcon}>🏷️</Text>
                    <Text style={styles.cardTitle}>Style Information</Text>
                </View>
                <View style={styles.cardContent}>
                    <View style={styles.inputWrapper}>
                        <Text style={styles.inputLabel}>Style Name</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter style name"
                            placeholderTextColor="#aaa"
                            value={formData.style_name}
                            onChangeText={t => handleChange('style_name', t)}
                        />
                    </View>
                    <View style={styles.inputWrapper}>
                        <Text style={styles.inputLabel}>Buyer Name</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter buyer name"
                            placeholderTextColor="#aaa"
                            value={formData.buyer_name}
                            onChangeText={t => handleChange('buyer_name', t)}
                        />
                    </View>
                </View>
            </View>

            {/* Garment Type Selector */}
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <Text style={styles.cardIcon}>👗</Text>
                    <Text style={styles.cardTitle}>Garment Type</Text>
                </View>
                <View style={styles.typeSelector}>
                    {[
                        { key: 'tshirt', label: 'T-Shirt', sub: 'Knit', icon: '👕' },
                        { key: 'shirt', label: 'Shirt', sub: 'Woven', icon: '👔' },
                        { key: 'jeans', label: 'Jeans', sub: 'Denim', icon: '👖' },
                    ].map((item) => (
                        <TouchableOpacity
                            key={item.key}
                            style={[styles.typeCard, garmentType === item.key && styles.typeCardActive]}
                            onPress={() => handleGarmentTypeChange(item.key)}
                        >
                            <Text style={styles.typeIcon}>{item.icon}</Text>
                            <Text style={[styles.typeLabel, garmentType === item.key && styles.typeLabelActive]}>
                                {item.label}
                            </Text>
                            <Text style={[styles.typeSub, garmentType === item.key && styles.typeSubActive]}>
                                {item.sub}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* T-Shirt Fields */}
            {garmentType === 'tshirt' && (
                <>
                    <View style={styles.card}>
                        <View style={styles.cardHeader}>
                            <Text style={styles.cardIcon}>📏</Text>
                            <Text style={styles.cardTitle}>T-Shirt Dimensions</Text>
                            <View style={styles.unitBadge}>
                                <Text style={styles.unitBadgeText}>cm</Text>
                            </View>
                        </View>
                        <View style={styles.cardContent}>
                            <View style={styles.inputWrapper}>
                                <Text style={styles.inputLabel}>Fabric Type</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="e.g. Single Jersey"
                                    placeholderTextColor="#aaa"
                                    value={formData.fabric_type}
                                    onChangeText={t => handleChange('fabric_type', t)}
                                />
                            </View>
                            {renderInput('GSM', 'gsm', 'e.g. 160', 'g/m²')}
                            <View style={styles.row}>
                                <View style={styles.halfInput}>
                                    {renderInput('Body Length', 'body_length', '72')}
                                </View>
                                <View style={styles.halfInput}>
                                    {renderInput('Chest Width', 'chest_width', '54')}
                                </View>
                            </View>
                            <View style={styles.row}>
                                <View style={styles.halfInput}>
                                    {renderInput('Sleeve Length', 'sleeve_length', '24')}
                                </View>
                                <View style={styles.halfInput}>
                                    {renderInput('Wastage', 'wastage_percent', '10', '%')}
                                </View>
                            </View>
                            {renderInput('Fabric Allowance', 'fabric_allowance', '4', 'cm')}
                        </View>
                    </View>

                    <View style={styles.card}>
                        <View style={styles.cardHeader}>
                            <Text style={styles.cardIcon}>💵</Text>
                            <Text style={styles.cardTitle}>Knit Fabric Costs</Text>
                            <View style={styles.unitBadge}>
                                <Text style={styles.unitBadgeText}>$/kg</Text>
                            </View>
                        </View>
                        <View style={styles.cardContent}>
                            <View style={styles.row}>
                                <View style={styles.thirdInput}>
                                    {renderInput('Yarn', 'yarn_price_per_kg', '4.50')}
                                </View>
                                <View style={styles.thirdInput}>
                                    {renderInput('Knitting', 'knitting_charge_per_kg', '0.50')}
                                </View>
                                <View style={styles.thirdInput}>
                                    {renderInput('Dyeing', 'dyeing_charge_per_kg', '1.20')}
                                </View>
                            </View>
                        </View>
                    </View>
                </>
            )}

            {/* Woven Shirt Fields */}
            {garmentType === 'shirt' && (
                <>
                    <View style={styles.card}>
                        <View style={styles.cardHeader}>
                            <Text style={styles.cardIcon}>📏</Text>
                            <Text style={styles.cardTitle}>Woven Shirt Dimensions</Text>
                            <View style={styles.unitBadge}>
                                <Text style={styles.unitBadgeText}>inches</Text>
                            </View>
                        </View>
                        <View style={styles.cardContent}>
                            <View style={styles.row}>
                                <View style={styles.halfInput}>
                                    {renderInput('Body Length', 'shirt_body_length', '30')}
                                </View>
                                <View style={styles.halfInput}>
                                    {renderInput('Chest Width', 'shirt_chest_width', '22')}
                                </View>
                            </View>
                            <View style={styles.row}>
                                <View style={styles.halfInput}>
                                    {renderInput('Sleeve Length', 'shirt_sleeve_length', '25')}
                                </View>
                                <View style={styles.halfInput}>
                                    {renderInput('Collar Size', 'shirt_collar', '16')}
                                </View>
                            </View>
                            <View style={styles.row}>
                                <View style={styles.halfInput}>
                                    {renderInput('Fabric Width', 'fabric_width', '60')}
                                </View>
                                <View style={styles.halfInput}>
                                    {renderInput('Wastage', 'shirt_wastage_percent', '5', '%')}
                                </View>
                            </View>
                            {renderInput('Fabric Allowance', 'shirt_fabric_allowance', '2', 'in')}
                        </View>
                    </View>

                    <View style={styles.card}>
                        <View style={styles.cardHeader}>
                            <Text style={styles.cardIcon}>💵</Text>
                            <Text style={styles.cardTitle}>Woven Fabric Cost</Text>
                        </View>
                        <View style={styles.cardContent}>
                            {renderInput('Fabric Price', 'fabric_price_per_yard', '3.50', '$/yard')}
                        </View>
                    </View>
                </>
            )}

            {/* Denim Jeans Fields */}
            {garmentType === 'jeans' && (
                <>
                    <View style={styles.card}>
                        <View style={styles.cardHeader}>
                            <Text style={styles.cardIcon}>📏</Text>
                            <Text style={styles.cardTitle}>Denim Jeans Dimensions</Text>
                            <View style={styles.unitBadge}>
                                <Text style={styles.unitBadgeText}>inches</Text>
                            </View>
                        </View>
                        <View style={styles.cardContent}>
                            <View style={styles.row}>
                                <View style={styles.halfInput}>
                                    {renderInput('Waist', 'waist', '34')}
                                </View>
                                <View style={styles.halfInput}>
                                    {renderInput('Inseam', 'inseam', '32')}
                                </View>
                            </View>
                            <View style={styles.row}>
                                <View style={styles.halfInput}>
                                    {renderInput('Thigh Width', 'thigh_width', '12')}
                                </View>
                                <View style={styles.halfInput}>
                                    {renderInput('Front Rise', 'front_rise', '11')}
                                </View>
                            </View>
                            <View style={styles.row}>
                                <View style={styles.halfInput}>
                                    {renderInput('Back Rise', 'back_rise', '15')}
                                </View>
                                <View style={styles.halfInput}>
                                    {renderInput('Leg Opening', 'leg_opening', '8')}
                                </View>
                            </View>
                            <View style={styles.row}>
                                <View style={styles.halfInput}>
                                    {renderInput('Denim Width', 'denim_fabric_width', '60')}
                                </View>
                                <View style={styles.halfInput}>
                                    {renderInput('Wastage', 'jeans_wastage_percent', '5', '%')}
                                </View>
                            </View>
                            {renderInput('Fabric Allowance', 'jeans_fabric_allowance', '2', 'in')}
                        </View>
                    </View>

                    <View style={styles.card}>
                        <View style={styles.cardHeader}>
                            <Text style={styles.cardIcon}>💵</Text>
                            <Text style={styles.cardTitle}>Denim Fabric Cost</Text>
                        </View>
                        <View style={styles.cardContent}>
                            {renderInput('Fabric Price', 'fabric_price_per_yard', '3.50', '$/yard')}
                        </View>
                    </View>
                </>
            )}

            {/* Common Costs Section */}
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <Text style={styles.cardIcon}>🧵</Text>
                    <Text style={styles.cardTitle}>Production Costs</Text>
                    <View style={styles.unitBadge}>
                        <Text style={styles.unitBadgeText}>$/doz</Text>
                    </View>
                </View>
                <View style={styles.cardContent}>
                    <View style={styles.row}>
                        <View style={styles.thirdInput}>
                            {renderInput('AOP/Print', 'aop_print_cost_per_pc', '0')}
                        </View>
                        <View style={styles.thirdInput}>
                            {renderInput('Accessories', 'accessories_cost_per_pc', '2.04')}
                        </View>
                        <View style={styles.thirdInput}>
                            {renderInput('CM Cost', 'cm_cost_per_pc', '12.00')}
                        </View>
                    </View>
                </View>
            </View>

            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <Text style={styles.cardIcon}>📦</Text>
                    <Text style={styles.cardTitle}>FOB Essential Costs</Text>
                    <View style={styles.unitBadge}>
                        <Text style={styles.unitBadgeText}>$/doz</Text>
                    </View>
                </View>
                <View style={styles.cardContent}>
                    <View style={styles.row}>
                        <View style={styles.thirdInput}>
                            {renderInput('Washing', 'washing_cost_per_pc', '6.00')}
                        </View>
                        <View style={styles.thirdInput}>
                            {renderInput('Commercial', 'commercial_cost_per_pc', '9.60')}
                        </View>
                        <View style={styles.thirdInput}>
                            {renderInput('Testing', 'testing_cost_per_pc', '3.60')}
                        </View>
                    </View>
                </View>
            </View>

            {/* Calculate Button */}
            <TouchableOpacity
                style={[styles.calculateButton, loading && styles.calculateButtonDisabled]}
                onPress={handleCalculate}
                disabled={loading}
            >
                {loading ? (
                    <ActivityIndicator color="#fff" size="small" />
                ) : (
                    <>
                        <Text style={styles.calculateIcon}>🧮</Text>
                        <Text style={styles.calculateText}>CALCULATE FOB</Text>
                    </>
                )}
            </TouchableOpacity>

            <View style={{ height: 40 }} />
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f0f2f5',
    },
    header: {
        backgroundColor: '#007bff',
        paddingTop: 20,
        paddingBottom: 30,
        paddingHorizontal: 20,
        alignItems: 'center',
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        marginBottom: 20,
        marginHorizontal: 16,
    },
    headerIcon: {
        fontSize: 40,
        marginBottom: 8,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)',
    },
    card: {
        backgroundColor: '#fff',
        marginHorizontal: 16,
        marginBottom: 16,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
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
        fontSize: 20,
        marginRight: 10,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        flex: 1,
    },
    unitBadge: {
        backgroundColor: '#007bff15',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    unitBadgeText: {
        fontSize: 12,
        color: '#007bff',
        fontWeight: '600',
    },
    cardContent: {
        padding: 16,
    },
    typeSelector: {
        flexDirection: 'row',
        padding: 12,
        gap: 10,
    },
    typeCard: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 8,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#e0e0e0',
        backgroundColor: '#fafafa',
    },
    typeCardActive: {
        borderColor: '#007bff',
        backgroundColor: '#f0f7ff',
    },
    typeIcon: {
        fontSize: 32,
        marginBottom: 8,
    },
    typeLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 2,
    },
    typeLabelActive: {
        color: '#007bff',
    },
    typeSub: {
        fontSize: 11,
        color: '#888',
    },
    typeSubActive: {
        color: '#007bff',
    },
    inputWrapper: {
        marginBottom: 12,
    },
    inputLabel: {
        fontSize: 13,
        fontWeight: '500',
        color: '#555',
        marginBottom: 6,
    },
    unitText: {
        fontSize: 11,
        color: '#888',
        fontWeight: '400',
    },
    input: {
        backgroundColor: '#f8f9fa',
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 15,
        color: '#333',
    },
    row: {
        flexDirection: 'row',
        marginHorizontal: -6,
    },
    halfInput: {
        flex: 1,
        paddingHorizontal: 6,
    },
    thirdInput: {
        flex: 1,
        paddingHorizontal: 6,
    },
    calculateButton: {
        flexDirection: 'row',
        backgroundColor: '#007bff',
        marginHorizontal: 16,
        marginTop: 8,
        paddingVertical: 18,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#007bff',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    calculateButtonDisabled: {
        backgroundColor: '#93c5fd',
    },
    calculateIcon: {
        fontSize: 22,
        marginRight: 10,
    },
    calculateText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
});

export default InputScreen;
