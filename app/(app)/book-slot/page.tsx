
'use client';
export const dynamic = 'force-dynamic';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface SlotData {
  id: string | null;
  number: number;
  startTime: string;
  endTime: string;
  status: 'EXPIRED' | 'FULL' | 'PARTIAL' | 'AVAILABLE';
  bookingCount: number;
  userBooked: boolean;
  isNextAvailable: boolean;
}

function formatTime(t: string) {
  const [h, m] = t.split(':').map(Number);
  const d = new Date(); d.setHours(h, m);
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
}

export default function BookSlotPage() {
  const [slots, setSlots] = useState<SlotData[]>([]);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();

  const today = new Date();

  useEffect(() => {
    fetchSlots();
  }, []);

  async function fetchSlots() {
    setLoading(true);
    try {
      const res = await fetch('/api/slots');
      const data = await res.json();
      setSlots(data.slots || []);
    } catch {
      setError('Failed to load slots');
    } finally {
      setLoading(false);
    }
  }

  async function handleBook(startTime: string) {
    setBooking(startTime);
    setError('');
    setSuccess('');
    try {
      const res = await fetch('/api/slots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startTime }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Booking failed');
      } else {
        if (data.matched) {
          setSuccess(`Matched instantly! Redirecting to your interview...`);
          setTimeout(() => router.push('/dashboard'), 1500);
        } else {
          setSuccess(`Booked! ${data.message}`);
          setTimeout(() => router.push('/dashboard'), 2000);
        }
        fetchSlots();
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setBooking(null);
    }
  }

  const statusLabel: Record<string, string> = {
    EXPIRED: 'EXPIRED',
    FULL: 'FULL',
    PARTIAL: 'AVAILABLE',
    AVAILABLE: 'AVAILABLE',
  };

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between mb-10 gap-4">
        <div>
<h2 className="text-3xl md:text-4xl font-headline font-black tracking-tight text-on-surface">
            {today.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </h2>
          <p className="text-on-surface-variant mt-2 max-w-lg text-sm leading-relaxed">
            Secure your high-performance mock interview session today. All slots are in UTC.
            Prepare your environment 5 minutes prior to the start time.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-surface-container-low px-4 py-3 rounded-xl border border-outline-variant/10 text-sm">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <div>
            <p className="text-[10px] text-on-surface-variant uppercase tracking-widest">Active Connection</p>
            <p className="font-bold text-on-surface">P2P Stable</p>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-error/10 border border-error/20 text-error text-sm flex items-center gap-2">
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>error</span>
          {error}
        </div>
      )}
      {success && (
        <div className="mb-6 p-4 rounded-xl bg-primary/10 border border-primary/20 text-primary text-sm flex items-center gap-2">
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>check_circle</span>
          {success}
        </div>
      )}

      {/* Slot grid */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="skeleton h-48 rounded-2xl" />
          ))}
        </div>
      ) : (
        <>
          {/* Top row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            {slots.slice(0, 4).map((slot) => (
              <SlotCard
                key={slot.number}
                slot={slot}
                onBook={handleBook}
                isBooking={booking === slot.startTime}
                statusLabel={statusLabel}
              />
            ))}
          </div>
          {/* Bottom row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {slots.slice(4).map((slot) => (
              <SlotCard
                key={slot.number}
                slot={slot}
                onBook={handleBook}
                isBooking={booking === slot.startTime}
                statusLabel={statusLabel}
              />
            ))}
          </div>
        </>
      )}


    </div>
  );
}

function SlotCard({
  slot,
  onBook,
  isBooking,
  statusLabel,
}: {
  slot: SlotData;
  onBook: (t: string) => void;
  isBooking: boolean;
  statusLabel: Record<string, string>;
}) {
  const isExpired = slot.status === 'EXPIRED';
  const isFull = slot.status === 'FULL';
  const isBooked = slot.userBooked;
  const canBook = !isExpired && !isFull && !isBooked;

  return (
    <div
      className={`rounded-2xl p-5 flex flex-col gap-4 transition-all duration-200 ${
        slot.isNextAvailable
          ? 'bg-primary/10 border-2 border-primary/40 ring-1 ring-primary/20'
          : isExpired || isFull
          ? 'bg-surface-container opacity-60'
          : 'bg-surface-container hover:bg-surface-container-high'
      }`}
    >
      {/* Top row */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-on-surface-variant">
          Session #{String(slot.number).padStart(2, '0')}
        </span>
        {slot.isNextAvailable ? (
          <span className="px-2 py-0.5 rounded-full text-[9px] font-black text-primary-container bg-primary uppercase tracking-wider">
            Next Available
          </span>
        ) : (
          <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
            isExpired ? 'bg-surface-container-high text-on-surface-variant/60'
              : isFull ? 'bg-error/10 text-error'
              : 'bg-primary/10 text-primary'
          }`}>
            {isBooked ? 'BOOKED' : statusLabel[slot.status]}
          </span>
        )}
      </div>

      {/* Time */}
      <div className="flex items-center gap-2">
        {slot.isNextAvailable ? (
          <span className="material-symbols-outlined text-on-surface" style={{ fontSize: '22px', fontVariationSettings: "'FILL' 1" }}>alarm</span>
        ) : (
          <span className="material-symbols-outlined text-on-surface-variant/60" style={{ fontSize: '20px' }}>schedule</span>
        )}
        <span className={`text-2xl font-headline font-black ${
          isExpired ? 'text-on-surface-variant/40' : 'text-on-surface'
        }`}>
          {formatTime(slot.startTime)}
        </span>
      </div>

      {/* Partial indicator */}
      {slot.status === 'PARTIAL' && (
        <div className="text-[10px] text-on-surface-variant flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-primary/60 inline-block" />
          1 user waiting
        </div>
      )}

      {/* Button */}
      {isBooked ? (
        <div className="py-2.5 rounded-xl text-center text-xs font-bold bg-primary/10 text-primary">
          ✓ Booked
        </div>
      ) : canBook ? (
        <button
          onClick={() => onBook(slot.startTime)}
          disabled={isBooking}
          className={`py-2.5 rounded-xl text-xs font-bold transition-all ${
            slot.isNextAvailable
              ? 'btn-primary'
              : 'bg-surface-container-high text-on-surface hover:bg-surface-bright'
          } disabled:opacity-50`}
        >
          {isBooking ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
              Booking...
            </span>
          ) : slot.isNextAvailable ? 'Instant Book' : 'Book Slot'}
        </button>
      ) : (
        <button disabled className="py-2.5 rounded-xl text-xs font-bold bg-surface-container-high text-on-surface-variant/40 cursor-not-allowed">
          Not Available
        </button>
      )}
    </div>
  );
}
