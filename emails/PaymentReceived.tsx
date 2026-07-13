import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
  Hr,
} from "@react-email/components"

interface PaymentReceivedProps {
  customerName: string
  orderNumber: string
  orderUrl: string
}

export default function PaymentReceivedEmail({
  customerName,
  orderNumber,
  orderUrl,
}: PaymentReceivedProps) {
  return (
    <Html>
      <Head />
      <Preview>Pembayaran Diterima — Pesanan #{orderNumber}</Preview>
      <Body
        style={{
          fontFamily: "'Poppins', Arial, sans-serif",
          backgroundColor: "#FAFAFA",
          margin: 0,
          padding: 0,
        }}
      >
        <Container style={{ maxWidth: 600, margin: "0 auto", padding: 20 }}>
          <Heading
            style={{ color: "#333456", textAlign: "center", marginBottom: 4 }}
          >
            Bubblepi Store
          </Heading>
          <Hr style={{ borderColor: "#F4ABC4", marginBottom: 24 }} />

          <Heading as="h2" style={{ color: "#333456" }}>
            ✅ Pembayaran Diterima!
          </Heading>

          <Text style={{ color: "#333456", fontSize: 16 }}>
            Halo, {customerName}!
          </Text>

          <Text style={{ color: "#333456", fontSize: 15, lineHeight: "1.6" }}>
            Pembayaran untuk pesanan <strong>#{orderNumber}</strong> sudah kami
            terima. Akun/produk Anda sedang kami proses dan akan segera
            dikirimkan. Anda akan mendapat email konfirmasi begitu akun siap.
          </Text>

          <Button
            href={orderUrl}
            style={{
              backgroundColor: "#F4ABC4",
              color: "#333456",
              padding: "12px 28px",
              borderRadius: 8,
              textDecoration: "none",
              display: "inline-block",
              fontWeight: "bold",
              fontSize: 15,
              marginTop: 8,
            }}
          >
            Lihat Status Pesanan
          </Button>

          <Hr style={{ borderColor: "#F4ABC4", marginTop: 32 }} />

          <Text style={{ color: "#888", fontSize: 12, textAlign: "center" }}>
            Ada pertanyaan? Balas email ini atau hubungi kami melalui{" "}
            <Link href="https://bubblepi.store" style={{ color: "#F4ABC4" }}>
              bubblepi.store
            </Link>
            .
          </Text>
        </Container>
      </Body>
    </Html>
  )
}
