import Xendit from "xendit-node"
import type { CreateInvoiceRequest } from "xendit-node/invoice/models"

function getXenditClient() {
  return new Xendit({ secretKey: process.env.XENDIT_SECRET_KEY! })
}

export async function createInvoice(params: {
  orderId: string
  orderNumber: string
  amount: number
  paymentMethod: "QRIS" | "VA"
  bankCode?: string
  customerName: string
  customerEmail: string
}) {
  const xenditClient = getXenditClient()

  const invoiceData: CreateInvoiceRequest = {
    externalId: params.orderNumber,
    amount: params.amount,
    payerEmail: params.customerEmail,
    description: `Bubblepi Store - ${params.orderNumber}`,
    currency: "IDR",
    successRedirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/orders/${params.orderId}`,
    failureRedirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/orders/${params.orderId}`,
  }

  // Payment method selection — QRIS vs VA
  // ponytail: xendit-node v7 Invoice API tidak support paymentMethods filter di CreateInvoiceRequest
  // Untuk restrict ke QRIS/VA spesifik, pakai Xendit Payment Request API (v2) bukan Invoice API
  if (params.paymentMethod === "QRIS") {
    invoiceData.paymentMethods = ["QRIS"]
  } else if (params.paymentMethod === "VA" && params.bankCode) {
    const bankMap: Record<string, string> = {
      BCA: "BCA",
      BRI: "BRI",
      BNI: "BNI",
      PERMATA: "PERMATA",
    }
    const xenditBank = bankMap[params.bankCode.toUpperCase()]
    if (xenditBank) {
      invoiceData.paymentMethods = [xenditBank]
    }
  }

  const invoice = await xenditClient.Invoice.createInvoice({ data: invoiceData })
  return invoice
}
