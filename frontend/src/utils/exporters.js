import * as FileSystem from 'expo-file-system/legacy';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import {
  generateExcelFOB_XLSX,
  generateFabricAnalysisExcel_XLSX,
  generateMarginAnalysisExcel_XLSX,
} from './exportersXLSX';

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
  // Use XLSX-based export for mobile compatibility
  return await generateExcelFOB_XLSX(data);
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
  // Use XLSX-based export for mobile compatibility
  return await generateFabricAnalysisExcel_XLSX(data);
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

  const getGarmentTypeLabel = (type) => {
    switch (type) {
      case 'knit': return 'Knit (T-Shirt/Polo)';
      case 'woven': return 'Woven (Shirt/Blouse)';
      case 'denim': return 'Denim (Jeans/Jacket)';
      default: return type;
    }
  };

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

// ============================================================================
// MARGIN ANALYSIS EXPORT FUNCTIONS
// ============================================================================

/**
 * Build data structure for margin analysis exports
 */
export const buildMarginAnalysisData = (inputs, analysis, negotiationInsights = {}) => {
  return {
    // Style info
    styleName: inputs.styleName || 'N/A',
    buyerName: inputs.buyerName || 'N/A',
    currency: inputs.currency || 'USD',
    incoterm: inputs.incoterm || 'FOB',

    // Pricing
    buyerTargetFob: analysis.inputs.buyerTargetFob,
    quotedFob: analysis.inputs.quotedFob,
    priceGap: analysis.priceGap,
    priceGapPercent: analysis.priceGapPercent,

    // Cost structure
    totalCost: analysis.totalCost,
    costBreakdown: analysis.costBreakdown,
    topCostContributors: analysis.topCostContributors,
    costDriver: analysis.costDriver,
    flaggedCosts: analysis.flaggedCosts,

    // Margin analysis
    grossMargin: analysis.grossMargin,
    marginPercent: analysis.marginPercent,
    breakEvenFob: analysis.breakEvenFob,
    targetFobWithProfit: analysis.targetFobWithProfit,
    targetVariance: analysis.targetVariance,
    isViable: analysis.isViable,
    targetProfitPercent: analysis.inputs.targetProfitPercent,

    // Order metrics
    orderQuantity: analysis.inputs.orderQuantity,
    orderSizeCategory: analysis.orderSizeCategory,
    totalOrderValue: analysis.totalOrderValue,
    totalProfit: analysis.totalProfit,

    // Feasibility
    feasibilityScore: analysis.feasibilityScore,

    // Negotiation insights (with defaults)
    negotiationInsights: {
      commercialAction: negotiationInsights.commercialAction || analysis.feasibilityScore?.recommendation || 'Review pricing strategy',
      negotiationLevers: negotiationInsights.negotiationLevers || []
    },

    // Timestamp
    timestamp: analysis.timestamp,
  };
};

/**
 * Generate styled Excel file for margin analysis using HTML table approach
 */
export const generateExcelMarginAnalysis = async (data) => {
  // Use XLSX-based export for mobile compatibility
  return await generateMarginAnalysisExcel_XLSX(data);
};

/**
 * Generate PDF report for margin analysis
 */
export const generatePdfMarginAnalysis = async (data) => {
  const currency = data.currency || 'USD';
  const symbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '$';
  const curr = (n) => `${symbol}${Number(n || 0).toFixed(2)}`;

  // Determine status colors
  const getStatusColor = () => {
    if (data.feasibilityScore.status === 'Green') return '#28a745';
    if (data.feasibilityScore.status === 'Amber') return '#ffc107';
    return '#dc3545';
  };

  const getMarginColor = () => {
    if (data.marginPercent >= 15) return '#28a745';
    if (data.marginPercent >= 10) return '#ffc107';
    return '#dc3545';
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
        .page { max-width: 600px; margin: 0 auto; padding: 24px; }
        .header {
            background: linear-gradient(135deg, #6f42c1 0%, #5a32a3 100%);
            color: white;
            padding: 28px 24px;
            border-radius: 16px;
            text-align: center;
            margin-bottom: 20px;
        }
        .brand { font-size: 14px; font-weight: 600; opacity: 0.9; margin-bottom: 4px; }
        .title { font-size: 22px; font-weight: 800; margin-bottom: 8px; }
        .style-info { font-size: 16px; font-weight: 600; margin-top: 8px; }
        .buyer-info { font-size: 13px; opacity: 0.85; }
        
        .score-card {
            background: #fff;
            border-radius: 16px;
            padding: 24px;
            margin-bottom: 16px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.08);
            border-left: 5px solid ${getStatusColor()};
            display: flex;
            align-items: center;
        }
        .score-circle {
            width: 80px;
            height: 80px;
            border-radius: 50%;
            border: 5px solid ${getStatusColor()};
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            margin-right: 20px;
        }
        .score-value { font-size: 28px; font-weight: 800; color: ${getStatusColor()}; }
        .score-max { font-size: 11px; color: #888; }
        .score-info { flex: 1; }
        .score-status {
            display: inline-block;
            background: ${getStatusColor()};
            color: white;
            padding: 4px 12px;
            border-radius: 8px;
            font-size: 12px;
            font-weight: 700;
            margin-bottom: 8px;
        }
        .score-recommendation { font-size: 18px; font-weight: 700; color: #1a1a2e; }
        .score-justification { font-size: 13px; color: #666; margin-top: 8px; }
        
        .hero-card {
            background: #1a1a2e;
            border-radius: 16px;
            padding: 24px;
            text-align: center;
            margin-bottom: 16px;
        }
        .hero-label { font-size: 11px; font-weight: 700; color: #888; letter-spacing: 1px; }
        .hero-value { font-size: 48px; font-weight: 800; color: ${getMarginColor()}; }
        .hero-sub { font-size: 14px; color: #aaa; margin-top: 4px; }
        
        .section {
            background: #fff;
            border-radius: 12px;
            padding: 16px;
            margin-bottom: 12px;
            box-shadow: 0 1px 4px rgba(0,0,0,0.04);
        }
        .section-title {
            font-size: 14px;
            font-weight: 700;
            color: #1a1a2e;
            margin-bottom: 12px;
            padding-bottom: 8px;
            border-bottom: 1px solid #f0f0f0;
        }
        
        table { width: 100%; border-collapse: collapse; }
        td, th { padding: 8px 0; font-size: 13px; }
        td:first-child { color: #666; }
        td:last-child { text-align: right; font-weight: 600; color: #1a1a2e; }
        .highlight-row { background: #f8f9fa; }
        .highlight-value { color: #007bff !important; }
        
        .price-grid { display: flex; justify-content: space-between; margin-bottom: 12px; }
        .price-item { text-align: center; flex: 1; }
        .price-label { font-size: 11px; color: #888; }
        .price-value { font-size: 18px; font-weight: 700; color: #1a1a2e; }
        .price-positive { color: #28a745; }
        .price-negative { color: #dc3545; }
        
        .cost-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 0;
            border-bottom: 1px solid #f5f5f5;
        }
        .cost-label { font-size: 13px; color: #333; }
        .cost-values { text-align: right; }
        .cost-value { font-size: 14px; font-weight: 600; color: #1a1a2e; }
        .cost-percent { font-size: 11px; color: #888; background: #f0f0f0; padding: 2px 6px; border-radius: 4px; }
        .cost-critical { background: #dc3545; color: #fff; }
        .cost-high { background: #fd7e14; color: #fff; }
        
        .alert-box {
            background: #f8d7da;
            border-radius: 8px;
            padding: 12px;
            margin-top: 12px;
        }
        .alert-title { font-size: 12px; font-weight: 700; color: #721c24; margin-bottom: 6px; }
        .alert-text { font-size: 12px; color: #721c24; }
        
        .action-box {
            background: ${getStatusColor()}15;
            border-left: 4px solid ${getStatusColor()};
            border-radius: 8px;
            padding: 14px;
            margin-bottom: 16px;
        }
        .action-label { font-size: 11px; font-weight: 700; color: #888; letter-spacing: 0.5px; }
        .action-text { font-size: 14px; font-weight: 600; color: ${getStatusColor()}; margin-top: 4px; }
        
        .footer {
            text-align: center;
            font-size: 11px;
            color: #aaa;
            padding: 16px 0;
            border-top: 1px solid #f0f0f0;
            margin-top: 16px;
        }
    </style>
</head>
<body>
    <div class="page">
        <div class="header">
            <div class="brand">MerchMate</div>
            <div class="title">MARGIN ANALYSIS REPORT</div>
            <div class="style-info">${data.styleName}</div>
            <div class="buyer-info">${data.buyerName} • ${data.incoterm} • ${data.currency}</div>
        </div>

        <div class="score-card">
            <div class="score-circle">
                <span class="score-value">${data.feasibilityScore.score}</span>
                <span class="score-max">/100</span>
            </div>
            <div class="score-info">
                <span class="score-status">${data.feasibilityScore.status}</span>
                <div class="score-recommendation">${data.feasibilityScore.recommendation}</div>
                <div class="score-justification">${data.feasibilityScore.justification}</div>
            </div>
        </div>

        <div class="hero-card">
            <div class="hero-label">GROSS MARGIN</div>
            <div class="hero-value">${data.marginPercent.toFixed(1)}%</div>
            <div class="hero-sub">${curr(data.grossMargin)} per piece</div>
        </div>

        <div class="action-box">
            <div class="action-label">COMMERCIAL RECOMMENDATION</div>
            <div class="action-text">${data.negotiationInsights.commercialAction}</div>
        </div>

        <div class="section">
            <div class="section-title">💵 Price Analysis</div>
            <div class="price-grid">
                <div class="price-item">
                    <div class="price-label">Buyer Target</div>
                    <div class="price-value">${curr(data.buyerTargetFob)}</div>
                </div>
                <div class="price-item">
                    <div class="price-label">Your Quote</div>
                    <div class="price-value">${curr(data.quotedFob)}</div>
                </div>
                <div class="price-item">
                    <div class="price-label">Price Gap</div>
                    <div class="price-value ${data.priceGap >= 0 ? 'price-positive' : 'price-negative'}">
                        ${data.priceGap >= 0 ? '+' : ''}${curr(data.priceGap)}
                    </div>
                </div>
            </div>
            <table>
                <tr><td>Break-even FOB</td><td>${curr(data.breakEvenFob)}</td></tr>
                <tr><td>Target FOB (at ${data.targetProfitPercent}% profit)</td><td>${curr(data.targetFobWithProfit)}</td></tr>
                <tr><td>Variance from Buyer Target</td><td style="color: ${data.isViable ? '#28a745' : '#dc3545'}">${data.isViable ? '+' : ''}${curr(data.targetVariance)}</td></tr>
            </table>
        </div>

        <div class="section">
            <div class="section-title">📋 Cost Breakdown (${data.costDriver} Product)</div>
            ${Object.entries(data.costBreakdown).map(([key, comp]) => `
                <div class="cost-item">
                    <span class="cost-label">${comp.emoji} ${comp.label}</span>
                    <div class="cost-values">
                        <span class="cost-value">${curr(comp.value)}</span>
                        <span class="cost-percent ${comp.status === 'critical' ? 'cost-critical' : comp.status === 'high' ? 'cost-high' : ''}">${comp.percent.toFixed(1)}%</span>
                    </div>
                </div>
            `).join('')}
            <div class="cost-item" style="border-top: 2px solid #1a1a2e; padding-top: 12px;">
                <span class="cost-label" style="font-weight: 700;">★ TOTAL COST</span>
                <span class="cost-value" style="font-size: 18px;">${curr(data.totalCost)}</span>
            </div>
            ${data.flaggedCosts && data.flaggedCosts.length > 0 ? `
                <div class="alert-box">
                    <div class="alert-title">⚠️ Cost Alerts</div>
                    ${data.flaggedCosts.map(flag => `<div class="alert-text">• ${flag.warning}</div>`).join('')}
                </div>
            ` : ''}
        </div>

        <div class="section">
            <div class="section-title">📦 Order Summary</div>
            <table>
                <tr><td>Order Quantity</td><td>${data.orderQuantity.toLocaleString()} pieces</td></tr>
                <tr><td>Order Category</td><td>${data.orderSizeCategory}</td></tr>
                <tr><td>Total Order Value</td><td>${curr(data.totalOrderValue)}</td></tr>
                <tr class="highlight-row"><td>Expected Total Profit</td><td class="highlight-value">${curr(data.totalProfit)}</td></tr>
            </table>
        </div>

        ${data.negotiationInsights.negotiationLevers && data.negotiationInsights.negotiationLevers.length > 0 ? `
        <div class="section">
            <div class="section-title">🔧 Negotiation Levers</div>
            ${data.negotiationInsights.negotiationLevers.map(lever => `
                <div style="margin-bottom: 12px; padding: 10px; background: #f8f9fa; border-radius: 8px;">
                    <div style="font-weight: 700; font-size: 13px; color: #1a1a2e;">${lever.lever}</div>
                    <div style="font-size: 12px; color: #666; margin-top: 4px;">${lever.description}</div>
                    <div style="font-size: 11px; color: #007bff; font-weight: 600; margin-top: 4px;">Target: ${lever.targetImprovement}</div>
                </div>
            `).join('')}
        </div>
        ` : ''}

        <div class="footer">
            Generated by MerchMate • Buyer-Centric Margin Analyzer • ${new Date().toLocaleString()}
        </div>
    </div>
</body>
</html>`;

  const { uri } = await Print.printToFileAsync({ html });

  const safeStyle = String(data.styleName || 'analysis').replace(/[^a-z0-9_-]/gi, '_');
  const fileName = `MerchMate_Margin_${safeStyle}_${timestamp()}.pdf`;
  const dest = FileSystem.documentDirectory + fileName;
  try {
    await FileSystem.moveAsync({ from: uri, to: dest });
    return dest;
  } catch {
    return uri;
  }
};
