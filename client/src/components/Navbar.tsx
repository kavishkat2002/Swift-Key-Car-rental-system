import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Car, Menu, X, User as UserIcon, LogOut, ShieldCheck, ClipboardList, Calendar } from 'lucide-react';

interface NavbarProps {
  currentPage: string;
  onNavigate: (page: string, params?: Record<string, any>) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentPage, onNavigate }) => {
  const { user, logout, isCustomer, isStaff, isAdmin } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNav = (page: string, params?: Record<string, any>) => {
    onNavigate(page, params);
    setMobileMenuOpen(false);
  };

  const navLinks = [
    { id: 'home', label: 'Home' },
    { id: 'catalogue', label: 'Fleet Catalogue' },
    { id: 'about', label: 'About Us' },
    { id: 'blog', label: 'Driving Guides' },
    { id: 'terms', label: 'Rental Terms' },
    { id: 'contact', label: 'Contact' }
  ];

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          {/* Brand Logo */}
          <button
            type="button"
            onClick={() => handleNav('home')}
            className="flex items-center gap-2 text-left focus:outline-none hover:opacity-95 transition-opacity py-1"
            aria-label="SwiftDrive Rentals Home"
          >
            <img
              src="/logo.png"
              alt="SwiftDrive Rentals"
              className="h-12 sm:h-14 w-auto object-contain"
            />
          </button>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1" aria-label="Main Navigation">
            {navLinks.map((link) => {
              const isActive = currentPage === link.id;
              return (
                <button
                  key={link.id}
                  type="button"
                  onClick={() => handleNav(link.id)}
                  className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive
                      ? 'text-[#0F766E] bg-teal-50/80 font-semibold'
                      : 'text-[#526477] hover:text-[#102A43] hover:bg-slate-50'
                  }`}
                >
                  {link.label}
                </button>
              );
            })}
          </nav>

          {/* User Account / Role Portals CTA */}
          <div className="hidden md:flex items-center gap-2">
            {user ? (
              <div className="flex items-center gap-2">
                {isCustomer && (
                  <button
                    type="button"
                    onClick={() => handleNav('customer-dashboard')}
                    className={`inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      currentPage === 'customer-dashboard'
                        ? 'bg-[#102A43] text-white'
                        : 'text-[#102A43] hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    <Calendar className="w-4 h-4 text-teal-600" />
                    <span>My Bookings</span>
                  </button>
                )}

                {isStaff && (
                  <button
                    type="button"
                    onClick={() => handleNav('staff-dashboard')}
                    className={`inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      currentPage === 'staff-dashboard'
                        ? 'bg-[#102A43] text-white'
                        : 'text-[#102A43] hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    <ClipboardList className="w-4 h-4 text-teal-600" />
                    <span>Staff Desk</span>
                  </button>
                )}

                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => handleNav('admin-dashboard')}
                    className={`inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      currentPage === 'admin-dashboard'
                        ? 'bg-[#0F766E] text-white'
                        : 'text-[#0F766E] hover:bg-teal-50 border border-teal-200'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Admin Fleet</span>
                  </button>
                )}

                <div className="h-5 w-px bg-slate-200 mx-1" />

                <div className="flex items-center gap-2 pl-1">
                  <div className="text-right">
                    <span className="block text-xs font-semibold text-[#102A43] leading-tight">
                      {user.fullName.split(' ')[0]}
                    </span>
                    <span className="block text-[10px] uppercase font-bold tracking-wider text-[#526477]">
                      {user.role}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={logout}
                    title="Sign Out"
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                    aria-label="Sign Out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleNav('login')}
                  className="px-3.5 py-2 text-sm font-medium text-[#102A43] hover:text-[#0F766E] transition-colors"
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => handleNav('register')}
                  className="px-4 py-2 text-sm font-medium rounded-md text-white bg-[#0F766E] hover:bg-[#0D655E] shadow-xs transition-colors"
                >
                  Register
                </button>
              </div>
            )}
          </div>

          {/* Mobile menu hamburger button */}
          <div className="flex md:hidden items-center">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-2 pb-6 space-y-2">
          {navLinks.map((link) => (
            <button
              key={link.id}
              type="button"
              onClick={() => handleNav(link.id)}
              className={`block w-full text-left px-3 py-2.5 rounded-md text-base font-medium ${
                currentPage === link.id
                  ? 'text-[#0F766E] bg-teal-50 font-semibold'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              {link.label}
            </button>
          ))}

          <div className="pt-4 border-t border-slate-200 space-y-2">
            {user ? (
              <>
                <div className="px-3 py-1 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-bold text-[#102A43]">{user.fullName}</div>
                    <div className="text-xs text-slate-500 uppercase">{user.role} • {user.email}</div>
                  </div>
                  <button
                    type="button"
                    onClick={logout}
                    className="text-xs text-rose-600 font-semibold px-2 py-1 bg-rose-50 rounded"
                  >
                    Logout
                  </button>
                </div>

                {isCustomer && (
                  <button
                    type="button"
                    onClick={() => handleNav('customer-dashboard')}
                    className="block w-full text-left px-3 py-2 text-sm font-medium text-slate-700 bg-slate-50 rounded-md"
                  >
                    My Bookings & Profile
                  </button>
                )}

                {isStaff && (
                  <button
                    type="button"
                    onClick={() => handleNav('staff-dashboard')}
                    className="block w-full text-left px-3 py-2 text-sm font-medium text-slate-700 bg-slate-50 rounded-md"
                  >
                    Staff Operations Desk
                  </button>
                )}

                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => handleNav('admin-dashboard')}
                    className="block w-full text-left px-3 py-2 text-sm font-medium text-teal-800 bg-teal-50 rounded-md font-semibold"
                  >
                    Admin Fleet Management
                  </button>
                )}
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => handleNav('login')}
                  className="w-full text-center py-2.5 text-sm font-medium text-slate-700 border border-slate-300 rounded-md hover:bg-slate-50"
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => handleNav('register')}
                  className="w-full text-center py-2.5 text-sm font-medium text-white bg-[#0F766E] rounded-md hover:bg-[#0D655E]"
                >
                  Register
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
