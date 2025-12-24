
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface CreateFamilyDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onFamilyCreated: () => void;
}

export function CreateFamilyDialog({ open, onOpenChange, onFamilyCreated }: CreateFamilyDialogProps) {
    const { user } = useAuth();
    const [name, setName] = useState("");
    const [loading, setLoading] = useState(false);

    const handleCreate = async () => {
        if (!name.trim()) return;
        setLoading(true);

        try {
            // Generate a random simple code
            const shareCode = `FAM-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

            // 1. Create Family
            const { data: family, error: createError } = await supabase
                .from('families')
                .insert({
                    name: name.trim(),
                    created_by: user?.id,
                    share_code: shareCode
                })
                .select()
                .single();

            if (createError) throw createError;

            // 2. Add Creator as Admin
            const { error: memberError } = await supabase
                .from('family_members')
                .insert({
                    family_id: family.id,
                    user_id: user?.id,
                    role: 'admin',
                    visibility_level: 'full'
                });

            if (memberError) throw memberError;

            toast.success("Family created successfully!");
            onFamilyCreated();
            onOpenChange(false);
        } catch (error: any) {
            console.error("Error creating family:", error);
            toast.error(error.message || "Failed to create family");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create your Family</DialogTitle>
                    <DialogDescription>
                        Create a space to track expenses together. You'll be the admin.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Family Name</Label>
                        <Input
                            id="name"
                            placeholder="e.g. The Smiths"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleCreate} disabled={loading || !name.trim()}>
                        {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Create Family
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
