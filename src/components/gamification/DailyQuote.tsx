import { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Quote } from "lucide-react";
import dayjs from "dayjs";
import dayOfYear from "dayjs/plugin/dayOfYear";
import { FINANCIAL_QUOTES } from "@/constants/quotes";

dayjs.extend(dayOfYear);

export function DailyQuote() {
    const [quote, setQuote] = useState("");

    useEffect(() => {
        // Get day of year (1-366)
        const today = dayjs().dayOfYear();
        // Use modulo to cycle through quotes if we have fewer quotes than days in a year
        const quoteIndex = (today - 1) % FINANCIAL_QUOTES.length;
        setQuote(FINANCIAL_QUOTES[quoteIndex]);
    }, []);

    if (!quote) return null;

    return (
        <Card className="bg-gradient-to-r from-primary/10 via-background to-secondary/10 border-none shadow-sm overflow-hidden relative">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 p-4 opacity-5">
                <Quote className="w-24 h-24 transform rotate-180" />
            </div>

            <div className="p-4 flex gap-4 items-start relative z-10">
                <div className="p-2 bg-primary/10 rounded-full shrink-0 mt-1">
                    <Quote className="w-4 h-4 text-primary" />
                </div>
                <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground/90 italic">
                        "{quote}"
                    </p>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                        Daily Wisdom
                    </p>
                </div>
            </div>
        </Card>
    );
}
