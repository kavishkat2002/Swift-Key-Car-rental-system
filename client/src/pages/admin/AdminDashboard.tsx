import React, { useState, useEffect } from 'react';
import { AdminMetrics, Vehicle, User, Payment } from '../../types';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { Badge } from '../../components/Badge';
import { Modal } from '../../components/Modal';
import {
  ShieldCheck, Car, Users, DollarSign, Calendar, Plus,
  Edit2, Trash2, Shield, Activity, Clock, CheckCircle2, AlertCircle
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();

  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Active Admin Tab
  const [activeTab, setActiveTab] = useState<'overview' | 'fleet' | 'users' | 'payments' | 'audit'>('overview');

  // Vehicle Create/Edit Modal State
  const [vehicleModalOpen, setVehicleModalOpen] = useState(false);
  const [editingVehicleId, setEditingVehicleId] = useState<number | null>(null);
  const [vMake, setVMake] = useState('');
  const [vModel, setVModel] = useState('');
  const [vYear, setVYear] = useState(2023);
  const [vCategory, setVCategory] = useState<'economy' | 'suv' | 'van' | 'luxury'>('economy');
  const [vTransmission, setVTransmission] = useState<'automatic' | 'manual'>('automatic');
  const [vFuelType, setVFuelType] = useState<'petrol' | 'diesel' | 'hybrid' | 'electric'>('petrol');
  const [vSeats, setVSeats] = useState(5);
  const [vDailyRate, setVDailyRate] = useState(10000);
  const [vWeeklyRate, setVWeeklyRate] = useState(65000);
  const [vDeposit, setVDeposit] = useState(30000);
  const [vReg, setVReg] = useState('');
  const [vMileage, setVMileage] = useState(30000);
  const [vFeatures, setVFeatures] = useState('Air Conditioning, Reverse Camera, Bluetooth Audio, Power Windows');
  const [vDescription, setVDescription] = useState('Reliable, well-maintained rental vehicle stationed at Negombo.');
  const [vImage, setVImage] = useState('https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80');
  const [vStatus, setVStatus] = useState<'available' | 'rented' | 'maintenance' | 'archived'>('available');
  const [isSavingVehicle, setIsSavingVehicle] = useState(false);

  const loadAllAdminData = () => {
    setLoading(true);
    Promise.all([
      api.admin.getMetrics(),
      api.admin.getVehicles(),
      api.admin.getUsers(),
      api.admin.getPayments(),
      api.admin.getAuditLogs()
    ])
      .then(([mRes, vRes, uRes, pRes, aRes]) => {
        setMetrics(mRes.metrics);
        setVehicles(vRes.vehicles);
        setUsers(uRes.users);
        setPayments(pRes.payments);
        setAuditLogs(aRes.logs);
      })
      .catch((err) => {
        showError(err.message || 'Failed to load administrative data.');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    loadAllAdminData();
  }, []);

  const handleOpenAddVehicle = () => {
    setEditingVehicleId(null);
    setVMake('');
    setVModel('');
    setVYear(2023);
    setVCategory('economy');
    setVTransmission('automatic');
    setVFuelType('petrol');
    setVSeats(5);
    setVDailyRate(10000);
    setVWeeklyRate(65000);
    setVDeposit(30000);
    setVReg(`WP-CAB-${Math.floor(1000 + Math.random() * 9000)}`);
    setVMileage(25000);
    setVFeatures('Air Conditioning, Reverse Camera, Bluetooth Audio, Power Windows');
    setVDescription('Comfortable and fuel-efficient rental vehicle stationed at Negombo.');
    setVImage('https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80');
    setVStatus('available');
    setVehicleModalOpen(true);
  };

  const handleOpenEditVehicle = (veh: Vehicle) => {
    setEditingVehicleId(veh.id);
    setVMake(veh.make);
    setVModel(veh.model);
    setVYear(veh.year);
    setVCategory(veh.category);
    setVTransmission(veh.transmission);
    setVFuelType(veh.fuel_type);
    setVSeats(veh.seating_capacity);
    setVDailyRate(veh.daily_rate_lkr);
    setVWeeklyRate(veh.weekly_rate_lkr);
    setVDeposit(veh.deposit_lkr);
    setVReg(veh.registration_number);
    setVMileage(veh.mileage_km);
    setVFeatures(Array.isArray(veh.features) ? veh.features.join(', ') : veh.features);
    setVDescription(veh.description);
    setVImage(veh.main_image_url);
    setVStatus(veh.status);
    setVehicleModalOpen(true);
  };

  const handleSaveVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSavingVehicle(true);
      const parsedFeatures = vFeatures.split(',').map((s) => s.trim()).filter(Boolean);

      if (editingVehicleId) {
        await api.admin.updateVehicle(editingVehicleId, {
          make: vMake,
          model: vModel,
          year: Number(vYear),
          category: vCategory,
          transmission: vTransmission,
          fuel_type: vFuelType,
          seating_capacity: Number(vSeats),
          daily_rate_lkr: Number(vDailyRate),
          weekly_rate_lkr: Number(vWeeklyRate),
          deposit_lkr: Number(vDeposit),
          mileage_km: Number(vMileage),
          description: vDescription,
          features: parsedFeatures,
          main_image_url: vImage,
          status: vStatus
        });
        showSuccess(`Vehicle ${vMake} ${vModel} updated.`);
      } else {
        await api.admin.createVehicle({
          make: vMake,
          model: vModel,
          year: Number(vYear),
          category: vCategory,
          transmission: vTransmission,
          fuel_type: vFuelType,
          seating_capacity: Number(vSeats),
          daily_rate_lkr: Number(vDailyRate),
          weekly_rate_lkr: Number(vWeeklyRate),
          deposit_lkr: Number(vDeposit),
          registration_number: vReg,
          mileage_km: Number(vMileage),
          description: vDescription,
          features: parsedFeatures,
          main_image_url: vImage
        });
        showSuccess(`New vehicle ${vMake} ${vModel} added to fleet.`);
      }

      setVehicleModalOpen(false);
      loadAllAdminData();
    } catch (err: any) {
      showError(err.message || 'Failed to save vehicle.');
    } finally {
      setIsSavingVehicle(false);
    }
  };

  const handleArchiveVehicle = async (vehId: number) => {
    if (!window.confirm('Are you sure you want to archive this vehicle from active fleet?')) return;
    try {
      await api.admin.archiveVehicle(vehId);
      showSuccess('Vehicle archived from active fleet.');
      loadAllAdminData();
    } catch (err: any) {
      showError(err.message || 'Failed to archive vehicle.');
    }
  };

  const handleChangeRole = async (targetUserId: number, newRole: string) => {
    try {
      await api.admin.updateUserRole(targetUserId, newRole);
      showSuccess(`User role updated to ${newRole}.`);
      loadAllAdminData();
    } catch (err: any) {
      showError(err.message || 'Failed to update user role.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Page Header */}
      <div className="border-b border-slate-200 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#102A43] tracking-tight">
              Fleet & Business Administration
            </h1>
            <span className="bg-teal-100 text-teal-800 text-[10px] font-bold px-2 py-0.5 rounded border border-teal-200 uppercase">
              Admin Verified
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#526477] mt-1">
            Grounded in actual database records • Negombo Hub Fleet Analytics
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAddVehicle}
          className="px-4 py-2 bg-[#0F766E] hover:bg-[#0D655E] text-white text-xs font-semibold rounded-md shadow-xs transition-colors flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Fleet Vehicle</span>
        </button>
      </div>

      {/* KPI METRIC CARDS (Grounding requirement 10: from actual DB records) */}
      {metrics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Settled Revenue
              </span>
              <DollarSign className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-extrabold text-[#102A43] mt-2">
              LKR {metrics.revenue.totalLkr.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              From {metrics.revenue.totalTransactions} verified payments
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Active Fleet Size
              </span>
              <Car className="w-4 h-4 text-teal-600" />
            </div>
            <div className="text-2xl font-extrabold text-[#102A43] mt-2">
              {metrics.fleet.total_vehicles} Vehicles
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              {metrics.fleet.available_vehicles || 0} Available • {metrics.fleet.rented_vehicles || 0} Rented
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Total Bookings
              </span>
              <Calendar className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-extrabold text-[#102A43] mt-2">
              {metrics.bookings.total_bookings} Bookings
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              {metrics.bookings.active_bookings || 0} Active • {metrics.bookings.completed_bookings || 0} Completed
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Pending Invoices
              </span>
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-extrabold text-[#102A43] mt-2">
              LKR {metrics.revenue.pendingLkr.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              {metrics.bookings.pending_bookings || 0} bookings awaiting payment
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-2 sm:gap-4 overflow-x-auto">
        {[
          { id: 'overview', label: 'Operational Overview' },
          { id: 'fleet', label: `Fleet Management (${vehicles.length})` },
          { id: 'users', label: `User Roles (${users.length})` },
          { id: 'payments', label: `Payments (${payments.length})` },
          { id: 'audit', label: `Audit Trail (${auditLogs.length})` }
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as any)}
            className={`pb-3 text-xs sm:text-sm font-semibold whitespace-nowrap transition-colors border-b-2 ${
              activeTab === tab.id
                ? 'border-teal-700 text-teal-800 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: OVERVIEW & RECENT AUDIT LOGS */}
      {activeTab === 'overview' && metrics && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Category Distribution */}
          <div className="lg:col-span-5 bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-[#102A43] uppercase tracking-wider">
              Fleet Category Distribution
            </h2>
            <div className="space-y-3">
              {metrics.categoryBreakdown.map((item) => (
                <div key={item.category} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold capitalize text-slate-700">
                    <span>{item.category}</span>
                    <span>{item.count} Vehicles</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-teal-700 h-2 rounded-full"
                      style={{
                        width: `${Math.round((item.count / (metrics.fleet.total_vehicles || 1)) * 100)}%`
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Operations Activity */}
          <div className="lg:col-span-7 bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-[#102A43] uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4 text-teal-700" />
              <span>Real-Time Audit Trail Events</span>
            </h2>

            <div className="divide-y divide-slate-100">
              {metrics.recentActivity.map((act) => (
                <div key={act.id} className="py-2.5 text-xs flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold text-slate-800">{act.action}</div>
                    <div className="text-[11px] text-slate-500">{act.user_email || 'System'} • {act.entity_type}</div>
                  </div>
                  <span className="text-[10px] text-slate-400 whitespace-nowrap">
                    {new Date(act.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: FLEET CRUD TABLE */}
      {activeTab === 'fleet' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Vehicle</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Reg Number</th>
                  <th className="px-4 py-3">Daily Tariff</th>
                  <th className="px-4 py-3">Deposit</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {vehicles.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3 font-semibold text-[#102A43] flex items-center gap-2.5">
                      <img
                        src={v.main_image_url}
                        alt={v.model}
                        className="w-10 h-8 object-cover rounded border border-slate-200 shrink-0"
                      />
                      <span>{v.make} {v.model} ({v.year})</span>
                    </td>
                    <td className="px-4 py-3 capitalize">{v.category}</td>
                    <td className="px-4 py-3 font-mono font-bold text-slate-600">{v.registration_number}</td>
                    <td className="px-4 py-3 font-semibold">LKR {v.daily_rate_lkr.toLocaleString()}</td>
                    <td className="px-4 py-3">LKR {v.deposit_lkr.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <Badge status={v.status} />
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <button
                        type="button"
                        onClick={() => handleOpenEditVehicle(v)}
                        className="text-teal-700 hover:text-teal-900 font-semibold p-1"
                        title="Edit Vehicle"
                      >
                        <Edit2 className="w-3.5 h-3.5 inline" />
                      </button>
                      {v.status !== 'archived' && (
                        <button
                          type="button"
                          onClick={() => handleArchiveVehicle(v.id)}
                          className="text-rose-600 hover:text-rose-800 font-semibold p-1"
                          title="Archive Vehicle"
                        >
                          <Trash2 className="w-3.5 h-3.5 inline" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: USER ROLES MANAGEMENT */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Full Name</th>
                  <th className="px-4 py-3">Email Address</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">License / IDP</th>
                  <th className="px-4 py-3">Role Privilege</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3 font-bold text-[#102A43]">{u.fullName}</td>
                    <td className="px-4 py-3 text-slate-600">{u.email}</td>
                    <td className="px-4 py-3">{u.phone}</td>
                    <td className="px-4 py-3 font-mono text-[11px]">{u.drivingLicenseNumber || '—'}</td>
                    <td className="px-4 py-3">
                      <select
                        value={u.role}
                        disabled={u.id === user?.id} // Safety: cannot demote own active session
                        onChange={(e) => handleChangeRole(u.id, e.target.value)}
                        className="px-2 py-1 text-xs border border-slate-300 rounded font-semibold capitalize bg-white disabled:bg-slate-100 disabled:cursor-not-allowed"
                      >
                        <option value="customer">Customer</option>
                        <option value="staff">Staff Operations</option>
                        <option value="admin">Administrator</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: PAYMENTS AUDIT TABLE */}
      {activeTab === 'payments' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Txn Reference</th>
                  <th className="px-4 py-3">Booking Ref</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Amount (LKR)</th>
                  <th className="px-4 py-3">Method</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3 font-mono text-[11px] font-bold text-teal-800">{p.transaction_reference}</td>
                    <td className="px-4 py-3 font-mono font-medium">{p.booking_reference}</td>
                    <td className="px-4 py-3">{p.customer_name}</td>
                    <td className="px-4 py-3 font-bold text-[#102A43]">LKR {p.amount_lkr.toLocaleString()}</td>
                    <td className="px-4 py-3 capitalize">{p.payment_method.replace(/_/g, ' ')}</td>
                    <td className="px-4 py-3">
                      <Badge status={p.payment_status} />
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-[11px]">
                      {new Date(p.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: AUDIT TRAIL */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Entity</th>
                  <th className="px-4 py-3">Details / Parameters</th>
                  <th className="px-4 py-3">IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-2.5 text-slate-400 whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-2.5 text-slate-800 font-sans">{log.user_email || 'Anonymous'}</td>
                    <td className="px-4 py-2.5 font-bold text-teal-800">{log.action}</td>
                    <td className="px-4 py-2.5 text-slate-600">{log.entity_type} #{log.entity_id || '0'}</td>
                    <td className="px-4 py-2.5 text-slate-600 max-w-xs truncate font-sans text-xs">{log.details || '—'}</td>
                    <td className="px-4 py-2.5 text-slate-400">{log.ip_address || '127.0.0.1'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE / EDIT VEHICLE MODAL */}
      <Modal
        isOpen={vehicleModalOpen}
        onClose={() => setVehicleModalOpen(false)}
        title={editingVehicleId ? 'Edit Vehicle Specifications & Tariffs' : 'Add New Vehicle to Fleet'}
        maxWidth="xl"
      >
        <form onSubmit={handleSaveVehicle} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Make *</label>
              <input
                type="text"
                required
                value={vMake}
                onChange={(e) => setVMake(e.target.value)}
                placeholder="e.g. Toyota"
                className="w-full px-3 py-1.5 border border-slate-300 rounded"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Model *</label>
              <input
                type="text"
                required
                value={vModel}
                onChange={(e) => setVModel(e.target.value)}
                placeholder="e.g. RAV4 AWD"
                className="w-full px-3 py-1.5 border border-slate-300 rounded"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Year *</label>
              <input
                type="number"
                min="2010"
                max="2030"
                required
                value={vYear}
                onChange={(e) => setVYear(Number(e.target.value))}
                className="w-full px-3 py-1.5 border border-slate-300 rounded"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Category *</label>
              <select
                value={vCategory}
                onChange={(e: any) => setVCategory(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded bg-white"
              >
                <option value="economy">Economy</option>
                <option value="suv">SUV</option>
                <option value="van">Van</option>
                <option value="luxury">Luxury</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Registration # *</label>
              <input
                type="text"
                required
                disabled={Boolean(editingVehicleId)}
                value={vReg}
                onChange={(e) => setVReg(e.target.value)}
                placeholder="WP-CBB-1290"
                className="w-full px-3 py-1.5 border border-slate-300 rounded font-mono uppercase disabled:bg-slate-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Transmission *</label>
              <select
                value={vTransmission}
                onChange={(e: any) => setVTransmission(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded bg-white"
              >
                <option value="automatic">Automatic</option>
                <option value="manual">Manual</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Fuel Type *</label>
              <select
                value={vFuelType}
                onChange={(e: any) => setVFuelType(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded bg-white"
              >
                <option value="petrol">Petrol</option>
                <option value="diesel">Diesel</option>
                <option value="hybrid">Hybrid</option>
                <option value="electric">Electric</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Seats *</label>
              <input
                type="number"
                min="1"
                max="20"
                required
                value={vSeats}
                onChange={(e) => setVSeats(Number(e.target.value))}
                className="w-full px-3 py-1.5 border border-slate-300 rounded"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Daily Rate (LKR) *</label>
              <input
                type="number"
                min="1000"
                required
                value={vDailyRate}
                onChange={(e) => setVDailyRate(Number(e.target.value))}
                className="w-full px-3 py-1.5 border border-slate-300 rounded"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Weekly Rate (LKR) *</label>
              <input
                type="number"
                min="5000"
                required
                value={vWeeklyRate}
                onChange={(e) => setVWeeklyRate(Number(e.target.value))}
                className="w-full px-3 py-1.5 border border-slate-300 rounded"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Deposit (LKR) *</label>
              <input
                type="number"
                min="0"
                required
                value={vDeposit}
                onChange={(e) => setVDeposit(Number(e.target.value))}
                className="w-full px-3 py-1.5 border border-slate-300 rounded"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Vehicle Image URL *
            </label>
            <input
              type="url"
              required
              value={vImage}
              onChange={(e) => setVImage(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-300 rounded"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Features (Comma-separated)
            </label>
            <input
              type="text"
              value={vFeatures}
              onChange={(e) => setVFeatures(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-300 rounded"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Description
            </label>
            <textarea
              rows={2}
              required
              value={vDescription}
              onChange={(e) => setVDescription(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-300 rounded"
            />
          </div>

          {editingVehicleId && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Fleet Status
              </label>
              <select
                value={vStatus}
                onChange={(e: any) => setVStatus(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded bg-white"
              >
                <option value="available">Available</option>
                <option value="rented">Rented</option>
                <option value="maintenance">Maintenance</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setVehicleModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSavingVehicle}
              className="px-5 py-2 text-xs font-semibold text-white bg-[#0F766E] hover:bg-[#0D655E] rounded-md transition-colors"
            >
              {isSavingVehicle ? 'Saving...' : editingVehicleId ? 'Update Specifications' : 'Add Vehicle'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
