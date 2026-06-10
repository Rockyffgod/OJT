import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Profile } from '../lib/types';

export interface AuthUser {
  id: string;
  email: string;
  account_type?: string;
}

export interface AuthSession {
  access_token: string;
  user: AuthUser;
}

interface AuthState {
  session: AuthSession | null;
  user: AuthUser | null;
  profile: Profile | null;
  djangoToken: string | null;
  loading: boolean;
  isInitialized: boolean;
  setAuth: (session: AuthSession | null, user: AuthUser | null) => void;
  setProfile: (profile: Profile | null) => void;
  setDjangoToken: (token: string | null) => void;
  setLoading: (loading: boolean) => void;
  setInitialized: (initialized: boolean) => void;
  fetchProfile: (userId: string) => Promise<void>;
  logout: () => Promise<void>;
  reset: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      session: null,
      user: null,
      profile: null,
      djangoToken: null,
      loading: true,
      isInitialized: false,
      setAuth: (session, user) => set({ session, user }),
      setProfile: (profile) => set({ profile }),
      setDjangoToken: (djangoToken) => set({ djangoToken }),
      setLoading: (loading) => set({ loading }),
      setInitialized: (isInitialized) => set({ isInitialized }),
      fetchProfile: async (userId: string) => {
        try {
          const token = get().djangoToken;
          if (!token) return;
          
          const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/accounts/me/`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          if (!res.ok) throw new Error('Failed to fetch user me');
          const userData = await res.json();
          
          const mappedProfile: Profile = {
            id: userData.id,
            full_name: userData.full_name || `${userData.first_name} ${userData.last_name}`.trim() || userData.username,
            full_name_nepali: userData.full_name_nepali,
            username: userData.username,
            phone: userData.phone,
            email: userData.email,
            avatar_url: userData.profile_photo || undefined,
            account_type: userData.account_type,
            is_phone_verified: userData.is_phone_verified,
            is_email_verified: userData.is_email_verified,
            city: userData.city,
            created_at: userData.date_joined,
          };

          // If provider, fetch extra details from my-profile
          if (userData.account_type === 'PROVIDER') {
            try {
              const provRes = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/services/my-profile/`, {
                headers: {
                  'Authorization': `Bearer ${token}`
                }
              });
              if (provRes.ok) {
                const provData = await provRes.json();
                mappedProfile.karma_points = provData.karma_points;
                mappedProfile.karma_level = provData.karma_level;
                mappedProfile.verification_status = provData.verification_status;
                mappedProfile.is_verified = provData.verification_status === 'APPROVED' || provData.verification_status === 'VERIFIED';
              }
            } catch (e) {
              console.warn('Failed to fetch provider details:', e);
            }
          }
          
          set({ profile: mappedProfile });
        } catch (error) {
          console.error('Failed to fetch profile:', error);
          set({ profile: null });
        }
      },
      logout: async () => {
        set({
          session: null,
          user: null,
          profile: null,
          djangoToken: null,
          loading: false,
          isInitialized: false,
        });
      },
      reset: () =>
        set({
          session: null,
          user: null,
          profile: null,
          djangoToken: null,
          loading: false,
          isInitialized: false,
        }),
    }),
    {
      name: 'auth-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        session: state.session,
        user: state.user,
        djangoToken: state.djangoToken,
        profile: state.profile,
      }),
    }
  )
);
