"use client"

import { useState, useEffect } from "react"
import { useCart } from "@/context/CartContext"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import CheckoutStep1 from "@/components/store/CheckoutStep1"
import CheckoutStep2 from "@/components/store/CheckoutStep2"
import CheckoutStep3 from "@/components/store/CheckoutStep3"
import StepIndicator from "@/components/store/StepIndicator"
import { Card, CardContent } from "@/components/ui/card"
import type { CheckoutFormData } from "@/types"
import { trackEvent } from "@/lib/analytics"

export default function CheckoutPage() {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState<CheckoutFormData | null>(null)
  const [orderId, setOrderId] = useState<string | null>(null)
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null)
  const [orderCreatedAt, setOrderCreatedAt] = useState<string>(new Date().toISOString())
  const [submitting, setSubmitting] = useState(false)
  const { items, clearCart } = useCart()
  const router = useRouter()

  useEffect(() => {
    trackEvent("CHECKOUT_START")
  }, [])

  if (items.length === 0 && step < 3) {
    router.push("/cart")
    return null
  }

  async function handleStep1Submit(data: CheckoutFormData) {
    setFormData(data)
    setStep(2)
  }

  async function handleStep2Submit(voucherId?: string, discountAmount?: number) {
    if (!formData || submitting) return
    setSubmitting(true)

    try {
      const orderRes = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: formData.customerName,
          customerEmail: formData.customerEmail,
          items: items.map((i) => ({ variantId: i.variantId, quantity: i.quantity })),
          voucherId: voucherId ?? null,
          discountAmount: discountAmount ?? 0,
        }),
      })
      const orderData = await orderRes.json()
      if (!orderData.success) throw new Error(orderData.error ?? "Gagal membuat pesanan")

      const payRes = await fetch("/api/payments/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: orderData.data.orderId,
          paymentMethod: formData.paymentMethod,
          bankCode: formData.bankCode,
        }),
      })
      const payData = await payRes.json()
      if (!payData.success) throw new Error(payData.error ?? "Gagal membuat pembayaran")

      setOrderId(orderData.data.orderId)
      setPaymentUrl(payData.data.paymentUrl)
      setOrderCreatedAt(new Date().toISOString())
      clearCart()
      setStep(3)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8 text-center">Checkout</h1>
      <StepIndicator currentStep={step} />
      <Card className="mt-8">
        <CardContent className="p-6 md:p-8">
          {step === 1 && <CheckoutStep1 onSubmit={handleStep1Submit} />}
          {step === 2 && (
            <CheckoutStep2
              formData={formData!}
              onSubmit={handleStep2Submit}
              onBack={() => setStep(1)}
              submitting={submitting}
            />
          )}
          {step === 3 && orderId && (
            <CheckoutStep3 orderId={orderId} paymentUrl={paymentUrl} createdAt={orderCreatedAt} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
