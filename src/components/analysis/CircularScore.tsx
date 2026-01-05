import React from 'react';
import { cn } from "@/lib/utils";

interface CircularScoreProps {
    score: number;
    max?: number;
    label: string;
    insight?: string;
    color?: string;
    size?: number;
    strokeWidth?: number;
    className?: string;
}

export const CircularScore = ({
    score,
    max = 100,
    label,
    insight,
    color = "text-primary",
    size = 120,
    strokeWidth = 10,
    className
}: CircularScoreProps) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const percentage = Math.min(100, Math.max(0, (score / max) * 100));
    const offset = circumference - (percentage / 100) * circumference;

    return (
        <div className={cn("flex flex-col items-center justify-center p-4 bg-card rounded-xl border border-border/50", className)}>
            <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
                {/* Background Circle */}
                <svg className="transform -rotate-90 w-full h-full">
                    <circle
                        className="text-muted-foreground/20"
                        strokeWidth={strokeWidth}
                        stroke="currentColor"
                        fill="transparent"
                        r={radius}
                        cx={size / 2}
                        cy={size / 2}
                    />
                    {/* Progress Circle */}
                    <circle
                        className={cn("transition-all duration-1000 ease-out", color)}
                        strokeWidth={strokeWidth}
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="transparent"
                        r={radius}
                        cx={size / 2}
                        cy={size / 2}
                    />
                </svg>
                {/* Score Text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className={cn("text-2xl font-bold", color)}>{Math.round(score)}</span>
                    <span className="text-xs text-muted-foreground uppercase opacity-70">/ {max}</span>
                </div>
            </div>

            <div className="text-center mt-4 space-y-1">
                <h3 className="font-semibold text-foreground">{label}</h3>
                {insight && (
                    <p className="text-xs text-muted-foreground max-w-[150px] mx-auto leading-relaxed">
                        {insight}
                    </p>
                )}
            </div>
        </div>
    );
};
