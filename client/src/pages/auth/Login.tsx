import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { Car, Lock, Mail, Eye, EyeOff, ArrowRight, ShieldCheck } from 'lucide-react';

interface LoginProps {
  onSuccess: (role: string) => void;
  onNavigateRegister: () => void;
  onNavigateForgotPassword: () => void;
}

export const Login: React.FC<LoginProps> = ({
  onSuccess,
  onNavigateRegister,
  onNavigateForgotPassword
}) => {
  const { login } = useAuth();
  const { showSuccess, showError } = useNotification();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsSubmitting(true);
      const user = await login(email.trim(), password);
      showSuccess(`Welcome back, ${user.fullName}!`);
      onSuccess(user.role);
    } catch (err: any) {
      showError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const fillCredentials = (em: string, pw: string) => {
    setEmail(em);
    setPassword(pw);
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16 space-y-6">
      <div className="text-center space-y-2">
        <img
          src="/logo.png"
          alt="SwiftDrive Rentals"
          className="h-16 w-auto mx-auto object-contain mb-3"
        />
        <h1 className="text-2xl font-bold text-[#102A43]">
          Sign In to Your Account
        </h1>
        <p className="text-xs text-[#526477]">
          Access your bookings, profile, or staff operations portal
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-5">
        {/* Examiner Quick-Fill Credentials helper for assessment testing */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-2">
          <div className="font-semibold text-slate-700 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-700" />
            <span>Assessment Testing Credentials:</span>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            <button
              type="button"
              onClick={() => fillCredentials('kavishka@example.com', 'Customer@1234')}
              className="py-1 px-2 text-[10px] font-semibold bg-white border border-slate-300 rounded text-slate-700 hover:bg-slate-100"
            >
              Customer
            </button>
            <button
              type="button"
              onClick={() => fillCredentials('staff@swiftdrive.lk', 'Staff@1234')}
              className="py-1 px-2 text-[10px] font-semibold bg-white border border-slate-300 rounded text-slate-700 hover:bg-slate-100"
            >
              Staff Desk
            </button>
            <button
              type="button"
              onClick={() => fillCredentials('admin@swiftdrive.lk', 'Admin@1234')}
              className="py-1 px-2 text-[10px] font-semibold bg-teal-50 border border-teal-300 rounded text-teal-900 hover:bg-teal-100"
            >
              Administrator
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-teal-600 focus:outline-none"
                placeholder="you@example.com"
              />
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700">
                Password
              </label>
              <button
                type="button"
                onClick={onNavigateForgotPassword}
                className="text-[11px] text-teal-700 hover:underline"
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-9 py-2 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-teal-600 focus:outline-none"
                placeholder="••••••••"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 bg-[#0F766E] hover:bg-[#0D655E] text-white text-xs font-semibold rounded-md shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>{isSubmitting ? 'Signing in...' : 'Sign In'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        <div className="text-center text-xs text-slate-500 pt-2 border-t border-slate-100">
          <span>Don't have an account yet? </span>
          <button
            type="button"
            onClick={onNavigateRegister}
            className="text-teal-700 font-bold hover:underline"
          >
            Create Customer Account
          </button>
        </div>
      </div>
    </div>
  );
};
