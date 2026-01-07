import React, { useEffect, useRef, useState } from 'react';
import { Star, Quote, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const TESTIMONIALS = [
    {
        name: "Ananya Sharma",
        role: "Freelance Designer",
        content: "BudGlio totally changed how I look at my finances. The 'Money-Curious' mode was exactly what I needed—clean, simple, but powerful.",
        rating: 5,
        image: "https://api.dicebear.com/7.x/big-smile/svg?seed=Ananya&hair=long01,long02,long03&mouth=smile"
    },
    {
        name: "Rahul Verma",
        role: "Software Engineer",
        content: "I've tried every spreadsheet and app out there. Nothing beats the gamification here. Leveling up my ledger is actually addictive!",
        rating: 5,
        image: "https://api.dicebear.com/7.x/big-smile/svg?seed=Rahul&hair=short01,short02&mouth=smile"
    },
    {
        name: "Priya Patel",
        role: "Small Business Owner",
        content: "The family tracking feature is a lifesaver. Finally got my husband and kids on the same page with our monthly budget.",
        rating: 4,
        image: "https://api.dicebear.com/7.x/big-smile/svg?seed=Priya&hair=long04,long05&mouth=smile"
    },
    {
        name: "Arjun Singh",
        role: "Marketing Director",
        content: "Premium is a no-brainer. The custom card themes are gorgeous, and the deep insights helped me trim 20% of my waste expenses.",
        rating: 5,
        image: "https://api.dicebear.com/7.x/big-smile/svg?seed=Arjun&hair=short03,short04&mouth=smile"
    },
    {
        name: "Neha Gupta",
        role: "Student",
        content: "Being a student, every rupee counts. BudGlio helps me save for trips without feeling restricted. Love the rewards too!",
        rating: 5,
        image: "https://api.dicebear.com/7.x/big-smile/svg?seed=Neha&hair=long06,long07&mouth=smile"
    },
    {
        name: "Vikram Malhotra",
        role: "Architect",
        content: "Simple pricing, no hidden fees. Exactly what I wanted. The UI is honestly the best I've seen in a fintech app.",
        rating: 5,
        image: "https://api.dicebear.com/7.x/big-smile/svg?seed=Vikram&hair=short05,short06&mouth=smile"
    }
];

export const TestimonialsSection = () => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [isPaused, setIsPaused] = useState(false);
    const [isMobile, setIsMobile] = useState(() => {
        // Initialize with proper check to avoid delay
        if (typeof window !== 'undefined') {
            return window.innerWidth < 768;
        }
        return false;
    });

    // Detect mobile on mount and resize
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);

        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useEffect(() => {
        const scroller = scrollRef.current;
        if (!scroller) return; // Run on all devices for testimonials

        let animationId: number;
        const speed = 1.5; // Increased pixels per frame for more visible scrolling

        const step = () => {
            if (!isPaused && scroller) {
                // Check if we've scrolled to the halfway point (where duplicated content starts)
                const maxScroll = scroller.scrollWidth - scroller.clientWidth;
                const resetPoint = maxScroll / 2;

                if (scroller.scrollLeft >= resetPoint) {
                    scroller.scrollLeft = 0; // Seamless reset
                } else {
                    scroller.scrollLeft += speed;
                }
            }

            animationId = requestAnimationFrame(step);
        };

        // Start animation immediately
        animationId = requestAnimationFrame(step);

        return () => cancelAnimationFrame(animationId);
    }, [isPaused]);

    return (
        <section className="py-24 bg-background dark:bg-slate-950 relative overflow-hidden transition-colors duration-300 testimonials-section">
            {/* Background Decorations */}
            <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-[100px] pointer-events-none -translate-x-1/2 -translate-y-1/2" />

            <div className="container mx-auto px-4 mb-12 text-center relative z-10">
                <h2 className="text-4xl font-bold tracking-tight text-foreground mb-4">Loved by Thousands</h2>
                <p className="text-xl text-muted-foreground font-light max-w-2xl mx-auto">
                    See what our community has to say about leveling up their finances.
                </p>
            </div>

            {/* Scrolling Container */}
            <div
                className="relative w-full"
                onMouseEnter={() => setIsPaused(true)}
                onMouseLeave={() => setIsPaused(false)}
                onTouchStart={() => setIsPaused(true)}
                onTouchEnd={() => setIsPaused(false)}
                onTouchCancel={() => setIsPaused(false)}
            >
                <div
                    ref={scrollRef}
                    className="flex gap-6 overflow-x-auto no-scrollbar pb-8 px-4 md:px-0"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', scrollBehavior: 'auto' }}
                >
                    {/* Render Double for Infinite Loop Illusion */}
                    {[...TESTIMONIALS, ...TESTIMONIALS, ...TESTIMONIALS].map((testimonial, idx) => (
                        <div
                            key={idx}
                            className="flex-shrink-0 w-[350px] md:w-[400px] bg-card/40 dark:bg-slate-900/40 backdrop-blur-md border border-border/10 p-8 rounded-3xl shadow-lg hover:shadow-xl hover:bg-card/60 transition-all duration-300 group cursor-grab active:cursor-grabbing"
                        >
                            <div className="flex items-start justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-12 w-12 border-2 border-background shadow-sm">
                                        <AvatarImage src={testimonial.image} />
                                        <AvatarFallback><User className="w-6 h-6" /></AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <h4 className="font-bold text-foreground leading-none">{testimonial.name}</h4>
                                        <p className="text-sm text-muted-foreground mt-1">{testimonial.role}</p>
                                    </div>
                                </div>
                                <Quote className="w-8 h-8 text-primary/10 group-hover:text-primary/20 transition-colors" />
                            </div>

                            <p className="text-muted-foreground leading-relaxed mb-6 italic">
                                "{testimonial.content}"
                            </p>

                            <div className="flex items-center gap-1">
                                {[...Array(5)].map((_, i) => (
                                    <Star
                                        key={i}
                                        className={cn(
                                            "w-4 h-4",
                                            i < testimonial.rating ? "fill-yellow-400 text-yellow-400" : "fill-muted text-muted"
                                        )}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};
