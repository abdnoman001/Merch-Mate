import { useEffect, useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import {
    calculateFabricConsumption,
    getRecommendedEfficiency,
    getRecommendedShrinkage,
    getRecommendedWastage,
    MARKER_EFFICIENCY_BENCHMARKS,
    validateInputs,
} from '../utils/fabricConsumptionCalculator';

const GARMENT_TYPES = [
    { key: 'knit', label: 'Knit', sublabel: 'T-Shirt', icon: '👕' },
    { key: 'woven', label: 'Woven', sublabel: 'Shirt', icon: '👔' },
    { key: 'denim', label: 'Denim', sublabel: 'Jeans', icon: '👖' },
];

const FabricAnalyzerInputScreen = ({ navigation, route }) => {
    const editData = route?.params?.editData;

    // Basic info
    const [styleName, setStyleName] = useState('');
    const [buyerName, setBuyerName] = useState('');
    const [garmentType, setGarmentType] = useState('knit');

    // Pattern parameters
    const [patternLength, setPatternLength] = useState('');
    const [patternWidth, setPatternWidth] = useState('');
    const [fabricWidth, setFabricWidth] = useState('');
    const [gsm, setGsm] = useState(''); // For knit
    const [fabricWeight, setFabricWeight] = useState(''); // For denim (oz/sq yard)
    const [patternRepeat, setPatternRepeat] = useState('0'); // For woven prints

    // Shrinkage & wastage
    const [shrinkageLength, setShrinkageLength] = useState('');
    const [shrinkageWidth, setShrinkageWidth] = useState('');
    const [wastage, setWastage] = useState('');
    const [markerEfficiency, setMarkerEfficiency] = useState('');

    // Order & cost
    const [orderQuantity, setOrderQuantity] = useState('');
    const [fabricPrice, setFabricPrice] = useState(''); // per kg (knit) or per yard (woven/denim)
    const [otherCosts, setOtherCosts] = useState('0'); // Optional: other costs per piece for FOB calculation
    const [profitMargin, setProfitMargin] = useState('10');

    // Set default values based on garment type
    useEffect(() => {
        if (!editData) {
            const shrinkage = getRecommendedShrinkage(garmentType);
            const wastageRec = getRecommendedWastage(garmentType);
            const efficiency = getRecommendedEfficiency(garmentType);

            setShrinkageLength(shrinkage.length.toString());
            setShrinkageWidth(shrinkage.width.toString());
            setWastage(wastageRec.typical.toString());
            setMarkerEfficiency(efficiency.typical.toString());

            // Set default fabric widths
            if (garmentType === 'knit') {
                setFabricWidth('90'); // cm for tubular knit
                setGsm('180'); // typical for t-shirt
            } else if (garmentType === 'woven') {
                setFabricWidth('58'); // inches
            } else if (garmentType === 'denim') {
                setFabricWidth('60'); // inches
                setFabricWeight('12'); // 12 oz denim
            }
        }
    }, [garmentType, editData]);

    // Load edit data if available
    useEffect(() => {
        if (editData) {
            setStyleName(editData.styleName || '');
            setBuyerName(editData.buyerName || '');
            setGarmentType(editData.garmentType || 'knit');
            setPatternLength(editData.inputs?.patternLength?.toString() || '');
            setPatternWidth(editData.inputs?.patternWidth?.toString() || '');
            setFabricWidth(editData.inputs?.fabricWidth?.toString() || '');
            setGsm(editData.inputs?.gsm?.toString() || '');
            setFabricWeight(editData.inputs?.fabricWeight?.toString() || '');
            setPatternRepeat(editData.inputs?.patternRepeat?.toString() || '0');
            setShrinkageLength(editData.inputs?.shrinkageLength?.toString() || '');
            setShrinkageWidth(editData.inputs?.shrinkageWidth?.toString() || '');
            setWastage(editData.inputs?.wastage?.toString() || '');
            setMarkerEfficiency(editData.inputs?.markerEfficiency?.toString() || '');
            setOrderQuantity(editData.orderQuantity?.toString() || '');
            setFabricPrice(
                (editData.inputs?.fabricPricePerKg || editData.inputs?.fabricPricePerYard)?.toString() || ''
            );
            setOtherCosts(editData.otherCosts?.toString() || '0');
            setProfitMargin(editData.profitMargin?.toString() || '10');
        }
    }, [editData]);

    const handleCalculate = () => {
        // Build params based on garment type
        const baseParams = {
            patternLength: parseFloat(patternLength) || 0,
            patternWidth: parseFloat(patternWidth) || 0,
            fabricWidth: parseFloat(fabricWidth) || 0,
            markerEfficiency: parseFloat(markerEfficiency) || 0,
            shrinkageLength: parseFloat(shrinkageLength) || 0,
            shrinkageWidth: parseFloat(shrinkageWidth) || 0,
            wastage: parseFloat(wastage) || 0,
            orderQuantity: parseInt(orderQuantity, 10) || 0,
        };

        let params;
        if (garmentType === 'knit') {
            params = {
                ...baseParams,
                gsm: parseFloat(gsm) || 0,
                fabricPricePerKg: parseFloat(fabricPrice) || 0,
            };
        } else if (garmentType === 'woven') {
            params = {
                ...baseParams,
                fabricPricePerYard: parseFloat(fabricPrice) || 0,
                patternRepeat: parseFloat(patternRepeat) || 0,
            };
        } else {
            // denim
            params = {
                ...baseParams,
                fabricWeight: parseFloat(fabricWeight) || 0,
                fabricPricePerYard: parseFloat(fabricPrice) || 0,
            };
        }

        // Validate inputs
        const validation = validateInputs(garmentType, params);
        if (!validation.isValid) {
            Alert.alert('Validation Error', validation.errors.join('\n'));
            return;
        }

        try {
            const result = calculateFabricConsumption(garmentType, params);

            // Add metadata
            const analysisData = {
                ...result,
                styleName,
                buyerName,
                otherCosts: parseFloat(otherCosts) || 0,
                profitMargin: parseFloat(profitMargin) || 10,
                timestamp: new Date().toISOString(),
                id: editData?.id || Date.now().toString(),
            };

            navigation.navigate('FabricAnalyzerResult', { analysisData });
        } catch (error) {
            Alert.alert('Calculation Error', error.message);
        }
    };

    const renderGarmentTypeSelector = () => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <Text style={styles.cardIcon}>🏷️</Text>
                <Text style={styles.cardTitle}>Garment Type</Text>
            </View>
            <View style={styles.typeButtonsContainer}>
                {GARMENT_TYPES.map((type) => (
                    <TouchableOpacity
                        key={type.key}
                        style={[
                            styles.typeButton,
                            garmentType === type.key && styles.typeButtonActive,
                        ]}
                        onPress={() => setGarmentType(type.key)}
                    >
                        <Text style={styles.typeIcon}>{type.icon}</Text>
                        <Text
                            style={[
                                styles.typeLabel,
                                garmentType === type.key && styles.typeLabelActive,
                            ]}
                        >
                            {type.label}
                        </Text>
                        <Text style={[
                            styles.typeSublabel,
                            garmentType === type.key && styles.typeSublabelActive,
                        ]}>
                            {type.sublabel}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );

    const renderBasicInfo = () => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <Text style={styles.cardIcon}>📋</Text>
                <Text style={styles.cardTitle}>Basic Information</Text>
            </View>
            <View style={styles.cardContent}>
                <View style={styles.row}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Style Name</Text>
                        <TextInput
                            style={styles.input}
                            value={styleName}
                            onChangeText={setStyleName}
                            placeholder="Enter style name"
                            placeholderTextColor="#999"
                        />
                    </View>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Buyer Name</Text>
                        <TextInput
                            style={styles.input}
                            value={buyerName}
                            onChangeText={setBuyerName}
                            placeholder="Enter buyer name"
                            placeholderTextColor="#999"
                        />
                    </View>
                </View>
            </View>
        </View>
    );

    const renderPatternParams = () => {
        const lengthUnit = garmentType === 'knit' ? 'cm' : 'inches';
        const widthUnit = garmentType === 'knit' ? 'cm' : 'inches';

        return (
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <Text style={styles.cardIcon}>📐</Text>
                    <Text style={styles.cardTitle}>Pattern Parameters</Text>
                    <View style={styles.unitBadge}>
                        <Text style={styles.unitBadgeText}>{garmentType === 'knit' ? 'cm' : 'in'}</Text>
                    </View>
                </View>
                <View style={styles.cardContent}>

                    <View style={styles.row}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Pattern Length ({lengthUnit})</Text>
                            <TextInput
                                style={styles.input}
                                value={patternLength}
                                onChangeText={setPatternLength}
                                placeholder={garmentType === 'knit' ? 'e.g., 75' : 'e.g., 32'}
                                keyboardType="numeric"
                                placeholderTextColor="#999"
                            />
                        </View>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Pattern Width ({widthUnit})</Text>
                            <TextInput
                                style={styles.input}
                                value={patternWidth}
                                onChangeText={setPatternWidth}
                                placeholder={garmentType === 'knit' ? 'e.g., 55' : 'e.g., 24'}
                                keyboardType="numeric"
                                placeholderTextColor="#999"
                            />
                        </View>
                    </View>

                    <View style={styles.row}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>
                                Fabric Width ({garmentType === 'knit' ? 'cm' : 'inches'})
                            </Text>
                            <TextInput
                                style={styles.input}
                                value={fabricWidth}
                                onChangeText={setFabricWidth}
                                placeholder={garmentType === 'knit' ? 'e.g., 90' : 'e.g., 58'}
                                keyboardType="numeric"
                                placeholderTextColor="#999"
                            />
                        </View>

                        {garmentType === 'knit' && (
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>GSM</Text>
                                <TextInput
                                    style={styles.input}
                                    value={gsm}
                                    onChangeText={setGsm}
                                    placeholder="e.g., 180"
                                    keyboardType="numeric"
                                    placeholderTextColor="#999"
                                />
                            </View>
                        )}

                        {garmentType === 'denim' && (
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Fabric Weight (oz/sq yd)</Text>
                                <TextInput
                                    style={styles.input}
                                    value={fabricWeight}
                                    onChangeText={setFabricWeight}
                                    placeholder="e.g., 12"
                                    keyboardType="numeric"
                                    placeholderTextColor="#999"
                                />
                            </View>
                        )}

                        {garmentType === 'woven' && (
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Pattern Repeat (inches)</Text>
                                <TextInput
                                    style={styles.input}
                                    value={patternRepeat}
                                    onChangeText={setPatternRepeat}
                                    placeholder="0 for solid"
                                    keyboardType="numeric"
                                    placeholderTextColor="#999"
                                />
                            </View>
                        )}
                    </View>
                </View>
            </View>
        );
    };

    const renderEfficiencyParams = () => {
        const benchmark = MARKER_EFFICIENCY_BENCHMARKS[garmentType];

        return (
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <Text style={styles.cardIcon}>⚡</Text>
                    <Text style={styles.cardTitle}>Efficiency & Allowances</Text>
                </View>
                <View style={styles.cardContent}>
                    <View style={styles.tipBox}>
                        <Text style={styles.tipEmoji}>💡</Text>
                        <View style={styles.tipContent}>
                            <Text style={styles.tipTitle}>Marker Efficiency Range</Text>
                            <Text style={styles.tipText}>
                                {benchmark.min}% - {benchmark.max}% (Typical: {benchmark.typical}%)
                            </Text>
                        </View>
                    </View>

                    <View style={styles.row}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Marker Efficiency (%)</Text>
                            <TextInput
                                style={styles.input}
                                value={markerEfficiency}
                                onChangeText={setMarkerEfficiency}
                                placeholder={`e.g., ${benchmark.typical}`}
                                keyboardType="numeric"
                                placeholderTextColor="#999"
                            />
                        </View>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Wastage (%)</Text>
                            <TextInput
                                style={styles.input}
                                value={wastage}
                                onChangeText={setWastage}
                                placeholder="e.g., 5"
                                keyboardType="numeric"
                                placeholderTextColor="#999"
                            />
                        </View>
                    </View>

                    <View style={styles.row}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Shrinkage Length (%)</Text>
                            <TextInput
                                style={styles.input}
                                value={shrinkageLength}
                                onChangeText={setShrinkageLength}
                                placeholder="e.g., 5"
                                keyboardType="numeric"
                                placeholderTextColor="#999"
                            />
                        </View>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Shrinkage Width (%)</Text>
                            <TextInput
                                style={styles.input}
                                value={shrinkageWidth}
                                onChangeText={setShrinkageWidth}
                                placeholder="e.g., 3"
                                keyboardType="numeric"
                                placeholderTextColor="#999"
                            />
                        </View>
                    </View>
                </View>
            </View>
        );
    };

    const renderOrderAndCost = () => {
        const priceUnit = garmentType === 'knit' ? 'per kg' : 'per yard';
        const pricePlaceholder = garmentType === 'knit' ? 'e.g., 8.50' : 'e.g., 4.50';

        return (
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <Text style={styles.cardIcon}>💰</Text>
                    <Text style={styles.cardTitle}>Order & Cost</Text>
                    <View style={styles.unitBadge}>
                        <Text style={styles.unitBadgeText}>USD</Text>
                    </View>
                </View>
                <View style={styles.cardContent}>
                    <View style={styles.row}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Order Quantity (pcs)</Text>
                            <TextInput
                                style={styles.input}
                                value={orderQuantity}
                                onChangeText={setOrderQuantity}
                                placeholder="e.g., 10000"
                                keyboardType="numeric"
                                placeholderTextColor="#999"
                            />
                        </View>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Fabric Price ({priceUnit}) $</Text>
                            <TextInput
                                style={styles.input}
                                value={fabricPrice}
                                onChangeText={setFabricPrice}
                                placeholder={pricePlaceholder}
                                keyboardType="numeric"
                                placeholderTextColor="#999"
                            />
                        </View>
                    </View>

                    <View style={styles.row}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Other Costs ($/pc) - Optional</Text>
                            <TextInput
                                style={styles.input}
                                value={otherCosts}
                                onChangeText={setOtherCosts}
                                placeholder="e.g., 2.50"
                                keyboardType="numeric"
                                placeholderTextColor="#999"
                            />
                        </View>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Profit Margin (%)</Text>
                            <TextInput
                                style={styles.input}
                                value={profitMargin}
                                onChangeText={setProfitMargin}
                                placeholder="e.g., 10"
                                keyboardType="numeric"
                                placeholderTextColor="#999"
                            />
                        </View>
                    </View>
                </View>
            </View>
        );
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.header}>
                    <View style={styles.headerIconContainer}>
                        <Text style={styles.headerIcon}>🧵</Text>
                    </View>
                    <Text style={styles.headerTitle}>Fabric Analyzer</Text>
                    <Text style={styles.headerSubtitle}>
                        Calculate fabric consumption & marker efficiency
                    </Text>
                </View>

                {renderGarmentTypeSelector()}
                {renderBasicInfo()}
                {renderPatternParams()}
                {renderEfficiencyParams()}
                {renderOrderAndCost()}

                <TouchableOpacity style={styles.calculateButton} onPress={handleCalculate}>
                    <Text style={styles.calculateButtonIcon}>📊</Text>
                    <Text style={styles.calculateButtonText}>Analyze Consumption</Text>
                </TouchableOpacity>

                <View style={styles.bottomPadding} />
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f0f2f5',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingLeft: 16,
        paddingRight: 16,
    },

    // Header
    header: {
        backgroundColor: '#28a745',
        paddingTop: 20,
        paddingBottom: 30,
        paddingHorizontal: 20,
        alignItems: 'center',
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        marginBottom: 20,
    },
    headerIconContainer: {
        width: 64,
        height: 64,
        borderRadius: 20,
        backgroundColor: '#28a745',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
        shadowColor: '#28a745',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    headerIcon: {
        fontSize: 32,
    },
    headerTitle: {
        fontSize: 26,
        fontWeight: '800',
        color: '#ffffff',
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#e5e5e5',
        textAlign: 'center',
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
    unitBadge: {
        backgroundColor: '#28a74515',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 10,
    },
    unitBadgeText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#28a745',
    },

    // Type Selector
    typeButtonsContainer: {
        flexDirection: 'row',
        padding: 12,
        gap: 10,
    },
    typeButton: {
        flex: 1,
        backgroundColor: '#f8f9fa',
        borderRadius: 14,
        paddingVertical: 16,
        paddingHorizontal: 8,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    typeButtonActive: {
        borderColor: '#28a745',
        backgroundColor: '#28a74510',
    },
    typeIcon: {
        fontSize: 32,
        marginBottom: 6,
    },
    typeLabel: {
        fontSize: 13,
        fontWeight: '700',
        color: '#333',
        marginBottom: 2,
    },
    typeLabelActive: {
        color: '#28a745',
    },
    typeSublabel: {
        fontSize: 10,
        color: '#888',
        textAlign: 'center',
    },
    typeSublabelActive: {
        color: '#28a745',
    },

    // Form Elements
    row: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 14,
    },
    inputGroup: {
        flex: 1,
    },
    label: {
        fontSize: 12,
        color: '#555',
        marginBottom: 6,
        fontWeight: '600',
    },
    input: {
        backgroundColor: '#f8f9fa',
        borderRadius: 10,
        padding: 14,
        fontSize: 16,
        borderWidth: 1.5,
        borderColor: '#e8e8e8',
        color: '#333',
    },

    // Tip Box
    tipBox: {
        flexDirection: 'row',
        backgroundColor: '#fff9e6',
        borderRadius: 12,
        padding: 14,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#ffc10730',
    },
    tipEmoji: {
        fontSize: 20,
        marginRight: 12,
    },
    tipContent: {
        flex: 1,
    },
    tipTitle: {
        fontSize: 12,
        fontWeight: '700',
        color: '#856404',
        marginBottom: 2,
    },
    tipText: {
        fontSize: 12,
        color: '#856404',
    },

    // Calculate Button
    calculateButton: {
        backgroundColor: '#28a745',
        borderRadius: 14,
        paddingVertical: 18,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 8,
        shadowColor: '#28a745',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    calculateButtonIcon: {
        fontSize: 22,
        marginRight: 10,
    },
    calculateButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
    },

    bottomPadding: {
        height: 40,
    },
});

export default FabricAnalyzerInputScreen;
