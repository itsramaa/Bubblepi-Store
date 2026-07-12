"use client"

import { useState } from "react"
import { useCart } from "@/context/CartContext"
import { useRouter } from "next/navigation"
import CheckoutStep1 from "@/components/store/CheckoutStep1"
import CheckoutStep2 from "@/components/store/CheckoutStep2"
import CheckoutStep3 from "@/components/store/CheckoutStep3"
import StepIndicator from "@/components/store/StepIndicator"
import { Card, CardContent } from "@/components/ui/card"
import type { CheckoutFormData } from "@/types"

export default function CheckoutPage() {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState<CheckoutFormData | null>(null)
  const [orderId, setOrderId] = useState<string | null>(null)
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null)
  const { items, clearCart } = useCart()
  const router = useRouter()

  if (items.length === 0 && step < 3) {
    router.push("/cart")
    return null
  }

  async function handleStep1Submit(data: CheckoutFormData) {
    setFormData(data)
    setStep(2)
  }

  async function handleStep2Submit() {
    if (!formData) return

    const orderRes = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerName: formData.customerName,
        customerEmail: formData.customerEmail,
        items: items.map((i) => ({ variantId: i.variantId, quantity: i.quantity })),
      }),
    })
    const orderData = await orderRes.json()
    if (!orderData.success) { alert("Gagal membuat pesanan"); return }

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
    if (!payData.success) { alert("Gagal membuat pembayaran"); return }

    setOrderId(orderData.data.orderId)
    setPaymentUrl(payData.data.paymentUrl)
    clearCart()
    setStep(3)
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">Checkout</h1>
      <StepIndicator currentStep={step} />
      <Card className="mt-8">
        <CardContent className="p-6">
          {step === 1 && <CheckoutStep1 onSubmit={handleStep1Submit} />}
          {step === 2 && (
            <CheckoutStep2
              formData={formData!}
              onSubmit={handleStep2Submit}
              onBack={() => setStep(1)}
            />
          )}
          {step === 3 && orderId && (
            <CheckoutStep3 orderId={orderId} paymentUrl={paymentUrl} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
