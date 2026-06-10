import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, AlertCircle, Loader2 } from 'lucide-react';
import { signIn, AuthError } from '../lib/auth';
import { useAuthStore } from '../store/authStore';
import { useToast } from '../hooks/useToast';
import { useTrans } from '../i18n';
import SuccessAnimation from '../components/SuccessAnimation';

export default function LoginPage() {
  const { t } = useTrans();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const { fetchProfile } = useAuthStore();
  const toast = useToast();

  const demoLogin = async (demoEmail: string, demoPassword: string) => {
    setError('');
    setLoading(true);
    try {
      const user = await signIn(demoEmail, demoPassword);
      await fetchProfile(user.id);
      toast.success(t('toast.loginSuccess'));
      setSuccess(true);
      setTimeout(() => navigate('/dashboard'), 1500);
    } catch (err: any) {
      const msg = err instanceof AuthError ? err.message : 'Login failed';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await signIn(email, password);
      await fetchProfile(user.id);

      toast.success('Welcome back');
      setSuccess(true);
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (err: any) {
      const msg = err instanceof AuthError ? err.message : 'Login failed. Please try again.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 pt-20">
      {success && <SuccessAnimation message="Signed In" />}
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold font-heading text-slate-900 dark:text-slate-100 mb-2">
            Welcome Back
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Sign in to your Karma account
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 space-y-5"
        >
          {error && (
            <div className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <AlertCircle size={18} className="text-red-600 dark:text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 text-sm"
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Password
            </label>
            <div className="relative">
              <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 text-sm"
                disabled={loading}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-violet-600 text-white font-semibold rounded-lg hover:bg-violet-700 transition-smooth disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading && <Loader2 size={18} className="animate-spin" />}
            {loading ? 'Signing in...' : 'Sign In'}
          </button>

          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-slate-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                New to Karma?
              </span>
            </div>
          </div>

          <Link
            to="/signup"
            className="w-full py-2.5 border border-violet-200 dark:border-violet-800 text-violet-700 dark:text-violet-300 font-semibold rounded-lg hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-smooth text-center block"
          >
            Create Account
          </Link>
        </form>

        <div className="mt-8 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 text-center">
            {t('login.quickDemo')}
          </h3>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => demoLogin('rockyffgod@gmail.com', 'rk1234')}
              disabled={loading}
              className="flex-1 py-2.5 border border-violet-200 dark:border-violet-800 text-violet-700 dark:text-violet-300 font-medium rounded-lg hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-smooth text-sm"
            >
              {t('login.demoCustomer')}
            </button>
            <button
              type="button"
              onClick={() => demoLogin('ram@example.com', 'ram1234')}
              disabled={loading}
              className="flex-1 py-2.5 bg-violet-600 text-white font-medium rounded-lg hover:bg-violet-700 transition-smooth text-sm"
            >
              {t('login.demoProvider')}
            </button>
          </div>
        </div>

        <p className="text-center text-sm text-slate-600 dark:text-slate-400 mt-6">
          Need help?{' '}
          <a href="#" className="text-violet-600 dark:text-violet-400 font-semibold hover:underline">
            Contact support
          </a>
        </p>
      </div>
    </div>
  );
}
