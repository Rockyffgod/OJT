import { useAuthStore } from '../store/authStore';

export class AuthError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'AuthError';
  }
}

export async function signUp(
  email: string,
  password: string,
  name: string,
  phone: string,
  accountType: 'CUSTOMER' | 'PROVIDER' | 'ADMIN',
  username: string
) {
  if (!email?.trim()) throw new AuthError('Email is required', 'INVALID_EMAIL');
  if (!password || password.length < 8) throw new AuthError('Password must be at least 8 characters', 'WEAK_PASSWORD');
  if (!name?.trim()) throw new AuthError('Name is required', 'INVALID_NAME');
  if (!phone?.trim()) throw new AuthError('Phone is required', 'INVALID_PHONE');
  if (!username?.trim()) throw new AuthError('Username is required', 'INVALID_USERNAME');

  const parts = name.trim().split(' ', 1);
  const firstName = parts[0] || '';
  const lastName = name.trim().substring(firstName.length).trim();

  try {
    const djangoRegisterRes = await fetch(
      `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/accounts/register/`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          password,
          phone: phone.trim(),
          account_type: accountType,
          first_name: firstName,
          last_name: lastName,
          full_name: name.trim(),
          username: username.trim(),
        }),
      }
    );
    if (!djangoRegisterRes.ok) {
      const err = await djangoRegisterRes.json().catch(() => null);
      let errMsg = 'Registration failed';
      if (err) {
        if (err.detail) {
          errMsg = err.detail;
        } else if (typeof err === 'object') {
          const messages = Object.entries(err).map(([key, val]) => {
            const valStr = Array.isArray(val) ? val.join(' ') : String(val);
            const fieldName = key.replace('_', ' ');
            return `${fieldName}: ${valStr}`;
          });
          if (messages.length > 0) {
            errMsg = messages.join('\n');
          }
        } else if (typeof err === 'string') {
          errMsg = err;
        }
      }
      throw new AuthError(errMsg, 'REGISTRATION_FAILED');
    }
    return await djangoRegisterRes.json();
  } catch (e: any) {
    if (e instanceof AuthError) throw e;
    throw new AuthError(e?.message || 'Server connection failed', 'SERVER_ERROR');
  }
}

export async function signIn(email: string, password: string) {
  if (!email?.trim()) throw new AuthError('Email is required', 'INVALID_EMAIL');
  if (!password) throw new AuthError('Password is required', 'INVALID_PASSWORD');

  try {
    const djangoLoginRes = await fetch(
      `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/accounts/login/`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      }
    );
    if (!djangoLoginRes.ok) {
      const err = await djangoLoginRes.json().catch(() => ({ detail: 'Authentication failed' }));
      throw new AuthError(err.detail || 'Authentication failed', 'AUTH_FAILED');
    }
    const djangoData = await djangoLoginRes.json();
    if (djangoData.access) {
      useAuthStore.getState().setDjangoToken(djangoData.access);
      const session = {
        access_token: djangoData.access,
        user: {
          id: djangoData.id,
          email: djangoData.email,
          account_type: djangoData.account_type,
        }
      };
      useAuthStore.getState().setAuth(session, session.user);
    }
    return {
      id: djangoData.id,
      email: djangoData.email,
      account_type: djangoData.account_type,
    };
  } catch (e: any) {
    if (e instanceof AuthError) throw e;
    throw new AuthError(e?.message || 'Server connection failed', 'SERVER_ERROR');
  }
}

export async function signOut() {
  await useAuthStore.getState().logout();
}

export async function getProfile(userId: string) {
  const token = useAuthStore.getState().djangoToken;
  if (!token) return null;
  const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/accounts/me/`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) throw new AuthError('Failed to fetch profile', 'PROFILE_FETCH_FAILED');
  const userData = await res.json();
  return {
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
}

export async function updateProfile(userId: string, updates: any) {
  const token = useAuthStore.getState().djangoToken;
  if (!token) return;

  const bodyData: any = {};
  if (updates.full_name !== undefined) bodyData.full_name = updates.full_name;
  if (updates.phone !== undefined) bodyData.phone = updates.phone;
  if (updates.city !== undefined) bodyData.city = updates.city;
  if (updates.username !== undefined) bodyData.username = updates.username;
  if (updates.email !== undefined) bodyData.email = updates.email;
  if (updates.name_nepali !== undefined) bodyData.name_nepali = updates.name_nepali;

  const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/accounts/me/`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(bodyData),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Profile update failed' }));
    throw new AuthError(err.detail || 'Profile update failed', 'PROFILE_UPDATE_FAILED');
  }
}

export async function uploadProfilePhoto(userId: string, file: File) {
  if (!file.type.startsWith('image/')) throw new AuthError('Only images allowed', 'INVALID_FILE_TYPE');
  if (file.size > 5 * 1024 * 1024) throw new AuthError('Image must be less than 5MB', 'FILE_TOO_LARGE');

  const token = useAuthStore.getState().djangoToken;
  if (!token) throw new AuthError('Not authenticated');

  const formData = new FormData();
  formData.append('profile_photo', file);

  const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/accounts/me/`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });

  if (!res.ok) throw new AuthError('Failed to upload profile photo', 'UPLOAD_FAILED');
  const data = await res.json();
  
  // Update local store profile photo
  const currentProfile = useAuthStore.getState().profile;
  if (currentProfile) {
    useAuthStore.getState().setProfile({
      ...currentProfile,
      avatar_url: data.profile_photo || undefined
    });
  }

  return data.profile_photo;
}

export async function getCurrentUser() {
  const user = useAuthStore.getState().user;
  return user;
}
