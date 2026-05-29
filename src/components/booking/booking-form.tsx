'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { X, Send, Clock, User, CalendarDays } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useBookingStore } from '@/stores/booking-store';
import {
  generateTimeSlots,
  generateSlotsWithAvailability,
  getBlockedSlots,
  timeToMinutes,
  formatIndonesianDate,
  toDateString,
  formatDuration,
  formatTimeDisplay,
  slotStatusColors,
} from '@/lib/utils';
import type { Device, TimeSlot, SlotStatus, Booking } from '@/types';

const WA_NUMBER = '6282152425391';
const DURATIONS = [1, 2, 3, 4, 6, 8]; // in hours
const ALL_SLOTS = generateTimeSlots();

function getDateOptions(): Date[] {
  const days = [];
  for (let i = 0; i < 14; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    days.push(date);
  }
  return days;
}

const DAYS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

function isToday(date: Date): boolean {
  return toDateString(date) === toDateString(new Date());
}

function isPastTimeSlot(slotTime: string, date: Date): boolean {
  const now = new Date();
  if (toDateString(date) !== toDateString(now)) return false;
  const slotMinutes = timeToMinutes(slotTime);
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  // Post-midnight slots (00:00 - 01:00) are in the NEXT operational day.
  // If the current time is past 01:00, these slots are not "past" — they are future for today's schedule.
  // Only mark as past if current time is already past that slot AND we're past 01:00 AM
  if (slotMinutes < 60) {
    // Slot is in early morning (00:00 - 01:00)
    // If current time is >= 01:00, this slot is actually in the future for today's schedule
    return nowMinutes > slotMinutes && nowMinutes >= 60;
  }
  return slotMinutes <= nowMinutes;
}

interface BookingFormProps {
  device: Device;
  onClose: () => void;
}

export function BookingForm({ device, onClose }: BookingFormProps) {
  const { fetchBookingsByDevice, createBooking } = useBookingStore();
  const [customerName, setCustomerName] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedStartTime, setSelectedStartTime] = useState<string | null>(null);
  const [durationHours, setDurationHours] = useState(2);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dateOptions = useMemo(() => getDateOptions(), []);

  const loadSlots = useCallback(async () => {
    setIsLoadingSlots(true);
    setSelectedStartTime(null);
    try {
      const existingBookings = await fetchBookingsByDevice(
        device.id,
        toDateString(selectedDate)
      );
      const formattedBookings = existingBookings.map((b: Booking) => ({
        start_time: b.slot_start,
        end_time: b.slot_end,
        status: b.status,
        id: b.id,
      }));
      const availableSlots = generateSlotsWithAvailability(ALL_SLOTS, formattedBookings);
      setSlots(availableSlots);
    } catch {
      setSlots(ALL_SLOTS.map((t) => ({ time: t, status: 'available' as SlotStatus })));
    } finally {
      setIsLoadingSlots(false);
    }
  }, [device.id, selectedDate, fetchBookingsByDevice]);

  useEffect(() => {
    loadSlots();
  }, [loadSlots]);

  const blockedSlots = useMemo(() => {
    if (!selectedStartTime) return [];
    return getBlockedSlots(selectedStartTime, durationHours * 60);
  }, [selectedStartTime, durationHours]);

  const getSlotDisplay = useCallback(
    (slot: TimeSlot): { status: SlotStatus; isSelected: boolean } => {
      const isInBlockedRange = selectedStartTime && blockedSlots.includes(slot.time);
      const isStartSlot = slot.time === selectedStartTime;
      const isPast = isPastTimeSlot(slot.time, selectedDate);

      if (isStartSlot) return { status: 'available', isSelected: true };
      if (isInBlockedRange && slot.status === 'available') return { status: 'blocked', isSelected: false };
      if (isPast && slot.status === 'available') return { status: 'blocked', isSelected: false };
      return { status: slot.status, isSelected: false };
    },
    [selectedStartTime, blockedSlots, selectedDate]
  );

  const handleSlotClick = (slot: TimeSlot) => {
    if (slot.status !== 'available') return;
    const isPast = isPastTimeSlot(slot.time, selectedDate);
    if (isPast) return;
    setSelectedStartTime(slot.time);
    setError(null);
  };

  const handleSubmit = async () => {
    if (!customerName.trim() || !selectedStartTime) return;

    const startMinutes = timeToMinutes(selectedStartTime);
    const endMinutes = startMinutes + durationHours * 60;
    const endHour = Math.floor(endMinutes / 60) % 24;
    const endMin = endMinutes % 60;
    const endTime = `${endHour.toString().padStart(2, '0')}:${endMin.toString().padStart(2, '0')}`;

    setIsSubmitting(true);
    setError(null);

    try {
      await createBooking({
        device_id: device.id,
        customer_name: customerName.trim(),
        booking_date: toDateString(selectedDate),
        slot_start: selectedStartTime,
        slot_end: endTime,
        duration_minutes: durationHours * 60,
      });

      const message = `Halo admin K Gaming XCafe

Saya ingin booking:

Device: ${device.name}
Tanggal: ${formatIndonesianDate(selectedDate)}
Jam: ${selectedStartTime}
Durasi: ${durationHours} Jam
Nama: ${customerName.trim()}`;

      const waUrl = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(message)}`;
      window.open(waUrl, '_blank');
      onClose();
    } catch (err) {
      setError('Gagal membuat booking. Silakan coba lagi.');
      console.error('Failed to submit booking:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/60" onClick={onClose} />
      <div className="fixed inset-x-0 bottom-0 z-50 animate-slide-up lg:inset-auto lg:top-1/2 lg:left-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2 lg:w-full lg:max-w-lg">
        <div className="rounded-t-2xl lg:rounded-2xl border border-gaming-700 bg-gaming-950 p-5 lg:p-6 shadow-elevated max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-semibold text-gaming-100">
                Booking {device.name}
              </h2>
              <p className="text-xs text-gaming-500 mt-0.5">
                Rp{device.hourly_price.toLocaleString('id-ID')}/jam
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gaming-500 hover:text-gaming-300 hover:bg-gaming-800 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-4">
            {/* Nama */}
            <div>
              <label className="block text-xs font-medium text-gaming-400 mb-1.5">Nama Kamu</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gaming-500" />
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Masukkan nama"
                  className="input pl-10"
                />
              </div>
            </div>

            {/* Tanggal */}
            <div>
              <label className="block text-xs font-medium text-gaming-400 mb-2">
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="h-3.5 w-3.5" />
                  Pilih Tanggal
                </span>
              </label>
              <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
                {dateOptions.map((date, i) => {
                  const dayName = DAYS[date.getDay()];
                  const dateNum = date.getDate();
                  const isSel = toDateString(date) === toDateString(selectedDate);
                  return (
                    <button
                      key={i}
                      onClick={() => setSelectedDate(date)}
                      className={cn(
                        'flex flex-col items-center gap-0.5 rounded-xl px-3.5 py-2 min-w-[56px] transition-colors flex-shrink-0',
                        isSel
                          ? 'bg-emerald-500 text-white'
                          : 'bg-gaming-800 text-gaming-400 hover:bg-gaming-700'
                      )}
                    >
                      <span className="text-[10px] font-medium">{dayName}</span>
                      <span className="text-sm font-bold">{dateNum}</span>
                      {isToday(date) && (
                        <span className="text-[8px] font-medium opacity-80">Hari ini</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Time Slots */}
            <div>
              <label className="block text-xs font-medium text-gaming-400 mb-2">
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  Pilih Jam Mulai
                </span>
              </label>
              {isLoadingSlots ? (
                <div className="grid grid-cols-4 gap-1.5">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <div key={i} className="h-10 rounded-lg skeleton" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-1.5 max-h-48 overflow-y-auto no-scrollbar pr-1">
                  {slots.map((slot) => {
                    const display = getSlotDisplay(slot);
                    const isPast = isPastTimeSlot(slot.time, selectedDate);
                    const canClick = slot.status === 'available' && !isPast;

                    let colors = slotStatusColors[slot.status];
                    if (display.isSelected) {
                      colors = { bg: 'bg-emerald-500', text: 'text-white', border: 'border-emerald-500' };
                    } else if (slot.status === 'available' && display.status === 'blocked') {
                      colors = slotStatusColors.blocked;
                    }

                    return (
                      <button
                        key={slot.time}
                        onClick={() => handleSlotClick(slot)}
                        disabled={!canClick}
                        className={cn(
                          'rounded-lg py-2.5 text-xs font-medium transition-all border',
                          colors.bg,
                          colors.text,
                          colors.border,
                          display.isSelected && 'ring-2 ring-emerald-400 ring-offset-1 ring-offset-gaming-950 scale-105',
                          canClick && 'hover:bg-emerald-500/20 hover:text-emerald-400 cursor-pointer',
                          !canClick && 'cursor-not-allowed'
                        )}
                      >
                        {formatTimeDisplay(slot.time)}
                        {slot.status === 'booked' && ' ❌'}
                        {slot.status === 'pending' && ' ⏳'}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Durasi - only show when time selected */}
            {selectedStartTime && (
              <div>
                <label className="block text-xs font-medium text-gaming-400 mb-1.5">Durasi</label>
                <div className="grid grid-cols-6 gap-1.5">
                  {DURATIONS.map((h) => {
                    const endMin = timeToMinutes(selectedStartTime) + h * 60;
                    const endH = Math.floor(endMin / 60) % 24;
                    const endM = endMin % 60;
                    const endTime = `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`;
                    return (
                      <button
                        key={h}
                        onClick={() => {
                          setDurationHours(h);
                          setError(null);
                        }}
                        className={cn(
                          'rounded-lg py-2 text-xs font-medium transition-colors',
                          durationHours === h
                            ? 'bg-emerald-500 text-white'
                            : 'bg-gaming-800 text-gaming-400 hover:bg-gaming-700'
                        )}
                      >
                        {h}j
                        <span className="block text-[9px] opacity-60">{endTime}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Selected Info & Price */}
            {selectedStartTime && (
              <div className="rounded-xl bg-gaming-800/50 border border-gaming-700/50 p-3 space-y-1.5">
                <div className="flex justify-between text-xs text-gaming-400">
                  <span>Jam mulai</span>
                  <span className="text-gaming-200 font-medium">{formatTimeDisplay(selectedStartTime)}</span>
                </div>
                <div className="flex justify-between text-xs text-gaming-400">
                  <span>Durasi</span>
                  <span className="text-gaming-200 font-medium">{formatDuration(durationHours * 60)}</span>
                </div>
                <div className="border-t border-gaming-700/50 pt-1.5 flex justify-between text-sm">
                  <span className="text-gaming-400">Estimasi total</span>
                  <span className="text-emerald-400 font-bold">
                    Rp{(device.hourly_price * durationHours).toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <p className="text-xs text-rose-400 text-center bg-rose-500/10 rounded-lg py-2">{error}</p>
            )}

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={!customerName.trim() || !selectedStartTime || isSubmitting}
              className={cn(
                'btn w-full',
                customerName.trim() && selectedStartTime && !isSubmitting
                  ? 'btn-primary'
                  : 'opacity-50 cursor-not-allowed bg-gaming-800 text-gaming-500'
              )}
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Memproses...
                </span>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Kirim via WhatsApp
                </>
              )}
            </button>

            <p className="text-center text-[11px] text-gaming-600">
              Booking akan disimpan dan dikirim via WhatsApp untuk persetujuan staff
            </p>
          </div>
        </div>
      </div>
    </>
  );
}