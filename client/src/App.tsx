import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { BookingModal } from './components/BookingModal';
import { Vehicle, Booking } from './types';
import { parseLocation, formatUrl, RouteState } from './utils/router';

// Pages
import { Home } from './pages/public/Home';
import { Catalogue } from './pages/public/Catalogue';
import { VehicleDetails } from './pages/public/VehicleDetails';
import { About } from './pages/public/About';
import { Terms } from './pages/public/Terms';
import { Contact } from './pages/public/Contact';
import { BlogList } from './pages/public/BlogList';
import { BlogPostPage } from './pages/public/BlogPostPage';
import { NotFound } from './pages/public/NotFound';
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';
import { ForgotPassword } from './pages/auth/ForgotPassword';
import { CustomerDashboard } from './pages/customer/CustomerDashboard';
import { StaffDashboard } from './pages/staff/StaffDashboard';
import { AdminDashboard } from './pages/admin/AdminDashboard';

const MainApp: React.FC = () => {
  const { user, isLoading, isStaff, isAdmin } = useAuth();

  // Initialize route directly from window.location
  const [route, setRoute] = useState<RouteState>(() =>
    parseLocation(window.location.pathname, window.location.search)
  );

  const currentPage = route.page;
  const pageParams = route.params;

  // Global Booking Modal State
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [selectedVehicleForBooking, setSelectedVehicleForBooking] = useState<Vehicle | null>(null);
  const [bookingPickupDate, setBookingPickupDate] = useState<string | undefined>(undefined);
  const [bookingReturnDate, setBookingReturnDate] = useState<string | undefined>(undefined);

  // Synchronize on browser Back / Forward buttons (popstate)
  useEffect(() => {
    const handlePopState = () => {
      const nextRoute = parseLocation(window.location.pathname, window.location.search);
      setRoute(nextRoute);
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  const handleNavigate = useCallback(
    (pageOrPath: string, params: Record<string, any> = {}, options?: { replace?: boolean; scroll?: boolean }) => {
      const targetUrl = formatUrl(pageOrPath, params);
      const urlPath = targetUrl.split('?')[0];
      const urlSearch = targetUrl.includes('?') ? targetUrl.substring(targetUrl.indexOf('?')) : '';
      const nextRoute = parseLocation(urlPath, urlSearch);

      // Merge explicit non-URL params (e.g. object states)
      nextRoute.params = { ...nextRoute.params, ...params };

      if (options?.replace) {
        window.history.replaceState({ page: nextRoute.page, params: nextRoute.params }, '', targetUrl);
      } else {
        window.history.pushState({ page: nextRoute.page, params: nextRoute.params }, '', targetUrl);
      }

      setRoute(nextRoute);

      if (options?.scroll !== false) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    },
    []
  );

  const handleOpenBookingModal = (vehicle: Vehicle, pickupDate?: string, returnDate?: string) => {
    setSelectedVehicleForBooking(vehicle);
    setBookingPickupDate(pickupDate);
    setBookingReturnDate(returnDate);
    setBookingModalOpen(true);
  };

  const handleBookingComplete = (_booking: Booking) => {
    if (user) {
      handleNavigate('customer-dashboard');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-[#102A43]">
      <Navbar currentPage={currentPage} onNavigate={handleNavigate} />

      <main className="flex-1">
        {currentPage === 'home' && (
          <Home
            onNavigate={handleNavigate}
            onBookVehicle={(veh) => handleOpenBookingModal(veh)}
          />
        )}

        {currentPage === 'catalogue' && (
          <Catalogue
            key={JSON.stringify(pageParams)}
            initialFilters={pageParams}
            onSelectVehicle={(veh) => handleNavigate('vehicle-details', { vehicleId: veh.id })}
            onBookVehicle={(veh) => handleOpenBookingModal(veh)}
          />
        )}

        {currentPage === 'vehicle-details' && (
          pageParams.vehicleId ? (
            <VehicleDetails
              vehicleId={Number(pageParams.vehicleId)}
              onBack={() => handleNavigate('catalogue')}
              onBookNow={(veh, pDate, rDate) => handleOpenBookingModal(veh, pDate, rDate)}
            />
          ) : (
            <NotFound
              requestedPath="/vehicles"
              onNavigate={handleNavigate}
            />
          )
        )}

        {currentPage === 'about' && <About />}

        {currentPage === 'terms' && <Terms />}

        {currentPage === 'contact' && <Contact />}

        {currentPage === 'blog' && (
          <BlogList onSelectPost={(slug) => handleNavigate('blog-post', { slug })} />
        )}

        {currentPage === 'blog-post' && (
          pageParams.slug ? (
            <BlogPostPage
              slug={pageParams.slug}
              onBack={() => handleNavigate('blog')}
              onNavigateFleet={() => handleNavigate('catalogue')}
            />
          ) : (
            <NotFound
              requestedPath="/blog"
              onNavigate={handleNavigate}
            />
          )
        )}

        {currentPage === 'login' && (
          <Login
            onSuccess={(role) => {
              if (role === 'admin') handleNavigate('admin-dashboard');
              else if (role === 'staff') handleNavigate('staff-dashboard');
              else handleNavigate('customer-dashboard');
            }}
            onNavigateRegister={() => handleNavigate('register')}
            onNavigateForgotPassword={() => handleNavigate('forgot-password')}
          />
        )}

        {currentPage === 'register' && (
          <Register
            onSuccess={() => handleNavigate('customer-dashboard')}
            onNavigateLogin={() => handleNavigate('login')}
          />
        )}

        {currentPage === 'forgot-password' && (
          <ForgotPassword onBackToLogin={() => handleNavigate('login')} />
        )}

        {currentPage === 'customer-dashboard' && (
          isLoading ? (
            <div className="max-w-md mx-auto py-24 text-center text-slate-500">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#0F766E] mb-3" />
              <p className="text-sm font-medium">Verifying customer session...</p>
            </div>
          ) : user ? (
            <CustomerDashboard
              onNavigateFleet={() => handleNavigate('catalogue')}
              onPayBooking={(b) => {
                handleOpenBookingModal({
                  id: b.vehicle_id,
                  make: b.vehicle_make || 'Vehicle',
                  model: b.vehicle_model || '',
                  year: b.vehicle_year || 2022,
                  category: b.vehicle_category || 'economy',
                  transmission: 'automatic',
                  fuel_type: 'petrol',
                  seating_capacity: 5,
                  daily_rate_lkr: b.daily_rate_applied,
                  weekly_rate_lkr: b.daily_rate_applied * 6,
                  deposit_lkr: b.deposit_amount_lkr,
                  status: 'available',
                  registration_number: b.vehicle_reg || '',
                  mileage_km: 0,
                  features: [],
                  description: '',
                  main_image_url: b.vehicle_image || ''
                }, b.pickup_date, b.return_date);
              }}
            />
          ) : (
            <div className="max-w-md mx-auto py-16 text-center space-y-4">
              <p className="text-sm font-semibold">Please sign in to access your customer dashboard.</p>
              <button
                type="button"
                onClick={() => handleNavigate('login')}
                className="px-4 py-2 bg-[#0F766E] text-white text-xs font-semibold rounded-md shadow-xs hover:bg-[#0D655E] transition-colors"
              >
                Sign In
              </button>
            </div>
          )
        )}

        {currentPage === 'staff-dashboard' && (
          isLoading ? (
            <div className="max-w-md mx-auto py-24 text-center text-slate-500">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#0F766E] mb-3" />
              <p className="text-sm font-medium">Verifying staff credentials...</p>
            </div>
          ) : isStaff ? (
            <StaffDashboard />
          ) : (
            <div className="max-w-md mx-auto py-16 text-center space-y-4">
              <p className="text-sm font-semibold text-rose-700">Access Restricted: Staff or Administrator privileges required.</p>
              <button
                type="button"
                onClick={() => handleNavigate('login')}
                className="px-4 py-2 bg-[#102A43] text-white text-xs font-semibold rounded-md shadow-xs hover:bg-slate-800 transition-colors"
              >
                Sign In with Staff Account
              </button>
            </div>
          )
        )}

        {currentPage === 'admin-dashboard' && (
          isLoading ? (
            <div className="max-w-md mx-auto py-24 text-center text-slate-500">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#0F766E] mb-3" />
              <p className="text-sm font-medium">Verifying administrator credentials...</p>
            </div>
          ) : isAdmin ? (
            <AdminDashboard />
          ) : (
            <div className="max-w-md mx-auto py-16 text-center space-y-4">
              <p className="text-sm font-semibold text-rose-700">Access Restricted: Administrator privileges required.</p>
              <button
                type="button"
                onClick={() => handleNavigate('login')}
                className="px-4 py-2 bg-[#102A43] text-white text-xs font-semibold rounded-md shadow-xs hover:bg-slate-800 transition-colors"
              >
                Sign In with Administrator Account
              </button>
            </div>
          )
        )}

        {currentPage === 'not-found' && (
          <NotFound
            requestedPath={pageParams.requestedPath || window.location.pathname}
            onNavigate={handleNavigate}
          />
        )}
      </main>

      <Footer onNavigate={handleNavigate} />

      {/* Global Booking & Sandbox Checkout Modal */}
      <BookingModal
        isOpen={bookingModalOpen}
        onClose={() => setBookingModalOpen(false)}
        vehicle={selectedVehicleForBooking}
        initialPickupDate={bookingPickupDate}
        initialReturnDate={bookingReturnDate}
        onBookingComplete={handleBookingComplete}
        onNavigateLogin={() => {
          setBookingModalOpen(false);
          handleNavigate('login');
        }}
      />
    </div>
  );
};

export default function App() {
  return (
    <NotificationProvider>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </NotificationProvider>
  );
}
