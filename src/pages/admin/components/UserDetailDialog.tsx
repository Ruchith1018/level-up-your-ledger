import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, CreditCard, Palette, Gift, Calendar } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"; // Added Import
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";

import { THEMES } from "@/constants/themes";
import { CARD_THEMES, MARVEL_THEMES, ANIME_THEMES } from "@/constants/cardThemes";

interface UserDetailProps {
    isOpen: boolean;
    onClose: () => void;
    user: {
        user_id: string;
        user_name: string;
        email: string;
        referral_id: string | null;
        profile_image: string | null; // Added field
        purchased_themes: string[] | null;
        purchased_card_themes: string[] | null;
    } | null;
}

export default function UserDetailDialog({ isOpen, onClose, user }: UserDetailProps) {
    const [redemptions, setRedemptions] = useState<any[]>([]);
    const [loadingRedemptions, setLoadingRedemptions] = useState(false);

    useEffect(() => {
        if (isOpen && user) {
            fetchRedemptions();
        }
    }, [isOpen, user]);

    const fetchRedemptions = async () => {
        if (!user) return;
        setLoadingRedemptions(true);
        const { data, error } = await supabase
            .from('gamification_profiles')
            .select('redemption_history')
            .eq('user_id', user.user_id)
            .single();

        if (error) {
            console.error("Error fetching redemptions:", error);
        } else {
            setRedemptions(data?.redemption_history || []);
        }
        setLoadingRedemptions(false);
    };

    if (!user) return null;

    // Helper to find theme/card details
    const findTheme = (id: string) => THEMES.find(t => t.id === id);
    // Combine all card themes for lookup
    const allCardThemes = [...CARD_THEMES, ...MARVEL_THEMES, ...ANIME_THEMES];
    const findCardTheme = (id: string) => allCardThemes.find(c => c.id === id);


    const getCardPrice = (id: string) => {
        if (id.startsWith("marvel_") || id.startsWith("anime_")) return "₹149";
        if (id === "gold" || id === "platinum") return "₹100";
        if (id === "custom") return "₹249";
        return "₹50";
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-3 text-xl">
                        <Avatar className="h-10 w-10 border border-muted">
                            <AvatarImage src={user.profile_image || undefined} alt={user.user_name} />
                            <AvatarFallback className="bg-primary/10 text-primary">
                                {user.user_name?.slice(0, 2).toUpperCase() || "U"}
                            </AvatarFallback>
                        </Avatar>
                        {user.user_name || "User Details"}
                    </DialogTitle>
                    <DialogDescription className="flex flex-col gap-1 ml-[52px]"> {/* Indent to align with text */}
                        <span className="flex items-center gap-2">📧 {user.email}</span>
                        <span className="flex items-center gap-2 font-mono text-xs">ID: {user.referral_id || "N/A"}</span>
                    </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="purchases" className="flex-1 overflow-hidden flex flex-col">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="purchases">Item Purchases</TabsTrigger>
                        <TabsTrigger value="redemptions">Redemption History</TabsTrigger>
                    </TabsList>

                    <TabsContent value="purchases" className="flex-1 overflow-hidden mt-4">
                        <ScrollArea className="h-[50vh] pr-4">
                            <div className="space-y-6">
                                {/* Themes Section */}
                                <div>
                                    <h3 className="font-semibold mb-3 flex items-center gap-2 text-primary">
                                        <Palette className="w-4 h-4" /> App Themes
                                    </h3>
                                    {(!user.purchased_themes || user.purchased_themes.length === 0) ? (
                                        <p className="text-sm text-muted-foreground italic pl-6">No themes purchased.</p>
                                    ) : (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-2">
                                            {user.purchased_themes?.map(id => {
                                                const theme = findTheme(id);
                                                return (
                                                    <div key={id} className="flex items-center justify-between p-3 border rounded-lg bg-card/50">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-800 dark:to-gray-700"
                                                                style={theme ? { background: `linear-gradient(to bottom right, hsl(${theme.colors.primary}), hsl(${theme.colors.secondary}))` } : {}}
                                                            />
                                                            <div>
                                                                <div className="font-medium text-sm">{theme?.name || id}</div>
                                                                <div className="text-xs text-muted-foreground">App Theme</div>
                                                            </div>
                                                        </div>
                                                        <Badge variant="secondary" className="font-mono text-xs">
                                                            {theme?.price ? `${theme.price} Coins` : "Free"}
                                                        </Badge>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>

                                {/* Cards Section */}
                                <div>
                                    <h3 className="font-semibold mb-3 flex items-center gap-2 text-primary">
                                        <CreditCard className="w-4 h-4" /> Card Skins
                                    </h3>
                                    {(!user.purchased_card_themes || user.purchased_card_themes.length === 0) ? (
                                        <p className="text-sm text-muted-foreground italic pl-6">No cards purchased.</p>
                                    ) : (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-2">
                                            {user.purchased_card_themes?.map(id => {
                                                const card = findCardTheme(id);
                                                const isCustom = id === 'custom';

                                                return (
                                                    <div key={id} className="flex items-center justify-between p-3 border rounded-lg bg-card/50">
                                                        <div className="flex items-center gap-3">
                                                            {/* Tiny Preview */}
                                                            <div className="w-10 h-6 rounded bg-gray-200 dark:bg-gray-800 relative overflow-hidden shadow-sm"
                                                                style={card && !(card as any).image ? { background: card.gradient } : {}}
                                                            >
                                                                {(card as any)?.image && <img src={(card as any).image} alt="" className="w-full h-full object-cover" />}
                                                                {isCustom && <span className="absolute inset-0 flex items-center justify-center text-[8px]">✨</span>}
                                                            </div>
                                                            <div>
                                                                <div className="font-medium text-sm">{isCustom ? "Custom Card" : (card?.name || id)}</div>
                                                                <div className="text-xs text-muted-foreground">{id.startsWith('marvel') ? 'Marvel' : id.startsWith('anime') ? 'Anime' : 'Classic'}</div>
                                                            </div>
                                                        </div>
                                                        <Badge variant="outline" className="font-mono text-xs bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800">
                                                            {getCardPrice(id)}
                                                        </Badge>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </ScrollArea>
                    </TabsContent>

                    <TabsContent value="redemptions" className="flex-1 overflow-hidden mt-4">
                        <ScrollArea className="h-[50vh] pr-4">
                            {loadingRedemptions ? (
                                <div className="flex justify-center py-10"><Loader2 className="animate-spin" /></div>
                            ) : redemptions.length === 0 ? (
                                <div className="text-center py-10 text-muted-foreground">No redemption history found using gamification profile.</div>
                            ) : (
                                <div className="space-y-3">
                                    {redemptions.map((req, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-3 border rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div className={`p-2 rounded-full ${req.status === 'completed' ? 'bg-green-100 text-green-600' : req.status === 'failed' ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-600'}`}>
                                                    <Gift className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <div className="font-medium">₹{req.amount} Gift Card</div>
                                                    <div className="text-xs text-muted-foreground flex items-center gap-2">
                                                        <Calendar className="w-3 h-3" />
                                                        {req.date ? format(new Date(req.date), 'PPP p') : 'Unknown Date'}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-bold text-yellow-600 text-sm">-{req.coins} 🪙</div>
                                                <Badge variant={req.status === 'completed' ? 'default' : 'secondary'} className={`text-[10px] mt-1 ${req.status === 'completed' ? 'bg-green-600' : ''}`}>
                                                    {req.status?.toUpperCase() || 'PENDING'}
                                                </Badge>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </ScrollArea>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
