import {
    createContext,
    useContext,
    useEffect,
    useState,
    type ReactNode,
} from "react";
import {
    auth,
    isFirebaseConfigured,
    onAuthStateChanged,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    signOut,
    type User,
} from "@/lib/firebase";
import { migrateFromLocalStorage } from "@/lib/db";

interface AuthContextType {
    user: User | null;
    userId: string;
    loading: boolean;
    isConfigured: boolean;
    loginWithGoogle: () => Promise<void>;
    loginWithEmail: (email: string, password: string) => Promise<void>;
    registerWithEmail: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Offline/demo user for when Firebase is not configured
const OFFLINE_USER_ID = "local-user";

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    // If Firebase is not configured, use offline mode
    const effectiveUserId = isFirebaseConfigured
        ? (user?.uid ?? "")
        : OFFLINE_USER_ID;

    useEffect(() => {
        if (!isFirebaseConfigured || !auth) {
            // No Firebase — run in offline mode immediately
            setLoading(false);
            // Migrate any old localStorage data
            migrateFromLocalStorage(OFFLINE_USER_ID).catch(console.error);
            return;
        }

        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            setUser(firebaseUser);

            if (firebaseUser) {
                try {
                    const didMigrate = await migrateFromLocalStorage(firebaseUser.uid);
                    if (didMigrate) {
                        console.log("Migrated data from localStorage to IndexedDB");
                    }
                } catch (err) {
                    console.error("Migration error:", err);
                }
            }

            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const loginWithGoogle = async () => {
        await signInWithGoogle();
    };

    const loginWithEmail = async (email: string, password: string) => {
        await signInWithEmail(email, password);
    };

    const registerWithEmail = async (email: string, password: string) => {
        await signUpWithEmail(email, password);
    };

    const logout = async () => {
        await signOut();
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                userId: effectiveUserId,
                loading,
                isConfigured: isFirebaseConfigured,
                loginWithGoogle,
                loginWithEmail,
                registerWithEmail,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within AuthProvider");
    return ctx;
}
