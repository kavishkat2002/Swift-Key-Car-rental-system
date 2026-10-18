import React from 'react';
import { Car, Home, ArrowLeft, Search, HelpCircle } from 'lucide-react';

interface NotFoundProps {
  requestedPath?: string;
  onNavigate: (page: string, params?: Record<string, any>) => void;
}

export const NotFound: React.FC<NotFoundProps> = ({ requestedPath, onNavigate }) => {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16 bg-[#F8FAFC]">
      <div className="max-w-md w-full text-center space-y-6 bg-white p-8 sm:p-10 rounded-2xl shadow-sm border border-slate-200">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-teal-50 text-[#0F766E] mx-auto">
          <Car className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="inline-block text-xs uppercase tracking-widest font-bold text-[#0F766E] bg-teal-50/80 px-2.5 py-1 rounded-full">
            404 Error
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#102A43] tracking-tight">
            Page Not Found
          </h1>
          <p className="text-sm text-slate-500 leading-relaxed">
            The road you are looking for doesn't exist or may have been moved.
            {requestedPath && (
              <span className="block mt-1 font-mono text-xs text-slate-600 bg-slate-100 py-1 px-2 rounded inline-block">
                {requestedPath}
              </span>
            )}
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
          <button
            type="button"
            onClick={() => onNavigate('home')}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white bg-[#0F766E] hover:bg-[#0D655E] transition-colors shadow-xs"
          >
            <Home className="w-4 h-4" />
            <span>Return Home</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('catalogue')}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-[#102A43] bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            <Search className="w-4 h-4" />
            <span>Browse Fleet</span>
          </button>
        </div>

        <div className="pt-4 border-t border-slate-100 text-xs text-slate-400">
          Need roadside assistance or reservation help?{' '}
          <button
            type="button"
            onClick={() => onNavigate('contact')}
            className="text-[#0F766E] font-medium hover:underline"
          >
            Contact our 24/7 team
          </button>
        </div>
      </div>
    </div>
  );
};
