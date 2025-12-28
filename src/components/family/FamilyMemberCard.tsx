import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MoreVertical, Shield, User, Eye, Wallet } from "lucide-react";
import { FamilyMember } from "@/types";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { motion } from "framer-motion";

interface FamilyMemberCardProps {
    member: FamilyMember;
    isCurrentUserAdmin: boolean;
    onUpdateRole?: (memberId: string, newRole: string) => void;
    onRemove?: (memberId: string) => void;
}

export function FamilyMemberCard({ member, isCurrentUserAdmin, onUpdateRole, onRemove }: FamilyMemberCardProps) {
    const roleIcon = {
        admin: <Shield className="w-3 h-3" />,
        member: <User className="w-3 h-3" />,
        viewer: <Eye className="w-3 h-3" />
    };

    const roleColor = {
        admin: "bg-purple-500/10 text-purple-500 hover:bg-purple-500/20",
        member: "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20",
        viewer: "bg-gray-500/10 text-gray-500 hover:bg-gray-500/20"
    };

    const initials = member.profile?.name
        ? member.profile.name.substring(0, 2).toUpperCase()
        : "U";

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
        >
            <Card className="overflow-hidden">
                <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10 border-2 border-background">
                            <AvatarImage src={member.profile?.avatar_url} />
                            <AvatarFallback>{initials}</AvatarFallback>
                        </Avatar>

                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-sm">
                                    {member.profile?.name || "Family Member"}
                                </h3>
                                <Badge variant="secondary" className={`gap-1 h-5 text-[10px] px-1.5 ${roleColor[member.role]}`}>
                                    {roleIcon[member.role]}
                                    {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                                </Badge>
                            </div>
                        </div>
                    </div>

                    {isCurrentUserAdmin && member.role !== 'admin' && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreVertical className="w-4 h-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => onUpdateRole?.(member.user_id, 'admin')}>
                                    Transfer Admin Rights
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => onUpdateRole?.(member.user_id, 'member')}>
                                    Make Member
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => onUpdateRole?.(member.user_id, 'viewer')}>
                                    Make Viewer
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-red-500" onClick={() => onRemove?.(member.user_id)}>
                                    Remove from Family
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </CardContent>
            </Card>
        </motion.div>
    );
}
