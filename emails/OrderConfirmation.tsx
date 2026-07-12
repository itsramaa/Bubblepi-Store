import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
  Button,
  Hr,
} from "@react-email/components"

interface OrderConfirmationProps {
  orderNumber: string
  items: Array<{ name: string; quantity: number; price: number }>
  total: number
  paymentUrl: string
  trackingUrl: string
}

export default function OrderConfirmationEmail({
  orderNumber,
  items,
  total,
  paymentUrl,
  trackingUrl,
}: OrderConfirmationProps) {
  return (
    <Html>
      <Head />
      <Preview>Bubblepi Store - Pesanan {orderNumber}</Preview>
      <Body style={{ fontFamily: "Arial, sans-serif", backgroundColor: "#FAFAFA" }}>
        <Container style={{ maxWidth: 600, margin: "0 auto", padding: 20 }}>
          <Heading style={{ color: "#7C3AED", textAlign: "center" }}>
            Bubblepi Store
          </Heading>
          <Heading as="h2">Konfirmasi Pesanan {orderNumber}</Heading>
          <Text>Terima kasih! Pesanan Anda sudah diterima.</Text>

          {items.map((item, i) => (
            <Text key={i}>
              {item.name} x{item.quantity} - Rp {item.price.toLocaleString("id-ID")}
            </Text>
          ))}

          <Hr />
          <Text style={{ fontWeight: "bold" }}>
            Total: Rp {total.toLocaleString("id-ID")}
          </Text>

          <Button
            href={paymentUrl}
            style={{
              backgroundColor: "#7C3AED",
              color: "#FFFFFF",
              padding: "12px 24px",
              borderRadius: 8,
              textDecoration: "none",
              display: "inline-block",
            }}
          >
            Bayar Sekarang
          </Button>

          <Text style={{ marginTop: 20 }}>
            <Link href={trackingUrl}>Lacak Status Pesanan</Link>
          </Text>
        </Container>
      </Body>
    </Html>
  )
}
