import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ShoppingBag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function AdminPurchasesTable() {
    const [purchases, setPurchases] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPurchases();
    }, []);

    const fetchPurchases = async () => {
        setLoading(true);
        // We are deriving "purchases" from users who own premium items
        const { data, error } = await supabase
            .from('user_settings')
            .select('user_id, user_name, purchased_themes, purchased_card_themes')
            .or('purchased_themes.neq.{},purchased_card_themes.neq.{}'); // Syntax might vary for array empty check in postgrest-js

        // Alternative fetch all and filter client side if the .neq.{} syntax fails or is complex
        if (error) {
            // Fallback if query fails
            const { data: allUsers, error: allError } = await supabase.from('user_settings').select('*');
            if (!allError && allUsers) {
                const premiums = allUsers.filter((u: any) =>
                    (u.purchased_themes && u.purchased_themes.length > 0) ||
                    (u.purchased_card_themes && u.purchased_card_themes.length > 0)
                );
                setPurchases(premiums);
            } else {
                console.error("Error fetching purchases:", allError);
                toast.error("Failed to load purchase data");
            }
        } else {
            // If the OR filter works (it might not work perfectly with array emptiness depending on PG setup)
            // Let's rely on the client side filter ensuring valid data
            const premiums = (data || []).filter((u: any) =>
                (u.purchased_themes && u.purchased_themes.length > 0) ||
                (u.purchased_card_themes && u.purchased_card_themes.length > 0)
            );
            setPurchases(premiums);
        }
        setLoading(false);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>User Purchases</CardTitle>
                <CardDescription>Users who have acquired Premium Themes or Cards</CardDescription>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
                ) : (
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>User</TableHead>
                                    <TableHead>Themes Owned</TableHead>
                                    <TableHead>Cards Owned</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {purchases.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                                            No premium purchases found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    purchases.map((p) => (
                                        <TableRow key={p.user_id}>
                                            <TableCell className="font-medium">{p.user_name || "Anonymous"}</TableCell>
                                            <TableCell>
                                                <div className="flex flex-wrap gap-1">
                                                    {p.purchased_themes?.map((t: string) => (
                                                        <Badge key={t} variant="outline" className="text-xs">{t}</Badge>
                                                    ))}
                                                    {(!p.purchased_themes || p.purchased_themes.length === 0) && <span className="text-muted-foreground text-xs">-</span>}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-wrap gap-1">
                                                    {p.purchased_card_themes?.map((t: string) => (
                                                        <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>
                                                    ))}
                                                    {(!p.purchased_card_themes || p.purchased_card_themes.length === 0) && <span className="text-muted-foreground text-xs">-</span>}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge className="bg-emerald-500">Premium</Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
