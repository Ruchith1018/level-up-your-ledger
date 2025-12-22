import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ShoppingBag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

import UserDetailDialog from "./UserDetailDialog";

export default function AdminPurchasesTable() {
    const [purchases, setPurchases] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState<any>(null);

    useEffect(() => {
        fetchPurchases();
    }, []);

    const fetchPurchases = async () => {
        setLoading(true);

        // Fetch secure details using the new RPC function
        const { data, error } = await supabase.rpc('get_premium_users_details');

        if (error) {
            console.error("Error fetching purchases:", error);
            toast.error(`Failed to load data: ${error.message}`);
        } else {
            setPurchases(data || []);
        }
        setLoading(false);
    };

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>User Purchases</CardTitle>
                    <CardDescription>Users who have acquired Premium Themes or Cards. Click a user to view details.</CardDescription>
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
                                        <TableHead>Email</TableHead>
                                        <TableHead>ID</TableHead>
                                        <TableHead>Themes Owned</TableHead>
                                        <TableHead>Cards Owned</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {purchases.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                                                No premium purchases found.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        purchases.map((p) => (
                                            <TableRow
                                                key={p.user_id}
                                                className="cursor-pointer hover:bg-muted/50 transition-colors"
                                                onClick={() => setSelectedUser(p)}
                                            >
                                                <TableCell className="font-medium">{p.user_name || "Anonymous"}</TableCell>
                                                <TableCell className="text-muted-foreground text-xs">{p.email}</TableCell>
                                                <TableCell className="font-mono text-xs text-muted-foreground">{p.referral_id || "-"}</TableCell>
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

            <UserDetailDialog
                isOpen={!!selectedUser}
                onClose={() => setSelectedUser(null)}
                user={selectedUser}
            />
        </>
    );
}
