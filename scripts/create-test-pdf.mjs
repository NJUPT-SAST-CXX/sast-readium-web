/**
 * Script to create a test PDF with sample data for testing chart and report features
 */

import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import fs from "fs";
import path from "path";

async function createTestPDF() {
  const pdfDoc = await PDFDocument.create();
  const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Page 1: Sales Report with Data
  const page1 = pdfDoc.addPage([612, 792]); // Letter size
  const { height } = page1.getSize();

  let y = height - 50;

  // Title
  page1.drawText("Q4 2024 Sales Report", {
    x: 50,
    y: y,
    size: 24,
    font: helveticaBold,
    color: rgb(0.1, 0.1, 0.4),
  });

  y -= 40;

  // Summary
  page1.drawText("Executive Summary", {
    x: 50,
    y: y,
    size: 16,
    font: helveticaBold,
  });

  y -= 25;

  const summary = `This report presents the quarterly sales performance for Q4 2024. 
Overall revenue increased by 15% compared to Q3, with strong growth in the 
technology and healthcare sectors. Key highlights include record-breaking 
online sales and successful expansion into new markets.`;

  const lines = summary.split("\n");
  for (const line of lines) {
    page1.drawText(line.trim(), {
      x: 50,
      y: y,
      size: 11,
      font: timesRomanFont,
    });
    y -= 16;
  }

  y -= 20;

  // Sales Data Table
  page1.drawText("Monthly Sales Data (in thousands USD)", {
    x: 50,
    y: y,
    size: 14,
    font: helveticaBold,
  });

  y -= 25;

  // Table header
  const tableData = [
    ["Month", "Revenue", "Expenses", "Profit"],
    ["October", "450", "320", "130"],
    ["November", "520", "350", "170"],
    ["December", "680", "400", "280"],
  ];

  const colWidths = [100, 100, 100, 100];
  let x = 50;

  for (let row = 0; row < tableData.length; row++) {
    x = 50;
    const isHeader = row === 0;
    const font = isHeader ? helveticaBold : timesRomanFont;

    for (let col = 0; col < tableData[row].length; col++) {
      page1.drawText(tableData[row][col], {
        x: x,
        y: y,
        size: 11,
        font: font,
      });
      x += colWidths[col];
    }
    y -= 20;
  }

  y -= 30;

  // Regional Performance
  page1.drawText("Regional Performance", {
    x: 50,
    y: y,
    size: 14,
    font: helveticaBold,
  });

  y -= 25;

  const regionalData = [
    "North America: $850,000 (52% of total)",
    "Europe: $420,000 (26% of total)",
    "Asia Pacific: $280,000 (17% of total)",
    "Other Regions: $100,000 (5% of total)",
  ];

  for (const item of regionalData) {
    page1.drawText("• " + item, {
      x: 60,
      y: y,
      size: 11,
      font: timesRomanFont,
    });
    y -= 18;
  }

  y -= 30;

  // Key Insights
  page1.drawText("Key Insights", {
    x: 50,
    y: y,
    size: 14,
    font: helveticaBold,
  });

  y -= 25;

  const insights = [
    "1. December sales exceeded projections by 23%",
    "2. Online channel grew 45% year-over-year",
    "3. Customer retention rate improved to 87%",
    "4. New product line contributed 18% of revenue",
  ];

  for (const insight of insights) {
    page1.drawText(insight, {
      x: 60,
      y: y,
      size: 11,
      font: timesRomanFont,
    });
    y -= 18;
  }

  y -= 30;

  // Action Items
  page1.drawText("Action Items", {
    x: 50,
    y: y,
    size: 14,
    font: helveticaBold,
  });

  y -= 25;

  const actionItems = [
    "[ ] Expand marketing budget for Q1 2025 - Due: Jan 15",
    "[ ] Launch loyalty program in Europe - Due: Feb 1",
    "[ ] Review pricing strategy for Asia Pacific - Due: Jan 30",
    "[ ] Hire 5 additional sales representatives - Due: Feb 15",
  ];

  for (const item of actionItems) {
    page1.drawText(item, {
      x: 60,
      y: y,
      size: 11,
      font: timesRomanFont,
    });
    y -= 18;
  }

  // Page 2: Product Performance
  const page2 = pdfDoc.addPage([612, 792]);
  y = height - 50;

  page2.drawText("Product Performance Analysis", {
    x: 50,
    y: y,
    size: 24,
    font: helveticaBold,
    color: rgb(0.1, 0.1, 0.4),
  });

  y -= 40;

  page2.drawText("Product Category Sales (Q4 2024)", {
    x: 50,
    y: y,
    size: 14,
    font: helveticaBold,
  });

  y -= 25;

  const productData = [
    ["Category", "Units Sold", "Revenue", "Growth"],
    ["Electronics", "12,500", "$625,000", "+18%"],
    ["Software", "8,200", "$410,000", "+32%"],
    ["Services", "3,100", "$310,000", "+12%"],
    ["Accessories", "25,000", "$125,000", "+8%"],
    ["Support Plans", "4,500", "$180,000", "+25%"],
  ];

  x = 50;
  const prodColWidths = [120, 100, 100, 80];

  for (let row = 0; row < productData.length; row++) {
    x = 50;
    const isHeader = row === 0;
    const font = isHeader ? helveticaBold : timesRomanFont;

    for (let col = 0; col < productData[row].length; col++) {
      page2.drawText(productData[row][col], {
        x: x,
        y: y,
        size: 11,
        font: font,
      });
      x += prodColWidths[col];
    }
    y -= 20;
  }

  y -= 30;

  page2.drawText("Customer Satisfaction Scores", {
    x: 50,
    y: y,
    size: 14,
    font: helveticaBold,
  });

  y -= 25;

  const satisfactionData = [
    "Product Quality: 4.5/5.0 (90%)",
    "Customer Service: 4.3/5.0 (86%)",
    "Delivery Speed: 4.7/5.0 (94%)",
    "Value for Money: 4.1/5.0 (82%)",
    "Overall Satisfaction: 4.4/5.0 (88%)",
  ];

  for (const item of satisfactionData) {
    page2.drawText("• " + item, {
      x: 60,
      y: y,
      size: 11,
      font: timesRomanFont,
    });
    y -= 18;
  }

  // Save the PDF
  const pdfBytes = await pdfDoc.save();

  const outputPath = path.join(process.cwd(), "public", "test-report.pdf");
  fs.writeFileSync(outputPath, pdfBytes);

  console.log(`Test PDF created at: ${outputPath}`);
}

createTestPDF().catch(console.error);
