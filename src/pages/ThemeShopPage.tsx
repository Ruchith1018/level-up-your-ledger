import { useEffect } from "react";
import { ThemeShop } from "@/components/shop/ThemeShop";
import { RedeemMoney } from "@/components/shop/RedeemMoney";
import { CardShop } from "@/components/shop/CardShop";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useGamification } from "@/contexts/GamificationContext";

export default function ThemeShopPage() {
    const navigate = useNavigate();
    const { isLoading, refreshGamification } = useGamification();

    useEffect(() => {
        refreshGamification();
    }, []);

    return (
        <div className="min-h-screen bg-background">
            <header className="h-[88px] border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10 flex items-center transition-all duration-200">
                <div className="container mx-auto px-4">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")} className="flex md:hidden">
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold">Shop & Redeem</h1>
                            <p className="text-sm text-muted-foreground">Spend your Earned coins</p>
                        </div>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-6 space-y-6 max-w-4xl pb-24">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-150px)] space-y-6">
                        <div className="relative">
                            <div className="absolute inset-0 bg-yellow-500/20 blur-xl rounded-full animate-pulse" />
                            <img
                                src="/assets/token.png"
                                alt="Loading..."
                                className="w-24 h-24 animate-[spin_2s_linear_infinite] relative z-10 object-contain"
                            />
                        </div>
                        <p className="text-muted-foreground animate-pulse font-medium">Loading shop...</p>
                    </div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <Tabs defaultValue="cards" className="space-y-6">
                            <TabsList className="grid w-full grid-cols-3">

                                <TabsTrigger value="cards">
                                    BudGlio Cards
                                </TabsTrigger>
                                <TabsTrigger value="themes">
                                    BudGlio Themes
                                </TabsTrigger>
                                <TabsTrigger value="redeem">
                                    Gift Cards
                                </TabsTrigger>
                            </TabsList>



                            <TabsContent value="cards" className="space-y-4">
                                <CardShop />
                            </TabsContent>

                            <TabsContent value="themes" className="space-y-4">
                                <ThemeShop />
                            </TabsContent>

                            <TabsContent value="redeem" className="space-y-4">
                                <RedeemMoney />
                            </TabsContent>
                        </Tabs>
                    </motion.div>
                )}
            </main>
        </div>
    );
}
