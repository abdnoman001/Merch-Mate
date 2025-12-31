import * as FileSystem from 'expo-file-system/legacy';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as XLSX from 'xlsx';

const toNumber = (v) => {
    const n = typeof v === 'string' ? parseFloat(v) : v;
    return isNaN(n) ? 0 : n;
};

export const buildFOBData = (inputs, breakdown, finalFob, profitMargin) => {
    const isKnit = breakdown.garment_type === 'T-Shirt (Knit)';
    const finalFobPerDoz = finalFob;
    const finalFobPerPc = finalFob / 12;
    const totalCostPerDoz = breakdown.total_cost_per_doz || (breakdown.total_cost_per_pc * 12);
    const totalCostPerPc = breakdown.total_cost_per_pc;
    const fabricCostPerDoz = breakdown.fabric_cost_per_doz || (breakdown.fabric_cost_per_pc * 12);
    const fabricCostPerPc = breakdown.fabric_cost_per_pc;

    return {
        style: inputs.style_name || 'N/A',
        buyer: inputs.buyer_name || 'N/A',
        garmentType: breakdown.garment_type || 'N/A',
        profitMargin: toNumber(profitMargin),
        finalFobPerDoz: Number(toNumber(finalFobPerDoz).toFixed(2)),
        finalFobPerPc: Number(toNumber(finalFobPerPc).toFixed(2)),
        totalCostPerDoz: Number(toNumber(totalCostPerDoz).toFixed(2)),
        totalCostPerPc: Number(toNumber(totalCostPerPc).toFixed(2)),
        costs: {
            fabricPerDoz: Number(toNumber(fabricCostPerDoz).toFixed(2)),
            fabricPerPc: Number(toNumber(fabricCostPerPc).toFixed(2)),
            printPerDoz: Number(toNumber(inputs.aop_print_cost_per_pc * 12).toFixed(2)),
            printPerPc: Number(toNumber(inputs.aop_print_cost_per_pc).toFixed(2)),
            accessoriesPerDoz: Number(toNumber(inputs.accessories_cost_per_pc * 12).toFixed(2)),
            accessoriesPerPc: Number(toNumber(inputs.accessories_cost_per_pc).toFixed(2)),
            cmPerDoz: Number(toNumber(inputs.cm_cost_per_pc * 12).toFixed(2)),
            cmPerPc: Number(toNumber(inputs.cm_cost_per_pc).toFixed(2)),
            washingPerDoz: Number(toNumber(inputs.washing_cost_per_pc * 12).toFixed(2)),
            washingPerPc: Number(toNumber(inputs.washing_cost_per_pc).toFixed(2)),
            commercialPerDoz: Number(toNumber(inputs.commercial_cost_per_pc * 12).toFixed(2)),
            commercialPerPc: Number(toNumber(inputs.commercial_cost_per_pc).toFixed(2)),
            testingPerDoz: Number(toNumber(inputs.testing_cost_per_pc * 12).toFixed(2)),
            testingPerPc: Number(toNumber(inputs.testing_cost_per_pc).toFixed(2)),
        },
        consumption: isKnit
            ? {
                basicLabel: 'Basic Cons (kg/doz)',
                totalLabel: `Total Req (with ${inputs.wastage_percent ?? 'N/A'}%) (kg/doz)`,
                basic: breakdown.basic_consumption_kg_doz,
                total: breakdown.total_fabric_req_kg_doz,
            }
            : {
                basicLabel: 'Basic Cons (yards/pc)',
                totalLabel: `Total Req (with ${inputs.shirt_wastage_percent ?? inputs.jeans_wastage_percent ?? 'N/A'}%) (yards/doz)`,
                basic: breakdown.basic_consumption_yards_piece,
                total: breakdown.total_fabric_req_yards_doz,
            },
    };
};

const timestamp = () => {
    const d = new Date();
    const pad = (x) => String(x).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(d.getHours())}-${pad(d.getMinutes())}-${pad(d.getSeconds())}`;
};

export const generateExcelFOB = async (data) => {
    // Professional Excel layout with improved structure
    const wsData = [
        ['', '', '', ''],  // Row 0 - empty top margin
        ['', 'MerchMate', '', ''],  // Row 1 - Brand
        ['', 'FOB COSTING SHEET', '', ''],  // Row 2 - Title
        ['', `Generated: ${new Date().toLocaleDateString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
        })}`, '', ''],  // Row 3 - Date
        ['', '', '', ''],  // Row 4 - spacer
        ['', 'STYLE DETAILS', '', ''],  // Row 5 - Section header
        ['', 'Style Name', data.style, ''],  // Row 6
        ['', 'Buyer', data.buyer, ''],  // Row 7
        ['', 'Garment Type', data.garmentType, ''],  // Row 8
        ['', '', '', ''],  // Row 9 - spacer
        ['', 'COST BREAKDOWN', '', ''],  // Row 10 - Section header
        ['', 'Component', 'Per Piece', 'Per Dozen'],  // Row 11 - Table header
        ['', '🧵 Fabric', `$${data.costs.fabricPerPc.toFixed(2)}`, `$${data.costs.fabricPerDoz.toFixed(2)}`],  // Row 12
        ['', '🎨 Print/AOP', `$${data.costs.printPerPc.toFixed(2)}`, `$${data.costs.printPerDoz.toFixed(2)}`],  // Row 13
        ['', '🔘 Accessories', `$${data.costs.accessoriesPerPc.toFixed(2)}`, `$${data.costs.accessoriesPerDoz.toFixed(2)}`],  // Row 14
        ['', '✂️ CM Cost', `$${data.costs.cmPerPc.toFixed(2)}`, `$${data.costs.cmPerDoz.toFixed(2)}`],  // Row 15
        ['', '💧 Washing', `$${data.costs.washingPerPc.toFixed(2)}`, `$${data.costs.washingPerDoz.toFixed(2)}`],  // Row 16
        ['', '📋 Commercial', `$${data.costs.commercialPerPc.toFixed(2)}`, `$${data.costs.commercialPerDoz.toFixed(2)}`],  // Row 17
        ['', '🔬 Testing', `$${data.costs.testingPerPc.toFixed(2)}`, `$${data.costs.testingPerDoz.toFixed(2)}`],  // Row 18
        ['', '', '', ''],  // Row 19 - spacer
        ['', 'SUMMARY', '', ''],  // Row 20 - Section header
        ['', 'Total Cost', `$${data.totalCostPerPc.toFixed(2)}`, `$${data.totalCostPerDoz.toFixed(2)}`],  // Row 21
        ['', 'Profit Margin', `${data.profitMargin}%`, ''],  // Row 22
        ['', '★ FINAL FOB PRICE', `$${data.finalFobPerPc.toFixed(2)}`, `$${data.finalFobPerDoz.toFixed(2)}`],  // Row 23
        ['', '', '', ''],  // Row 24 - spacer
        ['', 'CONSUMPTION', '', ''],  // Row 25 - Section header
        ['', data.consumption.basicLabel, data.consumption.basic, ''],  // Row 26
        ['', data.consumption.totalLabel, data.consumption.total, ''],  // Row 27
        ['', '', '', ''],  // Row 28 - spacer
        ['', '', '', ''],  // Row 29 - bottom margin
    ];

    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Set column widths for professional look
    ws['!cols'] = [
        { wch: 3 },   // Column A - left margin
        { wch: 28 },  // Column B - labels
        { wch: 16 },  // Column C - per piece values
        { wch: 16 },  // Column D - per dozen values
    ];

    // Set row heights
    ws['!rows'] = [
        { hpt: 10 },  // Row 0 - top margin
        { hpt: 30 },  // Row 1 - Brand
        { hpt: 25 },  // Row 2 - Title
        { hpt: 18 },  // Row 3 - Date
        { hpt: 12 },  // Row 4 - spacer
        { hpt: 24 },  // Row 5 - Section header
        { hpt: 20 },  // Row 6-8 - Style details
        { hpt: 20 },
        { hpt: 20 },
        { hpt: 12 },  // Row 9 - spacer
        { hpt: 24 },  // Row 10 - Section header
        { hpt: 22 },  // Row 11 - Table header
        { hpt: 20 },  // Row 12-18 - Cost rows
        { hpt: 20 },
        { hpt: 20 },
        { hpt: 20 },
        { hpt: 20 },
        { hpt: 20 },
        { hpt: 20 },
        { hpt: 12 },  // Row 19 - spacer
        { hpt: 24 },  // Row 20 - Section header
        { hpt: 22 },  // Row 21-23 - Summary
        { hpt: 20 },
        { hpt: 28 },  // Row 23 - Final FOB (taller)
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'FOB Costing');

    const b64 = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });

    const safeStyle = String(data.style).replace(/[^a-z0-9_-]/gi, '_');
    const fileName = `MerchMate_FOB_${safeStyle}_${timestamp()}.xlsx`;
    const fileUri = FileSystem.documentDirectory + fileName;
    await FileSystem.writeAsStringAsync(fileUri, b64, { encoding: 'base64' });
    return fileUri;
};

export const generatePdfFOB = async (data) => {
    const currency = (n) => `$${Number(n).toFixed(2)}`;

    // Get garment icon for display
    const getGarmentIcon = () => {
        if (data.garmentType.includes('Knit')) return '👕';
        if (data.garmentType.includes('Woven')) return '👔';
        if (data.garmentType.includes('Denim')) return '👖';
        return '📦';
    };

    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8" />
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background: #fff;
            color: #1a1a2e;
            padding: 0;
            line-height: 1.4;
        }
        
        .page {
            max-width: 600px;
            margin: 0 auto;
            padding: 24px;
        }
        
        /* Header Section */
        .header {
            background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
            color: white;
            padding: 28px 24px;
            border-radius: 16px;
            text-align: center;
            margin-bottom: 24px;
            box-shadow: 0 8px 32px rgba(0, 123, 255, 0.25);
        }
        
        .brand {
            font-size: 14px;
            font-weight: 600;
            letter-spacing: 2px;
            text-transform: uppercase;
            opacity: 0.9;
            margin-bottom: 4px;
        }
        
        .document-title {
            font-size: 24px;
            font-weight: 700;
            margin-bottom: 20px;
        }
        
        .fob-price-box {
            background: rgba(255, 255, 255, 0.15);
            border-radius: 12px;
            padding: 20px;
            margin-top: 16px;
        }
        
        .fob-label {
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            opacity: 0.8;
            margin-bottom: 8px;
        }
        
        .fob-price {
            font-size: 42px;
            font-weight: 800;
            letter-spacing: -1px;
        }
        
        .fob-unit {
            font-size: 16px;
            opacity: 0.8;
            font-weight: 500;
        }
        
        .fob-secondary {
            font-size: 16px;
            margin-top: 8px;
            opacity: 0.85;
        }
        
        /* Style Info Card */
        .info-card {
            background: #f8fafc;
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 20px;
            border: 1px solid #e2e8f0;
        }
        
        .info-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px dashed #e2e8f0;
        }
        
        .info-row:last-child {
            border-bottom: none;
        }
        
        .info-label {
            color: #64748b;
            font-size: 13px;
            font-weight: 500;
        }
        
        .info-value {
            color: #1e293b;
            font-size: 13px;
            font-weight: 600;
        }
        
        .garment-badge {
            display: inline-block;
            background: #007bff15;
            color: #007bff;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
        }
        
        /* Section Styling */
        .section {
            margin-bottom: 20px;
        }
        
        .section-header {
            display: flex;
            align-items: center;
            margin-bottom: 14px;
        }
        
        .section-icon {
            width: 32px;
            height: 32px;
            background: #007bff;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 14px;
            margin-right: 12px;
        }
        
        .section-title {
            font-size: 15px;
            font-weight: 700;
            color: #1e293b;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        /* Cost Table */
        .cost-table {
            width: 100%;
            border-collapse: collapse;
            background: #fff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
            border: 1px solid #e2e8f0;
        }
        
        .cost-table th {
            background: #f1f5f9;
            padding: 14px 16px;
            text-align: left;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #64748b;
            border-bottom: 2px solid #e2e8f0;
        }
        
        .cost-table th:not(:first-child) {
            text-align: right;
        }
        
        .cost-table td {
            padding: 12px 16px;
            font-size: 13px;
            border-bottom: 1px solid #f1f5f9;
        }
        
        .cost-table td:first-child {
            font-weight: 500;
            color: #334155;
        }
        
        .cost-table td:not(:first-child) {
            text-align: right;
            font-family: 'SF Mono', 'Menlo', monospace;
            color: #475569;
        }
        
        .cost-table tr:last-child td {
            border-bottom: none;
        }
        
        .cost-table tr:hover {
            background: #f8fafc;
        }
        
        .cost-emoji {
            margin-right: 8px;
        }
        
        /* Summary Box */
        .summary-box {
            background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
            border-radius: 12px;
            padding: 20px;
            border: 1px solid #e2e8f0;
        }
        
        .summary-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px 0;
            border-bottom: 1px solid #e2e8f0;
        }
        
        .summary-row:last-child {
            border-bottom: none;
            padding-top: 14px;
            margin-top: 4px;
            border-top: 2px solid #007bff;
        }
        
        .summary-label {
            font-size: 13px;
            color: #64748b;
            font-weight: 500;
        }
        
        .summary-value {
            font-size: 14px;
            font-weight: 600;
            color: #1e293b;
            font-family: 'SF Mono', 'Menlo', monospace;
        }
        
        .summary-row:last-child .summary-label {
            font-size: 14px;
            font-weight: 700;
            color: #007bff;
        }
        
        .summary-row:last-child .summary-value {
            font-size: 18px;
            font-weight: 800;
            color: #007bff;
        }
        
        /* Consumption Card */
        .consumption-grid {
            display: flex;
            gap: 16px;
        }
        
        .consumption-item {
            flex: 1;
            background: #fff;
            border: 1px solid #e2e8f0;
            border-radius: 10px;
            padding: 16px;
            text-align: center;
        }
        
        .consumption-value {
            font-size: 22px;
            font-weight: 700;
            color: #007bff;
            margin-bottom: 4px;
        }
        
        .consumption-label {
            font-size: 11px;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.3px;
        }
        
        /* Footer */
        .footer {
            text-align: center;
            margin-top: 32px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
        }
        
        .footer-brand {
            font-size: 14px;
            font-weight: 700;
            color: #007bff;
            margin-bottom: 4px;
        }
        
        .footer-date {
            font-size: 11px;
            color: #94a3b8;
        }
    </style>
</head>
<body>
    <div class="page">
        <!-- Header with FOB Price -->
        <div class="header">
            <div class="brand">MerchMate</div>
            <div class="document-title">FOB Costing Sheet</div>
            <div class="fob-price-box">
                <div class="fob-label">Final FOB Price</div>
                <div class="fob-price">${currency(data.finalFobPerDoz)} <span class="fob-unit">/ dozen</span></div>
                <div class="fob-secondary">${currency(data.finalFobPerPc)} per piece</div>
            </div>
        </div>
        
        <!-- Style Information -->
        <div class="info-card">
            <div class="info-row">
                <span class="info-label">Style Name</span>
                <span class="info-value">${data.style}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Buyer</span>
                <span class="info-value">${data.buyer}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Garment Type</span>
                <span class="garment-badge">${getGarmentIcon()} ${data.garmentType}</span>
            </div>
        </div>
        
        <!-- Cost Breakdown -->
        <div class="section">
            <div class="section-header">
                <div class="section-icon">💰</div>
                <div class="section-title">Cost Breakdown</div>
            </div>
            <table class="cost-table">
                <thead>
                    <tr>
                        <th>Component</th>
                        <th>Per Piece</th>
                        <th>Per Dozen</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td><span class="cost-emoji">🧵</span>Fabric</td>
                        <td>${currency(data.costs.fabricPerPc)}</td>
                        <td>${currency(data.costs.fabricPerDoz)}</td>
                    </tr>
                    <tr>
                        <td><span class="cost-emoji">🎨</span>Print/AOP</td>
                        <td>${currency(data.costs.printPerPc)}</td>
                        <td>${currency(data.costs.printPerDoz)}</td>
                    </tr>
                    <tr>
                        <td><span class="cost-emoji">🔘</span>Accessories</td>
                        <td>${currency(data.costs.accessoriesPerPc)}</td>
                        <td>${currency(data.costs.accessoriesPerDoz)}</td>
                    </tr>
                    <tr>
                        <td><span class="cost-emoji">✂️</span>CM Cost</td>
                        <td>${currency(data.costs.cmPerPc)}</td>
                        <td>${currency(data.costs.cmPerDoz)}</td>
                    </tr>
                    <tr>
                        <td><span class="cost-emoji">💧</span>Washing</td>
                        <td>${currency(data.costs.washingPerPc)}</td>
                        <td>${currency(data.costs.washingPerDoz)}</td>
                    </tr>
                    <tr>
                        <td><span class="cost-emoji">📋</span>Commercial</td>
                        <td>${currency(data.costs.commercialPerPc)}</td>
                        <td>${currency(data.costs.commercialPerDoz)}</td>
                    </tr>
                    <tr>
                        <td><span class="cost-emoji">🔬</span>Testing</td>
                        <td>${currency(data.costs.testingPerPc)}</td>
                        <td>${currency(data.costs.testingPerDoz)}</td>
                    </tr>
                </tbody>
            </table>
        </div>
        
        <!-- Summary -->
        <div class="section">
            <div class="section-header">
                <div class="section-icon">📊</div>
                <div class="section-title">Summary</div>
            </div>
            <div class="summary-box">
                <div class="summary-row">
                    <span class="summary-label">Total Cost</span>
                    <span class="summary-value">${currency(data.totalCostPerPc)} / pc  •  ${currency(data.totalCostPerDoz)} / doz</span>
                </div>
                <div class="summary-row">
                    <span class="summary-label">Profit Margin</span>
                    <span class="summary-value">${Number(data.profitMargin).toFixed(1)}%</span>
                </div>
                <div class="summary-row">
                    <span class="summary-label">Final FOB Price</span>
                    <span class="summary-value">${currency(data.finalFobPerPc)} / pc  •  ${currency(data.finalFobPerDoz)} / doz</span>
                </div>
            </div>
        </div>
        
        <!-- Consumption -->
        <div class="section">
            <div class="section-header">
                <div class="section-icon">📦</div>
                <div class="section-title">Fabric Consumption</div>
            </div>
            <div class="consumption-grid">
                <div class="consumption-item">
                    <div class="consumption-value">${data.consumption.basic}</div>
                    <div class="consumption-label">${data.consumption.basicLabel.replace(/\(.*\)/, '').trim()}</div>
                </div>
                <div class="consumption-item">
                    <div class="consumption-value">${data.consumption.total}</div>
                    <div class="consumption-label">With Wastage</div>
                </div>
            </div>
        </div>
        
        <!-- Footer -->
        <div class="footer">
            <div class="footer-brand">Generated by MerchMate</div>
            <div class="footer-date">${new Date().toLocaleString()}</div>
        </div>
    </div>
</body>
</html>`;

    const { uri } = await Print.printToFileAsync({ html });

    // Move/rename into documentDirectory with friendly name
    const safeStyle = String(data.style).replace(/[^a-z0-9_-]/gi, '_');
    const fileName = `MerchMate_FOB_${safeStyle}_${timestamp()}.pdf`;
    const dest = FileSystem.documentDirectory + fileName;
    try {
        await FileSystem.moveAsync({ from: uri, to: dest });
        return dest;
    } catch {
        return uri; // fallback to original
    }
};

export const shareFile = async (uri) => {
    const available = await Sharing.isAvailableAsync();
    if (!available) {
        throw new Error('Sharing is not available on this device');
    }
    await Sharing.shareAsync(uri);
};

// ===== FABRIC ANALYSIS EXPORT FUNCTIONS =====

const getGarmentTypeLabel = (type) => {
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

/**
 * Share Fabric Analysis as formatted text (WhatsApp, Email, etc.)
 */
export const shareFabricAnalysisAsText = async (data) => {
    const unit = data.unit;
    const priceLabel = unit === 'kg' ? '/kg' : '/yard';
    const price = data.fabricPricePerKg || data.fabricPricePerYard;

    const text = `📊 *MerchMate Fabric Analysis*
━━━━━━━━━━━━━━━━━━━━━

📋 *Style Information*
Style: ${data.styleName || 'N/A'}
Buyer: ${data.buyerName || 'N/A'}
Garment Type: ${getGarmentTypeLabel(data.garmentType)}

📦 *Consumption Summary*
Theoretical: ${formatNumber(data.theoreticalConsumptionPerPiece, 4)} ${unit}/pc
Actual: ${formatNumber(data.actualConsumptionPerPiece, 4)} ${unit}/pc
Per Dozen: ${formatNumber(data.consumptionPerDozen, 4)} ${unit}/doz

📐 *Pattern Details*
Original: ${data.inputs?.patternLength} × ${data.inputs?.patternWidth} ${unit === 'kg' ? 'cm' : 'in'}
Adjusted: ${formatNumber(data.adjustedPatternLength)} × ${formatNumber(data.adjustedPatternWidth)} ${unit === 'kg' ? 'cm' : 'in'}
Fabric Width: ${data.inputs?.fabricWidth} ${unit === 'kg' ? 'cm' : 'in'}
${data.garmentType === 'knit' ? `GSM: ${data.inputs?.gsm}` : ''}
${data.garmentType === 'denim' ? `Fabric Weight: ${data.inputs?.fabricWeight} oz/sq.yd` : ''}

⚡ *Efficiency Metrics*
Marker Efficiency: ${data.markerEfficiency}%
Fabric Utilization: ${formatNumber(data.fabricUtilization)}%
Waste Percentage: ${formatNumber(data.wastePercentage)}%
Shrinkage (L×W): ${data.inputs?.shrinkageLength}% × ${data.inputs?.shrinkageWidth}%
Wastage Allowance: ${data.inputs?.wastage}%

📋 *Order Requirements*
Order Quantity: ${data.orderQuantity?.toLocaleString()} pcs
Total Fabric: ${formatNumber(data.totalFabricRequired)} ${unit}
Total Meters: ${formatNumber(data.totalFabricMeters)} m
Total Waste: ${formatNumber(data.totalWaste)} ${unit}

💰 *Cost Breakdown*
Fabric Price: $${formatNumber(price)}${priceLabel}
Cost/Piece: $${formatNumber(data.fabricCostPerPiece)}
Cost/Dozen: $${formatNumber(data.fabricCostPerDozen)}
Total Fabric Cost: $${formatNumber(data.totalFabricCost)}

${data.fobData ? `📈 *FOB Impact*
Fabric Cost/pc: $${formatNumber(data.fobData.fabricCostPerPiece)}
Other Costs/pc: $${formatNumber(data.fobData.otherCostsPerPiece)}
Total Cost/pc: $${formatNumber(data.fobData.totalCostPerPiece)}
Profit Margin: ${data.profitMargin}%
FOB/Piece: $${formatNumber(data.fobData.fobPerPiece)}
FOB/Dozen: $${formatNumber(data.fobData.fobPerDozen)}
Fabric % of FOB: ${formatNumber(data.fobData.fabricPercentageOfFOB)}%` : ''}

━━━━━━━━━━━━━━━━━━━━━
Generated by MerchMate
${new Date().toLocaleString()}`;

    await Sharing.shareAsync('data:text/plain;base64,' + btoa(unescape(encodeURIComponent(text))), {
        mimeType: 'text/plain',
        dialogTitle: 'Share Fabric Analysis',
        UTI: 'public.plain-text',
    }).catch(async () => {
        // Fallback: save to file and share
        const fileName = `FabricAnalysis_${data.styleName || 'report'}_${timestamp()}.txt`;
        const fileUri = FileSystem.documentDirectory + fileName;
        await FileSystem.writeAsStringAsync(fileUri, text);
        await Sharing.shareAsync(fileUri);
    });
};

/**
 * Generate and share Fabric Analysis as Excel file
 */
export const shareFabricAnalysisAsExcel = async (data) => {
    const uri = await generateFabricAnalysisExcel(data);
    await shareFile(uri);
};

/**
 * Generate Fabric Analysis Excel file
 */
export const generateFabricAnalysisExcel = async (data) => {
    const unit = data.unit;
    const priceLabel = unit === 'kg' ? '/kg' : '/yard';
    const price = data.fabricPricePerKg || data.fabricPricePerYard;
    const dimensionUnit = data.garmentType === 'knit' ? 'cm' : 'in';

    const wsData = [
        // Header Section
        ['', '', '', ''],
        ['', '🧵 MERCHMATE FABRIC ANALYSIS', '', ''],
        ['', 'Fabric Consumption & Marker Efficiency Report', '', ''],
        ['', '', '', ''],

        // Style Information
        ['', 'STYLE INFORMATION', '', ''],
        ['', 'Style Name', data.styleName || 'N/A', ''],
        ['', 'Buyer', data.buyerName || 'N/A', ''],
        ['', 'Garment Type', getGarmentTypeLabel(data.garmentType), ''],
        ['', 'Generated', new Date().toLocaleString(), ''],
        ['', '', '', ''],

        // Key Results - Highlighted
        ['', '📊 KEY RESULTS', '', ''],
        ['', 'Metric', 'Value', 'Unit'],
        ['', '▶ Actual Consumption/Piece', formatNumber(data.actualConsumptionPerPiece, 4), unit],
        ['', '▶ Consumption/Dozen', formatNumber(data.consumptionPerDozen, 4), unit],
        ['', '▶ Fabric Cost/Piece', `$${formatNumber(data.fabricCostPerPiece)}`, 'USD'],
        ['', '▶ Total Fabric Required', formatNumber(data.totalFabricRequired), unit],
        ['', '', '', ''],

        // Consumption Details
        ['', '📦 CONSUMPTION SUMMARY', '', ''],
        ['', 'Metric', 'Value', 'Unit'],
        ['', 'Theoretical Consumption/pc', formatNumber(data.theoreticalConsumptionPerPiece, 4), unit],
        ['', 'Actual Consumption/pc', formatNumber(data.actualConsumptionPerPiece, 4), unit],
        ['', 'Consumption/Dozen', formatNumber(data.consumptionPerDozen, 4), unit],
        ['', 'Waste/Piece', formatNumber(data.wastePerPiece, 4), unit],
        ['', '', '', ''],

        // Pattern Details
        ['', '📐 PATTERN SPECIFICATIONS', '', ''],
        ['', 'Parameter', 'Value', 'Unit'],
        ['', 'Original Pattern Length', data.inputs?.patternLength, dimensionUnit],
        ['', 'Original Pattern Width', data.inputs?.patternWidth, dimensionUnit],
        ['', 'Adjusted Pattern Length', formatNumber(data.adjustedPatternLength), dimensionUnit],
        ['', 'Adjusted Pattern Width', formatNumber(data.adjustedPatternWidth), dimensionUnit],
        ['', 'Fabric Width', data.inputs?.fabricWidth, dimensionUnit],
    ];

    // Add garment-specific fields
    if (data.garmentType === 'knit') {
        wsData.push(['', 'GSM (Grams/Sq Meter)', data.inputs?.gsm, '']);
    }
    if (data.garmentType === 'denim') {
        wsData.push(['', 'Fabric Weight', data.inputs?.fabricWeight, 'oz/sq.yd']);
    }
    if (data.patternsAcrossFabric) {
        wsData.push(['', 'Patterns Across Width', data.patternsAcrossFabric, 'pieces']);
    }

    wsData.push(
        ['', '', '', ''],

        // Efficiency Metrics
        ['', '⚡ EFFICIENCY METRICS', '', ''],
        ['', 'Metric', 'Value', 'Benchmark'],
        ['', 'Marker Efficiency', `${data.markerEfficiency}%`, '75-85% typical'],
        ['', 'Fabric Utilization', `${formatNumber(data.fabricUtilization)}%`, ''],
        ['', 'Total Waste Percentage', `${formatNumber(data.wastePercentage)}%`, '<10% ideal'],
        ['', '', '', ''],

        // Allowances
        ['', '📋 ALLOWANCES APPLIED', '', ''],
        ['', 'Type', 'Length', 'Width'],
        ['', 'Shrinkage', `${data.inputs?.shrinkageLength}%`, `${data.inputs?.shrinkageWidth}%`],
        ['', 'Wastage Allowance', `${data.inputs?.wastage}%`, ''],
        ['', '', '', ''],

        // Order Requirements
        ['', '📦 ORDER REQUIREMENTS', '', ''],
        ['', 'Parameter', 'Value', 'Unit'],
        ['', 'Order Quantity', data.orderQuantity?.toLocaleString(), 'pieces'],
        ['', 'Total Fabric Required', formatNumber(data.totalFabricRequired), unit],
        ['', 'Total Fabric (Meters)', formatNumber(data.totalFabricMeters), 'm'],
        ['', 'Total Waste', formatNumber(data.totalWaste), unit],
        ['', '', '', ''],

        // Cost Breakdown
        ['', '💰 COST ANALYSIS', '', ''],
        ['', 'Item', 'Per Piece', 'Per Dozen'],
        ['', 'Fabric Cost', `$${formatNumber(data.fabricCostPerPiece)}`, `$${formatNumber(data.fabricCostPerDozen)}`],
        ['', '', '', ''],
        ['', 'Fabric Price', `$${formatNumber(price)}${priceLabel}`, ''],
        ['', 'Total Fabric Cost', `$${formatNumber(data.totalFabricCost)}`, '']
    );

    // Add FOB impact section if available
    if (data.fobData) {
        wsData.push(
            ['', '', '', ''],
            ['', '📈 FOB IMPACT ANALYSIS', '', ''],
            ['', 'Component', 'Amount', 'Percentage'],
            ['', 'Fabric Cost/Piece', `$${formatNumber(data.fobData.fabricCostPerPiece)}`, `${formatNumber(data.fobData.fabricPercentageOfFOB)}% of FOB`],
            ['', 'Other Costs/Piece', `$${formatNumber(data.fobData.otherCostsPerPiece)}`, ''],
            ['', 'Total Cost/Piece', `$${formatNumber(data.fobData.totalCostPerPiece)}`, ''],
            ['', '', '', ''],
            ['', '✨ FINAL FOB', '', ''],
            ['', 'FOB Per Piece', `$${formatNumber(data.fobData.fobPerPiece)}`, `@ ${data.profitMargin}% margin`],
            ['', 'FOB Per Dozen', `$${formatNumber(data.fobData.fobPerDozen)}`, '']
        );
    }

    wsData.push(
        ['', '', '', ''],
        ['', 'Generated by MerchMate - Your Garment Costing Partner', '', '']
    );

    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Set column widths
    ws['!cols'] = [
        { wch: 4 },   // Margin column
        { wch: 30 },  // Labels
        { wch: 24 },  // Values
        { wch: 18 },  // Units/Notes
    ];

    // Merge header cells
    ws['!merges'] = [
        { s: { r: 1, c: 1 }, e: { r: 1, c: 3 } }, // Title
        { s: { r: 2, c: 1 }, e: { r: 2, c: 3 } }, // Subtitle
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Fabric Analysis');

    const b64 = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });

    const safeStyle = String(data.styleName || 'analysis').replace(/[^a-z0-9_-]/gi, '_');
    const fileName = `MerchMate_Fabric_${safeStyle}_${timestamp()}.xlsx`;
    const fileUri = FileSystem.documentDirectory + fileName;
    await FileSystem.writeAsStringAsync(fileUri, b64, { encoding: 'base64' });
    return fileUri;
};

/**
 * Generate and share Fabric Analysis as PDF
 */
export const shareFabricAnalysisAsPDF = async (data) => {
    const uri = await generateFabricAnalysisPDF(data);
    await shareFile(uri);
};

/**
 * Generate Fabric Analysis PDF file
 */
export const generateFabricAnalysisPDF = async (data) => {
    const currency = (n) => `$${formatNumber(n)}`;
    const unit = data.unit;
    const priceLabel = unit === 'kg' ? '/kg' : '/yard';
    const price = data.fabricPricePerKg || data.fabricPricePerYard;
    const dimensionUnit = data.garmentType === 'knit' ? 'cm' : 'in';

    const html = `
    <html>
    <head>
      <meta charset="utf-8" />
      <style>
        * { box-sizing: border-box; }
        body { 
          font-family: -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; 
          margin: 0; 
          padding: 24px; 
          color: #333; 
          font-size: 11px; 
          background: #f5f5f5;
        }
        .container {
          max-width: 100%;
          background: #fff;
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        }
        
        /* Header */
        .header { 
          text-align: center; 
          padding-bottom: 20px;
          border-bottom: 2px solid #28a745;
          margin-bottom: 20px;
        }
        .brand { 
          font-size: 28px; 
          font-weight: 800; 
          color: #28a745;
          margin-bottom: 4px;
        }
        .title { 
          font-size: 14px; 
          color: #666; 
          font-weight: 500;
        }
        
        /* Meta Info */
        .meta { 
          display: flex;
          flex-wrap: wrap;
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
          padding: 16px 20px; 
          border-radius: 10px; 
          margin-bottom: 20px;
          border-left: 4px solid #28a745;
        }
        .meta-item { 
          width: 50%;
          padding: 4px 0;
        }
        .meta-label { 
          font-weight: 600; 
          color: #555;
          display: inline-block;
          width: 80px;
        }
        .meta-value {
          color: #333;
        }
        
        /* Hero Section */
        .hero {
          background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 20px;
          color: #fff;
          display: flex;
          justify-content: space-around;
          text-align: center;
        }
        .hero-item {
          flex: 1;
        }
        .hero-label {
          font-size: 10px;
          opacity: 0.9;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 4px;
        }
        .hero-value {
          font-size: 24px;
          font-weight: 800;
        }
        .hero-unit {
          font-size: 11px;
          opacity: 0.8;
        }
        
        /* Sections */
        .section { 
          margin-bottom: 16px;
          border-radius: 10px;
          overflow: hidden;
          border: 1px solid #e5e7eb;
        }
        .section-title { 
          font-size: 12px; 
          font-weight: 700; 
          color: #fff; 
          background: #28a745;
          padding: 10px 14px; 
          margin: 0;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        /* Tables */
        table { 
          width: 100%; 
          border-collapse: collapse;
        }
        th, td { 
          padding: 10px 14px; 
          font-size: 11px; 
          text-align: left;
          border-bottom: 1px solid #f0f0f0;
        }
        th { 
          background: #f8f9fa; 
          font-weight: 600;
          color: #555;
        }
        tr:last-child td {
          border-bottom: none;
        }
        .highlight-row { 
          background: #e8f5e9; 
        }
        .highlight-row td {
          font-weight: 600;
          color: #28a745;
        }
        .highlight-value { 
          font-size: 14px; 
          font-weight: 700; 
          color: #28a745; 
        }
        .waste-value {
          color: #dc3545;
        }
        
        /* Stats Grid */
        .stats-grid {
          display: flex;
          gap: 12px;
          padding: 16px;
          background: #f8f9fa;
        }
        .stat-box {
          flex: 1;
          background: #fff;
          border-radius: 10px;
          padding: 14px;
          text-align: center;
          box-shadow: 0 1px 3px rgba(0,0,0,0.08);
        }
        .stat-value {
          font-size: 20px;
          font-weight: 800;
          color: #28a745;
        }
        .stat-label {
          font-size: 9px;
          color: #666;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-top: 4px;
        }
        .stat-box.warning .stat-value {
          color: #dc3545;
        }
        
        /* FOB Box */
        .fob-box {
          background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
          border-radius: 10px;
          padding: 16px;
          margin: 16px 0;
          color: #fff;
          display: flex;
          justify-content: space-around;
        }
        .fob-item {
          text-align: center;
        }
        .fob-label {
          font-size: 10px;
          opacity: 0.85;
        }
        .fob-value {
          font-size: 22px;
          font-weight: 800;
        }
        
        /* Two Column Layout */
        .two-col {
          display: flex;
          gap: 16px;
          margin-bottom: 16px;
        }
        .two-col .section {
          flex: 1;
          margin-bottom: 0;
        }
        
        /* Footer */
        .footer { 
          margin-top: 24px; 
          text-align: center; 
          font-size: 10px; 
          color: #999;
          padding-top: 16px;
          border-top: 1px solid #eee;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="brand">🧵 MerchMate</div>
          <div class="title">Fabric Consumption & Marker Efficiency Analysis</div>
        </div>
        
        <div class="meta">
          <div class="meta-item"><span class="meta-label">Style:</span> <span class="meta-value">${data.styleName || 'N/A'}</span></div>
          <div class="meta-item"><span class="meta-label">Buyer:</span> <span class="meta-value">${data.buyerName || 'N/A'}</span></div>
          <div class="meta-item"><span class="meta-label">Garment:</span> <span class="meta-value">${getGarmentTypeLabel(data.garmentType)}</span></div>
          <div class="meta-item"><span class="meta-label">Date:</span> <span class="meta-value">${new Date().toLocaleDateString()}</span></div>
        </div>

        <div class="hero">
          <div class="hero-item">
            <div class="hero-label">Consumption/Piece</div>
            <div class="hero-value">${formatNumber(data.actualConsumptionPerPiece, 4)}</div>
            <div class="hero-unit">${unit}</div>
          </div>
          <div class="hero-item">
            <div class="hero-label">Consumption/Dozen</div>
            <div class="hero-value">${formatNumber(data.consumptionPerDozen, 3)}</div>
            <div class="hero-unit">${unit}</div>
          </div>
          <div class="hero-item">
            <div class="hero-label">Fabric Cost/Piece</div>
            <div class="hero-value">${currency(data.fabricCostPerPiece)}</div>
            <div class="hero-unit">USD</div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">📊 Efficiency Metrics</div>
          <div class="stats-grid">
            <div class="stat-box">
              <div class="stat-value">${data.markerEfficiency}%</div>
              <div class="stat-label">Marker Efficiency</div>
            </div>
            <div class="stat-box">
              <div class="stat-value">${formatNumber(data.fabricUtilization)}%</div>
              <div class="stat-label">Fabric Utilization</div>
            </div>
            <div class="stat-box warning">
              <div class="stat-value">${formatNumber(data.wastePercentage)}%</div>
              <div class="stat-label">Total Waste</div>
            </div>
          </div>
        </div>

        <div class="two-col">
          <div class="section">
            <div class="section-title">📦 Consumption Summary</div>
            <table>
              <tr class="highlight-row">
                <td>Actual Consumption/pc</td>
                <td class="highlight-value">${formatNumber(data.actualConsumptionPerPiece, 4)} ${unit}</td>
              </tr>
              <tr>
                <td>Theoretical Consumption/pc</td>
                <td>${formatNumber(data.theoreticalConsumptionPerPiece, 4)} ${unit}</td>
              </tr>
              <tr class="highlight-row">
                <td>Consumption/Dozen</td>
                <td class="highlight-value">${formatNumber(data.consumptionPerDozen, 4)} ${unit}</td>
              </tr>
              <tr>
                <td>Waste per Piece</td>
                <td class="waste-value">${formatNumber(data.wastePerPiece, 4)} ${unit}</td>
              </tr>
            </table>
          </div>
          
          <div class="section">
            <div class="section-title">📋 Order Requirements</div>
            <table>
              <tr>
                <td>Order Quantity</td>
                <td>${data.orderQuantity?.toLocaleString()} pcs</td>
              </tr>
              <tr class="highlight-row">
                <td>Total Fabric Required</td>
                <td class="highlight-value">${formatNumber(data.totalFabricRequired)} ${unit}</td>
              </tr>
              <tr>
                <td>Total in Meters</td>
                <td>${formatNumber(data.totalFabricMeters)} m</td>
              </tr>
              <tr>
                <td>Total Waste</td>
                <td class="waste-value">${formatNumber(data.totalWaste)} ${unit}</td>
              </tr>
            </table>
          </div>
        </div>

        <div class="two-col">
          <div class="section">
            <div class="section-title">📐 Pattern Details</div>
            <table>
              <tr>
                <td>Original Pattern (L×W)</td>
                <td>${data.inputs?.patternLength} × ${data.inputs?.patternWidth} ${dimensionUnit}</td>
              </tr>
              <tr>
                <td>Adjusted Pattern (L×W)</td>
                <td>${formatNumber(data.adjustedPatternLength)} × ${formatNumber(data.adjustedPatternWidth)} ${dimensionUnit}</td>
              </tr>
              <tr>
                <td>Fabric Width</td>
                <td>${data.inputs?.fabricWidth} ${dimensionUnit}</td>
              </tr>
              ${data.garmentType === 'knit' ? `<tr><td>GSM</td><td>${data.inputs?.gsm}</td></tr>` : ''}
              ${data.garmentType === 'denim' ? `<tr><td>Fabric Weight</td><td>${data.inputs?.fabricWeight} oz/sq.yd</td></tr>` : ''}
            </table>
          </div>
          
          <div class="section">
            <div class="section-title">⚡ Allowances Applied</div>
            <table>
              <tr>
                <td>Shrinkage (Length)</td>
                <td>${data.inputs?.shrinkageLength}%</td>
              </tr>
              <tr>
                <td>Shrinkage (Width)</td>
                <td>${data.inputs?.shrinkageWidth}%</td>
              </tr>
              <tr>
                <td>Wastage Allowance</td>
                <td>${data.inputs?.wastage}%</td>
              </tr>
              <tr>
                <td>Marker Efficiency</td>
                <td>${data.markerEfficiency}%</td>
              </tr>
            </table>
          </div>
        </div>

        <div class="section">
          <div class="section-title">💰 Cost Analysis</div>
          <table>
            <tr>
              <th style="width:40%">Item</th>
              <th style="width:30%">Per Piece</th>
              <th style="width:30%">Per Dozen</th>
            </tr>
            <tr>
              <td>Fabric Price</td>
              <td colspan="2">${currency(price)}${priceLabel}</td>
            </tr>
            <tr class="highlight-row">
              <td><strong>Fabric Cost</strong></td>
              <td class="highlight-value">${currency(data.fabricCostPerPiece)}</td>
              <td class="highlight-value">${currency(data.fabricCostPerDozen)}</td>
            </tr>
            <tr>
              <td><strong>Total Fabric Cost</strong></td>
              <td colspan="2" class="highlight-value">${currency(data.totalFabricCost)}</td>
            </tr>
          </table>
        </div>

        ${data.fobData ? `
        <div class="section">
          <div class="section-title">📈 FOB Impact Analysis</div>
          <div class="fob-box">
            <div class="fob-item">
              <div class="fob-label">FOB/Piece</div>
              <div class="fob-value">${currency(data.fobData.fobPerPiece)}</div>
            </div>
            <div class="fob-item">
              <div class="fob-label">FOB/Dozen</div>
              <div class="fob-value">${currency(data.fobData.fobPerDozen)}</div>
            </div>
            <div class="fob-item">
              <div class="fob-label">Fabric % of FOB</div>
              <div class="fob-value">${formatNumber(data.fobData.fabricPercentageOfFOB)}%</div>
            </div>
          </div>
          <table>
            <tr>
              <td>Fabric Cost/Piece</td>
              <td>${currency(data.fobData.fabricCostPerPiece)}</td>
            </tr>
            <tr>
              <td>Other Costs/Piece</td>
              <td>${currency(data.fobData.otherCostsPerPiece)}</td>
            </tr>
            <tr>
              <td>Total Cost/Piece</td>
              <td>${currency(data.fobData.totalCostPerPiece)}</td>
            </tr>
            <tr>
              <td>Profit Margin</td>
              <td>${data.profitMargin}%</td>
            </tr>
          </table>
        </div>
        ` : ''}

        <div class="footer">
          Generated by MerchMate • Your Garment Costing Partner • ${new Date().toLocaleString()}
        </div>
      </div>
    </body>
    </html>`;

    const { uri } = await Print.printToFileAsync({ html });

    const safeStyle = String(data.styleName || 'analysis').replace(/[^a-z0-9_-]/gi, '_');
    const fileName = `MerchMate_Fabric_${safeStyle}_${timestamp()}.pdf`;
    const dest = FileSystem.documentDirectory + fileName;
    try {
        await FileSystem.moveAsync({ from: uri, to: dest });
        return dest;
    } catch {
        return uri;
    }
};
