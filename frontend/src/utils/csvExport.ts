/**
 * CSV Export Utility for LactoFlow
 */

export function exportToCsv(filename: string, headers: string[], rows: (string | number | undefined | null)[][]) {
  const escapeCell = (val: string | number | undefined | null) => {
    if (val === undefined || val === null) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const csvContent = [
    headers.map(escapeCell).join(','),
    ...rows.map((row) => row.map(escapeCell).join(',')),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportMilkCollectionsCsv(collections: any[], filename = 'milk_collections.csv') {
  const headers = ['Date', 'Farmer Code', 'Farmer Name', 'Shift', 'Milk Type', 'Quantity (L)', 'FAT (%)', 'SNF (%)', 'Rate (₹/L)', 'Total (₹)'];
  const rows = collections.map((c) => [
    c.date || '',
    c.customerCode || '',
    c.customerName || '',
    c.shift || '',
    c.milkType || '',
    c.quantity ?? 0,
    c.fat ?? 0,
    c.snf ?? 0,
    c.rate ?? 0,
    c.totalAmount ?? 0,
  ]);
  exportToCsv(filename, headers, rows);
}

export function exportFarmersCsv(farmers: any[], filename = 'farmers_directory.csv') {
  const headers = ['Code', 'Full Name', 'Mobile', 'Milk Type', 'Address', 'Bank Name', 'Account No', 'IFSC Code', 'Advance Balance', 'Status'];
  const rows = farmers.map((f) => [
    f.code,
    f.name,
    f.mobile,
    f.milkType,
    f.address || '',
    f.bankName || '',
    f.accountNo || '',
    f.ifscCode || '',
    f.advanceBalance || 0,
    f.isActive ? 'Active' : 'Inactive',
  ]);
  exportToCsv(filename, headers, rows);
}

export function exportSettlementsCsv(settlements: any[], filename = 'settled_bills.csv') {
  const headers = ['Settlement Date', 'Farmer Code', 'Farmer Name', 'Period', 'Total Litres', 'Advance Deductions (₹)', 'Net Paid (₹)'];
  const rows = settlements.map((s) => [
    s.createdAt ? new Date(s.createdAt).toLocaleDateString() : '',
    s.customerCode,
    s.customerName,
    s.period,
    s.litres ?? 0,
    s.advanceDeducted ?? 0,
    s.netPayable ?? 0,
  ]);
  exportToCsv(filename, headers, rows);
}
