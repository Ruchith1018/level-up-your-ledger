
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, Loader2, Reply, X, Pencil, MoreVertical, Trash2, Undo2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { encryptMessage, decryptMessage } from '@/lib/encryption';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface FamilyChatModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    familyId: string | undefined;
    members: any[];
}

interface ChatMessage {
    id: string;
    family_id: string;
    user_id: string;
    message: string;
    created_at: string;
    reply_to_id?: string;
    is_deleted?: boolean;
}

export function FamilyChatModal({ open, onOpenChange, familyId, members }: FamilyChatModalProps) {
    const { user } = useAuth();
    const isAdmin = members.find(m => m.user_id === user?.id)?.role === 'admin';
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
    const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
    const [editingMessage, setEditingMessage] = useState<ChatMessage | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const typingTimeoutRef = useRef<any>(null);

    useEffect(() => {
        if (open && familyId && user) {
            fetchMessages();
            const channel = supabase
                .channel(`family-chat-${familyId}`)
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'family_chats',
                        filter: `family_id=eq.${familyId}`
                    },
                    (payload) => {
                        const newMsg = payload.new as ChatMessage;
                        // Decrypt incoming message
                        const decryptedMsg = {
                            ...newMsg,
                            message: decryptMessage(newMsg.message, familyId)
                        };
                        setMessages(prev => [...prev, decryptedMsg]);

                        setTypingUsers(prev => {
                            const newSet = new Set(prev);
                            newSet.delete(newMsg.user_id);
                            return newSet;
                        });
                    }
                )
                .on(
                    'postgres_changes',
                    {
                        event: 'UPDATE',
                        schema: 'public',
                        table: 'family_chats',
                        filter: `family_id=eq.${familyId}`
                    },
                    (payload) => {
                        const updatedMsg = payload.new as ChatMessage;
                        const decryptedMsg = {
                            ...updatedMsg,
                            message: decryptMessage(updatedMsg.message, familyId)
                        };
                        setMessages(prev => prev.map(msg => msg.id === updatedMsg.id ? decryptedMsg : msg));
                    }
                )
                .on(
                    'broadcast',
                    { event: 'typing' },
                    (payload) => {
                        const { userId, isTyping } = payload.payload;
                        if (userId === user.id) return; // Ignore self

                        setTypingUsers(prev => {
                            const newSet = new Set(prev);
                            if (isTyping) {
                                newSet.add(userId);
                            } else {
                                newSet.delete(userId);
                            }
                            return newSet;
                        });
                    }
                )
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        }
    }, [open, familyId, user]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, typingUsers]);

    const fetchMessages = async () => {
        if (!familyId) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('family_chats')
                .select('*')
                .eq('family_id', familyId)
                .order('created_at', { ascending: true });

            if (error) throw error;

            // Decrypt messages
            const decryptedMessages = (data || []).map(msg => ({
                ...msg,
                message: decryptMessage(msg.message, familyId)
            }));

            setMessages(decryptedMessages);
        } catch (error) {
            console.error("Error fetching chats:", error);
            toast.error("Failed to load chat history");
        } finally {
            setLoading(false);
        }
    };

    const handleTyping = async () => {
        if (!familyId || !user) return;

        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        await supabase.channel(`family-chat-${familyId}`).send({
            type: 'broadcast',
            event: 'typing',
            payload: { userId: user.id, isTyping: true }
        });

        typingTimeoutRef.current = setTimeout(async () => {
            await supabase.channel(`family-chat-${familyId}`).send({
                type: 'broadcast',
                event: 'typing',
                payload: { userId: user.id, isTyping: false }
            });
        }, 3000);
    };

    const handleSendMessage = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!newMessage.trim() || !familyId || !user) return;

        setSending(true);
        try {
            const encryptedContent = encryptMessage(newMessage.trim(), familyId);

            if (editingMessage) {
                const { error } = await supabase
                    .from('family_chats')
                    .update({ message: encryptedContent })
                    .eq('id', editingMessage.id);

                if (error) throw error;
                setEditingMessage(null);
            } else {
                const { error } = await supabase
                    .from('family_chats')
                    .insert({
                        family_id: familyId,
                        user_id: user.id,
                        message: encryptedContent,
                        reply_to_id: replyingTo?.id
                    });

                if (error) throw error;
                setReplyingTo(null);
            }

            setNewMessage("");
        } catch (error) {
            console.error("Error sending/updating message:", error);
            toast.error("Failed to send message");
        } finally {
            setSending(false);
        }
    };

    const handleDeleteMessage = async (messageId: string) => {
        if (!familyId) return;
        try {
            const { error } = await supabase
                .from('family_chats')
                .update({
                    is_deleted: true
                })
                .eq('id', messageId);

            if (error) throw error;
        } catch (error) {
            console.error("Error deleting message:", error);
            toast.error("Failed to delete message");
        }
    };

    const handleUndoDelete = async (messageId: string) => {
        if (!familyId) return;
        try {
            const { error } = await supabase
                .from('family_chats')
                .update({
                    is_deleted: false
                })
                .eq('id', messageId);

            if (error) throw error;
        } catch (error) {
            console.error("Error undoing delete:", error);
            toast.error("Failed to restore message");
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] h-[600px] flex flex-col p-0 gap-0">
                <DialogHeader className="px-6 py-4 border-b">
                    <DialogTitle>Family Chat</DialogTitle>
                </DialogHeader>

                <ScrollArea className="flex-1 p-4">
                    {loading ? (
                        <div className="flex justify-center items-center h-full">
                            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : messages.length === 0 && typingUsers.size === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground space-y-2 opacity-50 mt-20">
                            <Send className="w-12 h-12" />
                            <p>No messages yet. Start the conversation!</p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-4">
                            {messages.map((msg) => {
                                const isMe = msg.user_id === user?.id;
                                const senderProfile = members.find(m => m.user_id === msg.user_id)?.profile;

                                // Find replied message if exists
                                const repliedMsg = msg.reply_to_id ? messages.find(m => m.id === msg.reply_to_id) : null;
                                const repliedProfile = repliedMsg ? members.find(m => m.user_id === repliedMsg.user_id)?.profile : null;

                                return (
                                    <div
                                        key={msg.id}
                                        className={`flex gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'} group`}
                                    >
                                        <Avatar className="w-8 h-8 border">
                                            <AvatarImage src={senderProfile?.avatar_url} />
                                            <AvatarFallback>{senderProfile?.name?.[0] || 'U'}</AvatarFallback>
                                        </Avatar>
                                        <div className={`flex flex-col max-w-[70%] ${isMe ? 'items-end' : 'items-start'}`}>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-xs font-medium text-muted-foreground">
                                                    {senderProfile?.name || 'Unknown User'}
                                                </span>
                                                <span className="text-[10px] text-muted-foreground/70">
                                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>

                                            {/* Reply Context Bubble */}
                                            {repliedMsg && (
                                                <div
                                                    className={`mb-1 text-xs px-3 py-2 rounded-lg bg-muted/80 border-l-2 border-primary/50 text-muted-foreground truncate max-w-full cursor-pointer opacity-80 hover:opacity-100 transition-opacity`}
                                                    onClick={() => {
                                                        const el = document.getElementById(`msg-${repliedMsg.id}`);
                                                        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                                    }}
                                                >
                                                    <span className="font-semibold block text-[10px] mb-0.5">
                                                        Replying to {repliedProfile?.name || 'Unknown'}
                                                    </span>
                                                    {repliedMsg.message}
                                                </div>
                                            )}

                                            <div className="flex items-center gap-2 group-hover:gap-1 transition-all">
                                                {!isMe && (
                                                    <div className="order-last">
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-6 w-6 hover:bg-transparent text-muted-foreground hover:text-foreground hover:[&_svg]:stroke-[3]"
                                                                >
                                                                    <MoreVertical className="h-4 w-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="start">
                                                                {!msg.is_deleted && (
                                                                    <DropdownMenuItem onClick={() => setReplyingTo(msg)}>
                                                                        Reply
                                                                    </DropdownMenuItem>
                                                                )}
                                                                {isAdmin && !msg.is_deleted && (
                                                                    <DropdownMenuItem
                                                                        onClick={() => handleDeleteMessage(msg.id)}
                                                                        className="text-destructive focus:text-destructive"
                                                                    >
                                                                        <Trash2 className="w-4 h-4 mr-2" />
                                                                        Delete
                                                                    </DropdownMenuItem>
                                                                )}
                                                                {isAdmin && msg.is_deleted && (
                                                                    <DropdownMenuItem
                                                                        onClick={() => handleUndoDelete(msg.id)}
                                                                    >
                                                                        <Undo2 className="w-4 h-4 mr-2" />
                                                                        Undo Delete
                                                                    </DropdownMenuItem>
                                                                )}
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </div>
                                                )}

                                                <div
                                                    id={`msg-${msg.id}`}
                                                    className={`px-3 py-2 rounded-lg text-sm shadow-sm ${isMe
                                                        ? 'bg-primary text-primary-foreground rounded-tr-none'
                                                        : 'bg-muted rounded-tl-none'
                                                        } ${msg.is_deleted ? 'opacity-70 italic' : ''}`}
                                                >
                                                    {msg.is_deleted ? (
                                                        <span className="flex items-center gap-1.5 min-h-[20px]">
                                                            admin deleted this msg
                                                        </span>
                                                    ) : (
                                                        msg.message
                                                    )}
                                                </div>

                                                {isMe && (
                                                    <div className="order-first">
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-6 w-6 hover:bg-transparent text-muted-foreground hover:text-foreground hover:[&_svg]:stroke-[3]"
                                                                >
                                                                    <MoreVertical className="h-4 w-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                {!msg.is_deleted && (
                                                                    <DropdownMenuItem onClick={() => setReplyingTo(msg)}>
                                                                        Reply
                                                                    </DropdownMenuItem>
                                                                )}
                                                                {!msg.is_deleted && (
                                                                    <DropdownMenuItem onClick={() => {
                                                                        setEditingMessage(msg);
                                                                        setNewMessage(msg.message);
                                                                        setReplyingTo(null);
                                                                    }}>
                                                                        Edit
                                                                    </DropdownMenuItem>
                                                                )}
                                                                {isAdmin && !msg.is_deleted && (
                                                                    <DropdownMenuItem
                                                                        onClick={() => handleDeleteMessage(msg.id)}
                                                                        className="text-destructive focus:text-destructive"
                                                                    >
                                                                        <Trash2 className="w-4 h-4 mr-2" />
                                                                        Delete
                                                                    </DropdownMenuItem>
                                                                )}
                                                                {isAdmin && msg.is_deleted && (
                                                                    <DropdownMenuItem
                                                                        onClick={() => handleUndoDelete(msg.id)}
                                                                    >
                                                                        <Undo2 className="w-4 h-4 mr-2" />
                                                                        Undo Delete
                                                                    </DropdownMenuItem>
                                                                )}
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}


                            {/* Typing Indicator */}
                            {typingUsers.size > 0 && Array.from(typingUsers).map(typingUserId => {
                                const typerProfile = members.find(m => m.user_id === typingUserId)?.profile;
                                return (
                                    <div key={typingUserId} className="flex gap-2 flex-row animate-in fade-in slide-in-from-bottom-2">
                                        <Avatar className="w-8 h-8 border">
                                            <AvatarImage src={typerProfile?.avatar_url} />
                                            <AvatarFallback>{typerProfile?.name?.[0] || 'U'}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex flex-col items-start justify-center">
                                            <div className="bg-muted px-3 py-2 rounded-lg rounded-tl-none text-xs text-muted-foreground flex items-center gap-1">
                                                <span>{typerProfile?.name || 'Someone'} is typing</span>
                                                <span className="flex gap-0.5">
                                                    <span className="w-1 h-1 bg-current rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                                    <span className="w-1 h-1 bg-current rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                                    <span className="w-1 h-1 bg-current rounded-full animate-bounce"></span>
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}

                            <div ref={scrollRef} />
                        </div>
                    )}
                </ScrollArea>

                <div className="border-t mt-auto bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                    {(replyingTo || editingMessage) && (
                        <div className="flex items-center justify-between px-4 py-2 bg-muted/50 border-b text-xs">
                            <div className="flex flex-col truncate">
                                <span className="font-semibold text-muted-foreground">
                                    {editingMessage ? 'Editing Message' : `Replying to ${members.find(m => m.user_id === replyingTo?.user_id)?.profile?.name || 'Unknown'}`}
                                </span>
                                <span className="truncate opacity-70 max-w-[300px]">
                                    {editingMessage ? editingMessage.message : replyingTo?.message}
                                </span>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => {
                                    setReplyingTo(null);
                                    setEditingMessage(null);
                                    setNewMessage("");
                                }}
                            >
                                <X className="h-3 w-3" />
                            </Button>
                        </div>
                    )}
                    <div className="p-4">
                        <form onSubmit={handleSendMessage} className="flex gap-2">
                            <Input
                                placeholder="Type a message..."
                                value={newMessage}
                                onChange={(e) => {
                                    setNewMessage(e.target.value);
                                    handleTyping();
                                }}
                                disabled={sending}
                                className="flex-1"
                            />
                            <Button type="submit" size="icon" disabled={sending || !newMessage.trim()}>
                                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                            </Button>
                        </form>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

