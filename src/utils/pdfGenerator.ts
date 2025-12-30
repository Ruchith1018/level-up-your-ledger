import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import dayjs from "dayjs";

interface ReportData {
    familyName: string;
    month: string;
    totalBudget: number;
    totalSpent: number;
    totalRemaining: number;
    transactions: any[];
    members: any[];
}

export const generateFamilyReportPDF = (data: ReportData, password: string) => {
    // Initialize PDF with encryption
    const doc = new jsPDF({
        encryption: {
            userPassword: password,
            ownerPassword: password, // Same for simplicity, or generate a master key
            userPermissions: ["print", "copy", "modify"]
        }
    });

    const pageWidth = doc.internal.pageSize.width;
    const margin = 14;

    // Header
    doc.setFontSize(22);
    doc.setTextColor(40, 40, 40);
    doc.text(data.familyName, margin, 20);

    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(`Family Budget Report - ${dayjs(data.month).format("MMMM YYYY")}`, margin, 30);

    // Stats Section
    const statsY = 45;
    doc.setFillColor(245, 247, 250);
    doc.roundedRect(margin, statsY, pageWidth - (margin * 2), 25, 3, 3, 'F');

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text("Total Budget", margin + 10, statsY + 10);
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text(`Rs ${data.totalBudget.toLocaleString()}`, margin + 10, statsY + 20);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text("Total Spent", margin + 60, statsY + 10);
    doc.setFontSize(14);
    doc.setTextColor(220, 38, 38); // Red
    doc.text(`Rs ${data.totalSpent.toLocaleString()}`, margin + 60, statsY + 20);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text("Remaining", margin + 110, statsY + 10);
    doc.setFontSize(14);
    doc.setTextColor(22, 163, 74); // Green
    doc.text(`Rs ${data.totalRemaining.toLocaleString()}`, margin + 110, statsY + 20);

    // Transactions Table
    const tableStartY = statsY + 35;

    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text("Recent Transactions", margin, tableStartY);

    const tableData = data.transactions.map(t => [
        dayjs(t.created_at).format("MMM DD, YYYY"),
        t.profile?.name || "Unknown",
        t.category || "General",
        `Rs ${Number(t.amount).toLocaleString()}`
    ]);

    autoTable(doc, {
        startY: tableStartY + 5,
        head: [['Date', 'User', 'Category', 'Amount']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [15, 23, 42] }, // Dark slate
        styles: { fontSize: 10 },
        alternateRowStyles: { fillColor: [248, 250, 252] }
    });

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(
            `Generated on ${dayjs().format("MMM DD, YYYY HH:mm")} | Encrypted Document`,
            margin,
            doc.internal.pageSize.height - 10
        );
        doc.text(
            `Page ${i} of ${pageCount}`,
            pageWidth - margin - 20,
            doc.internal.pageSize.height - 10
        );
    }

    // Save
    doc.save(`${data.familyName.replace(/\s+/g, '_')}_Budget_Report_${data.month}.pdf`);
};
