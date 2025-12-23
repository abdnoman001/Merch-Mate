import { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { calculateFOB, saveCostSheet } from '../utils/calculations';

const InputScreen = ({ navigation }) => {
    const [loading, setLoading] = useState(false);
    const [garmentType, setGarmentType] = useState('tshirt'); // tshirt, shirt, jeans
    const [formData, setFormData] = useState({
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

        // Common costs
        yarn_price_per_kg: 4.5,
        knitting_charge_per_kg: 0.5,
        dyeing_charge_per_kg: 1.2,
        fabric_price_per_yard: 3.5, // For woven fabrics
        aop_print_cost_per_pc: 0,
        accessories_cost_per_pc: 0.17,
        cm_cost_per_pc: 1.0,
        washing_cost_per_pc: 0.5,
        commercial_cost_per_pc: 0.8,
        testing_cost_per_pc: 0.3,
        profit_margin_percent: 15.0,
    });

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
            cleanedData[field] = numValue;
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

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.header}>MerchMate</Text>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Style Info</Text>
                <TextInput style={styles.input} placeholder="Style Name" value={formData.style_name} onChangeText={t => handleChange('style_name', t)} />
                <TextInput style={styles.input} placeholder="Buyer Name" value={formData.buyer_name} onChangeText={t => handleChange('buyer_name', t)} />
            </View>

            {/* Garment Type Selector */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Garment Type</Text>
                <View style={styles.garmentTypeContainer}>
                    <TouchableOpacity
                        style={[styles.typeButton, garmentType === 'tshirt' && styles.typeButtonActive]}
                        onPress={() => handleGarmentTypeChange('tshirt')}
                    >
                        <Text style={[styles.typeButtonText, garmentType === 'tshirt' && styles.typeButtonTextActive]}>T-Shirt (Knit)</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.typeButton, garmentType === 'shirt' && styles.typeButtonActive]}
                        onPress={() => handleGarmentTypeChange('shirt')}
                    >
                        <Text style={[styles.typeButtonText, garmentType === 'shirt' && styles.typeButtonTextActive]}>Woven Shirt</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.typeButton, garmentType === 'jeans' && styles.typeButtonActive]}
                        onPress={() => handleGarmentTypeChange('jeans')}
                    >
                        <Text style={[styles.typeButtonText, garmentType === 'jeans' && styles.typeButtonTextActive]}>Denim Jeans</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* T-Shirt Fields */}
            {garmentType === 'tshirt' && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>T-Shirt Dimensions (cm)</Text>
                    <Text>Fabric Type</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g. Single Jersey"
                        value={formData.fabric_type}
                        onChangeText={t => handleChange('fabric_type', t)}
                    />

                    <Text>GSM (Fabric Weight)</Text>
                    <TextInput
                        style={styles.input}
                        keyboardType="decimal-pad"
                        value={String(formData.gsm)}
                        onChangeText={t => handleNumericChange('gsm', t)}
                    />

                    <View style={styles.row}>
                        <View style={{ flex: 1, marginRight: 5 }}>
                            <Text>Body Length (cm)</Text>
                            <TextInput style={styles.input} keyboardType="decimal-pad" value={String(formData.body_length)} onChangeText={t => handleNumericChange('body_length', t)} />
                        </View>
                        <View style={{ flex: 1, marginLeft: 5 }}>
                            <Text>Chest Width (cm)</Text>
                            <TextInput style={styles.input} keyboardType="decimal-pad" value={String(formData.chest_width)} onChangeText={t => handleNumericChange('chest_width', t)} />
                        </View>
                    </View>
                    <View style={styles.row}>
                        <View style={{ flex: 1, marginRight: 5 }}>
                            <Text>Sleeve Length (cm)</Text>
                            <TextInput style={styles.input} keyboardType="decimal-pad" value={String(formData.sleeve_length)} onChangeText={t => handleNumericChange('sleeve_length', t)} />
                        </View>
                        <View style={{ flex: 1, marginLeft: 5 }}>
                            <Text>Wastage %</Text>
                            <TextInput style={styles.input} keyboardType="decimal-pad" value={String(formData.wastage_percent)} onChangeText={t => handleNumericChange('wastage_percent', t)} />
                        </View>
                    </View>
                    <View style={styles.row}>
                        <View style={{ flex: 1 }}>
                            <Text>Fabric Allowance (cm)</Text>
                            <TextInput style={styles.input} keyboardType="decimal-pad" value={String(formData.fabric_allowance)} onChangeText={t => handleNumericChange('fabric_allowance', t)} />
                        </View>
                    </View>

                    <Text style={styles.sectionTitle}>Knit Fabric Costs (USD/kg)</Text>
                    <View style={styles.row}>
                        <View style={styles.col}>
                            <Text>Yarn ($/kg)</Text>
                            <TextInput style={styles.input} keyboardType="decimal-pad" value={String(formData.yarn_price_per_kg)} onChangeText={t => handleNumericChange('yarn_price_per_kg', t)} />
                        </View>
                        <View style={styles.col}>
                            <Text>Knit ($/kg)</Text>
                            <TextInput style={styles.input} keyboardType="decimal-pad" value={String(formData.knitting_charge_per_kg)} onChangeText={t => handleNumericChange('knitting_charge_per_kg', t)} />
                        </View>
                        <View style={styles.col}>
                            <Text>Dye ($/kg)</Text>
                            <TextInput style={styles.input} keyboardType="decimal-pad" value={String(formData.dyeing_charge_per_kg)} onChangeText={t => handleNumericChange('dyeing_charge_per_kg', t)} />
                        </View>
                    </View>
                </View>
            )}

            {/* Woven Shirt Fields */}
            {garmentType === 'shirt' && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Woven Shirt Dimensions (inches)</Text>
                    <View style={styles.row}>
                        <View style={{ flex: 1, marginRight: 5 }}>
                            <Text>Body Length (in)</Text>
                            <TextInput style={styles.input} keyboardType="decimal-pad" value={String(formData.shirt_body_length)} onChangeText={t => handleNumericChange('shirt_body_length', t)} />
                        </View>
                        <View style={{ flex: 1, marginLeft: 5 }}>
                            <Text>Chest Width (in)</Text>
                            <TextInput style={styles.input} keyboardType="decimal-pad" value={String(formData.shirt_chest_width)} onChangeText={t => handleNumericChange('shirt_chest_width', t)} />
                        </View>
                    </View>
                    <View style={styles.row}>
                        <View style={{ flex: 1, marginRight: 5 }}>
                            <Text>Sleeve Length (in)</Text>
                            <TextInput style={styles.input} keyboardType="decimal-pad" value={String(formData.shirt_sleeve_length)} onChangeText={t => handleNumericChange('shirt_sleeve_length', t)} />
                        </View>
                        <View style={{ flex: 1, marginLeft: 5 }}>
                            <Text>Collar Size (in)</Text>
                            <TextInput style={styles.input} keyboardType="decimal-pad" value={String(formData.shirt_collar)} onChangeText={t => handleNumericChange('shirt_collar', t)} />
                        </View>
                    </View>
                    <View style={styles.row}>
                        <View style={{ flex: 1, marginRight: 5 }}>
                            <Text>Fabric Width (in)</Text>
                            <TextInput style={styles.input} keyboardType="decimal-pad" value={String(formData.fabric_width)} onChangeText={t => handleNumericChange('fabric_width', t)} />
                        </View>
                        <View style={{ flex: 1, marginLeft: 5 }}>
                            <Text>Wastage %</Text>
                            <TextInput style={styles.input} keyboardType="decimal-pad" value={String(formData.shirt_wastage_percent)} onChangeText={t => handleNumericChange('shirt_wastage_percent', t)} />
                        </View>
                    </View>
                    <View style={styles.row}>
                        <View style={{ flex: 1 }}>
                            <Text>Fabric Allowance (in)</Text>
                            <TextInput style={styles.input} keyboardType="decimal-pad" value={String(formData.shirt_fabric_allowance)} onChangeText={t => handleNumericChange('shirt_fabric_allowance', t)} />
                        </View>
                    </View>

                    <Text style={styles.sectionTitle}>Woven Fabric Cost</Text>
                    <Text>Fabric Price ($/Yard)</Text>
                    <TextInput style={styles.input} keyboardType="decimal-pad" value={String(formData.fabric_price_per_yard)} onChangeText={t => handleNumericChange('fabric_price_per_yard', t)} />
                </View>
            )}

            {/* Denim Jeans Fields */}
            {garmentType === 'jeans' && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Denim Jeans Dimensions (inches)</Text>
                    <View style={styles.row}>
                        <View style={{ flex: 1, marginRight: 5 }}>
                            <Text>Waist (in)</Text>
                            <TextInput style={styles.input} keyboardType="decimal-pad" value={String(formData.waist)} onChangeText={t => handleNumericChange('waist', t)} />
                        </View>
                        <View style={{ flex: 1, marginLeft: 5 }}>
                            <Text>Inseam (in)</Text>
                            <TextInput style={styles.input} keyboardType="decimal-pad" value={String(formData.inseam)} onChangeText={t => handleNumericChange('inseam', t)} />
                        </View>
                    </View>
                    <View style={styles.row}>
                        <View style={{ flex: 1, marginRight: 5 }}>
                            <Text>Thigh Width (in)</Text>
                            <TextInput style={styles.input} keyboardType="decimal-pad" value={String(formData.thigh_width)} onChangeText={t => handleNumericChange('thigh_width', t)} />
                        </View>
                        <View style={{ flex: 1, marginLeft: 5 }}>
                            <Text>Front Rise (in)</Text>
                            <TextInput style={styles.input} keyboardType="decimal-pad" value={String(formData.front_rise)} onChangeText={t => handleNumericChange('front_rise', t)} />
                        </View>
                    </View>
                    <View style={styles.row}>
                        <View style={{ flex: 1, marginRight: 5 }}>
                            <Text>Back Rise (in)</Text>
                            <TextInput style={styles.input} keyboardType="decimal-pad" value={String(formData.back_rise)} onChangeText={t => handleNumericChange('back_rise', t)} />
                        </View>
                        <View style={{ flex: 1, marginLeft: 5 }}>
                            <Text>Leg Opening (in)</Text>
                            <TextInput style={styles.input} keyboardType="decimal-pad" value={String(formData.leg_opening)} onChangeText={t => handleNumericChange('leg_opening', t)} />
                        </View>
                    </View>
                    <View style={styles.row}>
                        <View style={{ flex: 1, marginRight: 5 }}>
                            <Text>Denim Width (in)</Text>
                            <TextInput style={styles.input} keyboardType="decimal-pad" value={String(formData.denim_fabric_width)} onChangeText={t => handleNumericChange('denim_fabric_width', t)} />
                        </View>
                        <View style={{ flex: 1, marginLeft: 5 }}>
                            <Text>Wastage %</Text>
                            <TextInput style={styles.input} keyboardType="decimal-pad" value={String(formData.jeans_wastage_percent)} onChangeText={t => handleNumericChange('jeans_wastage_percent', t)} />
                        </View>
                    </View>
                    <View style={styles.row}>
                        <View style={{ flex: 1 }}>
                            <Text>Fabric Allowance (in)</Text>
                            <TextInput style={styles.input} keyboardType="decimal-pad" value={String(formData.jeans_fabric_allowance)} onChangeText={t => handleNumericChange('jeans_fabric_allowance', t)} />
                        </View>
                    </View>

                    <Text style={styles.sectionTitle}>Denim Fabric Cost</Text>
                    <Text>Fabric Price ($/Yard)</Text>
                    <TextInput style={styles.input} keyboardType="decimal-pad" value={String(formData.fabric_price_per_yard)} onChangeText={t => handleNumericChange('fabric_price_per_yard', t)} />
                </View>
            )}

            {/* Common Costs Section */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Other Costs (per Piece)</Text>
                <View style={styles.row}>
                    <View style={styles.col}>
                        <Text style={styles.label}>AOP/Print            ($/pc)</Text>
                        <TextInput style={styles.input} keyboardType="decimal-pad" value={String(formData.aop_print_cost_per_pc)} onChangeText={t => handleNumericChange('aop_print_cost_per_pc', t)} />
                    </View>
                    <View style={styles.col}>
                        <Text style={styles.label}>Accessories          ($/pc)</Text>
                        <TextInput style={styles.input} keyboardType="decimal-pad" value={String(formData.accessories_cost_per_pc)} onChangeText={t => handleNumericChange('accessories_cost_per_pc', t)} />
                    </View>
                    <View style={styles.col}>
                        <Text style={styles.label}>CM Cost            ($/pc)</Text>
                        <TextInput style={styles.input} keyboardType="decimal-pad" value={String(formData.cm_cost_per_pc)} onChangeText={t => handleNumericChange('cm_cost_per_pc', t)} />
                    </View>
                </View>

                <Text style={styles.sectionTitle}>FOB-Essential Costs (per Piece)</Text>
                <View style={styles.row}>
                    <View style={styles.col}>
                        <Text style={styles.label}>Washing            ($/pc)</Text>
                        <TextInput style={styles.input} keyboardType="decimal-pad" value={String(formData.washing_cost_per_pc)} onChangeText={t => handleNumericChange('washing_cost_per_pc', t)} />
                    </View>
                    <View style={styles.col}>
                        <Text style={styles.label}>Commercial     ($/pc)</Text>
                        <TextInput style={styles.input} keyboardType="decimal-pad" value={String(formData.commercial_cost_per_pc)} onChangeText={t => handleNumericChange('commercial_cost_per_pc', t)} />
                    </View>
                    <View style={styles.col}>
                        <Text style={styles.label}>Testing            ($/pc)</Text>
                        <TextInput style={styles.input} keyboardType="decimal-pad" value={String(formData.testing_cost_per_pc)} onChangeText={t => handleNumericChange('testing_cost_per_pc', t)} />
                    </View>
                </View>
            </View>

            <TouchableOpacity style={styles.button} onPress={handleCalculate} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>CALCULATE FOB</Text>}
            </TouchableOpacity>

            <View style={{ height: 50 }} />
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: '#f5f5f5' },
    header: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center', color: '#333' },
    section: { backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 15, elevation: 2 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10, color: '#444' },
    label: { fontSize: 13, color: '#555', marginBottom: 5 },
    input: { borderWidth: 1, borderColor: '#ddd', padding: 10, borderRadius: 5, marginBottom: 10, backgroundColor: '#fafafa' },
    row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
    col: { flex: 1, marginHorizontal: 5 },
    garmentTypeContainer: { flexDirection: 'row', justifyContent: 'space-between' },
    typeButton: { flex: 1, padding: 12, marginHorizontal: 3, borderRadius: 8, borderWidth: 2, borderColor: '#007bff', backgroundColor: '#fff' },
    typeButtonActive: { backgroundColor: '#007bff' },
    typeButtonText: { color: '#007bff', fontSize: 12, fontWeight: '600', textAlign: 'center' },
    typeButtonTextActive: { color: '#fff' },
    button: { backgroundColor: '#007bff', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 10 },
    buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});

export default InputScreen;
