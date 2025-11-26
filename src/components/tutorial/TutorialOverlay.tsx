import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTutorial } from '@/contexts/TutorialContext';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUp, ArrowDown } from 'lucide-react';

export function TutorialOverlay() {
    const { isActive, currentStep, nextStep, endTutorial } = useTutorial();
    const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
    const [targetId, setTargetId] = useState<string>('');
    const [position, setPosition] = useState<'top' | 'bottom'>('bottom');

    useEffect(() => {
        if (!isActive) return;

        const updatePosition = () => {
            const isVisible = (el: HTMLElement) => {
                const rect = el.getBoundingClientRect();
                return rect.width > 0 && rect.height > 0;
            };

            let id = '';
            if (currentStep === 1) id = 'add-expense-btn';
            else if (currentStep === 2) {
                const mobileNav = document.getElementById('nav-analytics-mobile');
                if (mobileNav && isVisible(mobileNav)) id = 'nav-analytics-mobile';
                else id = 'nav-analytics-desktop';
            }
            else if (currentStep === 3) {
                const mobileNav = document.getElementById('nav-subscriptions-mobile');
                if (mobileNav && isVisible(mobileNav)) id = 'nav-subscriptions-mobile';
                else id = 'nav-subscriptions-desktop';
            }
            else if (currentStep === 4) {
                const mobileBtn = document.getElementById('add-subscription-btn-mobile');
                if (mobileBtn && isVisible(mobileBtn)) id = 'add-subscription-btn-mobile';
                else id = 'add-subscription-btn-desktop';
            }

            const el = document.getElementById(id);
            if (el) {
                const rect = el.getBoundingClientRect();
                setTargetRect(rect);
                setTargetId(id);

                // Determine best position
                if (rect.top > window.innerHeight / 2) {
                    setPosition('top');
                } else {
                    setPosition('bottom');
                }
            }
        };

        updatePosition();
        const interval = setInterval(updatePosition, 50);
        window.addEventListener('resize', updatePosition);
        window.addEventListener('scroll', updatePosition, true);

        return () => {
            clearInterval(interval);
            window.removeEventListener('resize', updatePosition);
            window.removeEventListener('scroll', updatePosition, true);
        };
    }, [isActive, currentStep]);

    if (!isActive || !targetRect) return null;

    const messages = [
        "", // 0
        "Tap here to add your first expense or income!", // 1
        "View your spending trends and insights here.", // 2
        "Access your subscriptions manager here.", // 3
        "Tap here to add a new subscription." // 4
    ];

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

    // Highlight Shape
    const isFab = currentStep === 1 || (currentStep === 4 && targetId.includes('mobile'));
    const borderRadius = isFab ? '50%' : '12px';

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
                        <p className="font-medium mb-4 text-sm">{messages[currentStep]}</p>
                        <div className="flex justify-center gap-2">
                            <Button size="sm" onClick={nextStep} className="w-full">
                                {currentStep === 4 ? "Finish Tour" : "Next"}
                            </Button>
                        </div>
                        <button
                            onClick={endTutorial}
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
