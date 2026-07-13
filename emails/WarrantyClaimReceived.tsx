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

interface WarrantyClaimReceivedProps {
  customerName: string
  orderNumber: string
  claimDescription: string
  orderUrl: string
}

export default function WarrantyClaimReceivedEmail({
  customerName,
  orderNumber,
  claimDescription,
  orderUrl,
}: WarrantyClaimReceivedProps) {
  return (
    <Html>
      <Head />
      <Preview>Klaim Garansi Diterima — Pesanan #{orderNumber}</Preview>
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
            🛡️ Klaim Garansi Diterima
          </Heading>

          <Text style={{ color: "#333456", fontSize: 16 }}>
            Halo, {customerName}!
          </Text>

          <Text style={{ color: "#333456", fontSize: 15, lineHeight: "1.6" }}>
            Kami telah menerima klaim garansi Anda untuk pesanan{" "}
            <strong>#{orderNumber}</strong>. Tim kami sedang meninjau permintaan
            Anda dan akan segera menghubungi Anda.
          </Text>

          <Text
            style={{
              color: "#333456",
              fontSize: 13,
              backgroundColor: "#F9F0F4",
              border: "1px solid #F4ABC4",
              borderRadius: 6,
              padding: "12px 16px",
              lineHeight: "1.6",
            }}
          >
            <strong>Deskripsi klaim:</strong>
            <br />
            {claimDescription}
          </Text>

          <Text style={{ color: "#333456", fontSize: 15, lineHeight: "1.6" }}>
            Estimasi penyelesaian: <strong>1–3 hari kerja</strong>. Kami akan
            menghubungi Anda melalui email ini begitu klaim diproses.
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
            Lihat Detail Pesanan
          </Button>

          <Hr style={{ borderColor: "#F4ABC4", marginTop: 32 }} />

          <Text style={{ color: "#888", fontSize: 12, textAlign: "center" }}>
            Ada pertanyaan? Balas email ini atau kunjungi{" "}
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
