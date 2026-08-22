import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export function exportToCSV(filename: string, headers: string[], rows: (string | number)[][]) {
  const csvContent = [
    headers.map((h) => `"${h.replace(/"/g, '""')}"`).join(','),
    ...rows.map((row) =>
      row.map((val) => `"${String(val ?? '').replace(/"/g, '""')}"`).join(',')
    ),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function generateOfficialGovPdfReport(
  title: string,
  subtitle: string,
  headers: string[],
  rows: (string | number)[][],
  filename: string
) {
  const doc = new jsPDF();

  // Header Banner
  doc.setFillColor(6, 78, 59); // Gov Emerald 900
  doc.rect(0, 0, 210, 28, 'F');

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('NATIONAL WATER SUPPLY & DRAINAGE BOARD (NWSDB)', 14, 12);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('DEMOCRATIC SOCIALIST REPUBLIC OF SRI LANKA - SMART METER PORTAL', 14, 18);
  doc.text(`Official Utility Report: ${title}`, 14, 24);

  // Metadata Sub-banner
  doc.setTextColor(50, 50, 50);
  doc.setFontSize(9);
  doc.text(`Generated: ${new Date().toLocaleString('en-GB')} | Scope: ${subtitle}`, 14, 35);
  doc.text('Security Classification: RESTRICTED / OFFICIAL USE ONLY', 14, 40);

  // Table
  autoTable(doc, {
    startY: 44,
    head: [headers],
    body: rows,
    theme: 'grid',
    headStyles: {
      fillColor: [4, 120, 87],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59],
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    styles: {
      cellPadding: 2,
    },
  });

  // Footer
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Page ${i} of ${pageCount} | NWSDB Smart Water IoT Infrastructure | Government of Sri Lanka`,
      14,
      doc.internal.pageSize.height - 10
    );
  }

  doc.save(`${filename}.pdf`);
}
