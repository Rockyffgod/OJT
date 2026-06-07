import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User as UserIcon, Mail as MailIcon, Phone as PhoneIcon, Lock as LockIcon, AlertCircle as AlertCircleIcon, Loader2 as Loader2Icon, Check as CheckIcon, Briefcase as BriefcaseIcon } from 'lucide-react';
import { signUp, signIn, AuthError } from '../lib/auth';
import { useAuthStore } from '../store/authStore';
import { useToast } from '../hooks/useToast';
import { AccountType } from '../lib/types';
import SuccessAnimation from '../components/SuccessAnimation';

export default function SignUpPage() {
  const [step, setStep] = useState<'type' | 'form'>('type');
  const [accountType, setAccountType] = useState<AccountType>('CUSTOMER');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const { fetchProfile, setAuth } = useAuthStore();
  const toast = useToast();

  const getPasswordStrength = (pw: string) => {
    if (!pw) return { score: 0, label: '', color: 'bg-slate-200 dark:bg-slate-700' };
    let score = 0;
    if (pw.length >= 8) score += 1;
    if (/[A-Z]/.test(pw)) score += 1;
    if (/[a-z]/.test(pw)) score += 1;
    if (/[0-9]/.test(pw)) score += 1;
    if (/[^A-Za-z0-9]/.test(pw)) score += 1;

    if (score <= 2) return { score, label: 'Weak', color: 'bg-red-500' };
    if (score <= 4) return { score, label: 'Medium', color: 'bg-amber-500' };
    return { score, label: 'Strong', color: 'bg-green-500' };
  };

  const strength = getPasswordStrength(formData.password);

  const handleTypeSelect = (type: AccountType) => {
    setAccountType(type);
    setStep('form');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  const validateForm = () => {
    if (!formData.firstName.trim()) return 'First name is required';
    if (!formData.lastName.trim()) return 'Last name is required';
    if (!formData.username.trim()) return 'Username is required';
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(formData.username.trim())) {
      return 'Username must be 3-20 characters and contain only letters, numbers, or underscores';
    }
    if (!formData.email.trim()) return 'Email is required';
    if (!formData.phone.trim()) return 'Phone number is required';
    if (formData.password.length < 8) return 'Password must be at least 8 characters';
    
    const strengthScore = getPasswordStrength(formData.password).score;
    if (strengthScore <= 2) {
      return 'Password is too weak. Please include a mix of uppercase letters, numbers, and symbols.';
    }
    
    if (formData.password !== formData.confirmPassword) return 'Passwords do not match';
    if (!agreed) return 'You must agree to the Terms of Service and Terms & Conditions';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      const fullName = `${formData.firstName.trim()} ${formData.lastName.trim()}`;
      const user = await signUp(
        formData.email,
        formData.password,
        fullName,
        formData.phone,
        accountType,
        formData.username.trim()
      );
      await signIn(formData.email, formData.password);
      if (user) await fetchProfile(user.id);
      toast.success('Account created');
      setSuccess(true);
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (err: any) {
      const msg = err instanceof AuthError ? err.message : 'Sign up failed. Please try again.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (step === 'type') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12 pt-20">
        <div className="w-full max-w-2xl">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold font-heading text-slate-900 dark:text-slate-100 mb-2">
              Join Karma
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              What type of account would you like to create?
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <button
              onClick={() => handleTypeSelect('CUSTOMER')}
              className="p-6 bg-white dark:bg-slate-800 rounded-xl border-2 border-slate-200 dark:border-slate-700 hover:border-violet-500 dark:hover:border-violet-500 text-left group transition-smooth"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold font-heading text-slate-900 dark:text-slate-100">
                  I need a service
                </h2>
                <div className="w-12 h-12 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center group-hover:bg-violet-200 dark:group-hover:bg-violet-900/50 transition-smooth">
                  <UserIcon size={22} className="text-violet-600 dark:text-violet-400" />
                </div>
              </div>
              <p className="text-slate-600 dark:text-slate-400 mb-4 text-sm">
                Find and hire trusted local service providers in Nepal
              </p>
              <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
                <li className="flex items-center gap-2">
                  <CheckIcon size={14} className="text-emerald-600 dark:text-emerald-400" />
                  Quick and verified matches
                </li>
                <li className="flex items-center gap-2">
                  <CheckIcon size={14} className="text-emerald-600 dark:text-emerald-400" />
                  Community lost & found network
                </li>
                <li className="flex items-center gap-2">
                  <CheckIcon size={14} className="text-emerald-600 dark:text-emerald-400" />
                  Secure payments
                </li>
              </ul>
            </button>

            <button
              onClick={() => handleTypeSelect('PROVIDER')}
              className="p-6 bg-white dark:bg-slate-800 rounded-xl border-2 border-slate-200 dark:border-slate-700 hover:border-amber-500 text-left group transition-smooth"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold font-heading text-slate-900 dark:text-slate-100">
                  I provide services
                </h2>
                <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center group-hover:bg-amber-200 dark:group-hover:bg-amber-900/50 transition-smooth">
                  <BriefcaseIcon size={22} className="text-amber-600 dark:text-amber-400" />
                </div>
              </div>
              <p className="text-slate-600 dark:text-slate-400 mb-4 text-sm">
                Offer your skills and earn with Karma
              </p>
              <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
                <li className="flex items-center gap-2">
                  <CheckIcon size={14} className="text-emerald-600 dark:text-emerald-400" />
                  Get verified and trusted
                </li>
                <li className="flex items-center gap-2">
                  <CheckIcon size={14} className="text-emerald-600 dark:text-emerald-400" />
                  Earn karma points
                </li>
                <li className="flex items-center gap-2">
                  <CheckIcon size={14} className="text-emerald-600 dark:text-emerald-400" />
                  Grow your business
                </li>
              </ul>
            </button>
          </div>

          <p className="text-center text-sm text-slate-600 dark:text-slate-400 mt-8">
            Already have an account?{' '}
            <Link
              to="/login"
              className="text-violet-600 dark:text-violet-400 font-semibold hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 pt-20">
      {success && <SuccessAnimation message="Signed In" />}
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold font-heading text-slate-900 dark:text-slate-100 mb-2">
            {accountType === 'PROVIDER' ? 'Become a Professional' : 'Create Your Account'}
          </h1>
          <p className="text-slate-600 dark:text-slate-400">Fill in your details to get started</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 space-y-4"
        >
          {error && (
            <div className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <AlertCircleIcon size={18} className="text-red-600 dark:text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                First Name
              </label>
              <div className="relative">
                <UserIcon size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  placeholder="First name"
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 text-sm"
                  disabled={loading}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Last Name
              </label>
              <div className="relative">
                <UserIcon size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  placeholder="Last name"
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 text-sm"
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Username
            </label>
            <div className="relative">
              <UserIcon size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                placeholder="Username (e.g. ram_sharma)"
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 text-sm"
                disabled={loading}
              />
            </div>
          </div>

          {[
            { name: 'email', label: 'Email Address', type: 'email', placeholder: 'you@example.com', icon: MailIcon },
            { name: 'phone', label: 'Phone Number', type: 'tel', placeholder: '+977 98XXXXXXXX', icon: PhoneIcon },
            { name: 'password', label: 'Password', type: 'password', placeholder: 'At least 8 characters', icon: LockIcon },
            { name: 'confirmPassword', label: 'Confirm Password', type: 'password', placeholder: 'Confirm password', icon: LockIcon },
          ].map((field) => {
            const Icon = field.icon;
            return (
              <div key={field.name}>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  {field.label}
                </label>
                <div className="relative">
                  <Icon size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={field.type || 'text'}
                    name={field.name}
                    value={(formData as any)[field.name]}
                    onChange={handleInputChange}
                    placeholder={field.placeholder}
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 text-sm"
                    disabled={loading}
                  />
                </div>
                {field.name === 'password' && formData.password && (
                  <div className="mt-2 space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500 dark:text-slate-400">Password Strength:</span>
                      <span className={`font-semibold ${
                        strength.label === 'Strong' ? 'text-green-500' :
                        strength.label === 'Medium' ? 'text-amber-500' : 'text-red-500'
                      }`}>
                        {strength.label}
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div className={`h-full transition-all duration-300 ${strength.color}`} style={{ width: `${(strength.score / 5) * 100}%` }} />
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          <div className="flex items-start gap-2.5 py-1">
            <input
              type="checkbox"
              id="agree-terms"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-1 w-4 h-4 rounded text-violet-600 border-slate-300 dark:border-slate-600 focus:ring-violet-500 bg-white dark:bg-slate-900"
              disabled={loading}
            />
            <label htmlFor="agree-terms" className="text-xs text-slate-600 dark:text-slate-400 leading-normal select-none">
              I agree to the{' '}
              <Link to="/terms-of-service" className="text-violet-600 dark:text-violet-400 font-semibold hover:underline">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link to="/terms-and-conditions" className="text-violet-600 dark:text-violet-400 font-semibold hover:underline">
                Terms & Conditions
              </Link>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-violet-600 text-white font-semibold rounded-lg hover:bg-violet-700 transition-smooth disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-1"
          >
            {loading && <Loader2Icon size={18} className="animate-spin" />}
            {loading ? 'Creating account...' : 'Create Account'}
          </button>

          <button
            type="button"
            onClick={() => setStep('type')}
            className="w-full py-2.5 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-semibold rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-smooth"
            disabled={loading}
          >
            Back
          </button>
        </form>

        <p className="text-center text-sm text-slate-600 dark:text-slate-400 mt-6">
          Already have an account?{' '}
          <Link
            to="/login"
            className="text-violet-600 dark:text-violet-400 font-semibold hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
