/**
 * Fabric Consumption & Marker Efficiency Calculator
 * 
 * Calculates fabric consumption per garment based on:
 * - Garment type (knit / woven / denim)
 * - Pattern parameters (width, length, repeat, GSM)
 * - Shrinkage %, wastage %, and marker efficiency
 * 
 * Outputs:
 * - Fabric per piece (kg / meter / yard)
 * - Total fabric requirement for order quantity
 * - Fabric cost impact on FOB
 */

// Industry standard marker efficiencies by garment type
export const MARKER_EFFICIENCY_BENCHMARKS = {
    knit: { min: 75, typical: 82, max: 90 },
    woven: { min: 70, typical: 78, max: 85 },
    denim: { min: 68, typical: 75, max: 82 },
};

// Standard shrinkage ranges by fabric type
export const SHRINKAGE_BENCHMARKS = {
    knit: { length: 5, width: 3 },    // Typical shrinkage %
    woven: { length: 3, width: 2 },
    denim: { length: 10, width: 5 },  // Denim has higher shrinkage
};

// Standard wastage ranges
export const WASTAGE_BENCHMARKS = {
    knit: { min: 3, typical: 5, max: 8 },
    woven: { min: 2, typical: 4, max: 6 },
    denim: { min: 3, typical: 5, max: 8 },
};

/**
 * Calculate fabric consumption for KNIT garments (T-shirts, polo, etc.)
 * 
 * @param {Object} params - Input parameters
 * @param {number} params.patternLength - Pattern length in cm
 * @param {number} params.patternWidth - Pattern width in cm
 * @param {number} params.gsm - Grams per square meter
 * @param {number} params.fabricWidth - Fabric tube width in cm (typically 80-100cm for tubular knit)
 * @param {number} params.markerEfficiency - Marker efficiency % (e.g., 82)
 * @param {number} params.shrinkageLength - Length shrinkage % (e.g., 5)
 * @param {number} params.shrinkageWidth - Width shrinkage % (e.g., 3)
 * @param {number} params.wastage - Wastage % (e.g., 5)
 * @param {number} params.orderQuantity - Total pieces to produce
 * @param {number} params.fabricPricePerKg - Fabric cost per kg
 * @param {number} params.piecesPerMarker - Number of pieces in one marker lay (default: 1)
 * @returns {Object} Consumption breakdown
 */
export function calculateKnitConsumption(params) {
    const {
        patternLength,
        patternWidth,
        gsm,
        fabricWidth,
        markerEfficiency,
        shrinkageLength,
        shrinkageWidth,
        wastage,
        orderQuantity,
        fabricPricePerKg,
        piecesPerMarker = 1,
    } = params;

    // Adjust pattern dimensions for shrinkage (add shrinkage allowance)
    const adjustedLength = patternLength * (1 + shrinkageLength / 100);
    const adjustedWidth = patternWidth * (1 + shrinkageWidth / 100);

    // Calculate pattern area in square meters
    const patternAreaSqM = (adjustedLength * adjustedWidth) / 10000;

    // Calculate theoretical consumption (kg) per piece based on GSM
    const theoreticalConsumptionKgPerPiece = (patternAreaSqM * gsm) / 1000;

    // Adjust for marker efficiency (lower efficiency = more fabric needed)
    const markerAdjustedConsumption = theoreticalConsumptionKgPerPiece / (markerEfficiency / 100);

    // Adjust for wastage
    const actualConsumptionKgPerPiece = markerAdjustedConsumption * (1 + wastage / 100);

    // Calculate per dozen consumption
    const consumptionKgPerDozen = actualConsumptionKgPerPiece * 12;

    // Calculate marker length (how much fabric length used per marker)
    const markerLength = (adjustedLength * piecesPerMarker) / (markerEfficiency / 100);
    const markerLengthMeters = markerLength / 100;

    // Calculate total fabric requirement for order
    const totalFabricKg = actualConsumptionKgPerPiece * orderQuantity;

    // Calculate total fabric length in meters
    // Formula: Total weight / (GSM * fabric width in meters)
    const fabricWidthMeters = fabricWidth / 100;
    const totalFabricMeters = totalFabricKg / (gsm * fabricWidthMeters / 1000);

    // Calculate costs
    const fabricCostPerPiece = actualConsumptionKgPerPiece * fabricPricePerKg;
    const fabricCostPerDozen = fabricCostPerPiece * 12;
    const totalFabricCost = totalFabricKg * fabricPricePerKg;

    // Efficiency metrics
    const fabricUtilization = markerEfficiency * (100 - wastage) / 100;
    const wasteKgPerPiece = actualConsumptionKgPerPiece - theoreticalConsumptionKgPerPiece;
    const totalWasteKg = wasteKgPerPiece * orderQuantity;

    return {
        garmentType: 'knit',
        unit: 'kg',

        // Core consumption metrics
        theoreticalConsumptionPerPiece: roundTo4(theoreticalConsumptionKgPerPiece),
        actualConsumptionPerPiece: roundTo4(actualConsumptionKgPerPiece),
        consumptionPerDozen: roundTo4(consumptionKgPerDozen),

        // Pattern & marker details
        adjustedPatternLength: roundTo2(adjustedLength),
        adjustedPatternWidth: roundTo2(adjustedWidth),
        patternAreaSqM: roundTo4(patternAreaSqM),
        markerLengthMeters: roundTo4(markerLengthMeters),

        // Order requirements
        orderQuantity,
        totalFabricRequired: roundTo2(totalFabricKg),
        totalFabricMeters: roundTo2(totalFabricMeters),

        // Cost breakdown
        fabricPricePerKg,
        fabricCostPerPiece: roundTo2(fabricCostPerPiece),
        fabricCostPerDozen: roundTo2(fabricCostPerDozen),
        totalFabricCost: roundTo2(totalFabricCost),

        // Efficiency analysis
        markerEfficiency,
        fabricUtilization: roundTo2(fabricUtilization),
        wastePercentage: roundTo2(100 - fabricUtilization),
        wastePerPiece: roundTo4(wasteKgPerPiece),
        totalWaste: roundTo2(totalWasteKg),

        // Input parameters (for reference)
        inputs: {
            patternLength,
            patternWidth,
            gsm,
            fabricWidth,
            markerEfficiency,
            shrinkageLength,
            shrinkageWidth,
            wastage,
            fabricPricePerKg,
        },
    };
}

/**
 * Calculate fabric consumption for WOVEN garments (shirts, blouses, etc.)
 * 
 * @param {Object} params - Input parameters
 * @param {number} params.patternLength - Pattern length in inches
 * @param {number} params.patternWidth - Pattern width in inches
 * @param {number} params.fabricWidth - Fabric width in inches (typically 44-60")
 * @param {number} params.markerEfficiency - Marker efficiency % (e.g., 78)
 * @param {number} params.shrinkageLength - Length shrinkage % (e.g., 3)
 * @param {number} params.shrinkageWidth - Width shrinkage % (e.g., 2)
 * @param {number} params.wastage - Wastage % (e.g., 4)
 * @param {number} params.orderQuantity - Total pieces to produce
 * @param {number} params.fabricPricePerYard - Fabric cost per yard
 * @param {number} params.patternRepeat - Pattern repeat in inches (for prints, 0 if solid)
 * @returns {Object} Consumption breakdown
 */
export function calculateWovenConsumption(params) {
    const {
        patternLength,
        patternWidth,
        fabricWidth,
        markerEfficiency,
        shrinkageLength,
        shrinkageWidth,
        wastage,
        orderQuantity,
        fabricPricePerYard,
        patternRepeat = 0,
    } = params;

    // Adjust pattern dimensions for shrinkage
    const adjustedLength = patternLength * (1 + shrinkageLength / 100);
    const adjustedWidth = patternWidth * (1 + shrinkageWidth / 100);

    // Add pattern repeat allowance if applicable
    const repeatAllowance = patternRepeat > 0 ? patternRepeat : 0;
    const totalPatternLength = adjustedLength + repeatAllowance;

    // Calculate how many patterns fit across fabric width
    const patternsAcross = Math.floor(fabricWidth / adjustedWidth);
    const effectivePatternsAcross = Math.max(1, patternsAcross);

    // Calculate theoretical yards per piece
    const theoreticalYardsPerPiece = totalPatternLength / (36 * effectivePatternsAcross);

    // Adjust for marker efficiency
    const markerAdjustedYards = theoreticalYardsPerPiece / (markerEfficiency / 100);

    // Adjust for wastage
    const actualYardsPerPiece = markerAdjustedYards * (1 + wastage / 100);

    // Per dozen consumption
    const consumptionYardsPerDozen = actualYardsPerPiece * 12;

    // Calculate marker dimensions
    const markerLengthInches = totalPatternLength / (markerEfficiency / 100);
    const markerLengthYards = markerLengthInches / 36;

    // Total fabric requirement
    const totalFabricYards = actualYardsPerPiece * orderQuantity;
    const totalFabricMeters = totalFabricYards * 0.9144; // Convert yards to meters

    // Cost calculations
    const fabricCostPerPiece = actualYardsPerPiece * fabricPricePerYard;
    const fabricCostPerDozen = fabricCostPerPiece * 12;
    const totalFabricCost = totalFabricYards * fabricPricePerYard;

    // Efficiency metrics
    const fabricUtilization = markerEfficiency * (100 - wastage) / 100;
    const wasteYardsPerPiece = actualYardsPerPiece - theoreticalYardsPerPiece;
    const totalWasteYards = wasteYardsPerPiece * orderQuantity;

    return {
        garmentType: 'woven',
        unit: 'yards',

        // Core consumption metrics
        theoreticalConsumptionPerPiece: roundTo4(theoreticalYardsPerPiece),
        actualConsumptionPerPiece: roundTo4(actualYardsPerPiece),
        consumptionPerDozen: roundTo4(consumptionYardsPerDozen),

        // Pattern & marker details
        adjustedPatternLength: roundTo2(adjustedLength),
        adjustedPatternWidth: roundTo2(adjustedWidth),
        patternRepeatAllowance: roundTo2(repeatAllowance),
        patternsAcrossFabric: effectivePatternsAcross,
        markerLengthYards: roundTo4(markerLengthYards),

        // Order requirements
        orderQuantity,
        totalFabricRequired: roundTo2(totalFabricYards),
        totalFabricMeters: roundTo2(totalFabricMeters),

        // Cost breakdown
        fabricPricePerYard,
        fabricCostPerPiece: roundTo2(fabricCostPerPiece),
        fabricCostPerDozen: roundTo2(fabricCostPerDozen),
        totalFabricCost: roundTo2(totalFabricCost),

        // Efficiency analysis
        markerEfficiency,
        fabricUtilization: roundTo2(fabricUtilization),
        wastePercentage: roundTo2(100 - fabricUtilization),
        wastePerPiece: roundTo4(wasteYardsPerPiece),
        totalWaste: roundTo2(totalWasteYards),

        // Input parameters
        inputs: {
            patternLength,
            patternWidth,
            fabricWidth,
            markerEfficiency,
            shrinkageLength,
            shrinkageWidth,
            wastage,
            fabricPricePerYard,
            patternRepeat,
        },
    };
}

/**
 * Calculate fabric consumption for DENIM garments (jeans, jackets, etc.)
 * 
 * @param {Object} params - Input parameters
 * @param {number} params.patternLength - Pattern length in inches (typically outseam + allowances)
 * @param {number} params.patternWidth - Pattern width in inches (thigh width * 2 + seams)
 * @param {number} params.fabricWidth - Fabric width in inches (typically 58-62" for denim)
 * @param {number} params.fabricWeight - Fabric weight in oz/sq yard (e.g., 12oz, 14oz)
 * @param {number} params.markerEfficiency - Marker efficiency % (e.g., 75)
 * @param {number} params.shrinkageLength - Length shrinkage % (e.g., 10 for raw denim)
 * @param {number} params.shrinkageWidth - Width shrinkage % (e.g., 5)
 * @param {number} params.wastage - Wastage % (e.g., 5)
 * @param {number} params.orderQuantity - Total pieces to produce
 * @param {number} params.fabricPricePerYard - Fabric cost per yard
 * @returns {Object} Consumption breakdown
 */
export function calculateDenimConsumption(params) {
    const {
        patternLength,
        patternWidth,
        fabricWidth,
        fabricWeight,
        markerEfficiency,
        shrinkageLength,
        shrinkageWidth,
        wastage,
        orderQuantity,
        fabricPricePerYard,
    } = params;

    // Denim requires larger shrinkage allowances (especially raw/unwashed denim)
    const adjustedLength = patternLength * (1 + shrinkageLength / 100);
    const adjustedWidth = patternWidth * (1 + shrinkageWidth / 100);

    // Add allowance for pockets, waistband, belt loops (typical ~0.2 yards per piece)
    const accessoryAllowance = 0.2 * 36; // inches

    // Calculate how many patterns fit across fabric width
    const patternsAcross = Math.floor(fabricWidth / adjustedWidth);
    const effectivePatternsAcross = Math.max(1, patternsAcross);

    // Calculate theoretical yards per piece
    const totalPatternLength = adjustedLength + accessoryAllowance;
    const theoreticalYardsPerPiece = totalPatternLength / (36 * effectivePatternsAcross);

    // Adjust for marker efficiency (denim typically has lower efficiency due to grain direction)
    const markerAdjustedYards = theoreticalYardsPerPiece / (markerEfficiency / 100);

    // Adjust for wastage
    const actualYardsPerPiece = markerAdjustedYards * (1 + wastage / 100);

    // Per dozen consumption
    const consumptionYardsPerDozen = actualYardsPerPiece * 12;

    // Calculate weight-based consumption (oz and kg)
    // Fabric weight is oz per square yard
    const sqYardsPerPiece = actualYardsPerPiece * (fabricWidth / 36);
    const ozPerPiece = sqYardsPerPiece * fabricWeight;
    const kgPerPiece = ozPerPiece * 0.0283495; // Convert oz to kg

    // Marker dimensions
    const markerLengthInches = totalPatternLength / (markerEfficiency / 100);
    const markerLengthYards = markerLengthInches / 36;

    // Total fabric requirement
    const totalFabricYards = actualYardsPerPiece * orderQuantity;
    const totalFabricMeters = totalFabricYards * 0.9144;
    const totalFabricKg = kgPerPiece * orderQuantity;

    // Cost calculations
    const fabricCostPerPiece = actualYardsPerPiece * fabricPricePerYard;
    const fabricCostPerDozen = fabricCostPerPiece * 12;
    const totalFabricCost = totalFabricYards * fabricPricePerYard;

    // Efficiency metrics
    const fabricUtilization = markerEfficiency * (100 - wastage) / 100;
    const wasteYardsPerPiece = actualYardsPerPiece - theoreticalYardsPerPiece;
    const totalWasteYards = wasteYardsPerPiece * orderQuantity;

    return {
        garmentType: 'denim',
        unit: 'yards',

        // Core consumption metrics
        theoreticalConsumptionPerPiece: roundTo4(theoreticalYardsPerPiece),
        actualConsumptionPerPiece: roundTo4(actualYardsPerPiece),
        consumptionPerDozen: roundTo4(consumptionYardsPerDozen),

        // Weight-based consumption
        weightOzPerPiece: roundTo2(ozPerPiece),
        weightKgPerPiece: roundTo4(kgPerPiece),
        weightKgPerDozen: roundTo4(kgPerPiece * 12),

        // Pattern & marker details
        adjustedPatternLength: roundTo2(adjustedLength),
        adjustedPatternWidth: roundTo2(adjustedWidth),
        accessoryAllowance: roundTo2(accessoryAllowance / 36), // in yards
        patternsAcrossFabric: effectivePatternsAcross,
        markerLengthYards: roundTo4(markerLengthYards),

        // Order requirements
        orderQuantity,
        totalFabricRequired: roundTo2(totalFabricYards),
        totalFabricMeters: roundTo2(totalFabricMeters),
        totalFabricKg: roundTo2(totalFabricKg),

        // Cost breakdown
        fabricPricePerYard,
        fabricCostPerPiece: roundTo2(fabricCostPerPiece),
        fabricCostPerDozen: roundTo2(fabricCostPerDozen),
        totalFabricCost: roundTo2(totalFabricCost),

        // Efficiency analysis
        markerEfficiency,
        fabricUtilization: roundTo2(fabricUtilization),
        wastePercentage: roundTo2(100 - fabricUtilization),
        wastePerPiece: roundTo4(wasteYardsPerPiece),
        totalWaste: roundTo2(totalWasteYards),

        // Input parameters
        inputs: {
            patternLength,
            patternWidth,
            fabricWidth,
            fabricWeight,
            markerEfficiency,
            shrinkageLength,
            shrinkageWidth,
            wastage,
            fabricPricePerYard,
        },
    };
}

/**
 * Main calculation dispatcher - determines which calculation to use based on garment type
 */
export function calculateFabricConsumption(garmentType, params) {
    switch (garmentType) {
        case 'knit':
            return calculateKnitConsumption(params);
        case 'woven':
            return calculateWovenConsumption(params);
        case 'denim':
            return calculateDenimConsumption(params);
        default:
            throw new Error(`Unknown garment type: ${garmentType}`);
    }
}

/**
 * Calculate FOB impact from fabric cost
 * 
 * @param {number} fabricCostPerPiece - Fabric cost per piece
 * @param {number} otherCostsPerPiece - All other costs (CM, accessories, etc.) per piece
 * @param {number} profitMargin - Profit margin % (e.g., 10)
 * @returns {Object} FOB breakdown
 */
export function calculateFOBImpact(fabricCostPerPiece, otherCostsPerPiece, profitMargin) {
    const totalCostPerPiece = fabricCostPerPiece + otherCostsPerPiece;
    const totalCostPerDozen = totalCostPerPiece * 12;

    const fobPerPiece = totalCostPerPiece * (1 + profitMargin / 100);
    const fobPerDozen = fobPerPiece * 12;

    const fabricPercentageOfCost = (fabricCostPerPiece / totalCostPerPiece) * 100;
    const fabricPercentageOfFOB = (fabricCostPerPiece / fobPerPiece) * 100;

    return {
        fabricCostPerPiece: roundTo2(fabricCostPerPiece),
        fabricCostPerDozen: roundTo2(fabricCostPerPiece * 12),
        otherCostsPerPiece: roundTo2(otherCostsPerPiece),
        otherCostsPerDozen: roundTo2(otherCostsPerPiece * 12),
        totalCostPerPiece: roundTo2(totalCostPerPiece),
        totalCostPerDozen: roundTo2(totalCostPerDozen),
        profitMargin,
        fobPerPiece: roundTo2(fobPerPiece),
        fobPerDozen: roundTo2(fobPerDozen),
        fabricPercentageOfCost: roundTo2(fabricPercentageOfCost),
        fabricPercentageOfFOB: roundTo2(fabricPercentageOfFOB),
    };
}

/**
 * Get recommended marker efficiency based on garment type
 */
export function getRecommendedEfficiency(garmentType) {
    return MARKER_EFFICIENCY_BENCHMARKS[garmentType] || MARKER_EFFICIENCY_BENCHMARKS.woven;
}

/**
 * Get recommended shrinkage values based on garment type
 */
export function getRecommendedShrinkage(garmentType) {
    return SHRINKAGE_BENCHMARKS[garmentType] || SHRINKAGE_BENCHMARKS.woven;
}

/**
 * Get recommended wastage values based on garment type
 */
export function getRecommendedWastage(garmentType) {
    return WASTAGE_BENCHMARKS[garmentType] || WASTAGE_BENCHMARKS.woven;
}

/**
 * Validate input parameters
 */
export function validateInputs(garmentType, params) {
    const errors = [];

    // Common validations
    if (!params.patternLength || params.patternLength <= 0) {
        errors.push('Pattern length must be greater than 0');
    }
    if (!params.patternWidth || params.patternWidth <= 0) {
        errors.push('Pattern width must be greater than 0');
    }
    if (!params.fabricWidth || params.fabricWidth <= 0) {
        errors.push('Fabric width must be greater than 0');
    }
    if (!params.markerEfficiency || params.markerEfficiency <= 0 || params.markerEfficiency > 100) {
        errors.push('Marker efficiency must be between 0 and 100');
    }
    if (params.shrinkageLength < 0 || params.shrinkageLength > 50) {
        errors.push('Shrinkage (length) must be between 0 and 50%');
    }
    if (params.shrinkageWidth < 0 || params.shrinkageWidth > 50) {
        errors.push('Shrinkage (width) must be between 0 and 50%');
    }
    if (params.wastage < 0 || params.wastage > 50) {
        errors.push('Wastage must be between 0 and 50%');
    }
    if (!params.orderQuantity || params.orderQuantity <= 0) {
        errors.push('Order quantity must be greater than 0');
    }

    // Type-specific validations
    if (garmentType === 'knit') {
        if (!params.gsm || params.gsm <= 0) {
            errors.push('GSM must be greater than 0');
        }
        if (!params.fabricPricePerKg || params.fabricPricePerKg <= 0) {
            errors.push('Fabric price per kg must be greater than 0');
        }
    } else {
        if (!params.fabricPricePerYard || params.fabricPricePerYard <= 0) {
            errors.push('Fabric price per yard must be greater than 0');
        }
    }

    if (garmentType === 'denim') {
        if (!params.fabricWeight || params.fabricWeight <= 0) {
            errors.push('Fabric weight (oz) must be greater than 0');
        }
    }

    return {
        isValid: errors.length === 0,
        errors,
    };
}

// Utility functions
function roundTo2(num) {
    return Math.round(num * 100) / 100;
}

function roundTo4(num) {
    return Math.round(num * 10000) / 10000;
}

export default {
    calculateFabricConsumption,
    calculateKnitConsumption,
    calculateWovenConsumption,
    calculateDenimConsumption,
    calculateFOBImpact,
    getRecommendedEfficiency,
    getRecommendedShrinkage,
    getRecommendedWastage,
    validateInputs,
    MARKER_EFFICIENCY_BENCHMARKS,
    SHRINKAGE_BENCHMARKS,
    WASTAGE_BENCHMARKS,
};
