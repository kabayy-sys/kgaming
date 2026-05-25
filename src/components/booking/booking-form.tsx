'use client';

import { useState, useMemo } from 'react';
import { X, Send, Clock, User, CalendarDays } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Device } from '@/types';

const WA_NUMBER = '6282152425391';
const DURATIONS = [1, 2, 3, 4, 5, 6, 8, 10, 12];

// Generate time slots from 07:00 to 23:00 (cafe operational hours)
const TIME_SLOTS = Array.from({ length: 17 }, (_, i) => {
  const hour = i + 7;
  return `${hour.toString().padStart(2, '0')}:00`;
});

// Indonesian day/month names
const DAYS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

function formatDate(date: Date): string {
  return `${DAYS[date.getDay()]}, ${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

function toDateString(date: Date): string {
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
}

function generateWhatsAppMessage(params: {
  deviceName: string;
  date: string;
  startTime: string;
  durationHours: number;
  customerName: string;
}): string {
  const { deviceName, date, startTime, durationHours, customerName } = params;
  return `Halo admin K Gaming XCafe

Saya ingin booking:
- Device: ${deviceName}
- Tanggal: ${date}
- Jam: ${startTime}
- Durasi: ${durationHours} Jam
- Nama: ${customerName}`;
}

interface BookingFormProps {
  device: Device;
  onClose: () => void;
}

export function BookingForm({ device, onClose }: BookingFormProps) {
  const [customerName, setCustomerName] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState('');
  const [duration, setDuration] = useState(2);

  // Generate 7 upcoming days (today + 6)
  const dateOptions = useMemo(() => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      days.push(date);
    }
    return days;
  }, []);

  // Set default time to next hour
  useMemo(() => {
    const now = new Date();
    const nextHour = now.getHours() + 1;
    if (nextHour >= 7 && nextHour <= 23) {
      setSelectedTime(`${nextHour.toString().padStart(2, '0')}:00`);
    } else {
      setSelectedTime('10:00');
    }
    // Select today by default
    setSelectedDate(new Date());
  }, []);

  const handleSubmit = () => {
    if (!customerName.trim() || !selectedTime || !selectedDate) return;

    const message = generateWhatsAppMessage({
      deviceName: device.name,
      date: formatDate(selectedDate),
      startTime: selectedTime,
      durationHours: duration,
      customerName: customerName.trim(),
    });

    const waUrl = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank');
    onClose();
  };

  const isToday = (date: Date) => toDateString(date) === toDateString(new Date());
  const isSelected = (date: Date) => toDateString(date) === toDateString(selectedDate);

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/60" onClick={onClose} />
      <div className="fixed inset-x-0 bottom-0 z-50 animate-slide-up lg:inset-auto lg:top-1/2 lg:left-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2 lg:w-full lg:max-w-md">
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

            {/* Tanggal - Quick Pick */}
            <div>
              <label className="block text-xs font-medium text-gaming-400 mb-2">
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="h-3.5 w-3.5" />
                  Pilih Tanggal
                </span>
              </label>
              <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
                {dateOptions.map((date, i) => {
                  const days = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
                  const dayName = days[date.getDay()];
                  const dateNum = date.getDate();
                  return (
                    <button
                      key={i}
                      onClick={() => setSelectedDate(date)}
                      className={cn(
                        'flex flex-col items-center gap-0.5 rounded-xl px-3.5 py-2 min-w-[56px] transition-colors flex-shrink-0',
                        isSelected(date)
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

            {/* Jam - Quick Pick Grid */}
            <div>
              <label className="block text-xs font-medium text-gaming-400 mb-2">
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  Pilih Jam
                </span>
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {TIME_SLOTS.map((time) => {
                  const isAM = parseInt(time) < 12;
                  const display = isAM ? `${time}` : `${time}`;
                  return (
                    <button
                      key={time}
                      onClick={() => setSelectedTime(time)}
                      className={cn(
                        'rounded-lg py-2.5 text-xs font-medium transition-colors',
                        selectedTime === time
                          ? 'bg-emerald-500 text-white'
                          : 'bg-gaming-800 text-gaming-400 hover:bg-gaming-700'
                      )}
                    >
                      {display}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Durasi */}
            <div>
              <label className="block text-xs font-medium text-gaming-400 mb-1.5">Durasi</label>
              <div className="grid grid-cols-5 gap-1.5">
                {DURATIONS.map((h) => (
                  <button
                    key={h}
                    onClick={() => setDuration(h)}
                    className={cn(
                      'rounded-lg py-2 text-xs font-medium transition-colors',
                      duration === h
                        ? 'bg-emerald-500 text-white'
                        : 'bg-gaming-800 text-gaming-400 hover:bg-gaming-700'
                    )}
                  >
                    {h}j
                  </button>
                ))}
              </div>
            </div>

            {/* Estimated Price */}
            <div className="rounded-xl bg-gaming-800/50 border border-gaming-700/50 p-3 text-center">
              <p className="text-xs text-gaming-500 mb-0.5">Estimasi total</p>
              <p className="text-lg font-bold text-emerald-400">
                Rp{(device.hourly_price * duration).toLocaleString('id-ID')}
              </p>
            </div>

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={!customerName.trim() || !selectedTime}
              className={cn(
                'btn w-full',
                customerName.trim() && selectedTime
                  ? 'btn-primary'
                  : 'opacity-50 cursor-not-allowed bg-gaming-800 text-gaming-500'
              )}
            >
              <Send className="h-4 w-4" />
              Kirim via WhatsApp
            </button>

            <p className="text-center text-[11px] text-gaming-600">
              Booking akan dikirim via WhatsApp untuk persetujuan staff
            </p>
          </div>
        </div>
      </div>
    </>
  );
}