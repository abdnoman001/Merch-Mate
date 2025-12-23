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
    return {
        style: inputs.style_name || 'N/A',
        buyer: inputs.buyer_name || 'N/A',
        garmentType: breakdown.garment_type || 'N/A',
        profitMargin: toNumber(profitMargin),
        finalFob: Number(toNumber(finalFob).toFixed(2)),
        totalCost: Number(toNumber(breakdown.total_cost_per_pc).toFixed(2)),
        costs: {
            fabric: Number(toNumber(breakdown.fabric_cost_per_pc).toFixed(2)),
            print: Number(toNumber(inputs.aop_print_cost_per_pc).toFixed(2)),
            accessories: Number(toNumber(inputs.accessories_cost_per_pc).toFixed(2)),
            cm: Number(toNumber(inputs.cm_cost_per_pc).toFixed(2)),
            washing: Number(toNumber(inputs.washing_cost_per_pc).toFixed(2)),
            commercial: Number(toNumber(inputs.commercial_cost_per_pc).toFixed(2)),
            testing: Number(toNumber(inputs.testing_cost_per_pc).toFixed(2)),
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
    const wsData = [
        ['MerchMate FOB Costing', '', ''],
        ['Generated:', new Date().toLocaleString(), ''],
        [],
        ['STYLE INFORMATION', '', ''],
        ['Style:', data.style, ''],
        ['Buyer:', data.buyer, ''],
        ['Garment Type:', data.garmentType, ''],
        [],
        ['COST BREAKDOWN (PER PIECE)', '', ''],
        ['Component', 'Amount', 'Currency'],
        ['Fabric', data.costs.fabric, 'USD'],
        ['AOP/Print', data.costs.print, 'USD'],
        ['Accessories', data.costs.accessories, 'USD'],
        ['CM Cost', data.costs.cm, 'USD'],
        ['Washing', data.costs.washing, 'USD'],
        ['Commercial', data.costs.commercial, 'USD'],
        ['Testing', data.costs.testing, 'USD'],
        [],
        ['TOTALS', '', ''],
        ['Total Cost', data.totalCost, 'USD'],
        ['Profit Margin', data.profitMargin + '%', ''],
        ['Final FOB (per piece)', data.finalFob, 'USD'],
        [],
        ['CONSUMPTION DETAILS', '', ''],
        [data.consumption.basicLabel, data.consumption.basic, ''],
        [data.consumption.totalLabel, data.consumption.total, ''],
    ];

    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Set column widths
    ws['!cols'] = [
        { wch: 30 },  // Column A - wider for labels
        { wch: 15 },  // Column B - amounts
        { wch: 10 },  // Column C - currency
    ];

    // Apply styles to cells
    const range = XLSX.utils.decode_range(ws['!ref']);

    for (let R = range.s.r; R <= range.e.r; ++R) {
        for (let C = range.s.c; C <= range.e.c; ++C) {
            const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
            if (!ws[cellAddress]) continue;

            // Initialize cell style
            if (!ws[cellAddress].s) ws[cellAddress].s = {};

            // Header row (MerchMate FOB Costing)
            if (R === 0) {
                ws[cellAddress].s = {
                    font: { name: 'Arial', sz: 16, bold: true, color: { rgb: 'FFFFFF' } },
                    fill: { fgColor: { rgb: '0A84FF' } },
                    alignment: { horizontal: 'center', vertical: 'center' },
                };
            }
            // Section headers (STYLE INFORMATION, COST BREAKDOWN, etc.)
            else if (wsData[R][0] && (
                wsData[R][0].includes('STYLE INFORMATION') ||
                wsData[R][0].includes('COST BREAKDOWN') ||
                wsData[R][0].includes('TOTALS') ||
                wsData[R][0].includes('CONSUMPTION DETAILS')
            )) {
                ws[cellAddress].s = {
                    font: { name: 'Arial', sz: 12, bold: true, color: { rgb: 'FFFFFF' } },
                    fill: { fgColor: { rgb: '4A4A4A' } },
                    alignment: { horizontal: 'left', vertical: 'center' },
                };
            }
            // Table header row (Component, Amount, Currency)
            else if (R === 9) {
                ws[cellAddress].s = {
                    font: { name: 'Arial', sz: 11, bold: true },
                    fill: { fgColor: { rgb: 'E8E8E8' } },
                    alignment: { horizontal: 'center', vertical: 'center' },
                    border: {
                        top: { style: 'thin', color: { rgb: '000000' } },
                        bottom: { style: 'thin', color: { rgb: '000000' } },
                    },
                };
            }
            // Cost breakdown rows
            else if (R >= 10 && R <= 16) {
                ws[cellAddress].s = {
                    font: { name: 'Arial', sz: 10 },
                    alignment: { horizontal: C === 0 ? 'left' : 'right', vertical: 'center' },
                    border: {
                        bottom: { style: 'thin', color: { rgb: 'CCCCCC' } },
                    },
                };
                // Format numbers in column B
                if (C === 1 && typeof ws[cellAddress].v === 'number') {
                    ws[cellAddress].z = '$0.00';
                }
            }
            // Totals section (highlighted)
            else if (R >= 19 && R <= 21) {
                ws[cellAddress].s = {
                    font: { name: 'Arial', sz: 11, bold: R === 21 },
                    fill: { fgColor: { rgb: R === 21 ? 'FFF3CD' : 'F8F9FA' } },
                    alignment: { horizontal: C === 0 ? 'left' : 'right', vertical: 'center' },
                    border: {
                        top: { style: 'thin', color: { rgb: '000000' } },
                        bottom: { style: R === 21 ? 'double' : 'thin', color: { rgb: '000000' } },
                    },
                };
                // Format numbers
                if (C === 1 && typeof ws[cellAddress].v === 'number') {
                    ws[cellAddress].z = '$0.00';
                }
            }
            // Style information and consumption rows (text aligned left)
            else if ((R >= 4 && R <= 7) || (R >= 23 && R <= 25)) {
                ws[cellAddress].s = {
                    font: { name: 'Arial', sz: 10 },
                    alignment: { horizontal: 'left', vertical: 'center' },
                };
            }
            // Other data cells
            else {
                ws[cellAddress].s = {
                    font: { name: 'Arial', sz: 10 },
                    alignment: { horizontal: 'left', vertical: 'center' },
                };
            }
        }
    }

    // Merge cells for title
    if (!ws['!merges']) ws['!merges'] = [];
    ws['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: 2 } });

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'FOB Costing');

    const b64 = XLSX.write(wb, { type: 'base64', bookType: 'xlsx', cellStyles: true });

    const safeStyle = String(data.style).replace(/[^a-z0-9_-]/gi, '_');
    const fileName = `MerchMate_FOB_${safeStyle}_${timestamp()}.xlsx`;
    const fileUri = FileSystem.documentDirectory + fileName;
    await FileSystem.writeAsStringAsync(fileUri, b64, { encoding: 'base64' });
    return fileUri;
};

export const generatePdfFOB = async (data) => {
    const currency = (n) => `$${Number(n).toFixed(2)}`;
    const html = `
  <html>
    <head>
      <meta charset="utf-8" />
      <style>
        body { font-family: -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; margin: 24px; color: #333; }
        .header { text-align: center; margin-bottom: 16px; }
        .brand { font-size: 24px; font-weight: 700; color: #0a84ff; }
        .title { font-size: 18px; margin-top: 4px; }
        .meta { margin: 12px 0; }
        .meta div { margin: 2px 0; }
        table { width: 100%; border-collapse: collapse; margin-top: 12px; }
        th, td { border: 1px solid #e5e7eb; padding: 8px; font-size: 14px; }
        th { background: #f3f4f6; text-align: left; }
        .totals { margin-top: 10px; }
        .totals div { display: flex; justify-content: space-between; margin: 4px 0; }
        .footer { margin-top: 24px; text-align: center; font-size: 12px; color: #6b7280; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="brand">MerchMate</div>
        <div class="title">FOB Costing Receipt</div>
      </div>
      <div class="meta">
        <div><strong>Style:</strong> ${data.style}</div>
        <div><strong>Buyer:</strong> ${data.buyer}</div>
        <div><strong>Garment Type:</strong> ${data.garmentType}</div>
        <div><strong>Date:</strong> ${new Date().toLocaleString()}</div>
      </div>
      <table>
        <thead>
          <tr><th>Component</th><th>Price (USD)</th></tr>
        </thead>
        <tbody>
          <tr><td>Fabric</td><td>${currency(data.costs.fabric)}</td></tr>
          <tr><td>AOP/Print</td><td>${currency(data.costs.print)}</td></tr>
          <tr><td>Accessories</td><td>${currency(data.costs.accessories)}</td></tr>
          <tr><td>CM Cost</td><td>${currency(data.costs.cm)}</td></tr>
          <tr><td>Washing</td><td>${currency(data.costs.washing)}</td></tr>
          <tr><td>Commercial</td><td>${currency(data.costs.commercial)}</td></tr>
          <tr><td>Testing</td><td>${currency(data.costs.testing)}</td></tr>
        </tbody>
      </table>
      <div class="totals">
        <div><strong>Total Cost</strong><span>${currency(data.totalCost)}</span></div>
        <div><strong>Profit Margin</strong><span>${Number(data.profitMargin).toFixed(2)}%</span></div>
        <div><strong>Final FOB (USD/pc)</strong><span>${currency(data.finalFob)}</span></div>
      </div>
      <div class="meta" style="margin-top: 14px">
        <div><strong>${data.consumption.basicLabel}:</strong> ${data.consumption.basic}</div>
        <div><strong>${data.consumption.totalLabel}:</strong> ${data.consumption.total}</div>
      </div>
      <div class="footer">Generated by MerchMate</div>
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
