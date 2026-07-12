import { Resend } from "resend"

function getResend() {
  return new Resend(process.env.RESEND_API_KEY)
}

export async function sendOrderConfirmation(params: {
  to: string
  orderNumber: string
  items: Array<{ name: string; quantity: number; price: number }>
  total: number
  paymentUrl: string
  orderId: string
}) {
  await getResend().emails.send({
    from: process.env.RESEND_FROM_EMAIL!,
    to: params.to,
    subject: `Bubblepi Store - Konfirmasi Pesanan ${params.orderNumber}`,
    html: `
      <h2>Konfirmasi Pesanan ${params.orderNumber}</h2>
      <p>Terima kasih, ${params.to}!</p>
      <p>Total: Rp${params.total.toLocaleString("id-ID")}</p>
      <p><a href="${params.paymentUrl}">Bayar Sekarang</a></p>
      <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/orders/${params.orderId}">Cek Status Pesanan</a></p>
    `,
    // ponytail: replace html with React Email template post-MVP (Task 7)
  })
}

export async function sendAccountDelivery(params: {
  to: string
  orderNumber: string
  items: Array<{ name: string; credentials: string[] }>
  orderId: string
}) {
  const itemsHtml = params.items
    .map(
      (item) => `
      <h3>${item.name}</h3>
      <ul>${item.credentials.map((c) => `<li><code>${c}</code></li>`).join("")}</ul>
    `
    )
    .join("")

  await getResend().emails.send({
    from: process.env.RESEND_FROM_EMAIL!,
    to: params.to,
    subject: `Bubblepi Store - Akun Anda Sudah Siap! ${params.orderNumber}`,
    html: `
      <h2>Akun Anda Sudah Siap! 🎉</h2>
      <p>Pesanan ${params.orderNumber} telah selesai diproses.</p>
      ${itemsHtml}
      <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/orders/${params.orderId}">Lihat Detail Pesanan</a></p>
    `,
    // ponytail: replace html with React Email template post-MVP (Task 7)
  })
}
