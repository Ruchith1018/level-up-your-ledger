import { createContext, useContext, useEffect, useState } from "react";
import { Session, User, AuthError } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

interface AuthContextType {
    session: Session | null;
    user: User | null;
    loading: boolean;
    signOut: () => Promise<{ error: AuthError | null }>;
}

const AuthContext = createContext<AuthContextType>({
    session: null,
    user: null,
    loading: true,
    signOut: async () => ({ error: null }),
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Get initial session and verify user exists
        const initializeAuth = async () => {
            try {
                // First get the session to see if we have a token
                const { data: { session } } = await supabase.auth.getSession();

                if (session) {
                    // Critical: Verify the user actually exists on the server
                    // getSession() just checks the local JWT expiry, which might still be valid for a deleted user
                    const { data: { user }, error } = await supabase.auth.getUser();

                    if (error || !user) {
                        // User deleted or invalid
                        console.log("User invalid or deleted, signing out");
                        await supabase.auth.signOut();
                        setSession(null);
                        setUser(null);
                    } else {
                        setSession(session);
                        setUser(user);
                    }
                } else {
                    setSession(null);
                    setUser(null);
                }
            } catch (error) {
                console.error("Auth initialization error:", error);
                setSession(null);
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        initializeAuth();

        // Listen for changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const signOut = async () => {
        return await supabase.auth.signOut();
    };

    return (
        <AuthContext.Provider value={{ session, user, loading, signOut }}>
            {children}
        </AuthContext.Provider>
    );
};
