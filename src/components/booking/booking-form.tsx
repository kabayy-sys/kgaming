'use client';

import { useState } from 'react';
import { X, Send, Clock, User } from 'lucide-react';
import { cn, generateWhatsAppMessage, getTodayDate } from '@/lib/utils';
import type { Device } from '@/types';

const WA_NUMBER = '6282152425391';
const DURATIONS = [1, 2, 3, 4, 5, 6, 8, 10, 12];

interface BookingFormProps {
  device: Device;
  onClose: () => void;
}

export function BookingForm({ device, onClose }: BookingFormProps) {
  const [customerName, setCustomerName] = useState('');
  const [startTime, setStartTime] = useState('');
  const [duration, setDuration] = useState(2);

  // Set default start time to next hour
  useState(() => {
    const now = new Date();
    now.setHours(now.getHours() + 1, 0, 0, 0);
    setStartTime(now.toTimeString().slice(0, 5));
  });

  const handleSubmit = () => {
    if (!customerName.trim() || !startTime) return;

    const message = generateWhatsAppMessage({
      deviceName: device.name,
      startTime,
      durationHours: duration,
      customerName: customerName.trim(),
      date: getTodayDate(),
    });

    const waUrl = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank');
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-50 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-x-0 bottom-0 z-50 animate-slide-up lg:inset-auto lg:top-1/2 lg:left-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2 lg:w-full lg:max-w-md">
        <div className="rounded-t-2xl lg:rounded-2xl border border-gaming-700 bg-gaming-950 p-5 lg:p-6 shadow-elevated">
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
            {/* Name */}
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

            {/* Time */}
            <div>
              <label className="block text-xs font-medium text-gaming-400 mb-1.5">Jam Mulai</label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gaming-500" />
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="input pl-10"
                />
              </div>
            </div>

            {/* Duration */}
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

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={!customerName.trim() || !startTime}
              className={cn(
                'btn w-full mt-2',
                customerName.trim() && startTime
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