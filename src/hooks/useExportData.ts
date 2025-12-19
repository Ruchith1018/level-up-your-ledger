import { useExpenses } from "@/contexts/ExpenseContext";
import { useBudget } from "@/contexts/BudgetContext";
import { useGamification } from "@/contexts/GamificationContext";
import { useSettings } from "@/contexts/SettingsContext";
import { useSubscriptions } from "@/contexts/SubscriptionContext";
import { useSavings } from "@/contexts/SavingsContext";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import dayjs from "dayjs";
import { Capacitor } from "@capacitor/core";
import { Filesystem, Directory, Encoding } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export function useExportData() {
    const { state: expenseState } = useExpenses();
    const { state: budgetState } = useBudget();
    const { state: gamifyState } = useGamification();
    const { state: subscriptionState } = useSubscriptions();
    const { state: savingsState } = useSavings();
    const { settings } = useSettings();
    const { user } = useAuth();

    const generatePassword = (length = 12) => {
        const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
        let retVal = "";
        for (let i = 0, n = charset.length; i < length; ++i) {
            retVal += charset.charAt(Math.floor(Math.random() * n));
        }
        return retVal;
    };

    const exportSecurePDF = async () => {
        try {
            console.log("Starting PDF generation...");
            // toast.loading removed to rely on button state

            // 1. Generate Password
            const password = generatePassword();
            console.log("Password generated.");

            // 2. Create PDF with Encryption (Best Practice for v2.5+)
            const doc = new jsPDF({
                encryption: {
                    userPassword: password,
                    ownerPassword: password,
                    userPermissions: ["print", "copy", "modify", "annot-forms"],
                },
            });
            const pageWidth = doc.internal.pageSize.width;
            console.log("PDF Document created with encryption.");

            // --- METADATA ---
            try {
                doc.setProperties({
                    title: "BudGlio Secure Report",
                    subject: "Financial Data Backup",
                    author: "BudGlio App",
                    creator: "BudGlio App"
                });
            } catch (e) {
                console.error("Error setting properties:", e);
            }

            // --- HEADER ---
            try {
                doc.setFontSize(22);
                doc.setTextColor(41, 128, 185); // Blue
                doc.text("BudGlio Financial Report", pageWidth / 2, 20, { align: "center" });

                doc.setFontSize(10);
                doc.setTextColor(100);
                doc.text(`Generated on: ${dayjs().format("MMMM D, YYYY h:mm A")}`, pageWidth / 2, 28, { align: "center" });
            } catch (e) {
                console.error("Error generating header:", e);
                throw new Error("Failed to generate PDF Header");
            }

            // --- USER PROFILE ---
            console.log("Generating User Profile section...");
            try {
                doc.setFontSize(14);
                doc.setTextColor(0);
                doc.text("User Profile", 14, 40);
                doc.setFontSize(10);

                const profileData = [
                    ["Email", user?.email || "N/A"],
                    ["Name", settings?.userName || "N/A"],
                    ["Currency", settings?.currency || "USD"],
                    ["Level", `${gamifyState?.level || 1}`],
                    ["XP", `${gamifyState?.xp || 0} / ${gamifyState?.totalXP || 100}`],
                    ["Coins", `${gamifyState?.coins || 0}`],
                ];

                autoTable(doc, {
                    startY: 45,
                    head: [],
                    body: profileData,
                    theme: 'plain',
                    styles: { fontSize: 10, cellPadding: 2 },
                    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 40 } },
                });
            } catch (e) {
                console.error("Error generating User Profile:", e);
                throw new Error("Failed to generate User Profile section");
            }

            // --- FINANCIAL SUMMARY ---
            console.log("Generating Financial Summary...");
            let finalY;
            try {
                // Check if lastAutoTable exists, otherwise default to a safe Y
                finalY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 10 : 80;

                doc.setFontSize(14);
                doc.text("Financial Summary (This Month)", 14, finalY);

                const thisMonth = dayjs().format("YYYY-MM");
                const items = expenseState?.items || [];
                const income = items
                    .filter(e => e.type === 'income' && dayjs(e.date).format("YYYY-MM") === thisMonth)
                    .reduce((sum, e) => sum + e.amount, 0);
                const expense = items
                    .filter(e => e.type === 'expense' && dayjs(e.date).format("YYYY-MM") === thisMonth)
                    .reduce((sum, e) => sum + e.amount, 0);

                const summaryData = [
                    ["Total Income", `${settings?.currency || "$"} ${income.toFixed(2)}`],
                    ["Total Expenses", `${settings?.currency || "$"} ${expense.toFixed(2)}`],
                    ["Net Savings", `${settings?.currency || "$"} ${(income - expense).toFixed(2)}`],
                ];

                autoTable(doc, {
                    startY: finalY + 5,
                    head: [],
                    body: summaryData,
                    theme: 'striped',
                    styles: { fontSize: 10 },
                    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50 } },
                });
            } catch (e) {
                console.error("Error generating Financial Summary:", e);
                // Don't throw, just skip this section if it fails? No, better to know.
                throw new Error("Failed to generate Financial Summary");
            }

            // --- BUDGETS ---
            console.log("Generating Budgets...");
            try {
                finalY = (doc as any).lastAutoTable.finalY + 10;
                doc.setFontSize(14);
                doc.text("Active Budgets", 14, finalY);

                const budgets = budgetState?.budgets || [];
                const budgetBody = budgets.map(b => [
                    b.month,
                    `${settings?.currency || "$"} ${b.total.toFixed(2)}`,
                    b.surplusAction
                ]);

                autoTable(doc, {
                    startY: finalY + 5,
                    head: [['Month', 'Total Limit', 'Surplus Action']],
                    body: budgetBody.length ? budgetBody : [['No budgets set', '-', '-']],
                    theme: 'grid',
                    headStyles: { fillColor: [41, 128, 185] },
                });
            } catch (e) {
                console.error("Error generating Budgets:", e);
            }

            // --- SAVINGS GOALS ---
            console.log("Generating Savings Goals...");
            try {
                finalY = (doc as any).lastAutoTable.finalY + 10;
                doc.setFontSize(14);
                doc.text("Savings Goals", 14, finalY);

                const goals = savingsState?.goals || [];
                const savingsBody = goals.map(g => [
                    g.name,
                    `${settings?.currency || "$"} ${g.currentAmount.toFixed(2)}`,
                    `${settings?.currency || "$"} ${g.targetAmount.toFixed(2)}`,
                    g.isCompleted ? "Completed" : "In Progress",
                    g.deadline ? dayjs(g.deadline).format("YYYY-MM-DD") : "No Deadline"
                ]);

                autoTable(doc, {
                    startY: finalY + 5,
                    head: [['Goal', 'Current', 'Target', 'Status', 'Deadline']],
                    body: savingsBody.length ? savingsBody : [['No savings goals', '-', '-', '-', '-']],
                    theme: 'grid',
                    headStyles: { fillColor: [39, 174, 96] }, // Green
                });
            } catch (e) {
                console.error("Error generating Savings:", e);
            }

            // --- SUBSCRIPTIONS ---
            console.log("Generating Subscriptions...");
            try {
                finalY = (doc as any).lastAutoTable.finalY + 10;
                doc.setFontSize(14);
                doc.text("Subscriptions", 14, finalY);

                const subs = subscriptionState?.subscriptions || [];
                const subBody = subs.map(s => [
                    s.title,
                    `${settings?.currency || "$"} ${s.amount.toFixed(2)}`,
                    s.interval,
                    dayjs(s.billingDate).format("YYYY-MM-DD"),
                    s.active ? "Active" : "Inactive"
                ]);

                autoTable(doc, {
                    startY: finalY + 5,
                    head: [['Service', 'Amount', 'Interval', 'Next Billing', 'Status']],
                    body: subBody.length ? subBody : [['No subscriptions', '-', '-', '-', '-']],
                    theme: 'grid',
                    headStyles: { fillColor: [142, 68, 173] }, // Purple
                });
            } catch (e) {
                console.error("Error generating Subscriptions:", e);
            }

            // --- RECENT TRANSACTIONS (Top 50) ---
            console.log("Generating Recent Transactions...");
            try {
                doc.addPage();
                doc.setFontSize(14);
                doc.text("Recent Transactions", 14, 20);

                const items = expenseState?.items || [];
                const expensesBody = items.slice(0, 50).map(e => [
                    dayjs(e.date).format("YYYY-MM-DD"),
                    e.type.toUpperCase(),
                    e.category,
                    e.merchant || "-",
                    `${settings?.currency || "$"} ${e.amount.toFixed(2)}`,
                    e.paymentMethod,
                    e.notes || "-"
                ]);

                autoTable(doc, {
                    startY: 25,
                    head: [['Date', 'Type', 'Category', 'Merchant', 'Amount', 'Method', 'Notes']],
                    body: expensesBody,
                    theme: 'grid',
                    styles: { fontSize: 8 },
                    headStyles: { fillColor: [52, 73, 94] }, // Dark Blue
                });
            } catch (e) {
                console.error("Error generating Transactions:", e);
            }

            // 3. Encrypt PDF
            console.log("Encrypting PDF...");


            // 4. Save/Export
            console.log("Saving PDF...");
            const fileName = `budglio-secure-report-${dayjs().format("YYYY-MM-DD")}.pdf`;

            try {
                if (Capacitor.isNativePlatform()) {
                    console.log("Saving native...");
                    const pdfBase64 = doc.output('datauristring').split(',')[1];

                    await Filesystem.writeFile({
                        path: fileName,
                        data: pdfBase64,
                        directory: Directory.Documents,
                    });

                    const fileResult = await Filesystem.getUri({
                        directory: Directory.Documents,
                        path: fileName,
                    });

                    // Try saving to Downloads too
                    try {
                        await Filesystem.writeFile({
                            path: `Download/${fileName}`,
                            data: pdfBase64,
                            directory: Directory.ExternalStorage,
                            recursive: true
                        });
                    } catch (e) {
                        console.log("Downloads save failed", e);
                    }

                    await Share.share({
                        files: [fileResult.uri],
                        dialogTitle: 'Share Secure Report',
                    });
                } else {
                    console.log("Saving web...");
                    doc.save(fileName);
                }
            } catch (saveError) {
                console.error("Error during save/share:", saveError);
                // Continue to show password even if sharing failed/was cancelled
            }

            console.log("PDF generation complete.");
            toast.success("Secure PDF Generated!");
            return password;

        } catch (error: any) {
            console.error("PDF Generation failed CRITICAL:", error);
            toast.error(`Failed to generate PDF: ${error.message}`);
            throw error;
        }
    };

    return { exportSecurePDF };
}

