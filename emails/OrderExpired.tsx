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

interface OrderExpiredProps {
  customerName: string
  orderNumber: string
  storeUrl: string
}

export default function OrderExpiredEmail({
  customerName,
  orderNumber,
  storeUrl,
}: OrderExpiredProps) {
  return (
    <Html>
      <Head />
      <Preview>Pesanan #{orderNumber} Kedaluwarsa</Preview>
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
            ⏰ Pesanan Kedaluwarsa
          </Heading>

          <Text style={{ color: "#333456", fontSize: 16 }}>
            Halo, {customerName}!
          </Text>

          <Text style={{ color: "#333456", fontSize: 15, lineHeight: "1.6" }}>
            Sayangnya, batas waktu pembayaran untuk pesanan{" "}
            <strong>#{orderNumber}</strong> sudah berakhir dan pesanan Anda
            otomatis dibatalkan.
          </Text>

          <Text style={{ color: "#333456", fontSize: 15, lineHeight: "1.6" }}>
            Jangan khawatir — Anda bisa melakukan pesanan baru kapan saja.
            Produk kami masih tersedia dan siap untuk Anda!
          </Text>

          <Button
            href={storeUrl}
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
            Pesan Ulang Sekarang
          </Button>

          <Hr style={{ borderColor: "#F4ABC4", marginTop: 32 }} />

          <Text style={{ color: "#888", fontSize: 12, textAlign: "center" }}>
            Ada pertanyaan? Balas email ini atau kunjungi{" "}
            <Link href={storeUrl} style={{ color: "#F4ABC4" }}>
              bubblepi.store
            </Link>
            .
          </Text>
        </Container>
      </Body>
    </Html>
  )
}
