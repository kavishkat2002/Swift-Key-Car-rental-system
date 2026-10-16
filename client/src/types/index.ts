export type Role = 'customer' | 'staff' | 'admin';

export interface User {
  id: number;
  email: string;
  fullName: string;
  role: Role;
  phone: string;
  drivingLicenseNumber?: string | null;
  address?: string | null;
  createdAt?: string;
}

export type VehicleCategory = 'economy' | 'suv' | 'van' | 'luxury';
export type Transmission = 'automatic' | 'manual';
export type FuelType = 'petrol' | 'diesel' | 'hybrid' | 'electric';
export type VehicleStatus = 'available' | 'rented' | 'maintenance' | 'archived';

export interface Vehicle {
  id: number;
  make: string;
  model: string;
  year: number;
  category: VehicleCategory;
  transmission: Transmission;
  fuel_type: FuelType;
  seating_capacity: number;
  daily_rate_lkr: number;
  weekly_rate_lkr: number;
  deposit_lkr: number;
  status: VehicleStatus;
  registration_number: string;
  mileage_km: number;
  features: string[];
  description: string;
  main_image_url: string;
  isAvailableForDates?: boolean;
  availabilityNote?: string;
  images?: { id: number; image_url: string; caption?: string }[];
  reviews?: Review[];
}

export type BookingStatus = 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export interface Booking {
  id: number;
  booking_reference: string;
  user_id: number;
  vehicle_id: number;
  pickup_date: string;
  return_date: string;
  pickup_location: string;
  return_location: string;
  total_days: number;
  daily_rate_applied: number;
  rental_cost_lkr: number;
  deposit_amount_lkr: number;
  total_amount_lkr: number;
  booking_status: BookingStatus;
  payment_status: PaymentStatus;
  special_requests?: string | null;
  cancellation_reason?: string | null;
  created_at: string;
  updated_at: string;
  vehicle_make?: string;
  vehicle_model?: string;
  vehicle_year?: number;
  vehicle_reg?: string;
  vehicle_image?: string;
  vehicle_category?: VehicleCategory;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  isOverdue?: boolean;
  payments?: Payment[];
  inspections?: ConditionReport[];
}

export interface Payment {
  id: number;
  booking_id: number;
  user_id: number;
  amount_lkr: number;
  payment_type: 'rental' | 'deposit' | 'full';
  payment_method: 'card_sandbox' | 'bank_transfer_test' | 'cash_on_pickup';
  transaction_reference: string;
  payment_status: 'successful' | 'failed' | 'pending';
  gateway_response?: string;
  created_at: string;
  booking_reference?: string;
  customer_name?: string;
}

export interface ConditionReport {
  id: number;
  booking_id: number;
  vehicle_id: number;
  staff_user_id: number;
  staff_name?: string;
  report_type: 'pickup' | 'return';
  odometer_reading: number;
  fuel_level: 'empty' | 'quarter' | 'half' | 'three_quarters' | 'full';
  exterior_condition: string;
  interior_condition: string;
  damage_notes?: string | null;
  created_at: string;
}

export interface Review {
  id: number;
  rating: number;
  comment: string;
  author_name: string;
  vehicle_make?: string;
  vehicle_model?: string;
  is_featured?: number;
  created_at: string;
}

export interface Inquiry {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  vehicle_id?: number | null;
  vehicle_make?: string;
  vehicle_model?: string;
  status: 'new' | 'in_progress' | 'resolved';
  response_notes?: string | null;
  assigned_staff_name?: string | null;
  created_at: string;
}

export interface BlogPost {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content?: string;
  cover_image: string;
  category: string;
  author_name: string;
  read_time_minutes: number;
  published_at: string;
}

export interface PricingQuote {
  totalDays: number;
  dailyRate: number;
  weeklyRate: number;
  dailyRateApplied: number;
  rentalCostLkr: number;
  depositAmountLkr: number;
  totalAmountLkr: number;
  weeklyDiscountApplied: boolean;
  savingsLkr: number;
}

export interface AdminMetrics {
  fleet: {
    total_vehicles: number;
    available_vehicles: number;
    rented_vehicles: number;
    maintenance_vehicles: number;
  };
  bookings: {
    total_bookings: number;
    pending_bookings: number;
    confirmed_bookings: number;
    active_bookings: number;
    completed_bookings: number;
    cancelled_bookings: number;
  };
  revenue: {
    totalLkr: number;
    totalTransactions: number;
    pendingLkr: number;
  };
  categoryBreakdown: { category: string; count: number }[];
  recentActivity: {
    id: number;
    user_email: string;
    action: string;
    entity_type: string;
    details: string;
    created_at: string;
  }[];
}
