/**
 * FOB Calculation Logic
 * Supports multiple garment types: T-Shirt (Knit), Woven Shirt, Denim Jeans
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

export const calculateFOB = (inputs) => {
    const garmentType = inputs.garment_type || 'tshirt';

    if (garmentType === 'tshirt') {
        return calculateTshirtFOB(inputs);
    } else if (garmentType === 'shirt') {
        return calculateShirtFOB(inputs);
    } else if (garmentType === 'jeans') {
        return calculateJeansFOB(inputs);
    }

    // Default to t-shirt calculation
    return calculateTshirtFOB(inputs);
};

/**
 * T-Shirt (Knit) FOB Calculation
 * Formula: ((Body_Len + Sleeve_Len + Allowance) * (Chest + Allowance) * 2 * GSM * 12) / 10,000,000
 */
const calculateTshirtFOB = (inputs) => {
    const {
        body_length,
        sleeve_length,
        chest_width,
        gsm,
        wastage_percent,
        fabric_allowance = 4, // Default 4cm if not provided
        yarn_price_per_kg,
        knitting_charge_per_kg,
        dyeing_charge_per_kg,
        aop_print_cost_per_pc = 0,
        accessories_cost_per_pc = 0,
        cm_cost_per_pc = 0,
        washing_cost_per_pc = 0,
        commercial_cost_per_pc = 0,
        testing_cost_per_pc = 0,
        profit_margin_percent,
    } = inputs;

    // Step A: Basic Consumption (Kg/Doz) - Use user-defined fabric allowance
    const length_with_allowance = body_length + sleeve_length + fabric_allowance;
    const width_with_allowance = chest_width + (fabric_allowance * 0.75); // 75% of length allowance for width

    const basic_consumption = (
        length_with_allowance * width_with_allowance * 2 * gsm * 12
    ) / 10000000.0;

    // Step B: Total Fabric Req with Wastage
    const total_fabric_req = basic_consumption * (1 + (wastage_percent / 100.0));

    // Step C: Fabric Cost per Doz
    const fabric_rate_per_kg = (
        yarn_price_per_kg +
        knitting_charge_per_kg +
        dyeing_charge_per_kg
    );
    const fabric_cost_per_doz = fabric_rate_per_kg * total_fabric_req;

    // Step D: Total Cost per Piece (all costs already in per-piece)
    const fabric_cost_per_pc = fabric_cost_per_doz / 12;
    const total_cost_per_pc = (
        fabric_cost_per_pc +
        aop_print_cost_per_pc +
        accessories_cost_per_pc +
        cm_cost_per_pc +
        washing_cost_per_pc +
        commercial_cost_per_pc +
        testing_cost_per_pc
    );

    // Step E: Final FOB per Pc (add profit margin)
    const final_fob_per_pc = total_cost_per_pc * (1 + (profit_margin_percent / 100.0));

    return {
        garment_type: 'T-Shirt (Knit)',
        basic_consumption_kg_doz: parseFloat(basic_consumption.toFixed(4)),
        total_fabric_req_kg_doz: parseFloat(total_fabric_req.toFixed(4)),
        fabric_cost_per_pc: parseFloat(fabric_cost_per_pc.toFixed(2)),
        total_cost_per_pc: parseFloat(total_cost_per_pc.toFixed(2)),
        final_fob_per_pc: parseFloat(final_fob_per_pc.toFixed(2))
    };
};

/**
 * Woven Shirt FOB Calculation
 * Formula: Consumption (Yds/Doz) = ((Body + Sleeve + Allowance) / Fabric Width) * 12
 * Standard: ~1.60-1.70 yards per piece for L/S shirt
 */
const calculateShirtFOB = (inputs) => {
    const {
        shirt_body_length,
        shirt_sleeve_length,
        shirt_chest_width,
        shirt_collar,
        fabric_width,
        shirt_wastage_percent,
        shirt_fabric_allowance = 2, // Default 2" if not provided
        fabric_price_per_yard,
        aop_print_cost_per_pc = 0,
        accessories_cost_per_pc = 0,
        cm_cost_per_pc = 0,
        washing_cost_per_pc = 0,
        commercial_cost_per_pc = 0,
        testing_cost_per_pc = 0,
        profit_margin_percent,
    } = inputs;

    // Calculate total length needed - Use user-defined allowance
    const body_with_allowance = shirt_body_length + shirt_fabric_allowance;
    const sleeve_with_allowance = shirt_sleeve_length + shirt_fabric_allowance;
    const total_length = body_with_allowance + sleeve_with_allowance;

    // Calculate yards per piece
    // Convert inches to yards (divide by 36)
    let yards_per_piece = total_length / 36;

    // Add extra for collar, cuffs, pockets (~0.15 yards)
    yards_per_piece += 0.15;

    // Add wastage
    const yards_with_wastage = yards_per_piece * (1 + (shirt_wastage_percent / 100.0));

    // Calculate for dozen
    const yards_per_doz = yards_with_wastage * 12;

    // Fabric cost per piece
    const fabric_cost_per_pc = yards_with_wastage * fabric_price_per_yard;

    // Total cost per piece (all costs already in per-piece)
    const total_cost_per_pc = (
        fabric_cost_per_pc +
        aop_print_cost_per_pc +
        accessories_cost_per_pc +
        cm_cost_per_pc +
        washing_cost_per_pc +
        commercial_cost_per_pc +
        testing_cost_per_pc
    );

    // Final FOB (add profit margin)
    const final_fob_per_pc = total_cost_per_pc * (1 + (profit_margin_percent / 100.0));

    return {
        garment_type: 'Woven Shirt',
        basic_consumption_yards_piece: parseFloat(yards_per_piece.toFixed(3)),
        total_fabric_req_yards_doz: parseFloat(yards_per_doz.toFixed(2)),
        fabric_cost_per_pc: parseFloat(fabric_cost_per_pc.toFixed(2)),
        total_cost_per_pc: parseFloat(total_cost_per_pc.toFixed(2)),
        final_fob_per_pc: parseFloat(final_fob_per_pc.toFixed(2))
    };
};

/**
 * Denim Jeans FOB Calculation
 * Formula: Outseam length + allowances, fit within fabric width
 * Standard: ~1.37-1.44 yards per pair
 */
const calculateJeansFOB = (inputs) => {
    const {
        waist,
        inseam,
        thigh_width,
        front_rise,
        back_rise,
        leg_opening,
        denim_fabric_width,
        jeans_wastage_percent,
        jeans_fabric_allowance = 2, // Default 2" if not provided
        fabric_price_per_yard,
        aop_print_cost_per_pc = 0,
        accessories_cost_per_pc = 0,
        cm_cost_per_pc = 0,
        washing_cost_per_pc = 0,
        commercial_cost_per_pc = 0,
        testing_cost_per_pc = 0,
        profit_margin_percent,
    } = inputs;

    // Calculate total side length (outseam) - Use user-defined allowance
    const average_rise = (front_rise + back_rise) / 2;
    const total_length = inseam + average_rise + jeans_fabric_allowance; // User-defined allowance

    // Convert to yards
    let yards_per_piece = total_length / 36;

    // Add for pockets, waistband, loops (~0.15 yards)
    yards_per_piece += 0.15;

    // Add wastage
    const yards_with_wastage = yards_per_piece * (1 + (jeans_wastage_percent / 100.0));

    // Calculate for dozen
    const yards_per_doz = yards_with_wastage * 12;

    // Fabric cost per piece
    const fabric_cost_per_pc = yards_with_wastage * fabric_price_per_yard;

    // Total cost per piece (all costs already in per-piece)
    const total_cost_per_pc = (
        fabric_cost_per_pc +
        aop_print_cost_per_pc +
        accessories_cost_per_pc +
        cm_cost_per_pc +
        washing_cost_per_pc +
        commercial_cost_per_pc +
        testing_cost_per_pc
    );

    // Final FOB (add profit margin)
    const final_fob_per_pc = total_cost_per_pc * (1 + (profit_margin_percent / 100.0));

    return {
        garment_type: 'Denim Jeans',
        basic_consumption_yards_piece: parseFloat(yards_per_piece.toFixed(3)),
        total_fabric_req_yards_doz: parseFloat(yards_per_doz.toFixed(2)),
        fabric_cost_per_pc: parseFloat(fabric_cost_per_pc.toFixed(2)),
        total_cost_per_pc: parseFloat(total_cost_per_pc.toFixed(2)),
        final_fob_per_pc: parseFloat(final_fob_per_pc.toFixed(2))
    };
};

/**
 * Save cost sheet to local storage
 */
export const saveCostSheet = async (inputs, breakdown) => {
    try {
        const costSheet = {
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            inputs,
            breakdown
        };

        // Get existing history
        const historyJson = await AsyncStorage.getItem('cost_sheets_history');
        const history = historyJson ? JSON.parse(historyJson) : [];

        // Add new entry at the beginning
        history.unshift(costSheet);

        // Keep only last 50 entries
        const trimmedHistory = history.slice(0, 50);

        // Save back
        await AsyncStorage.setItem('cost_sheets_history', JSON.stringify(trimmedHistory));

        return costSheet;
    } catch (error) {
        console.error('Error saving cost sheet:', error);
        return null;
    }
};

/**
 * Get cost sheet history
 */
export const getCostSheetHistory = async () => {
    try {
        const historyJson = await AsyncStorage.getItem('cost_sheets_history');
        return historyJson ? JSON.parse(historyJson) : [];
    } catch (error) {
        console.error('Error loading history:', error);
        return [];
    }
};
