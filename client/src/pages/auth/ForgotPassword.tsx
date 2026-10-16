import React, { useState } from 'react';
import { api } from '../../services/api';
import { useNotification } from '../../context/NotificationContext';
import { Car, Mail, ArrowLeft, Send } from 'lucide-react';

interface ForgotPasswordProps {
  onBackToLogin: () => void;
}

export const ForgotPassword: React.FC<ForgotPasswordProps> = ({ onBackToLogin }) => {
  const { showSuccess, showError } = useNotification();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      await api.auth.forgotPassword(email.trim());
      setSubmitted(true);
      showSuccess('Password reset link dispatched to your registered address.');
    } catch (err: any) {
      showError(err.message || 'Failed to request password reset.');
    } finally {
      setIsSubmitting(false);
    }
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
          Reset Your Password
        </h1>
        <p className="text-xs text-[#526477]">
          Enter your registered email address to receive reset instructions
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-4">
        {submitted ? (
          <div className="space-y-4 text-center">
            <div className="p-4 bg-teal-50 border border-teal-200 rounded-lg text-xs text-teal-900 leading-relaxed">
              If an account is associated with <strong>{email}</strong>, a secure verification link has been sent. Please inspect your inbox and spam folder.
            </div>
            <button
              type="button"
              onClick={onBackToLogin}
              className="text-xs font-semibold text-teal-700 hover:underline flex items-center justify-center gap-1 mx-auto"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Sign In</span>
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Registered Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-teal-600 focus:outline-none"
                  placeholder="name@example.com"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 bg-[#0F766E] hover:bg-[#0D655E] text-white text-xs font-semibold rounded-md shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{isSubmitting ? 'Sending Request...' : 'Send Reset Link'}</span>
              <Send className="w-3.5 h-3.5" />
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={onBackToLogin}
                className="text-xs text-slate-500 hover:text-slate-800 flex items-center justify-center gap-1 mx-auto font-medium"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Sign In</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
