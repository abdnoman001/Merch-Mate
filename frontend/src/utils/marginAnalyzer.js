/**
 * Buyer-Centric Cost & Margin Analyzer
 * 
 * Industry-grade margin analysis for apparel merchandising.
 * Evaluates FOB viability, margin health, and negotiation intelligence.
 * 
 * NOT a production tool - focuses on buyer pricing and commercial decisions.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// ============================================================================
// INDUSTRY BENCHMARKS - Cost thresholds for flagging
// ============================================================================

export const COST_THRESHOLDS = {
    fabricPercent: { low: 35, typical: 45, high: 55, critical: 65 },
    trimPercent: { low: 5, typical: 8, high: 12, critical: 15 },
    cmPercent: { low: 15, typical: 22, high: 30, critical: 40 },
    washingPercent: { low: 0, typical: 5, high: 10, critical: 15 },
    packagingPercent: { low: 2, typical: 4, high: 6, critical: 10 },
    testingPercent: { low: 1, typical: 2, high: 4, critical: 6 },
    logisticsPercent: { low: 2, typical: 4, high: 7, critical: 10 },
    overheadPercent: { low: 3, typical: 5, high: 8, critical: 12 },
};

export const MARGIN_BENCHMARKS = {
    minimum: 5,       // Below this = loss territory
    low: 10,          // Low margin - high risk
    healthy: 15,      // Industry standard healthy margin
    strong: 20,       // Strong margin - negotiation buffer
    premium: 25,      // Premium margin - luxury/specialty
};

export const ORDER_SIZE_BENCHMARKS = {
    small: 500,       // Small order - higher cost impact
    medium: 2000,     // Medium order - typical
    large: 5000,      // Large order - efficiency gains
    bulk: 10000,      // Bulk order - maximum efficiency
};

// Currency symbols
export const CURRENCIES = {
    USD: { symbol: '$', name: 'US Dollar' },
    EUR: { symbol: '€', name: 'Euro' },
    GBP: { symbol: '£', name: 'British Pound' },
    BDT: { symbol: '৳', name: 'Bangladeshi Taka' },
    INR: { symbol: '₹', name: 'Indian Rupee' },
    CNY: { symbol: '¥', name: 'Chinese Yuan' },
};

// Incoterms
export const INCOTERMS = {
    FOB: 'Free On Board',
    CIF: 'Cost, Insurance & Freight',
    CFR: 'Cost & Freight',
    EXW: 'Ex Works',
    DDP: 'Delivered Duty Paid',
};

// ============================================================================
// CORE CALCULATION FUNCTIONS
// ============================================================================

/**
 * Calculate comprehensive margin analysis from input parameters
 * 
 * @param {Object} inputs - All cost and pricing inputs
 * @returns {Object} Complete margin analysis breakdown
 */
export const calculateMarginAnalysis = (inputs) => {
    const {
        buyerTargetFob,
        quotedFob,
        orderQuantity,
        currency = 'USD',
        incoterm = 'FOB',

        // Cost components
        fabricCost,
        trimsCost,
        packagingCost,
        cmCost,
        washingCost,
        testingCost,
        logisticsCost,
        overheadCost,
        targetProfitPercent,

        // Toggle states for scenario analysis
        costToggles = {},
    } = inputs;

    // Calculate total cost based on active toggles
    const costComponents = {
        fabric: { value: parseFloat(fabricCost) || 0, label: 'Fabric', emoji: '🧵', enabled: costToggles.fabric !== false },
        trims: { value: parseFloat(trimsCost) || 0, label: 'Trims & Accessories', emoji: '🔘', enabled: costToggles.trims !== false },
        packaging: { value: parseFloat(packagingCost) || 0, label: 'Packaging', emoji: '📦', enabled: costToggles.packaging !== false },
        cm: { value: parseFloat(cmCost) || 0, label: 'CM / Making', emoji: '✂️', enabled: costToggles.cm !== false },
        washing: { value: parseFloat(washingCost) || 0, label: 'Washing / Print / Embellishment', emoji: '💧', enabled: costToggles.washing !== false },
        testing: { value: parseFloat(testingCost) || 0, label: 'Testing & Compliance', emoji: '🔬', enabled: costToggles.testing !== false },
        logistics: { value: parseFloat(logisticsCost) || 0, label: 'Logistics & Documentation', emoji: '🚢', enabled: costToggles.logistics !== false },
        overhead: { value: parseFloat(overheadCost) || 0, label: 'Overhead Allocation', emoji: '🏢', enabled: costToggles.overhead !== false },
    };

    // Calculate total cost (only active components)
    let totalCost = 0;
    Object.values(costComponents).forEach(comp => {
        if (comp.enabled) {
            totalCost += comp.value;
        }
    });

    const buyerTarget = parseFloat(buyerTargetFob) || 0;
    const quoted = parseFloat(quotedFob) || 0;
    const qty = parseInt(orderQuantity) || 0;
    const targetProfit = parseFloat(targetProfitPercent) || 0;

    // ========== MARGIN ANALYSIS ==========

    // Gross Margin from buyer target
    const grossMargin = buyerTarget - totalCost;
    const marginPercent = buyerTarget > 0 ? (grossMargin / buyerTarget) * 100 : 0;

    // Break-even FOB (zero profit point)
    const breakEvenFob = totalCost;

    // Price gap analysis
    const priceGap = buyerTarget - quoted;
    const priceGapPercent = quoted > 0 ? ((buyerTarget - quoted) / quoted) * 100 : 0;

    // Target FOB with desired profit
    const targetFobWithProfit = totalCost * (1 + targetProfit / 100);

    // How much we're off from target
    const targetVariance = buyerTarget - targetFobWithProfit;
    const isViable = targetVariance >= 0;

    // ========== COST DOMINANCE ANALYSIS ==========

    // Calculate percentages for each cost component
    const costBreakdown = {};
    Object.entries(costComponents).forEach(([key, comp]) => {
        const percent = buyerTarget > 0 ? (comp.value / buyerTarget) * 100 : 0;
        const threshold = COST_THRESHOLDS[`${key}Percent`] || COST_THRESHOLDS.fabricPercent;

        let status = 'normal';
        if (percent >= threshold.critical) status = 'critical';
        else if (percent >= threshold.high) status = 'high';
        else if (percent >= threshold.typical) status = 'typical';
        else if (percent >= threshold.low) status = 'low';

        costBreakdown[key] = {
            ...comp,
            percent: roundTo2(percent),
            status,
            threshold,
        };
    });

    // Rank top 3 cost contributors
    const sortedCosts = Object.entries(costBreakdown)
        .filter(([_, comp]) => comp.enabled && comp.value > 0)
        .sort((a, b) => b[1].percent - a[1].percent);

    const topCostContributors = sortedCosts.slice(0, 3).map(([key, comp]) => ({
        key,
        ...comp,
    }));

    // Identify product cost driver
    let costDriver = 'Balanced';
    if (sortedCosts.length > 0) {
        const topCost = sortedCosts[0][0];
        const topPercent = sortedCosts[0][1].percent;

        if (topCost === 'fabric' && topPercent > 50) {
            costDriver = 'Fabric-Driven';
        } else if (topCost === 'cm' && topPercent > 28) {
            costDriver = 'Labor-Driven';
        } else if (topCost === 'washing' && topPercent > 12) {
            costDriver = 'Processing-Driven';
        }
    }

    // Flag costs exceeding thresholds
    const flaggedCosts = Object.entries(costBreakdown)
        .filter(([_, comp]) => comp.status === 'high' || comp.status === 'critical')
        .map(([key, comp]) => ({
            key,
            ...comp,
            warning: comp.status === 'critical'
                ? `${comp.label} is critically high at ${comp.percent}% of FOB`
                : `${comp.label} exceeds typical range at ${comp.percent}% of FOB`,
        }));

    // ========== FEASIBILITY SCORING ==========

    const feasibilityScore = calculateFeasibilityScore({
        marginPercent,
        orderQuantity: qty,
        flaggedCosts,
        priceGapPercent,
        costDriver,
    });

    // ========== ORDER EFFICIENCY ==========

    let orderSizeCategory = 'Small';
    let orderEfficiency = 'Low';
    if (qty >= ORDER_SIZE_BENCHMARKS.bulk) {
        orderSizeCategory = 'Bulk';
        orderEfficiency = 'Maximum';
    } else if (qty >= ORDER_SIZE_BENCHMARKS.large) {
        orderSizeCategory = 'Large';
        orderEfficiency = 'High';
    } else if (qty >= ORDER_SIZE_BENCHMARKS.medium) {
        orderSizeCategory = 'Medium';
        orderEfficiency = 'Standard';
    }

    // Total order value
    const totalOrderValue = buyerTarget * qty;
    const totalCostValue = totalCost * qty;
    const totalProfit = grossMargin * qty;

    return {
        // Input summary
        inputs: {
            buyerTargetFob: buyerTarget,
            quotedFob: quoted,
            orderQuantity: qty,
            currency,
            incoterm,
            targetProfitPercent: targetProfit,
        },

        // Cost structure
        totalCost: roundTo2(totalCost),
        costBreakdown,
        topCostContributors,
        costDriver,
        flaggedCosts,

        // Margin analysis
        grossMargin: roundTo2(grossMargin),
        marginPercent: roundTo2(marginPercent),
        breakEvenFob: roundTo2(breakEvenFob),
        targetFobWithProfit: roundTo2(targetFobWithProfit),
        targetVariance: roundTo2(targetVariance),
        isViable,

        // Price gap analysis
        priceGap: roundTo2(priceGap),
        priceGapPercent: roundTo2(priceGapPercent),

        // Order metrics
        orderSizeCategory,
        orderEfficiency,
        totalOrderValue: roundTo2(totalOrderValue),
        totalCostValue: roundTo2(totalCostValue),
        totalProfit: roundTo2(totalProfit),

        // Feasibility
        feasibilityScore,

        // Metadata
        timestamp: new Date().toISOString(),
    };
};

/**
 * Calculate product feasibility score (0-100)
 */
const calculateFeasibilityScore = ({ marginPercent, orderQuantity, flaggedCosts, priceGapPercent, costDriver }) => {
    let score = 100;
    let factors = [];

    // Margin health (40 points)
    if (marginPercent < MARGIN_BENCHMARKS.minimum) {
        score -= 40;
        factors.push({ factor: 'Margin below minimum viable', impact: -40 });
    } else if (marginPercent < MARGIN_BENCHMARKS.low) {
        score -= 25;
        factors.push({ factor: 'Low margin - high commercial risk', impact: -25 });
    } else if (marginPercent < MARGIN_BENCHMARKS.healthy) {
        score -= 10;
        factors.push({ factor: 'Margin below healthy threshold', impact: -10 });
    } else if (marginPercent >= MARGIN_BENCHMARKS.strong) {
        score += 5;
        factors.push({ factor: 'Strong margin position', impact: +5 });
    }

    // Cost volatility (25 points)
    const criticalFlags = flaggedCosts.filter(c => c.status === 'critical').length;
    const highFlags = flaggedCosts.filter(c => c.status === 'high').length;

    if (criticalFlags > 0) {
        score -= criticalFlags * 12;
        factors.push({ factor: `${criticalFlags} critical cost flag(s)`, impact: -criticalFlags * 12 });
    }
    if (highFlags > 0) {
        score -= highFlags * 5;
        factors.push({ factor: `${highFlags} high cost flag(s)`, impact: -highFlags * 5 });
    }

    // Order size efficiency (20 points)
    if (orderQuantity < ORDER_SIZE_BENCHMARKS.small) {
        score -= 15;
        factors.push({ factor: 'Very small order - low efficiency', impact: -15 });
    } else if (orderQuantity < ORDER_SIZE_BENCHMARKS.medium) {
        score -= 8;
        factors.push({ factor: 'Small order size', impact: -8 });
    } else if (orderQuantity >= ORDER_SIZE_BENCHMARKS.large) {
        score += 5;
        factors.push({ factor: 'Large order efficiency bonus', impact: +5 });
    }

    // Price gap analysis (15 points)
    if (priceGapPercent < -10) {
        score -= 15;
        factors.push({ factor: 'Buyer target significantly below quote', impact: -15 });
    } else if (priceGapPercent < -5) {
        score -= 8;
        factors.push({ factor: 'Buyer target below quote', impact: -8 });
    } else if (priceGapPercent > 5) {
        score += 5;
        factors.push({ factor: 'Favorable price gap', impact: +5 });
    }

    // Cap score between 0 and 100
    score = Math.max(0, Math.min(100, score));

    // Determine status
    let status = 'Red';
    let statusColor = '#dc3545';
    let recommendation = 'Reject';

    if (score >= 75) {
        status = 'Green';
        statusColor = '#28a745';
        recommendation = 'Accept';
    } else if (score >= 50) {
        status = 'Amber';
        statusColor = '#ffc107';
        recommendation = 'Renegotiate';
    }

    // Generate commercial justification
    let justification = '';
    if (status === 'Green') {
        justification = 'Product shows healthy commercial viability with acceptable margins and manageable cost structure.';
    } else if (status === 'Amber') {
        justification = 'Marginal viability - requires cost optimization or price negotiation to achieve target returns.';
    } else {
        justification = 'Commercially unviable at current pricing. Significant margin erosion or cost risks identified.';
    }

    return {
        score: Math.round(score),
        status,
        statusColor,
        recommendation,
        justification,
        factors,
    };
};

// ============================================================================
// STORAGE FUNCTIONS
// ============================================================================

/**
 * Save margin analysis to history
 */
export const saveMarginAnalysis = async (inputs, analysis) => {
    try {
        const record = {
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            type: 'margin_analysis',
            inputs,
            analysis,
        };

        const historyJson = await AsyncStorage.getItem('margin_analysis_history');
        const history = historyJson ? JSON.parse(historyJson) : [];

        history.unshift(record);
        const trimmedHistory = history.slice(0, 50);

        await AsyncStorage.setItem('margin_analysis_history', JSON.stringify(trimmedHistory));

        return record;
    } catch (error) {
        console.error('Error saving margin analysis:', error);
        return null;
    }
};

/**
 * Get margin analysis history
 */
export const getMarginAnalysisHistory = async () => {
    try {
        const historyJson = await AsyncStorage.getItem('margin_analysis_history');
        return historyJson ? JSON.parse(historyJson) : [];
    } catch (error) {
        console.error('Error loading margin history:', error);
        return [];
    }
};

/**
 * Delete margin analysis by ID
 */
export const deleteMarginAnalysis = async (id) => {
    try {
        const historyJson = await AsyncStorage.getItem('margin_analysis_history');
        const history = historyJson ? JSON.parse(historyJson) : [];
        const updated = history.filter(item => item.id !== id);
        await AsyncStorage.setItem('margin_analysis_history', JSON.stringify(updated));
        return true;
    } catch (error) {
        console.error('Error deleting margin analysis:', error);
        return false;
    }
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const roundTo2 = (num) => Math.round((num + Number.EPSILON) * 100) / 100;
const roundTo4 = (num) => Math.round((num + Number.EPSILON) * 10000) / 10000;

/**
 * Format currency value
 */
export const formatCurrency = (value, currency = 'USD') => {
    const curr = CURRENCIES[currency] || CURRENCIES.USD;
    return `${curr.symbol}${Number(value || 0).toFixed(2)}`;
};

/**
 * Get margin status color
 */
export const getMarginStatusColor = (marginPercent) => {
    if (marginPercent < MARGIN_BENCHMARKS.minimum) return '#dc3545';
    if (marginPercent < MARGIN_BENCHMARKS.low) return '#fd7e14';
    if (marginPercent < MARGIN_BENCHMARKS.healthy) return '#ffc107';
    if (marginPercent < MARGIN_BENCHMARKS.strong) return '#28a745';
    return '#20c997';
};

/**
 * Get margin status label
 */
export const getMarginStatusLabel = (marginPercent) => {
    if (marginPercent < MARGIN_BENCHMARKS.minimum) return 'Critical';
    if (marginPercent < MARGIN_BENCHMARKS.low) return 'Low';
    if (marginPercent < MARGIN_BENCHMARKS.healthy) return 'Below Target';
    if (marginPercent < MARGIN_BENCHMARKS.strong) return 'Healthy';
    return 'Strong';
};
