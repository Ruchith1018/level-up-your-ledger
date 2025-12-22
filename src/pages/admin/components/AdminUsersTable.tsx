import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Search, User, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export default function AdminUsersTable() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<any>(null);
    const [adminPassword, setAdminPassword] = useState("");

    const [isDeleting, setIsDeleting] = useState(false);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        // Fetch users with email securely using RPC
        const { data, error } = await supabase.rpc('get_users_with_email');

        if (error) {
            console.error("Error fetching users:", error);
            toast.error("Failed to load users data");
        } else {
            setUsers(data || []);
        }
        setLoading(false);
    };

    const handleDeleteClick = (user: any) => {
        setUserToDelete(user);
        setAdminPassword("");
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!userToDelete) return;

        if (adminPassword !== "Ruchith@1010") {
            toast.error("Incorrect Admin Password");
            return;
        }

        setIsDeleting(true);
        const { error } = await supabase.rpc('delete_user_by_admin', { target_user_id: userToDelete.user_id });

        if (error) {
            console.error("Delete Error:", error);
            toast.error(`Failed to delete user: ${error.message}`);
        } else {
            toast.success("User deleted successfully");
            setUsers(prev => prev.filter(u => u.user_id !== userToDelete.user_id));
            setDeleteDialogOpen(false);
        }
        setIsDeleting(false);
    };

    const handleToggleTerms = async (userId: string, currentStatus: boolean) => {
        setActionLoading(userId);
        // Use RPC to update terms securely
        const { error } = await supabase.rpc('update_user_terms_by_admin', {
            target_user_id: userId,
            new_status: !currentStatus
        });

        if (error) {
            console.error("Terms Toggle Error:", error);
            toast.error(`Update failed: ${error.message}`);
        } else {
            toast.success(`Terms ${!currentStatus ? 'Accepted' : 'Revoked'}`);
            setUsers(prev => prev.map(u => u.user_id === userId ? { ...u, has_accepted_terms: !currentStatus } : u));
        }
        setActionLoading(null);
    };

    const handleToggleOnboarding = async (userId: string, currentStatus: boolean) => {
        setActionLoading(userId);
        // Use RPC to update onboarding securely
        const { error } = await supabase.rpc('update_user_onboarding_by_admin', {
            target_user_id: userId,
            new_status: !currentStatus
        });

        if (error) {
            console.error("Onboarding Toggle Error:", error);
            toast.error(`Update failed: ${error.message}`);
        } else {
            toast.success(`Onboarding ${!currentStatus ? 'Completed' : 'Reset'}`);
            setUsers(prev => prev.map(u => u.user_id === userId ? { ...u, has_completed_onboarding: !currentStatus } : u));
        }
        setActionLoading(null);
    };

    const filteredUsers = users.filter((u: any) =>
        u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.user_id?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>Registered Users</CardTitle>
                    <CardDescription>View all users in the system</CardDescription>
                    <div className="pt-4">
                        <div className="relative">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by email..."
                                className="pl-8"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
                    ) : (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[80px]">Avatar</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Terms Accepted</TableHead>
                                        <TableHead>Currency</TableHead>
                                        <TableHead>Onboarded</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredUsers.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                                                No users found.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredUsers.map((user) => (
                                            <TableRow key={user.user_id || Math.random()}>
                                                <TableCell>
                                                    <Avatar>
                                                        <AvatarImage src={user.profile_image} />
                                                        <AvatarFallback><User className="w-4 h-4" /></AvatarFallback>
                                                    </Avatar>
                                                </TableCell>
                                                <TableCell className="font-medium">{user.email || "No Email"}</TableCell>
                                                <TableCell>
                                                    <div className="flex items-center space-x-2">
                                                        <Switch
                                                            checked={user.has_accepted_terms}
                                                            onCheckedChange={() => handleToggleTerms(user.user_id, user.has_accepted_terms)}
                                                            disabled={actionLoading === user.user_id}
                                                        />
                                                        <span className="text-xs text-muted-foreground">{user.has_accepted_terms ? "Yes" : "No"}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>{user.currency}</TableCell>
                                                <TableCell>
                                                    <div className="flex items-center space-x-2">
                                                        <Switch
                                                            checked={user.has_completed_onboarding}
                                                            onCheckedChange={() => handleToggleOnboarding(user.user_id, user.has_completed_onboarding)}
                                                            disabled={actionLoading === user.user_id}
                                                        />
                                                        <span className="text-xs text-muted-foreground">{user.has_completed_onboarding ? "Yes" : "No"}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                                        onClick={() => handleDeleteClick(user)}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
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

            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete User</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete user <strong>{userToDelete?.email}</strong>? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="admin-password">Enter Admin Password to confirm</Label>
                            <Input
                                id="admin-password"
                                type="password"
                                value={adminPassword}
                                onChange={(e) => setAdminPassword(e.target.value)}
                                placeholder="Admin Password"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteConfirm}
                            disabled={isDeleting || !adminPassword}
                        >
                            {isDeleting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
                            Delete User
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
