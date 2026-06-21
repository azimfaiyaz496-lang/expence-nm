const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const os = require('os');
const PDFDocument = require('pdfkit');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// Helper to format currency
const formatCurrency = (val) => {
  const num = parseFloat(val);
  return isNaN(num) ? '$0.00' : '$' + num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

// Route to generate and save PDF receipt
app.post('/api/export-pdf', (req, { json, status }) => {
  try {
    const { sections, grandTotal, timestamp } = req.body;

    // Detect user's Desktop path (accounting for standard and OneDrive configurations)
    const homeDir = os.homedir();
    const standardDesktop = path.join(homeDir, 'Desktop');
    const oneDriveDesktop = path.join(homeDir, 'OneDrive', 'Desktop');
    
    let targetDir = homeDir;
    if (fs.existsSync(oneDriveDesktop)) {
      targetDir = oneDriveDesktop;
    } else if (fs.existsSync(standardDesktop)) {
      targetDir = standardDesktop;
    }

    const fileTimestamp = Date.now();
    const fileName = `Expense_Receipt_${fileTimestamp}.pdf`;
    const fullPath = path.join(targetDir, fileName);

    // Initialize PDF document
    const doc = new PDFDocument({ size: 'A4', margin: 40 });

    // Stream PDF directly to Desktop path
    const writeStream = fs.createWriteStream(fullPath);
    doc.pipe(writeStream);

    // --- PDF DRAWING LOGIC (PROFESSIONAL GRAPHIC DESIGN) ---

    // 1. Header block
    doc.rect(40, 40, 515, 60).fill('#0f172a');
    doc.fillColor('#06b6d4').font('Helvetica-Bold').fontSize(18).text('EXPENSE ARCHITECT LEDGER', 55, 52);
    doc.fillColor('#94a3b8').font('Helvetica').fontSize(9).text('Professional Multi-Section Event & House Management Ledger', 55, 75);

    // 2. Metadata / Grand Total Card
    doc.y = 120;
    const startY = doc.y;

    // Left info block
    doc.fillColor('#475569').font('Helvetica-Bold').fontSize(8).text('REPORT DETAILS', 40, startY);
    doc.fillColor('#1e293b').font('Helvetica').fontSize(9)
       .text(`Generated: ${timestamp}`, 40, startY + 15)
       .text(`Output Path: Desktop\\${fileName}`, 40, startY + 28)
       .text('Format: Dynamic Column Layout', 40, startY + 41);

    // Right grand total box
    doc.rect(360, startY - 5, 195, 60).fill('#f8fafc');
    doc.rect(360, startY - 5, 195, 60).stroke('#e2e8f0');
    doc.fillColor('#64748b').font('Helvetica-Bold').fontSize(8).text('CONSOLIDATED GRAND TOTAL', 375, startY + 5);
    doc.fillColor('#10b981').font('Helvetica-Bold').fontSize(16).text(formatCurrency(grandTotal), 375, startY + 22);

    // Draw horizontal separator
    doc.moveTo(40, startY + 70).lineTo(555, startY + 70).strokeColor('#cbd5e1').lineWidth(1).stroke();

    // 3. Render each section as an individual structured table
    let currentY = startY + 90;

    sections.forEach((sec, idx) => {
      // Check for page overflow
      if (currentY > 680) {
        doc.addPage();
        currentY = 50;
      }

      // Section title
      doc.fillColor('#1e293b').font('Helvetica-Bold').fontSize(13).text(`${idx + 1}. ${sec.title}`, 40, currentY);
      doc.fillColor('#64748b').font('Helvetica-Oblique').fontSize(8).text(`Calculation Mode: ${sec.calcMode}`, 40, currentY + 15, { align: 'left' });
      currentY += 28;

      // Calculate table column widths dynamically
      const tableWidth = 515;
      const colSchema = sec.columns;
      const numCols = colSchema.length;

      // Assign custom widths: Description takes 50%, Amount takes 20%, others split the rest (30%)
      const widths = {};
      let remainingWidth = tableWidth;

      // Check if custom columns exist other than default description and amount
      const customCols = colSchema.filter(c => c.id !== 'description' && c.id !== 'amount');

      if (customCols.length === 0) {
        widths['description'] = tableWidth * 0.75;
        widths['amount'] = tableWidth * 0.25;
      } else {
        widths['amount'] = 90; // Fixed width for currency
        widths['description'] = 220; // Good space for text
        const share = (tableWidth - 310) / customCols.length;
        customCols.forEach(c => {
          widths[c.id] = share;
        });
      }

      // Render Table Headers
      doc.rect(40, currentY, tableWidth, 20).fill('#f1f5f9');
      
      let headerX = 40;
      colSchema.forEach(col => {
        const w = widths[col.id];
        doc.fillColor('#475569')
           .font('Helvetica-Bold')
           .fontSize(8)
           .text(col.label.toUpperCase(), headerX + 8, currentY + 6, {
             width: w - 16,
             align: col.id === 'amount' ? 'right' : 'left',
             lineBreak: false
           });
        headerX += w;
      });

      currentY += 20;

      // Render Table Rows
      sec.rows.forEach((row, rIdx) => {
        // Page break check
        if (currentY > 740) {
          doc.addPage();
          currentY = 50;
          
          // Re-draw headers on new page
          doc.rect(40, currentY, tableWidth, 18).fill('#f1f5f9');
          let pageHeaderX = 40;
          colSchema.forEach(col => {
            const w = widths[col.id];
            doc.fillColor('#475569')
               .font('Helvetica-Bold')
               .fontSize(8)
               .text(col.label.toUpperCase(), pageHeaderX + 8, currentY + 5, {
                 width: w - 16,
                 align: col.id === 'amount' ? 'right' : 'left',
                 lineBreak: false
               });
            pageHeaderX += w;
          });
          currentY += 18;
        }

        // Draw light background for alternating rows
        if (rIdx % 2 === 1) {
          doc.rect(40, currentY, tableWidth, 18).fill('#f8fafc');
        }

        let cellX = 40;
        colSchema.forEach(col => {
          const w = widths[col.id];
          const rawVal = row[col.id] ?? '';
          const displayVal = col.type === 'number' && col.id === 'amount' ? formatCurrency(rawVal) : String(rawVal);

          doc.fillColor('#334155')
             .font('Helvetica')
             .fontSize(8.5)
             .text(displayVal, cellX + 8, currentY + 5, {
               width: w - 16,
               align: col.id === 'amount' ? 'right' : 'left',
               lineBreak: false
             });
          cellX += w;
        });

        // Bottom cell border
        doc.moveTo(40, currentY + 18).lineTo(555, currentY + 18).strokeColor('#f1f5f9').lineWidth(0.5).stroke();
        currentY += 18;
      });

      // Section Total Card
      doc.moveTo(40, currentY + 4).lineTo(555, currentY + 4).strokeColor('#cbd5e1').lineWidth(1).stroke();
      doc.fillColor('#475569').font('Helvetica-Bold').fontSize(8.5).text('SECTION SUM:', 360, currentY + 10, { align: 'right', width: 100 });
      doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(10.5).text(formatCurrency(sec.total), 465, currentY + 8, { align: 'right', width: 90 });

      currentY += 35;
    });

    // 4. Footer stamp
    const totalPages = doc.bufferedPageRange().count;
    for (let i = 0; i < totalPages; i++) {
      doc.switchToPage(i);
      doc.fillColor('#94a3b8')
         .font('Helvetica')
         .fontSize(7.5)
         .text(`Expense Architect Ledger • Page ${i + 1} of ${totalPages} • Generated direct to Desktop`, 40, 805, { align: 'center', width: 515 });
    }

    // Finalize PDF file
    doc.end();

    writeStream.on('finish', () => {
      json({ 
        success: true, 
        message: `Ledger receipt successfully compiled and saved to Desktop as: ${fileName}`
      });
    });

  } catch (err) {
    console.error('Failed to export PDF:', err);
    status(500).json({ error: 'Internal Server Error', details: err.message });
  }
});

// Serve frontend build in production if needed, or run API standalone
app.listen(PORT, () => {
  console.log(`Expense Tracker server running locally at http://localhost:${PORT}`);
});
