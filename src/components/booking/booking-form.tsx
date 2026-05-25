'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
  const router = useRouter();
  const [customerName, setCustomerName] = useState('');
  const [startTime, setStartTime] = useState('');
  const [duration, setDuration] = useState(2);
  const [isValid, setIsValid] = useState(false);

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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="relative w-full animate-slide-up rounded-t-3xl border border-gaming-500/20 bg-gaming-800 p-6 sm:max-w-md sm:rounded-3xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gaming-50">Book Device</h2>
            <p className="mt-0.5 text-sm text-gaming-400">{device.name}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-gaming-400 hover:bg-gaming-700/50 hover:text-gaming-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Price Info */}
        <div className="mb-6 rounded-xl bg-gaming-700/50 p-3 text-center">
          <span className="text-2xl font-bold text-neon-cyan">
            Rp {device.hourly_price.toLocaleString('id-ID')}
          </span>
          <span className="ml-1 text-sm text-gaming-400">/jam</span>
        </div>

        <div className="space-y-4">
          {/* Customer Name */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gaming-300">
              Your Name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gaming-400" />
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Masukkan nama kamu"
                className="input-field pl-10"
              />
            </div>
          </div>

          {/* Start Time */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gaming-300">
              Start Time
            </label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gaming-400" />
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="input-field pl-10"
              />
            </div>
          </div>

          {/* Duration */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gaming-300">
              Duration
            </label>
            <div className="grid grid-cols-5 gap-2">
              {DURATIONS.map((h) => (
                <button
                  key={h}
                  onClick={() => setDuration(h)}
                  className={cn(
                    'rounded-xl py-2 text-xs font-medium transition-all duration-200',
                    duration === h
                      ? 'bg-neon-cyan text-gaming-900'
                      : 'bg-gaming-700/50 text-gaming-300 hover:bg-gaming-600/50'
                  )}
                >
                  {h}h
                </button>
              ))}
            </div>
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={!customerName.trim() || !startTime}
            className={cn(
              'btn w-full gap-2',
              customerName.trim() && startTime
                ? 'btn-primary'
                : 'cursor-not-allowed bg-gaming-700/50 text-gaming-500'
            )}
          >
            <Send className="h-4 w-4" />
            Send via WhatsApp
          </button>

          <p className="text-center text-xs text-gaming-500">
            Booking request will be sent via WhatsApp for staff approval
          </p>
        </div>
      </div>
    </div>
  );
}