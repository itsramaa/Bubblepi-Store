'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface OrderStatusPollProps {
  orderId: string
  currentStatus: string
}

const POLLING_STATUSES = ['PENDING', 'AWAITING_PAYMENT', 'PAID']
const POLL_INTERVAL = 5000

export function OrderStatusPoll({ orderId, currentStatus }: OrderStatusPollProps) {
  const router = useRouter()

  useEffect(() => {
    if (!POLLING_STATUSES.includes(currentStatus)) return
    const interval = setInterval(() => {
      router.refresh()
    }, POLL_INTERVAL)
    return () => clearInterval(interval)
  }, [orderId, currentStatus, router])

  return null
}