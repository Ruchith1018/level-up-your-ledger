import { useExpenses } from "@/contexts/ExpenseContext";
import dayjs from "dayjs";
import { useMemo } from "react";

export function useAvailableMonths() {
    const { state } = useExpenses();

    const availableMonths = useMemo(() => {
        const currentMonth = dayjs();
        let minDate = currentMonth;

        if (state.items.length > 0) {
            // Find the earliest transaction date
            const dates = state.items.map(item => dayjs(item.date));
            const earliestTransaction = dates.reduce((min, visited) =>
                visited.isBefore(min) ? visited : min
            );

            // Use the earliest transaction date, but cap at 5 months ago (total 6 months)
            minDate = earliestTransaction;
            const sixMonthsAgo = currentMonth.subtract(5, 'month').startOf('month');

            if (minDate.isBefore(sixMonthsAgo)) {
                minDate = sixMonthsAgo;
            }
        } else {
            // If no transactions, just show current month (lines up with default behavior)
            return [{
                value: currentMonth.format("YYYY-MM"),
                label: currentMonth.format("MMMM YYYY"),
            }];
        }

        const months = [];
        let iterator = currentMonth;

        // Generate months from current back to minDate
        while (iterator.isAfter(minDate) || iterator.isSame(minDate, 'month')) {
            months.push({
                value: iterator.format("YYYY-MM"),
                label: iterator.format("MMMM YYYY"),
            });
            iterator = iterator.subtract(1, 'month');
        }

        return months;
    }, [state.items]);

    return availableMonths;
}
