import React, { useState, useEffect } from 'react';
import {
  PartyPopper,
  Calendar,
  Users,
  Clock,
  Plus,
  Trash2,
  CheckCircle,
  AlertCircle,
  FileText,
  DollarSign,
  Phone,
  Tag,
  Printer,
  ChevronRight,
  RefreshCw
} from 'lucide-react';
import { api } from '../../services/api';

export default function BanquetView() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [notification, setNotification] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);

  const [formData, setFormData] = useState({
    customer_name: '',
    customer_phone: '',
    event_name: 'Birthday Celebration',
    hall_name: 'Alinea Grand Banquet',
    event_date: new Date().toISOString().slice(0, 10),
    event_time_slot: 'Dinner (7:00 PM - 11:00 PM)',
    pax: 50,
    rate_per_pax: 400,
    advance_paid: 5000,
    menu_details: '',
    remarks: '',
  });

  const loadBookings = async () => {
    setLoading(true);
    try {
      const res = await api.getBanquetBookings();
      if (res?.data) {
        setBookings(res.data);
      }
    } catch (err) {
      console.error('Error fetching banquet bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, []);

  const showNotification = (msg, isSuccess = true) => {
    setNotification({ msg, isSuccess });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleCreateBooking = async (e) => {
    e.preventDefault();
    if (!formData.customer_name || !formData.customer_phone || !formData.pax || !formData.rate_per_pax) {
      showNotification('Please fill all required banquet details', false);
      return;
    }

    try {
      const res = await api.createBanquetBooking(formData);
      if (res.success) {
        showNotification('Banquet booking created successfully!');
        setShowAddModal(false);
        setFormData({
          customer_name: '',
          customer_phone: '',
          event_name: 'Birthday Celebration',
          hall_name: 'Alinea Grand Banquet',
          event_date: new Date().toISOString().slice(0, 10),
          event_time_slot: 'Dinner (7:00 PM - 11:00 PM)',
          pax: 50,
          rate_per_pax: 400,
          advance_paid: 5000,
          menu_details: '',
          remarks: '',
        });
        loadBookings();
      }
    } catch (err) {
      showNotification(err.message, false);
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await api.updateBanquetBooking(id, { status });
      showNotification(`Booking marked as ${status}`);
      loadBookings();
    } catch (err) {
      showNotification(err.message, false);
    }
  };

  const handleDeleteBooking = async (id) => {
    if (!window.confirm('Delete this banquet booking?')) return;
    try {
      await api.deleteBanquetBooking(id);
      showNotification('Booking deleted');
      loadBookings();
    } catch (err) {
      showNotification(err.message, false);
    }
  };

  const totalPax = bookings.reduce((sum, b) => sum + (b.status !== 'CANCELLED' ? Number(b.pax) : 0), 0);
  const totalBanquetRevenue = bookings.reduce((sum, b) => sum + (b.status !== 'CANCELLED' ? Number(b.package_total) : 0), 0);
  const totalAdvanceCollected = bookings.reduce((sum, b) => sum + (b.status !== 'CANCELLED' ? Number(b.advance_paid) : 0), 0);

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-900 text-slate-100 overflow-hidden font-sans">
      {/* Top Header */}
      <div className="bg-slate-800/90 border-b border-slate-700/80 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-purple-500/10 text-purple-400 rounded-lg border border-purple-500/20">
            <PartyPopper className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-wide uppercase text-white flex items-center space-x-2">
              <span>Param Infotech - Banquet & Party Booking</span>
              <span className="text-[10px] bg-purple-900/60 text-purple-300 px-2 py-0.5 rounded font-mono border border-purple-700/50">
                HALL MANAGEMENT
              </span>
            </h1>
            <p className="text-[11px] text-slate-400">
              Manage party order bookings, guest pax packages, advances & banquet billing
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="px-3.5 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold rounded-lg text-xs flex items-center space-x-1.5 shadow transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Party Booking</span>
          </button>
          <button
            onClick={loadBookings}
            disabled={loading}
            className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded text-xs flex items-center space-x-1.5 text-slate-200 transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Notification Banner */}
      {notification && (
        <div
          className={`px-4 py-2 text-xs flex items-center space-x-2 border-b ${
            notification.isSuccess
              ? 'bg-emerald-950/80 text-emerald-200 border-emerald-800'
              : 'bg-red-950/80 text-red-200 border-red-800'
          }`}
        >
          {notification.isSuccess ? (
            <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
          )}
          <span>{notification.msg}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 pb-2">
        <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-3 flex items-center justify-between">
          <div>
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Bookings</div>
            <div className="text-lg font-mono font-bold text-white mt-0.5">{bookings.length} Events</div>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Pax</div>
            <div className="text-sm font-mono font-bold text-purple-400 mt-0.5">{totalPax} Guests</div>
          </div>
        </div>

        <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-3 flex items-center justify-between">
          <div>
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Package Value</div>
            <div className="text-lg font-mono font-bold text-amber-400 mt-0.5">₹{totalBanquetRevenue.toLocaleString()}</div>
          </div>
        </div>

        <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-3 flex items-center justify-between">
          <div>
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Advance Collected</div>
            <div className="text-lg font-mono font-bold text-emerald-400 mt-0.5">₹{totalAdvanceCollected.toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <div className="bg-slate-800/70 border border-slate-700 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse font-sans text-xs">
              <thead>
                <tr className="bg-slate-900/70 border-b border-slate-700 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                  <th className="py-2.5 px-3">Booking No.</th>
                  <th className="py-2.5 px-3">Date & Slot</th>
                  <th className="py-2.5 px-3">Customer & Contact</th>
                  <th className="py-2.5 px-3">Event & Hall</th>
                  <th className="py-2.5 px-3 text-center">Pax</th>
                  <th className="py-2.5 px-3 text-right">Rate/Pax</th>
                  <th className="py-2.5 px-3 text-right">Total Package</th>
                  <th className="py-2.5 px-3 text-right">Advance Paid</th>
                  <th className="py-2.5 px-3 text-right">Balance Due</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/60">
                {bookings.length === 0 ? (
                  <tr>
                    <td colSpan="11" className="py-10 text-center text-slate-500">
                      No banquet bookings found. Click "New Party Booking" to create one.
                    </td>
                  </tr>
                ) : (
                  bookings.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-700/30 transition">
                      <td className="py-2.5 px-3 font-mono font-bold text-purple-400">{b.booking_no}</td>
                      <td className="py-2.5 px-3 text-slate-200">
                        <div className="font-bold">{b.event_date}</div>
                        <div className="text-[10px] text-slate-400">{b.event_time_slot}</div>
                      </td>
                      <td className="py-2.5 px-3 text-slate-200">
                        <div className="font-semibold text-white">{b.customer_name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{b.customer_phone}</div>
                      </td>
                      <td className="py-2.5 px-3 text-slate-200">
                        <div className="font-semibold">{b.event_name}</div>
                        <div className="text-[10px] text-slate-400">{b.hall_name}</div>
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-white">{b.pax}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-300">₹{b.rate_per_pax}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-amber-400">
                        ₹{Number(b.package_total).toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-400">
                        ₹{Number(b.advance_paid).toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-red-400">
                        ₹{Number(b.balance_amount).toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            b.status === 'CONFIRMED'
                              ? 'bg-blue-500/10 text-blue-300 border-blue-500/30'
                              : b.status === 'BILLED'
                              ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                              : 'bg-red-500/10 text-red-300 border-red-500/30'
                          }`}
                        >
                          {b.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center space-x-1.5">
                          {b.status === 'CONFIRMED' && (
                            <button
                              onClick={() => handleUpdateStatus(b.id, 'BILLED')}
                              className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold transition cursor-pointer"
                              title="Complete & Settle Bill"
                            >
                              Settle Bill
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteBooking(b.id)}
                            className="p-1 text-slate-400 hover:text-red-400 hover:bg-red-950/40 rounded transition cursor-pointer"
                            title="Delete Booking"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* New Booking Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="px-5 py-4 bg-slate-900 border-b border-slate-700 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <PartyPopper className="w-5 h-5 text-purple-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  New Banquet / Party Booking
                </h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white text-lg font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateBooking} className="p-5 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">Customer / Party Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.customer_name}
                    onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                    placeholder="e.g. Rajeshbhai Shah"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">Contact Mobile *</label>
                  <input
                    type="text"
                    required
                    value={formData.customer_phone}
                    onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                    placeholder="e.g. 98981 12345"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-purple-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">Event Occasion</label>
                  <input
                    type="text"
                    value={formData.event_name}
                    onChange={(e) => setFormData({ ...formData, event_name: e.target.value })}
                    placeholder="e.g. Silver Anniversary / Birthday"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">Hall / Area</label>
                  <select
                    value={formData.hall_name}
                    onChange={(e) => setFormData({ ...formData, hall_name: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="Alinea Grand Banquet">Alinea Grand Banquet (Cap. 200)</option>
                    <option value="Alinea Mini Banquet">Alinea Mini Hall (Cap. 75)</option>
                    <option value="Garden Terrace Area">Garden Terrace Area (Cap. 120)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">Event Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.event_date}
                    onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-purple-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">Time Slot</label>
                  <select
                    value={formData.event_time_slot}
                    onChange={(e) => setFormData({ ...formData, event_time_slot: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="Lunch (11:00 AM - 3:30 PM)">Lunch (11:00 AM - 3:30 PM)</option>
                    <option value="Dinner (7:00 PM - 11:30 PM)">Dinner (7:00 PM - 11:30 PM)</option>
                    <option value="Full Day (10:00 AM - 10:00 PM)">Full Day (10:00 AM - 10:00 PM)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">Pax (Guests) *</label>
                  <input
                    type="number"
                    min="10"
                    required
                    value={formData.pax}
                    onChange={(e) => setFormData({ ...formData, pax: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-purple-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">Rate / Pax (₹) *</label>
                  <input
                    type="number"
                    min="100"
                    required
                    value={formData.rate_per_pax}
                    onChange={(e) => setFormData({ ...formData, rate_per_pax: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-purple-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">Advance (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.advance_paid}
                    onChange={(e) => setFormData({ ...formData, advance_paid: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-purple-500 font-mono"
                  />
                </div>
              </div>

              <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-700/60 flex justify-between items-center text-xs">
                <span className="text-slate-400">Calculated Package Total:</span>
                <span className="font-mono font-bold text-amber-400 text-sm">
                  ₹{(Number(formData.pax || 0) * Number(formData.rate_per_pax || 0)).toLocaleString()}
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Menu Items & Specifications</label>
                <textarea
                  rows="2"
                  value={formData.menu_details}
                  onChange={(e) => setFormData({ ...formData, menu_details: e.target.value })}
                  placeholder="Welcome drinks, soups, starters, main course, desserts list"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-purple-500 resize-none"
                ></textarea>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-300 font-semibold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold rounded-lg shadow transition cursor-pointer"
                >
                  Confirm & Save Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
