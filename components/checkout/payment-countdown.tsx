'use client';

import { useState, useEffect } from 'react';

interface PaymentCountdownProps {
  expiresAt: string; // ISO date string
  onExpired?: () => void;
}

export function PaymentCountdown({ expiresAt, onExpired }: PaymentCountdownProps) {
  const [timeLeft, setTimeLeft] = useState('');
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    function calculate() {
      const now = new Date().getTime();
      const expiry = new Date(expiresAt).getTime();
      const diff = expiry - now;

      if (diff <= 0) {
        setTimeLeft('Kedaluwarsa');
        setExpired(true);
        onExpired?.();
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (hours > 0) {
        setTimeLeft(`${hours}j ${minutes}m ${seconds}d`);
      } else {
        setTimeLeft(`${minutes}m ${seconds}d`);
      }
    }

    calculate();
    const interval = setInterval(calculate, 1000);
    return () => clearInterval(interval);
  }, [expiresAt, onExpired]);

  if (expired) {
    return (
      <div className="rounded-lg bg-red-50 p-4 text-red-800 dark:bg-red-900 dark:text-red-200">
        <p className="font-semibold">Pembayaran kedaluwarsa</p>
        <p className="text-sm">Silakan lakukan pemesanan ulang</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-amber-50 p-4 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
      <p className="text-sm font-medium">Sisa waktu pembayaran</p>
      <p className="text-2xl font-bold tabular-nums">{timeLeft}</p>
    </div>
  );
}
