import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
  Hr,
  Button,
} from "@react-email/components"

interface LowStockAlertProps {
  variants: Array<{ name: string; available: number; productName: string }>
  adminUrl: string
}

export default function LowStockAlertEmail({
  variants,
  adminUrl,
}: LowStockAlertProps) {
  return (
    <Html>
      <Head />
      <Preview>⚠️ Alert Stok Kritis — Bubblepi Store</Preview>
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
            Bubblepi Store — Admin Alert
          </Heading>
          <Hr style={{ borderColor: "#F4ABC4", marginBottom: 24 }} />

          <Heading as="h2" style={{ color: "#C0392B" }}>
            ⚠️ Stok Kritis Terdeteksi
          </Heading>

          <Text style={{ color: "#333456", fontSize: 15, lineHeight: "1.6" }}>
            Berikut adalah varian produk yang stoknya di bawah ambang batas
            kritis dan membutuhkan perhatian segera:
          </Text>

          {/* Table header */}
          <div
            style={{
              display: "table",
              width: "100%",
              borderCollapse: "collapse",
              marginTop: 16,
            }}
          >
            <div
              style={{
                display: "table-row",
                backgroundColor: "#333456",
                color: "#FFFFFF",
                fontWeight: "bold",
              }}
            >
              <div
                style={{
                  display: "table-cell",
                  padding: "8px 12px",
                  fontSize: 13,
                  border: "1px solid #ddd",
                }}
              >
                Produk
              </div>
              <div
                style={{
                  display: "table-cell",
                  padding: "8px 12px",
                  fontSize: 13,
                  border: "1px solid #ddd",
                }}
              >
                Varian
              </div>
              <div
                style={{
                  display: "table-cell",
                  padding: "8px 12px",
                  fontSize: 13,
                  border: "1px solid #ddd",
                  textAlign: "center",
                }}
              >
                Stok Tersisa
              </div>
            </div>

            {variants.map((v, i) => (
              <div
                key={i}
                style={{
                  display: "table-row",
                  backgroundColor: i % 2 === 0 ? "#FFF0F5" : "#FFFFFF",
                }}
              >
                <div
                  style={{
                    display: "table-cell",
                    padding: "8px 12px",
                    fontSize: 13,
                    border: "1px solid #ddd",
                    color: "#333456",
                  }}
                >
                  {v.productName}
                </div>
                <div
                  style={{
                    display: "table-cell",
                    padding: "8px 12px",
                    fontSize: 13,
                    border: "1px solid #ddd",
                    color: "#333456",
                  }}
                >
                  {v.name}
                </div>
                <div
                  style={{
                    display: "table-cell",
                    padding: "8px 12px",
                    fontSize: 13,
                    border: "1px solid #ddd",
                    color: v.available === 0 ? "#C0392B" : "#E67E22",
                    fontWeight: "bold",
                    textAlign: "center",
                  }}
                >
                  {v.available}
                </div>
              </div>
            ))}
          </div>

          <Button
            href={adminUrl}
            style={{
              backgroundColor: "#333456",
              color: "#FFFFFF",
              padding: "12px 28px",
              borderRadius: 8,
              textDecoration: "none",
              display: "inline-block",
              fontWeight: "bold",
              fontSize: 15,
              marginTop: 24,
            }}
          >
            Kelola Stok di Admin
          </Button>

          <Hr style={{ borderColor: "#F4ABC4", marginTop: 32 }} />

          <Text style={{ color: "#888", fontSize: 12, textAlign: "center" }}>
            Email ini dikirim otomatis oleh sistem Bubblepi Store.{" "}
            <Link href={adminUrl} style={{ color: "#F4ABC4" }}>
              Buka panel admin
            </Link>
          </Text>
        </Container>
      </Body>
    </Html>
  )
}
