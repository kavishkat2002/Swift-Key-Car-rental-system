import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { BookingModal } from './components/BookingModal';
import { Vehicle, Booking } from './types';

// Pages
import { Home } from './pages/public/Home';
import { Catalogue } from './pages/public/Catalogue';
import { VehicleDetails } from './pages/public/VehicleDetails';
import { About } from './pages/public/About';
import { Terms } from './pages/public/Terms';
import { Contact } from './pages/public/Contact';
import { BlogList } from './pages/public/BlogList';
import { BlogPostPage } from './pages/public/BlogPostPage';
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';
import { ForgotPassword } from './pages/auth/ForgotPassword';
import { CustomerDashboard } from './pages/customer/CustomerDashboard';
import { StaffDashboard } from './pages/staff/StaffDashboard';
import { AdminDashboard } from './pages/admin/AdminDashboard';

const MainApp: React.FC = () => {
  const { user, isStaff, isAdmin } = useAuth();

  const [currentPage, setCurrentPage] = useState<string>('home');
  const [pageParams, setPageParams] = useState<Record<string, any>>({});

  // Global Booking Modal State
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [selectedVehicleForBooking, setSelectedVehicleForBooking] = useState<Vehicle | null>(null);
  const [bookingPickupDate, setBookingPickupDate] = useState<string | undefined>(undefined);
  const [bookingReturnDate, setBookingReturnDate] = useState<string | undefined>(undefined);

  const handleNavigate = (page: string, params: Record<string, any> = {}) => {
    setCurrentPage(page);
    setPageParams(params);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenBookingModal = (vehicle: Vehicle, pickupDate?: string, returnDate?: string) => {
    setSelectedVehicleForBooking(vehicle);
    setBookingPickupDate(pickupDate);
    setBookingReturnDate(returnDate);
    setBookingModalOpen(true);
  };

  const handleBookingComplete = (_booking: Booking) => {
    // Optionally redirect to customer dashboard
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
            initialFilters={pageParams}
            onSelectVehicle={(veh) => handleNavigate('vehicle-details', { vehicleId: veh.id })}
            onBookVehicle={(veh) => handleOpenBookingModal(veh)}
          />
        )}

        {currentPage === 'vehicle-details' && pageParams.vehicleId && (
          <VehicleDetails
            vehicleId={pageParams.vehicleId}
            onBack={() => handleNavigate('catalogue')}
            onBookNow={(veh, pDate, rDate) => handleOpenBookingModal(veh, pDate, rDate)}
          />
        )}

        {currentPage === 'about' && <About />}

        {currentPage === 'terms' && <Terms />}

        {currentPage === 'contact' && <Contact />}

        {currentPage === 'blog' && (
          <BlogList onSelectPost={(slug) => handleNavigate('blog-post', { slug })} />
        )}

        {currentPage === 'blog-post' && pageParams.slug && (
          <BlogPostPage
            slug={pageParams.slug}
            onBack={() => handleNavigate('blog')}
            onNavigateFleet={() => handleNavigate('catalogue')}
          />
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
          user ? (
            <CustomerDashboard
              onNavigateFleet={() => handleNavigate('catalogue')}
              onPayBooking={(b) => {
                // If paying for existing pending booking, navigate or open modal
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
                className="px-4 py-2 bg-[#0F766E] text-white text-xs font-semibold rounded-md"
              >
                Sign In
              </button>
            </div>
          )
        )}

        {currentPage === 'staff-dashboard' && (
          isStaff ? (
            <StaffDashboard />
          ) : (
            <div className="max-w-md mx-auto py-16 text-center space-y-4">
              <p className="text-sm font-semibold text-rose-700">Access Restricted: Staff or Administrator privileges required.</p>
              <button
                type="button"
                onClick={() => handleNavigate('login')}
                className="px-4 py-2 bg-[#102A43] text-white text-xs font-semibold rounded-md"
              >
                Sign In with Staff Account
              </button>
            </div>
          )
        )}

        {currentPage === 'admin-dashboard' && (
          isAdmin ? (
            <AdminDashboard />
          ) : (
            <div className="max-w-md mx-auto py-16 text-center space-y-4">
              <p className="text-sm font-semibold text-rose-700">Access Restricted: Administrator privileges required.</p>
              <button
                type="button"
                onClick={() => handleNavigate('login')}
                className="px-4 py-2 bg-[#102A43] text-white text-xs font-semibold rounded-md"
              >
                Sign In with Administrator Account
              </button>
            </div>
          )
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
