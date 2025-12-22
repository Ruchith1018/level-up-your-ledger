import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut, Users, FileCheck, ShoppingBag, Database } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

import AdminUsersTable from "./components/AdminUsersTable";
import AdminReferralsTable from "./components/AdminReferralsTable";
import AdminPurchasesTable from "./components/AdminPurchasesTable";
import AdminRedemptionTable from "./components/AdminRedemptionTable";

export default function AdminDashboard() {
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        totalUsers: 0,
        pendingReferrals: 0,
        totalPurchases: 0
    });

    useEffect(() => {
        const isAuth = localStorage.getItem("admin_auth");
        if (isAuth !== "true") {
            toast.error("Unauthorized access");
            navigate("/admin");
        }

        fetchStats();
    }, [navigate]);

    const fetchStats = async () => {
        // Fetch counts securely using RPC for users (bypasses RLS)
        const { data: usersCount, error: userError } = await supabase.rpc('get_total_users');
        if (userError) console.error("Error fetching total users:", userError);

        // Fetch secure pending referrals count (excludes deleted users)
        const { data: referralsCount, error: refError } = await supabase.rpc('get_pending_referrals_count');
        if (refError) console.error("Error fetching pending referrals:", refError);

        setStats({
            totalUsers: usersCount || 0,
            pendingReferrals: referralsCount || 0,
            totalPurchases: 0 // Placeholder until we verify purchase source
        });
    };

    const handleLogout = () => {
        localStorage.removeItem("admin_auth");
        toast.info("Logged out successfully");
        navigate("/admin");
    };

    return (
        <div className="min-h-screen bg-gray-50/50 dark:bg-gray-900/50 p-6">
            <header className="flex justify-between items-center mb-8 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border">
                <div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                        Super Admin Dashboard
                    </h1>
                    <p className="text-sm text-muted-foreground">Manage users, referrals, and system data</p>
                </div>
                <Button variant="outline" className="gap-2 text-destructive hover:text-destructive" onClick={handleLogout}>
                    <LogOut className="w-4 h-4" />
                    Logout
                </Button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalUsers}</div>
                        <p className="text-xs text-muted-foreground">Registered in system</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending Referrals</CardTitle>
                        <FileCheck className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.pendingReferrals}</div>
                        <p className="text-xs text-muted-foreground">Waiting for approval</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Purchase Activity</CardTitle>
                        <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">--</div>
                        <p className="text-xs text-muted-foreground">Total purchase value</p>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="referrals" className="space-y-4">
                <TabsList className="grid w-full grid-cols-4 lg:w-[600px]">
                    <TabsTrigger value="referrals">Referrals</TabsTrigger>
                    <TabsTrigger value="users">Users</TabsTrigger>
                    <TabsTrigger value="purchases">Purchases</TabsTrigger>
                    <TabsTrigger value="redemptions">Redemptions</TabsTrigger>
                </TabsList>

                <TabsContent value="referrals" className="space-y-4">
                    <AdminReferralsTable />
                </TabsContent>

                <TabsContent value="users" className="space-y-4">
                    <AdminUsersTable />
                </TabsContent>

                <TabsContent value="purchases" className="space-y-4">
                    <AdminPurchasesTable />
                </TabsContent>

                <TabsContent value="redemptions" className="space-y-4">
                    <AdminRedemptionTable />
                </TabsContent>
            </Tabs>
        </div>
    );
}
