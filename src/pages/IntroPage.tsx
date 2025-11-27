import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Sparkles, TrendingUp, Calendar, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useSettings } from "@/contexts/SettingsContext";

const slides = [
    {
        title: "Welcome to FinanceQuest",
        description: "Your gamified finance tracker that makes managing money fun and rewarding!",
        icon: Sparkles,
        gradient: "from-blue-500 to-purple-600",
    },
    {
        title: "Track Every Expense",
        description: "Easily log your income and expenses. Earn XP and level up as you build better financial habits!",
        icon: TrendingUp,
        gradient: "from-blue-500 to-green-500",
    },
    {
        title: "Manage Subscriptions",
        description: "Never miss a payment again. Track all your recurring subscriptions in one place.",
        icon: Calendar,
        gradient: "from-purple-500 to-blue-600",
    },
    {
        title: "Set Smart Budgets",
        description: "Create budgets, track your spending, and achieve your financial goals with ease.",
        icon: Target,
        gradient: "from-green-500 to-blue-500",
    },
];

export default function IntroPage() {
    const [currentSlide, setCurrentSlide] = useState(0);
    const navigate = useNavigate();
    const { updateSettings } = useSettings();

    const nextSlide = () => {
        if (currentSlide < slides.length - 1) {
            setCurrentSlide(currentSlide + 1);
        }
    };

    const prevSlide = () => {
        if (currentSlide > 0) {
            setCurrentSlide(currentSlide - 1);
        }
    };

    const handleGetStarted = () => {
        updateSettings({ hasSeenIntro: true });
        navigate("/");
    };

    const isLastSlide = currentSlide === slides.length - 1;

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
            <div className="w-full max-w-2xl">
                {/* Slide Content */}
                <div className="relative h-[500px] flex items-center justify-center">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentSlide}
                            initial={{ opacity: 0, x: 100 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -100 }}
                            transition={{ duration: 0.3 }}
                            drag="x"
                            dragConstraints={{ left: 0, right: 0 }}
                            dragElastic={0.2}
                            onDragEnd={(e, { offset, velocity }) => {
                                const swipe = offset.x;

                                if (swipe < -50) {
                                    nextSlide();
                                } else if (swipe > 50) {
                                    prevSlide();
                                }
                            }}
                            className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 cursor-grab active:cursor-grabbing"
                        >
                            {/* Icon */}
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                                className={`mb-8 p-8 rounded-full bg-gradient-to-br ${slides[currentSlide].gradient} shadow-2xl`}
                            >
                                {(() => {
                                    const Icon = slides[currentSlide].icon;
                                    return <Icon className="w-20 h-20 text-white" />;
                                })()}
                            </motion.div>

                            {/* Title */}
                            <motion.h1
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent"
                            >
                                {slides[currentSlide].title}
                            </motion.h1>

                            {/* Description */}
                            <motion.p
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                                className="text-lg md:text-xl text-muted-foreground max-w-md mb-8"
                            >
                                {slides[currentSlide].description}
                            </motion.p>

                            {/* Get Started Button - Only on last slide */}
                            {isLastSlide && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.5 }}
                                >
                                    <Button onClick={handleGetStarted} size="lg" className="px-12 py-6 text-lg">
                                        Get Started
                                    </Button>
                                </motion.div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Navigation - Only show on non-last slides */}
                {!isLastSlide && (
                    <div className="flex items-center justify-between mt-8">
                        {/* Previous Button */}
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={prevSlide}
                            disabled={currentSlide === 0}
                            className="disabled:opacity-0"
                        >
                            <ChevronLeft className="w-6 h-6" />
                        </Button>

                        {/* Dots Indicator */}
                        <div className="flex gap-2">
                            {slides.map((_, index) => (
                                <button
                                    key={index}
                                    onClick={() => setCurrentSlide(index)}
                                    className={`h-2 rounded-full transition-all ${index === currentSlide
                                        ? "w-8 bg-primary"
                                        : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50"
                                        }`}
                                />
                            ))}
                        </div>

                        {/* Next Button */}
                        <Button variant="ghost" size="icon" onClick={nextSlide}>
                            <ChevronRight className="w-6 h-6" />
                        </Button>
                    </div>
                )}

                {/* Dots Indicator - Show on last slide too */}
                {isLastSlide && (
                    <div className="flex justify-center mt-8">
                        <div className="flex gap-2">
                            {slides.map((_, index) => (
                                <button
                                    key={index}
                                    onClick={() => setCurrentSlide(index)}
                                    className={`h-2 rounded-full transition-all ${index === currentSlide
                                        ? "w-8 bg-primary"
                                        : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50"
                                        }`}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* Skip Button */}
                {!isLastSlide && (
                    <div className="text-center mt-6">
                        <Button variant="ghost" onClick={handleGetStarted} className="text-muted-foreground">
                            Skip
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
