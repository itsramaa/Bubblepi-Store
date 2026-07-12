import Xendit from "xendit-node"

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
  // ponytail: xendit-node v7 API — check SDK docs if invoice shape changes
  const invoice = await xenditClient.Invoice.createInvoice({
    data: {
      externalId: params.orderNumber,
      amount: params.amount,
      payerEmail: params.customerEmail,
      description: `Bubblepi Store - ${params.orderNumber}`,
      currency: "IDR",
      successRedirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/orders/${params.orderId}`,
      failureRedirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/orders/${params.orderId}`,
    },
  })
  return invoice
}

