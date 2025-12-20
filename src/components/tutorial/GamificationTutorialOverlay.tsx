import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUp, ArrowDown } from 'lucide-react';

interface GamificationTutorialOverlayProps {
    isActive: boolean;
    onComplete: () => void;
}

export function GamificationTutorialOverlay({ isActive, onComplete }: GamificationTutorialOverlayProps) {
    const [currentStep, setCurrentStep] = useState(0);
    const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
    const [position, setPosition] = useState<'top' | 'bottom'>('bottom');

    const steps = [
        { id: 'gami-level-card', message: "Track your overall progress here. Earn XP to level up!" },
        { id: 'gami-xp-card', message: "See your lifetime XP earnings here." },
        { id: 'gami-streak-card', message: "Keep your streak alive by checking in daily!" },
        { id: 'gami-coins-card', message: "Earn tokens by completing tasks and use them in the shop." },
        { id: 'gami-tasks-section', message: "Complete daily, weekly, and monthly tasks to earn rewards." },
        { id: 'gami-badges-section', message: "Unlock badges by achieving milestones." }
    ];

    useEffect(() => {
        if (!isActive) return;

        const updatePosition = () => {
            const step = steps[currentStep];
            if (!step) return;

            const el = document.getElementById(step.id);
            if (el) {
                const rect = el.getBoundingClientRect();
                setTargetRect(rect);

                // Scroll into view if needed
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });

                // Determine best position
                if (rect.top > window.innerHeight / 2) {
                    setPosition('top');
                } else {
                    setPosition('bottom');
                }
            }
        };

        updatePosition();
        // Small delay to ensure rendering
        const timeout = setTimeout(updatePosition, 100);
        const interval = setInterval(updatePosition, 50);
        window.addEventListener('resize', updatePosition);
        window.addEventListener('scroll', updatePosition, true);

        return () => {
            clearTimeout(timeout);
            clearInterval(interval);
            window.removeEventListener('resize', updatePosition);
            window.removeEventListener('scroll', updatePosition, true);
        };
    }, [isActive, currentStep]);

    const nextStep = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            onComplete();
        }
    };

    if (!isActive || !targetRect) return null;

    // Robust Positioning Logic
    const tooltipWidth = 280;
    const margin = 16;
    const screenWidth = window.innerWidth;
    const centerX = targetRect.left + targetRect.width / 2;

    // Calculate left position for tooltip container
    let left = centerX - tooltipWidth / 2;
    // Clamp to screen edges
    if (left < margin) left = margin;
    if (left + tooltipWidth > screenWidth - margin) left = screenWidth - margin - tooltipWidth;

    // Arrow position relative to tooltip container
    const arrowOffset = centerX - left;

    // Vertical position
    const topPos = position === 'bottom' ? targetRect.bottom + 16 : undefined;
    const bottomPos = position === 'top' ? window.innerHeight - targetRect.top + 16 : undefined;

    const borderRadius = '12px';

    return createPortal(
        <div className="fixed inset-0 z-[100]">
            {/* Spotlight Effect */}
            <div
                className="absolute transition-all duration-300 ease-out"
                style={{
                    top: targetRect.top,
                    left: targetRect.left,
                    width: targetRect.width,
                    height: targetRect.height,
                    borderRadius: borderRadius,
                    boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.7)',
                    pointerEvents: 'none'
                }}
            />

            {/* Pulsing Ring */}
            <div
                className="absolute animate-ping border-2 border-white opacity-75 pointer-events-none"
                style={{
                    top: targetRect.top,
                    left: targetRect.left,
                    width: targetRect.width,
                    height: targetRect.height,
                    borderRadius: borderRadius,
                }}
            />

            {/* Tooltip Container */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute flex flex-col items-start"
                    style={{
                        top: topPos,
                        bottom: bottomPos,
                        left: left,
                        width: tooltipWidth,
                    }}
                >
                    {/* Arrow */}
                    <div
                        className="absolute text-white drop-shadow-lg pointer-events-none"
                        style={{
                            left: arrowOffset,
                            transform: 'translateX(-50%)',
                            top: position === 'bottom' ? -24 : undefined,
                            bottom: position === 'top' ? -24 : undefined,
                        }}
                    >
                        {position === 'bottom' ? <ArrowUp className="w-8 h-8" /> : <ArrowDown className="w-8 h-8" />}
                    </div>

                    {/* Tooltip Box */}
                    <div className="bg-white text-black p-4 rounded-xl shadow-2xl w-full text-center relative z-10">
                        <p className="font-medium mb-4 text-sm">{steps[currentStep].message}</p>
                        <div className="flex justify-center gap-2">
                            <Button size="sm" onClick={nextStep} className="w-full">
                                {currentStep === steps.length - 1 ? "Finish Tour" : "Next"}
                            </Button>
                        </div>
                        <button
                            onClick={onComplete}
                            className="mt-2 text-xs text-muted-foreground hover:text-foreground underline"
                        >
                            Skip Tour
                        </button>
                    </div>
                </motion.div>
            </AnimatePresence>
        </div>,
        document.body
    );
}
