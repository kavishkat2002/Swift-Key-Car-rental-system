import {
  User, Vehicle, Booking, Payment, ConditionReport,
  Review, Inquiry, BlogPost, PricingQuote, AdminMetrics
} from '../types';

const API_BASE = '/api';

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('swiftdrive_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new ApiError(data.error || 'A network or server error occurred', response.status);
  }

  return data;
}

export const api = {
  auth: {
    login: (credentials: { email: string; password: string }) =>
      request<{ success: boolean; token: string; user: User }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials)
      }),
    register: (userData: { email: string; password: string; fullName: string; phone: string; drivingLicenseNumber?: string; address?: string }) =>
      request<{ success: boolean; token: string; user: User }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData)
      }),
    getMe: () =>
      request<{ success: boolean; user: User }>('/auth/me'),
    updateProfile: (profileData: { fullName: string; phone: string; drivingLicenseNumber?: string; address?: string }) =>
      request<{ success: boolean; user: User }>('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(profileData)
      }),
    forgotPassword: (email: string) =>
      request<{ success: boolean; message: string }>('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email })
      })
  },

  vehicles: {
    getAll: (params?: {
      category?: string;
      transmission?: string;
      fuelType?: string;
      minSeats?: number;
      maxPrice?: number;
      search?: string;
      sortBy?: string;
      pickupDate?: string;
      returnDate?: string;
    }) => {
      const searchParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, val]) => {
          if (val !== undefined && val !== null && val !== '') {
            searchParams.append(key, String(val));
          }
        });
      }
      const queryStr = searchParams.toString();
      return request<{ success: boolean; count: number; vehicles: Vehicle[] }>(`/vehicles${queryStr ? `?${queryStr}` : ''}`);
    },
    getFeatured: () =>
      request<{ success: boolean; vehicles: Vehicle[] }>('/vehicles/featured'),
    getById: (id: number) =>
      request<{ success: boolean; vehicle: Vehicle }>(`/vehicles/${id}`),
    checkAvailability: (id: number, pickupDate: string, returnDate: string) =>
      request<{ success: boolean; available: boolean; conflictReason?: string }>(
        `/vehicles/${id}/availability?pickupDate=${pickupDate}&returnDate=${returnDate}`
      )
  },

  bookings: {
    getQuote: (vehicleId: number, pickupDate: string, returnDate: string) =>
      request<{ success: boolean; quote: PricingQuote; availability: { available: boolean; conflictReason?: string } }>(
        '/bookings/quote',
        {
          method: 'POST',
          body: JSON.stringify({ vehicleId, pickupDate, returnDate })
        }
      ),
    create: (data: {
      vehicleId: number;
      pickupDate: string;
      returnDate: string;
      pickupLocation?: string;
      returnLocation?: string;
      specialRequests?: string;
    }) =>
      request<{ success: boolean; message: string; booking: Booking; quote: PricingQuote }>('/bookings', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    getMy: () =>
      request<{ success: boolean; bookings: Booking[] }>('/bookings/my'),
    getById: (id: number) =>
      request<{ success: boolean; booking: Booking }>(`/bookings/${id}`),
    cancel: (id: number, reason?: string) =>
      request<{ success: boolean; message: string; status: string }>(`/bookings/${id}/cancel`, {
        method: 'POST',
        body: JSON.stringify({ reason })
      })
  },

  payments: {
    process: (data: {
      bookingId: number;
      paymentMethod: 'card_sandbox' | 'bank_transfer_test' | 'cash_on_pickup';
      paymentType: 'rental' | 'deposit' | 'full';
      testCardNumber?: string;
      testCardExpiry?: string;
      testCardCvc?: string;
    }) =>
      request<{ success: boolean; message: string; transactionReference: string; booking: Booking }>('/payments/process', {
        method: 'POST',
        body: JSON.stringify(data)
      })
  },

  staff: {
    getBookings: (params?: { status?: string; search?: string }) => {
      const searchParams = new URLSearchParams();
      if (params?.status) searchParams.append('status', params.status);
      if (params?.search) searchParams.append('search', params.search);
      const queryStr = searchParams.toString();
      return request<{ success: boolean; count: number; bookings: Booking[] }>(`/staff/bookings${queryStr ? `?${queryStr}` : ''}`);
    },
    updateStatus: (bookingId: number, newStatus: string, notes?: string) =>
      request<{ success: boolean; message: string; newStatus: string }>(`/staff/bookings/${bookingId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ newStatus, notes })
      }),
    recordInspection: (data: {
      bookingId: number;
      vehicleId: number;
      reportType: 'pickup' | 'return';
      odometerReading: number;
      fuelLevel: string;
      exteriorCondition: string;
      interiorCondition: string;
      damageNotes?: string;
    }) =>
      request<{ success: boolean; message: string; reportId: number }>('/staff/inspections', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    getInquiries: () =>
      request<{ success: boolean; inquiries: Inquiry[] }>('/staff/inquiries'),
    updateInquiry: (id: number, status: string, responseNotes?: string) =>
      request<{ success: boolean; message: string }>(`/staff/inquiries/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ status, responseNotes })
      })
  },

  admin: {
    getMetrics: () =>
      request<{ success: boolean; metrics: AdminMetrics }>('/admin/metrics'),
    getVehicles: () =>
      request<{ success: boolean; vehicles: Vehicle[] }>('/admin/vehicles'),
    createVehicle: (data: Partial<Vehicle> & { features: string[] }) =>
      request<{ success: boolean; message: string; vehicleId: number }>('/admin/vehicles', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    updateVehicle: (id: number, data: Partial<Vehicle>) =>
      request<{ success: boolean; message: string }>(`/admin/vehicles/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      }),
    archiveVehicle: (id: number) =>
      request<{ success: boolean; message: string }>(`/admin/vehicles/${id}`, {
        method: 'DELETE'
      }),
    getUsers: () =>
      request<{ success: boolean; users: User[] }>('/admin/users'),
    updateUserRole: (userId: number, role: string) =>
      request<{ success: boolean; message: string }>(`/admin/users/${userId}/role`, {
        method: 'PUT',
        body: JSON.stringify({ role })
      }),
    getAuditLogs: () =>
      request<{ success: boolean; logs: any[] }>('/admin/audit-logs'),
    getPayments: () =>
      request<{ success: boolean; payments: Payment[] }>('/admin/payments')
  },

  reviews: {
    getAll: () =>
      request<{ success: boolean; reviews: Review[] }>('/reviews'),
    create: (data: { vehicleId?: number; rating: number; comment: string }) =>
      request<{ success: boolean; message: string }>('/reviews', {
        method: 'POST',
        body: JSON.stringify(data)
      })
  },

  inquiries: {
    submit: (data: { fullName: string; email: string; phone: string; subject: string; message: string; vehicleId?: number }) =>
      request<{ success: boolean; message: string; inquiryId: number }>('/inquiries', {
        method: 'POST',
        body: JSON.stringify(data)
      })
  },

  blog: {
    getAll: () =>
      request<{ success: boolean; posts: BlogPost[] }>('/blog'),
    getBySlug: (slug: string) =>
      request<{ success: boolean; post: BlogPost }>(`/blog/${slug}`)
  }
};
