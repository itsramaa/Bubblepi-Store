'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface OrderStatusPollProps {
  orderId: string;
  currentStatus: string;
}

const POLLING_STATUSES = ['PENDING', 'AWAITING_PAYMENT', 'PAID'];
const POLL_INTERVAL = 5000; // 5 seconds

export function OrderStatusPoll({ orderId, currentStatus }: OrderStatusPollProps) {
  const router = useRouter();

  useEffect(() => {
    if (!POLLING_STATUSES.includes(currentStatus)) {
      return; // Don't poll for terminal statuses
    }

    const interval = setInterval(() => {
      router.refresh(); // Re-fetch server components
    }, POLL_INTERVAL);

    return () => clearInterval(interval);
  }, [orderId, currentStatus, router]);

  return null; // This is a logic-only component
}
