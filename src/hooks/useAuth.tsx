import { useState, useEffect, createContext, useContext, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';
import { toast } from 'sonner';
import type { Profile, Wallet, AppRole } from '@/lib/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  wallet: Wallet | null;
  role: AppRole | null;
  isLoading: boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  refreshWallet: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);

  // ALWAYS start loading as true to avoid redirecting before Supabase fetch completes
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserData = useCallback(async (userId: string, allowBootstrap = true) => {
    try {
      const [profileResult, walletResult, roleResult] = await Promise.all([
        supabase.from('profiles').select('*').eq('user_id', userId).maybeSingle(),
        supabase.from('wallets').select('*').eq('user_id', userId).maybeSingle(),
        supabase.from('user_roles').select('role').eq('user_id', userId),
      ]);

      // A freshly created account may not have its profile/wallet/role rows yet.
      // Create them once, then re-read.
      if (allowBootstrap && (!profileResult.data || !walletResult.data || !roleResult.data)) {
        const { error: bootstrapError } = await supabase.rpc('bootstrap_current_user', {
          p_full_name: null,
        });
        if (!bootstrapError) {
          await fetchUserData(userId, false);
          return;
        }
        console.error('Account bootstrap failed:', bootstrapError);
      }

      if (profileResult.data) setProfile(profileResult.data as unknown as Profile);
      if (walletResult.data) setWallet(walletResult.data as Wallet);
      if (roleResult.data) setRole(roleResult.data.role as AppRole);
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  }, []);


  // Set up realtime subscription for wallet updates + ban enforcement
  useEffect(() => {
    if (!user) return;

    const walletChannel = supabase
      .channel(`wallet-updates-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'wallets',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.new && typeof payload.new === 'object') {
            setWallet(payload.new as Wallet);
          }
        }
      )
      .subscribe();

    // Watch profile for ban flag — force sign-out immediately if admin bans this user
    const profileChannel = supabase
      .channel(`profile-ban-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `user_id=eq.${user.id}`,
        },
        async (payload) => {
          const next = payload.new as any;
          if (next?.is_banned) {
            toast.error('You have been banned. Please contact admin.');
            try { await supabase.auth.signOut(); } catch {}
            setProfile(null);
            setWallet(null);
            setRole(null);
          } else if (next) {
            setProfile(next as unknown as Profile);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(walletChannel);
      supabase.removeChannel(profileChannel);
    };
  }, [user?.id]);

  useEffect(() => {
    let isMounted = true;
    let initialLoadDone = false;

    // Listener for ONGOING auth changes - does NOT control isLoading
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!isMounted) return;
        setSession(session);
        setUser(session?.user ?? null);

        // Only fetch user data on ONGOING changes (not initial)
        // Initial load is handled by initializeAuth below
        if (initialLoadDone) {
          if (session?.user) {
            fetchUserData(session.user.id);
          } else {
            setProfile(null);
            setWallet(null);
            setRole(null);
          }
        }
      }
    );

    // INITIAL load - controls isLoading, fetches data ONCE
    // Has a 10-second safety timeout to prevent infinite freeze
    const initializeAuth = async () => {
      try {
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Session fetch timed out')), 10000)
        );

        const result = await Promise.race([sessionPromise, timeoutPromise]) as any;
        if (!isMounted) return;

        const session = result?.data?.session ?? null;
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          // Fetch user data with its own timeout
          try {
            await Promise.race([
              fetchUserData(session.user.id),
              new Promise((_, reject) => setTimeout(() => reject(new Error('Data fetch timed out')), 10000))
            ]);
          } catch (e) {
            console.warn('User data fetch timed out, will retry on next action');
          }
        }
      } catch (err) {
        console.warn('initializeAuth timed out or failed:', err);
        // Still allow the page to render (show login form)
      } finally {
        if (isMounted) {
          setIsLoading(false);
          initialLoadDone = true;
        }
      }
    };

    initializeAuth();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [fetchUserData]);

  const signIn = async (email: string, password: string) => {
    console.log('--- useAuth: signIn started ---');
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        console.error('--- useAuth: signIn error ---', error.message);
        return { error: error as Error };
      }

      // Ban check — reject login if profile is banned
      if (data?.user) {
        const { data: prof } = await supabase
          .from('profiles')
          .select('is_banned')
          .eq('user_id', data.user.id)
          .single();
        if (prof && (prof as any).is_banned) {
          await supabase.auth.signOut();
          return { error: new Error('You are banned, please contact admin.') };
        }
      }

      console.log('--- useAuth: signIn success ---');
      return { error: null };
    } catch (error) {
      console.error('--- useAuth: signIn catch ---', error);
      return { error: error as Error };
    }
  };

  const signUp = async (email: string, password: string, fullName?: string) => {
    console.log('--- useAuth: signUp started ---');
    try {
      const normalizedEmail = email.trim().toLowerCase();
      const { error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: { full_name: fullName || '' },
        },
      });

      if (error) {
        console.error('--- useAuth: signUp error ---', error.message);
        return { error };
      }

      // Auto-confirm is enabled, so session is created immediately.
      // If not yet signed in, attempt password sign-in.
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        const signInRes = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        });
        if (signInRes.error) {
          return { error: signInRes.error };
        }
      }

      // Create the profile / wallet / role rows for the brand new account.
      const { error: bootstrapError } = await supabase.rpc('bootstrap_current_user', {
        p_full_name: fullName || null,
      });
      if (bootstrapError) {
        console.error('Account bootstrap failed:', bootstrapError);
      }

      console.log('--- useAuth: signUp success ---');
      return { error: null };

    } catch (error) {
      console.error('--- useAuth: signUp catch ---', error);
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setProfile(null);
      setWallet(null);
      setRole(null);
    } catch (error) {
      console.error('Sign out error:', error);
      // Still clear local state even if sign out fails
      setProfile(null);
      setWallet(null);
      setRole(null);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      if (data) setProfile(data as unknown as Profile);
    }
  };

  const refreshWallet = async () => {
    if (user) {
      const { data } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', user.id)
        .single();
      if (data) setWallet(data as Wallet);
    }
  };

  const value = {
    user,
    session,
    profile,
    wallet,
    role,
    isLoading,
    isAdmin: role === 'admin',
    signIn,
    signUp,
    signOut,
    refreshProfile,
    refreshWallet,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
