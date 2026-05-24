import fs from "node:fs/promises";
import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const outputDir = "/Users/abdolamunir/Dayline/outputs/retail_inventory_workbook";
const outputPath = `${outputDir}/retail_computer_shop_inventory.xlsx`;

const workbook = Workbook.create();
const dashboard = workbook.worksheets.getOrAdd("Dashboard", { renameFirstIfOnlyNewSpreadsheet: true });
const products = workbook.worksheets.add("Products");
const sales = workbook.worksheets.add("Sales");
const purchases = workbook.worksheets.add("Purchases");
const lookup = workbook.worksheets.add("Lookup");

const productRows = [
  ["SKU-001", "Wireless Mouse", "Mouse", "TechSource Lahore", 950, 1450, 35, 12],
  ["SKU-002", "Gaming Mouse RGB", "Mouse", "TechSource Lahore", 1850, 2850, 18, 8],
  ["SKU-003", "USB Keyboard", "Keyboard", "Karachi IT Wholesale", 1450, 2200, 28, 10],
  ["SKU-004", "Mechanical Keyboard", "Keyboard", "Karachi IT Wholesale", 5200, 7800, 12, 5],
  ["SKU-005", "HDMI Cable 2m", "Cable", "CableMart", 320, 650, 60, 20],
  ["SKU-006", "USB-C Cable", "Cable", "CableMart", 280, 550, 75, 25],
  ["SKU-007", "Laptop Charger 65W", "Charger", "PowerParts PK", 2100, 3350, 20, 8],
  ["SKU-008", "USB WiFi Adapter", "Adapter", "Network Hub", 1200, 1950, 22, 8],
  ["SKU-009", "Bluetooth Headset", "Headset", "SoundLine", 2500, 3950, 16, 6],
  ["SKU-010", "Webcam 1080p", "Webcam", "CameraTech", 3400, 5200, 10, 4],
  ["SKU-011", "USB Flash Drive 64GB", "Storage", "Memory World", 1050, 1650, 45, 15],
  ["SKU-012", "External SSD 512GB", "Storage", "Memory World", 9800, 13200, 7, 3],
  ["SKU-013", "Printer USB Cable", "Printer Accessory", "CableMart", 240, 500, 42, 15],
  ["SKU-014", "Mouse Pad", "Mouse", "TechSource Lahore", 180, 350, 80, 30],
  ["SKU-015", "Laptop Cooling Pad", "Laptop Accessory", "PowerParts PK", 1800, 2850, 14, 5],
];

const sampleSales = [
  [new Date("2026-05-01"), "INV-1001", "SKU-001", 3, "", "", "", "", "", "Completed", "", "Cash", "Walk-in customer"],
  [new Date("2026-05-02"), "INV-1002", "SKU-003", 2, "", "", "", "", "", "Completed", "", "Card", ""],
  [new Date("2026-05-03"), "INV-1003", "SKU-005", 8, "", "", "", "", "", "Completed", "", "Cash", "Bulk cable sale"],
  [new Date("2026-05-04"), "INV-1004", "SKU-009", 1, "", "", "", "", "", "Completed", "", "Bank Transfer", ""],
  [new Date("2026-05-05"), "INV-1005", "SKU-011", 5, "", "", "", "", "", "Completed", "", "Cash", ""],
  [new Date("2026-05-06"), "INV-1006", "SKU-004", 1, "", "", "", "", "", "Completed", "", "Card", ""],
  [new Date("2026-05-07"), "INV-1007", "SKU-007", 2, "", "", "", "", "", "Completed", "", "Cash", ""],
  [new Date("2026-05-08"), "INV-1008", "SKU-014", 10, "", "", "", "", "", "Completed", "", "Cash", ""],
];

const samplePurchases = [
  [new Date("2026-05-01"), "CableMart", "SKU-005", "", 20, "", "", "Restock fast-moving cables"],
  [new Date("2026-05-02"), "TechSource Lahore", "SKU-001", "", 10, "", "", ""],
  [new Date("2026-05-03"), "Memory World", "SKU-011", "", 12, "", "", ""],
  [new Date("2026-05-04"), "PowerParts PK", "SKU-007", "", 6, "", "", ""],
  [new Date("2026-05-05"), "Karachi IT Wholesale", "SKU-003", "", 8, "", "", ""],
];

const categories = [...new Set(productRows.map((row) => row[2]))].sort();
const statuses = ["Completed", "Pending", "Returned", "Cancelled"];
const paymentMethods = ["Cash", "Card", "Bank Transfer", "JazzCash", "Easypaisa", "Credit"];

function writeTitle(sheet, range, title, subtitle = "") {
  const [start] = range.split(":");
  const startCol = start.match(/[A-Z]+/)[0];
  const startRow = Number(start.match(/\d+/)[0]);
  sheet.getRange(start).values = [[title]];
  sheet.getRange(range).format = {
    fill: "#123524",
    font: { color: "#FFFFFF", bold: true, size: 18 },
    horizontalAlignment: "center",
    verticalAlignment: "center",
  };
  sheet.getRange(range).format.rowHeightPx = 38;
  if (subtitle) {
    const row = startRow + 1;
    sheet.getRange(`${startCol}${row}`).values = [[subtitle]];
    sheet.getRange(`A${row}:N${row}`).format = {
      fill: "#DDEBE2",
      font: { color: "#244534", bold: true, size: 11 },
      horizontalAlignment: "center",
      verticalAlignment: "center",
    };
  }
}

function styleHeader(sheet, range) {
  sheet.getRange(range).format = {
    fill: "#1F6F4A",
    font: { color: "#FFFFFF", bold: true, size: 11 },
    horizontalAlignment: "center",
    verticalAlignment: "center",
    wrapText: true,
    borders: { preset: "all", style: "thin", color: "#B8C7BD" },
  };
}

function styleBody(sheet, range) {
  sheet.getRange(range).format = {
    fill: "#FBFDFB",
    font: { color: "#1F2933", size: 10 },
    verticalAlignment: "center",
    borders: { preset: "all", style: "thin", color: "#D7E0DA" },
  };
}

function setWidths(sheet, widths) {
  widths.forEach((width, idx) => {
    const col = String.fromCharCode(65 + idx);
    sheet.getRange(`${col}:${col}`).format.columnWidthPx = width;
  });
}

// Products
writeTitle(products, "A1:P1", "Computer Shop Product Master", "Edit cost, selling price, opening stock, and reorder level here. Formula columns update from Sales and Purchases.");
const productHeaders = [
  "SKU", "Product", "Category", "Supplier", "Cost Price", "Selling Price", "Opening Stock",
  "Purchases Added", "Units Sold", "Current Stock", "Reorder Level", "Reorder Qty",
  "Stock Value", "Retail Value", "Margin %", "Status",
];
products.getRange("A4:P4").values = [productHeaders];
products.getRange(`A5:G${4 + productRows.length}`).values = productRows.map((row) => row.slice(0, 7));
products.getRange(`K5:K${4 + productRows.length}`).values = productRows.map((row) => [row[7]]);
for (let r = 5; r <= 34; r++) {
  products.getRange(`H${r}:J${r}`).formulas = [[
    `=IF($A${r}="","",SUMIFS(Purchases!$E$2:$E$501,Purchases!$C$2:$C$501,$A${r}))`,
    `=IF($A${r}="","",SUMIFS(Sales!$D$2:$D$501,Sales!$C$2:$C$501,$A${r},Sales!$J$2:$J$501,"Completed"))`,
    `=IF($A${r}="","",$G${r}+$H${r}-$I${r})`,
  ]];
  products.getRange(`L${r}:P${r}`).formulas = [[
    `=IF($A${r}="","",MAX($K${r}-$J${r},0))`,
    `=IF($A${r}="","",$J${r}*$E${r})`,
    `=IF($A${r}="","",$J${r}*$F${r})`,
    `=IF($A${r}="","",IFERROR(($F${r}-$E${r})/$F${r},0))`,
    `=IF($A${r}="","",IF($J${r}<=0,"Out of Stock",IF($J${r}<=$K${r},"Reorder","OK")))`,
  ]];
}
styleHeader(products, "A4:P4");
styleBody(products, "A5:P34");
setWidths(products, [90, 180, 135, 160, 95, 105, 95, 105, 90, 95, 95, 95, 110, 110, 85, 105]);
products.getRange("E5:F34").format.numberFormat = '"PKR" #,##0';
products.getRange("M5:N34").format.numberFormat = '"PKR" #,##0';
products.getRange("O5:O34").format.numberFormat = "0.0%";
products.getRange("G5:L34").format.numberFormat = "0";
products.getRange("P5:P34").conditionalFormats.add("containsText", {
  text: "Reorder",
  format: { fill: "#FDE68A", font: { color: "#92400E", bold: true } },
});
products.getRange("P5:P34").conditionalFormats.add("containsText", {
  text: "Out of Stock",
  format: { fill: "#FECACA", font: { color: "#991B1B", bold: true } },
});
products.freezePanes.freezeRows(4);

// Sales
writeTitle(sales, "A1:M1", "Sales Log", "Enter Date, Invoice No., SKU, Quantity, Status, Payment Method, and Notes. Product, price, subtotal, cost, and profit/loss are linked.");
const salesHeaders = ["Date", "Invoice No.", "SKU", "Qty Sold", "Product", "Category", "Unit Selling Price", "Unit Cost", "Subtotal", "Status", "Profit/Loss", "Payment Method", "Notes"];
sales.getRange("A4:M4").values = [salesHeaders];
sales.getRange(`A5:M${4 + sampleSales.length}`).values = sampleSales;
for (let r = 5; r <= 504; r++) {
  sales.getRange(`E${r}:I${r}`).formulas = [[
    `=IF($C${r}="","",XLOOKUP($C${r},Products!$A$5:$A$34,Products!$B$5:$B$34,""))`,
    `=IF($C${r}="","",XLOOKUP($C${r},Products!$A$5:$A$34,Products!$C$5:$C$34,""))`,
    `=IF($C${r}="","",XLOOKUP($C${r},Products!$A$5:$A$34,Products!$F$5:$F$34,""))`,
    `=IF($C${r}="","",XLOOKUP($C${r},Products!$A$5:$A$34,Products!$E$5:$E$34,""))`,
    `=IF(OR($C${r}="",$D${r}=""),"",($D${r}*$G${r}))`,
  ]];
  sales.getRange(`K${r}:K${r}`).formulas = [[`=IF(OR($C${r}="",$D${r}=""),"",$I${r}-($D${r}*$H${r}))`]];
}
styleHeader(sales, "A4:M4");
styleBody(sales, "A5:M504");
setWidths(sales, [105, 105, 95, 80, 180, 135, 120, 95, 110, 105, 110, 120, 210]);
sales.getRange("A5:A504").format.numberFormat = "yyyy-mm-dd";
sales.getRange("G5:I504").format.numberFormat = '"PKR" #,##0';
sales.getRange("K5:K504").format.numberFormat = '"PKR" #,##0';
sales.getRange("C5:C504").dataValidation = { allowBlank: true, list: { inCellDropDown: true, source: productRows.map((row) => row[0]) } };
sales.getRange("J5:J504").dataValidation = { allowBlank: true, list: { inCellDropDown: true, source: statuses } };
sales.getRange("L5:L504").dataValidation = { allowBlank: true, list: { inCellDropDown: true, source: paymentMethods } };
sales.getRange("K5:K504").conditionalFormats.addCellIs({
  operator: "lessThan",
  formula: 0,
  format: { fill: "#FECACA", font: { color: "#991B1B", bold: true } },
});
sales.freezePanes.freezeRows(4);

// Purchases
writeTitle(purchases, "A1:H1", "Purchases / Stock Additions", "Enter every stock purchase here. Quantities increase Products current stock automatically.");
const purchaseHeaders = ["Date", "Supplier", "SKU", "Product", "Qty Added", "Unit Cost", "Subtotal", "Notes"];
purchases.getRange("A4:H4").values = [purchaseHeaders];
purchases.getRange(`A5:H${4 + samplePurchases.length}`).values = samplePurchases;
for (let r = 5; r <= 504; r++) {
  purchases.getRange(`D${r}:G${r}`).formulas = [[
    `=IF($C${r}="","",XLOOKUP($C${r},Products!$A$5:$A$34,Products!$B$5:$B$34,""))`,
    null,
    `=IF($C${r}="","",XLOOKUP($C${r},Products!$A$5:$A$34,Products!$E$5:$E$34,""))`,
    `=IF(OR($C${r}="",$E${r}=""),"",$E${r}*$F${r})`,
  ]];
}
styleHeader(purchases, "A4:H4");
styleBody(purchases, "A5:H504");
setWidths(purchases, [105, 160, 95, 180, 90, 100, 110, 230]);
purchases.getRange("A5:A504").format.numberFormat = "yyyy-mm-dd";
purchases.getRange("F5:G504").format.numberFormat = '"PKR" #,##0';
purchases.getRange("C5:C504").dataValidation = { allowBlank: true, list: { inCellDropDown: true, source: productRows.map((row) => row[0]) } };
purchases.freezePanes.freezeRows(4);

// Lookup/helper sheet
lookup.getRange("A1").values = [["Product SKUs"]];
lookup.getRange(`A2:A${1 + productRows.length}`).values = productRows.map((row) => [row[0]]);
lookup.getRange("B1").values = [["Product Names"]];
lookup.getRange(`B2:B${1 + productRows.length}`).values = productRows.map((row) => [row[1]]);
lookup.getRange("D1:K1").values = [["Category", "Sales", "Profit", "Units Sold", "Stock Value", "Current Stock", "Reorder Qty", "Low Stock Items"]];
lookup.getRange(`D2:D${1 + categories.length}`).values = categories.map((category) => [category]);
for (let r = 2; r <= 1 + categories.length; r++) {
  lookup.getRange(`E${r}:K${r}`).formulas = [[
    `=SUMIFS(Sales!$I$5:$I$504,Sales!$F$5:$F$504,$D${r},Sales!$J$5:$J$504,"Completed")`,
    `=SUMIFS(Sales!$K$5:$K$504,Sales!$F$5:$F$504,$D${r},Sales!$J$5:$J$504,"Completed")`,
    `=SUMIFS(Sales!$D$5:$D$504,Sales!$F$5:$F$504,$D${r},Sales!$J$5:$J$504,"Completed")`,
    `=SUMIFS(Products!$M$5:$M$34,Products!$C$5:$C$34,$D${r})`,
    `=SUMIFS(Products!$J$5:$J$34,Products!$C$5:$C$34,$D${r})`,
    `=SUMIFS(Products!$L$5:$L$34,Products!$C$5:$C$34,$D${r})`,
    `=COUNTIFS(Products!$C$5:$C$34,$D${r},Products!$P$5:$P$34,"Reorder")+COUNTIFS(Products!$C$5:$C$34,$D${r},Products!$P$5:$P$34,"Out of Stock")`,
  ]];
}
lookup.getRange("M1:P1").values = [["Product", "Current Stock", "Reorder Level", "Reorder Qty"]];
for (let i = 0; i < productRows.length; i++) {
  const r = 2 + i;
  const productRow = 5 + i;
  lookup.getRange(`M${r}:P${r}`).formulas = [[
    `=Products!B${productRow}`,
    `=Products!J${productRow}`,
    `=Products!K${productRow}`,
    `=Products!L${productRow}`,
  ]];
}
styleHeader(lookup, "A1:B1");
styleHeader(lookup, "D1:K1");
styleHeader(lookup, "M1:P1");
styleBody(lookup, `A2:B${1 + productRows.length}`);
styleBody(lookup, `D2:K${1 + categories.length}`);
styleBody(lookup, `M2:P${1 + productRows.length}`);
lookup.getRange("E2:F20").format.numberFormat = '"PKR" #,##0';
lookup.getRange("H2:H20").format.numberFormat = '"PKR" #,##0';
setWidths(lookup, [95, 180, 25, 145, 110, 110, 90, 110, 105, 100, 110, 25, 180, 100, 100, 100]);
lookup.freezePanes.freezeRows(1);

// Dashboard
writeTitle(dashboard, "A1:N1", "Retail Computer Shop Dashboard", "Live view of inventory, sales, profit/loss, stock value, and reorder needs. Update Sales and Purchases to refresh.");
dashboard.getRange("A4:N4").format = { fill: "#EDF7F1" };
const kpis = [
  ["Total Stock Value", "=SUM(Products!$M$5:$M$34)"],
  ["Total Sales", '=SUMIFS(Sales!$I$5:$I$504,Sales!$J$5:$J$504,"Completed")'],
  ["Gross Profit", '=SUMIFS(Sales!$K$5:$K$504,Sales!$J$5:$J$504,"Completed")'],
  ["Units Sold", '=SUMIFS(Sales!$D$5:$D$504,Sales!$J$5:$J$504,"Completed")'],
  ["Low Stock Items", '=COUNTIF(Products!$P$5:$P$34,"Reorder")+COUNTIF(Products!$P$5:$P$34,"Out of Stock")'],
  ["Total Reorder Qty", "=SUM(Products!$L$5:$L$34)"],
];
const kpiCells = ["A5:B7", "D5:E7", "G5:H7", "J5:K7", "A9:B11", "D9:E11"];
kpis.forEach(([label, formula], index) => {
  const range = dashboard.getRange(kpiCells[index]);
  range.format = {
    fill: "#FFFFFF",
    font: { color: "#123524", bold: true, size: 11 },
    borders: { preset: "outside", style: "thin", color: "#9DB5A8" },
    horizontalAlignment: "center",
    verticalAlignment: "center",
  };
  const [start] = kpiCells[index].split(":");
  const col = start.match(/[A-Z]+/)[0];
  const row = Number(start.match(/\d+/)[0]);
  dashboard.getRange(`${col}${row}`).values = [[label]];
  dashboard.getRange(`${col}${row + 1}`).formulas = [[formula]];
  dashboard.getRange(`${col}${row + 1}`).format = {
    fill: "#FFFFFF",
    font: { color: "#0F2E20", bold: true, size: 16 },
    horizontalAlignment: "center",
    verticalAlignment: "center",
  };
});
dashboard.getRange("A13:H13").values = [["Category", "Sales", "Profit", "Units Sold", "Stock Value", "Current Stock", "Reorder Qty", "Low Stock Items"]];
dashboard.getRange(`A14:H${13 + categories.length}`).formulas = categories.map((_, idx) => {
  const r = 2 + idx;
  return [
    `=Lookup!D${r}`, `=Lookup!E${r}`, `=Lookup!F${r}`, `=Lookup!G${r}`,
    `=Lookup!H${r}`, `=Lookup!I${r}`, `=Lookup!J${r}`, `=Lookup!K${r}`,
  ];
});
styleHeader(dashboard, "A13:H13");
styleBody(dashboard, `A14:H${13 + categories.length}`);
dashboard.getRange(`B14:C${13 + categories.length}`).format.numberFormat = '"PKR" #,##0';
dashboard.getRange(`E14:E${13 + categories.length}`).format.numberFormat = '"PKR" #,##0';
dashboard.getRange("J13:M13").values = [["Product", "Current Stock", "Reorder Level", "Reorder Qty"]];
dashboard.getRange("J14:M28").formulas = productRows.map((_, idx) => {
  const r = 2 + idx;
  return [`=Lookup!M${r}`, `=Lookup!N${r}`, `=Lookup!O${r}`, `=Lookup!P${r}`];
});
styleHeader(dashboard, "J13:M13");
styleBody(dashboard, "J14:M28");
dashboard.getRange("M14:M28").conditionalFormats.addCellIs({
  operator: "greaterThan",
  formula: 0,
  format: { fill: "#FDE68A", font: { color: "#92400E", bold: true } },
});
dashboard.getRange("A32").values = [["How to use: add new products on Products, record sold items on Sales, record new stock on Purchases. Current stock, subtotals, profit/loss, and dashboard totals are linked by formulas. Use the SKU dropdown to find products quickly."]];
dashboard.getRange("A32:N32").format = {
  fill: "#E8F3EC",
  font: { color: "#244534", bold: true, size: 10 },
  wrapText: true,
  borders: { preset: "outside", style: "thin", color: "#9DB5A8" },
};
dashboard.getRange("A32:N32").format.rowHeightPx = 44;
setWidths(dashboard, [140, 105, 30, 140, 105, 30, 140, 105, 30, 170, 95, 95, 95, 30]);
dashboard.getRange("B6:E10").format.numberFormat = '"PKR" #,##0';
dashboard.getRange("G6:G10").format.numberFormat = '"PKR" #,##0';
dashboard.getRange("A1:N40").format.font = { name: "Aptos" };
dashboard.freezePanes.freezeRows(3);

dashboard.charts.add("ColumnClustered", dashboard.getRange(`A13:C${13 + categories.length}`), "Auto").setPosition(dashboard.getRange("A35:H50"));
dashboard.charts.items[0].title.text = "Sales and Profit by Category";
dashboard.charts.items[0].width = 640;
dashboard.charts.items[0].height = 320;
dashboard.charts.add("ColumnClustered", dashboard.getRange("J13:M28"), "Auto").setPosition(dashboard.getRange("J35:N50"));
dashboard.charts.items[1].title.text = "Current Stock and Reorder Quantity";
dashboard.charts.items[1].width = 520;
dashboard.charts.items[1].height = 320;

for (const sheet of [dashboard, products, sales, purchases, lookup]) {
  sheet.showGridLines = false;
  sheet.getUsedRange().format.autofitRows();
}

// Compact verification: inspect formulas, formula errors, and render sheets.
const dashboardCheck = await workbook.inspect({
  kind: "table",
  range: "Dashboard!A1:N32",
  include: "values,formulas",
  tableMaxRows: 35,
  tableMaxCols: 14,
});
console.log("DASHBOARD_CHECK");
console.log(dashboardCheck.ndjson);

const productsCheck = await workbook.inspect({
  kind: "table",
  range: "Products!A4:P20",
  include: "values,formulas",
  tableMaxRows: 20,
  tableMaxCols: 16,
});
console.log("PRODUCTS_CHECK");
console.log(productsCheck.ndjson);

const salesCheck = await workbook.inspect({
  kind: "table",
  range: "Sales!A4:M14",
  include: "values,formulas",
  tableMaxRows: 12,
  tableMaxCols: 13,
});
console.log("SALES_CHECK");
console.log(salesCheck.ndjson);

const errorScan = await workbook.inspect({
  kind: "match",
  searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A",
  options: { useRegex: true, maxResults: 300 },
  summary: "final formula error scan",
});
console.log("ERROR_SCAN");
console.log(errorScan.ndjson);

for (const sheetName of ["Dashboard", "Products", "Sales", "Purchases", "Lookup"]) {
  await workbook.render({ sheetName, scale: 1 });
  console.log(`Rendered ${sheetName}`);
}

await fs.mkdir(outputDir, { recursive: true });
const output = await SpreadsheetFile.exportXlsx(workbook);
await output.save(outputPath);
console.log(`SAVED ${outputPath}`);
