'use client';

import { useState, useCallback, useEffect } from 'react';
import { useSlotStore } from '@/stores/slot-store';
import { useAuthStore } from '@/stores/auth-store';
import { supabase } from '@/lib/supabase';
import { cn, formatTimeDisplay, timeToMinutes } from '@/lib/utils';
import type { DeviceSchedule, SlotAvailability } from '@/stores/slot-store';
import type { ActivityAction } from '@/types';

// ---- Activity Logger ----
async function logActivity(params: {
  action: ActivityAction;
  actorId: string | null;
  actorName: string;
  targetType: string;
  targetId: string | null;
  details: Record<string, unknown>;
}) {
  try {
    await supabase.from('activity_logs').insert([params]);
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
}

interface SlotCellProps {
  slot: SlotAvailability;
  deviceId: string;
  isCompact?: boolean;
  onSlotAction: (action: 'update_status' | 'add_override' | 'clear_override', slot: SlotAvailability, deviceId: string) => void;
}

function SlotCell({ slot, deviceId, isCompact, onSlotAction }: SlotCellProps) {
  const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
    available: { bg: 'bg-gaming-800', text: 'text-gaming-600', label: 'Available' },
    booked: { bg: 'bg-rose-500/20', text: 'text-rose-400', label: 'Booked' },
    pending: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', label: 'Pending' },
    blocked: { bg: 'bg-gaming-700/50', text: 'text-gaming-500', label: 'Override' },
  };

  const config = statusConfig[slot.status] || statusConfig.available;

  if (isCompact) {
    return (
      <div
        className={cn(
          'h-2 rounded-sm transition-colors cursor-pointer',
          slot.status === 'available' && 'bg-gaming-800 hover:bg-gaming-700',
          slot.status === 'booked' && 'bg-rose-500',
          slot.status === 'pending' && 'bg-yellow-500',
          slot.status === 'blocked' && 'bg-gaming-600',
        )}
        title={`${slot.time} - ${config.label}`}
        onClick={() => onSlotAction('update_status', slot, deviceId)}
      />
    );
  }

  return (
    <button
      onClick={() => onSlotAction('update_status', slot, deviceId)}
      className={cn(
        'relative flex flex-col items-center justify-center px-1 py-2 text-[10px] font-medium rounded-lg transition-all duration-150',
        'border border-transparent hover:border-gaming-600/50 hover:shadow-sm',
        slot.status === 'available' && 'bg-gaming-800/50 text-gaming-500 hover:bg-gaming-800 hover:text-gaming-300',
        slot.status === 'booked' && 'bg-rose-500/15 text-rose-400 border-rose-500/20',
        slot.status === 'pending' && 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20',
        slot.status === 'blocked' && 'bg-gaming-700/30 text-gaming-500 border-gaming-700/30',
      )}
      title={slot.notes || config.label}
    >
      <span className="sr-only">{slot.time}</span>
      {slot.notes && slot.status === 'blocked' && (
        <span className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-gaming-500" />
      )}
    </button>
  );
}

interface DateNavigatorProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
}

function DateNavigator({ selectedDate, onDateChange }: DateNavigatorProps) {
  const today = new Date().toISOString().split('T')[0];

  const changeDay = (delta: number) => {
    const date = new Date(selectedDate + 'T12:00:00');
    date.setDate(date.getDate() + delta);
    onDateChange(date.toISOString().split('T')[0]);
  };

  const formatDisplay = (dateStr: string) => {
    const date = new Date(dateStr + 'T12:00:00');
    const days = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const dayName = days[date.getDay()];
    const dayNum = date.getDate();
    const monthName = months[date.getMonth()];
    const year = date.getFullYear();
    const isToday = dateStr === today;
    return (
      <div className="flex items-center gap-2">
        <span className={cn(
          'text-sm font-medium',
          isToday ? 'text-emerald-400' : 'text-gaming-200'
        )}>
          {dayName}
        </span>
        <span className="text-xs text-gaming-400">
          {dayNum} {monthName} {year}
        </span>
        {isToday && (
          <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-[10px] font-semibold text-emerald-400">
            Hari Ini
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="flex items-center justify-between">
      <button
        onClick={() => changeDay(-1)}
        className="btn-ghost btn-sm"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {formatDisplay(selectedDate)}

      <button
        onClick={() => changeDay(1)}
        className="btn-ghost btn-sm"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
}

interface DeviceRowProps {
  schedule: DeviceSchedule;
  slots: string[];
  isCompact: boolean;
  onSlotAction: (action: 'update_status' | 'add_override' | 'clear_override', slot: SlotAvailability, deviceId: string) => void;
  onDeviceClick: (device: DeviceSchedule['device']) => void;
}

function DeviceRow({ schedule, slots, isCompact, onSlotAction, onDeviceClick }: DeviceRowProps) {
  const { device } = schedule;
  const statusDotColor: Record<string, string> = {
    Ready: 'bg-emerald-400',
    'In Use': 'bg-orange-400',
    Booked: 'bg-purple-400',
    Pending: 'bg-yellow-400',
    Maintenance: 'bg-rose-400',
  };

  return (
    <div className="flex items-stretch gap-2">
      {/* Device Info */}
      <div className="w-28 lg:w-36 shrink-0 flex flex-col justify-center">
        <button
          onClick={() => onDeviceClick(device)}
          className="text-left group"
        >
          <div className="flex items-center gap-1.5">
            <span className={cn(
              'h-1.5 w-1.5 rounded-full shrink-0',
              statusDotColor[device.status] || 'bg-gaming-500'
            )} />
            <span className="text-xs font-medium text-gaming-200 group-hover:text-gaming-100 truncate">
              {device.name}
            </span>
          </div>
          <span className="text-[10px] text-gaming-500 ml-3 block truncate">
            {device.category} · Rp {device.hourly_price.toLocaleString()}/jam
          </span>
        </button>
      </div>

      {/* Slot Timeline */}
      <div className="flex-1 grid gap-0.5" style={{
        gridTemplateColumns: `repeat(${slots.length}, minmax(${isCompact ? '8px' : '24px'}, 1fr))`
      }}>
        {schedule.slots.map((slot, idx) => (
          <SlotCell
            key={`${slot.time}-${idx}`}
            slot={slot}
            deviceId={device.id}
            isCompact={isCompact}
            onSlotAction={onSlotAction}
          />
        ))}
      </div>
    </div>
  );
}

// ---- Slot Action Modal ----
interface SlotActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  slot: SlotAvailability | null;
  deviceId: string | null;
  onAction: (action: 'mark_used' | 'mark_maintenance' | 'clear') => void;
}

function SlotActionModal({ isOpen, onClose, slot, deviceId, onAction }: SlotActionModalProps) {
  const { devicesSchedule } = useSlotStore();
  const device = deviceId ? devicesSchedule.find(d => d.device.id === deviceId)?.device : null;

  if (!isOpen || !slot) return null;

  const isAvailable = slot.status === 'available';
  const isBooked = slot.status === 'booked' || slot.status === 'pending';
  const isBlocked = slot.status === 'blocked';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl border border-gaming-700/40 bg-gaming-900 shadow-xl p-5 space-y-4" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div>
          <h3 className="text-sm font-semibold text-gaming-100">{device?.name || 'Device'}</h3>
          <p className="text-xs text-gaming-500 mt-0.5">
            Slot: {slot.time}
            {slot.notes && ` · ${slot.notes}`}
          </p>
        </div>

        {/* Status Info */}
        <div className="flex items-center gap-2 text-xs">
          <span className={cn(
            'px-2 py-1 rounded-md font-medium',
            isAvailable && 'bg-gaming-800 text-gaming-400',
            isBooked && 'bg-rose-500/10 text-rose-400',
            isBlocked && 'bg-gaming-700/50 text-gaming-400',
          )}>
            {isAvailable && 'Available'}
            {slot.status === 'booked' && 'Booked'}
            {slot.status === 'pending' && 'Pending'}
            {isBlocked && 'Override: Maintenance/In Use'}
          </span>
        </div>

        {/* Actions */}
        <div className="space-y-2">
          {isAvailable && (
            <>
              <button
                onClick={() => onAction('mark_used')}
                className="w-full btn bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 border border-orange-500/20"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-orange-400" />
                Tandai Sedang Digunakan (In Use)
              </button>
              <button
                onClick={() => onAction('mark_maintenance')}
                className="w-full btn bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
                Tandai Maintenance
              </button>
            </>
          )}

          {isBlocked && (
            <button
              onClick={() => onAction('clear')}
              className="w-full btn bg-gaming-800 text-gaming-300 hover:bg-gaming-700 border border-gaming-600"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Hapus Override (Kembalikan ke Available)
            </button>
          )}

          <button onClick={onClose} className="w-full btn-ghost text-xs text-gaming-500">
            Batal
          </button>
        </div>
      </div>
    </div>
  );
}

// ---- Compact Timeline Toggle ----
interface ViewToggleProps {
  isCompact: boolean;
  onToggle: () => void;
}

function ViewToggle({ isCompact, onToggle }: ViewToggleProps) {
  return (
    <button
      onClick={onToggle}
      className="btn-ghost btn-sm"
      title={isCompact ? 'Tampilan Detail' : 'Tampilan Padat'}
    >
      {isCompact ? (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      )}
    </button>
  );
}

// ---- Legend ----
function Legend() {
  return (
    <div className="flex items-center gap-4 text-[10px] text-gaming-400">
      <div className="flex items-center gap-1.5">
        <div className="h-2 w-4 rounded-sm bg-gaming-800" />
        <span>Available</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="h-2 w-4 rounded-sm bg-rose-500" />
        <span>Booked</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="h-2 w-4 rounded-sm bg-yellow-500" />
        <span>Pending</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="h-2 w-4 rounded-sm bg-gaming-600" />
        <span>Override</span>
      </div>
    </div>
  );
}

// =============================================
// MAIN EXPORTED COMPONENT
// =============================================
export function DeviceScheduleView() {
  const {
    devicesSchedule,
    isLoading,
    selectedDate,
    setSelectedDate,
    fetchSchedule,
    addOverride,
    removeOverride,
    subscribeToOverrides,
  } = useSlotStore();

  const { user } = useAuthStore();
  const [isCompact, setIsCompact] = useState(false);
  const [actionModal, setActionModal] = useState<{
    isOpen: boolean;
    slot: SlotAvailability | null;
    deviceId: string | null;
  }>({ isOpen: false, slot: null, deviceId: null });

  // Fetch on mount and subscribe to realtime
  useEffect(() => {
    fetchSchedule(selectedDate);
    const unsubscribe = subscribeToOverrides();
    return () => {
      unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Refetch when date changes
  useEffect(() => {
    if (selectedDate) {
      fetchSchedule(selectedDate);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);

  const slots = useSlotStore.getState().generateTimeSlots();
  const actorName = user?.display_name || user?.username || 'Staff';
  const actorId = user?.id || null;

  const handleSlotAction = useCallback(
    async (action: 'update_status' | 'add_override' | 'clear_override', slot: SlotAvailability, deviceId: string) => {
      setActionModal({ isOpen: true, slot, deviceId });
    },
    []
  );

  const handleModalAction = useCallback(
    async (action: 'mark_used' | 'mark_maintenance' | 'clear') => {
      const { slot, deviceId } = actionModal;
      if (!slot || !deviceId) return;

      try {
        if (action === 'clear' && slot.overrideId) {
          await removeOverride(slot.overrideId);
          await logActivity({
            action: 'slot_cleared',
            actorId,
            actorName,
            targetType: 'slot_override',
            targetId: slot.overrideId,
            details: { time: slot.time, device_id: deviceId },
          });
        } else if (action === 'mark_maintenance') {
          const startMin = timeToMinutes(slot.time);
          const endMin = startMin + 30; // one slot interval
          const endH = Math.floor(endMin / 60) % 24;
          const endM = endMin % 60;
          const slotEnd = `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`;
          await addOverride({
            device_id: deviceId,
            slot_start: slot.time,
            slot_end: slotEnd,
            override_date: selectedDate,
            status: 'maintenance',
            staff_id: actorId,
            notes: 'Maintenance',
          });
          await logActivity({
            action: 'maintenance_enabled',
            actorId,
            actorName,
            targetType: 'slot_override',
            targetId: null,
            details: { time: slot.time, device_id: deviceId, status: 'maintenance' },
          });
        } else if (action === 'mark_used') {
          const startMin = timeToMinutes(slot.time);
          const endMin = startMin + 30; // one slot interval
          const endH = Math.floor(endMin / 60) % 24;
          const endM = endMin % 60;
          const slotEnd = `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`;
          await addOverride({
            device_id: deviceId,
            slot_start: slot.time,
            slot_end: slotEnd,
            override_date: selectedDate,
            status: 'in_use',
            staff_id: actorId,
            notes: 'Digunakan oleh staff',
          });
          await logActivity({
            action: 'session_started',
            actorId,
            actorName,
            targetType: 'slot_override',
            targetId: null,
            details: { time: slot.time, device_id: deviceId, status: 'in_use' },
          });
        }
      } catch (error) {
        console.error('Failed to process slot action:', error);
      } finally {
        setActionModal({ isOpen: false, slot: null, deviceId: null });
      }
    },
    [actionModal, selectedDate, addOverride, removeOverride, actorId, actorName]
  );

  const handleDeviceClick = useCallback(
    (device: DeviceSchedule['device']) => {
      console.log('Device clicked:', device.id);
    },
    []
  );

  if (isLoading && devicesSchedule.length === 0) {
    return (
      <div className="space-y-4">
        <div className="h-8 skeleton w-48" />
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-12 skeleton" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Date Navigator */}
      <div className="card p-3">
        <DateNavigator
          selectedDate={selectedDate}
          onDateChange={(date) => {
            setSelectedDate(date);
          }}
        />
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <Legend />
        <ViewToggle isCompact={isCompact} onToggle={() => setIsCompact(!isCompact)} />
      </div>

      {/* Schedule Grid */}
      <div className="card p-3 overflow-x-auto">
        <div className="min-w-[600px] space-y-1">
          {/* Time Header Row */}
          <div className="flex items-stretch gap-2 mb-2">
            <div className="w-28 lg:w-36 shrink-0" />
            <div className="flex-1 grid gap-0.5" style={{
              gridTemplateColumns: `repeat(${slots.length}, minmax(${isCompact ? '8px' : '24px'}, 1fr))`
            }}>
              {slots.map((time, idx) => {
                const minute = parseInt(time.split(':')[1]);
                const showLabel = minute === 0;
                return (
                  <div
                    key={`time-${time}-${idx}`}
                    className={cn(
                      'text-[8px] text-gaming-600 text-center font-mono',
                      !showLabel && 'invisible'
                    )}
                  >
                    {showLabel ? formatTimeDisplay(time) : '--:--'}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Device Rows */}
          <div className="space-y-1">
            {devicesSchedule.map((schedule) => (
              <DeviceRow
                key={schedule.device.id}
                schedule={schedule}
                slots={slots}
                isCompact={isCompact}
                onSlotAction={handleSlotAction}
                onDeviceClick={handleDeviceClick}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="card p-3">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="text-center">
            <div className="text-lg font-bold text-emerald-400">
              {devicesSchedule.filter(d => d.device.status === 'Ready').length}
            </div>
            <div className="text-[10px] text-gaming-500">Ready</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-orange-400">
              {devicesSchedule.filter(d => d.device.status === 'In Use').length}
            </div>
            <div className="text-[10px] text-gaming-500">In Use</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-purple-400">
              {devicesSchedule.filter(d => d.device.status === 'Booked' || d.device.status === 'Pending').length}
            </div>
            <div className="text-[10px] text-gaming-500">Booked/Pending</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-rose-400">
              {devicesSchedule.filter(d => d.device.status === 'Maintenance').length}
            </div>
            <div className="text-[10px] text-gaming-500">Maintenance</div>
          </div>
        </div>
      </div>

      {/* Slot Action Modal */}
      <SlotActionModal
        isOpen={actionModal.isOpen}
        onClose={() => setActionModal({ isOpen: false, slot: null, deviceId: null })}
        slot={actionModal.slot}
        deviceId={actionModal.deviceId}
        onAction={handleModalAction}
      />
    </div>
  );
}