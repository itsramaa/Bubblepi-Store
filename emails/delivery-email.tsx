/**
 * Delivery Email Templates
 * Uses React Email compatible components
 */

import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Section,
  Text,
  Button,
  Hr,
  Img,
} from "@react-email/components"
import * as React from "react"

interface DeliveryEmailProps {
  customerName: string
  orderNumber: string
  productName: string
  variantName: string
  credentials: string
  warrantyExpiry?: string
  supportUrl: string
}

export const DeliveryEmail = ({
  customerName,
  orderNumber,
  productName,
  variantName,
  credentials,
  warrantyExpiry,
  supportUrl,
}: DeliveryEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Pesanan Anda telah siap - {orderNumber}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Img
              src="https://bubblepi.store/logo.png"
              width="48"
              height="48"
              alt="BubblePI"
              style={logo}
            />
            <Text style={headerTitle}>BubblePI Store</Text>
          </Section>

          <Section style={content}>
            <Text style={greeting}>Halo, {customerName}!</Text>
            <Text style={text}>
              Pesanan Anda telah siap! Berikut detail pesanan:
            </Text>

            <Section style={orderBox}>
              <Text style={orderLabel}>Nomor Pesanan</Text>
              <Text style={orderValue}>{orderNumber}</Text>
              
              <Hr style={hr} />
              
              <Text style={orderLabel}>Produk</Text>
              <Text style={orderValue}>{productName}</Text>
              
              <Text style={orderLabel}>Variant</Text>
              <Text style={orderValue}>{variantName}</Text>
            </Section>

            <Section style={credentialsBox}>
              <Text style={credentialsTitle}>🎉 Akun Anda</Text>
              <Text style={credentialsLabel}>Email/Username</Text>
              <Text style={credentialsValue}>{credentials.split("\n")[0]}</Text>
              <Text style={credentialsLabel}>Password</Text>
              <Text style={credentialsValue}>{credentials.split("\n")[1] || "Lihat di bawah"}</Text>
              <Text style={credentialsNote}>
                Simpan baik-baik informasi ini. Tidak ada reset password untuk akun demo.
              </Text>
            </Section>

            <Text style={credentialsFullLabel}>Full Credentials:</Text>
            <Text style={credentialsFull}>{credentials}</Text>

            {warrantyExpiry && (
              <Section style={warrantyBox}>
                <Text style={warrantyTitle}>🛡️ Garansi Aktif</Text>
                <Text style={warrantyText}>
                  Garansi berlaku hingga: <strong>{warrantyExpiry}</strong>
                </Text>
                <Text style={warrantyNote}>
                  Jika akun bermasalah dalam periode garansi, klaim langsung dari halaman pesanan Anda.
                </Text>
              </Section>
            )}

            <Section style={buttonSection}>
              <Button style={button} href={supportUrl}>
                Klaim Garansi
              </Button>
            </Section>
          </Section>

          <Hr style={hr} />

          <Section style={footer}>
            <Text style={footerText}>
              Need help? Reply to this email or contact us on Telegram.
            </Text>
            <Text style={footerCopyright}>
              © 2026 BubblePI Store. All rights reserved.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
}

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0 48px",
  marginBottom: "64px",
}

const header = {
  padding: "20px",
  textAlign: "center" as const,
}

const logo = {
  margin: "0 auto",
  borderRadius: "8px",
}

const headerTitle = {
  fontSize: "24px",
  fontWeight: "600",
  color: "#1a1a2e",
  margin: "10px 0 0",
}

const content = {
  padding: "0 20px",
}

const greeting = {
  fontSize: "20px",
  fontWeight: "600",
  color: "#1a1a2e",
  marginBottom: "24px",
}

const text = {
  fontSize: "16px",
  lineHeight: "26px",
  color: "#525f7f",
}

const orderBox = {
  backgroundColor: "#f8fafc",
  borderRadius: "8px",
  padding: "16px",
  margin: "20px 0",
}

const orderLabel = {
  fontSize: "12px",
  textTransform: "uppercase" as const,
  color: "#8898aa",
  marginBottom: "4px",
  marginTop: "12px",
}

const orderValue = {
  fontSize: "16px",
  fontWeight: "600",
  color: "#1a1a2e",
  margin: "0",
}

const hr = {
  border: "none",
  borderTop: "1px solid #e6ebf1",
  margin: "20px 0",
}

const credentialsBox = {
  backgroundColor: "#fff5f5",
  borderRadius: "8px",
  padding: "20px",
  margin: "20px 0",
  border: "2px solid #fc8181",
}

const credentialsTitle = {
  fontSize: "18px",
  fontWeight: "700",
  color: "#c53030",
  marginBottom: "16px",
  textAlign: "center" as const,
}

const credentialsLabel = {
  fontSize: "14px",
  fontWeight: "600",
  color: "#c53030",
  marginBottom: "4px",
}

const credentialsValue = {
  fontSize: "18px",
  fontWeight: "700",
  color: "#1a1a2e",
  fontFamily: "monospace",
  backgroundColor: "#fff",
  padding: "8px 12px",
  borderRadius: "4px",
  marginBottom: "12px",
}

const credentialsNote = {
  fontSize: "13px",
  color: "#c53030",
  marginTop: "12px",
  fontStyle: "italic" as const,
}

const credentialsFullLabel = {
  fontSize: "12px",
  textTransform: "uppercase" as const,
  color: "#8898aa",
  marginBottom: "8px",
}

const credentialsFull = {
  fontSize: "14px",
  fontFamily: "monospace",
  backgroundColor: "#1a1a2e",
  color: "#10b981",
  padding: "16px",
  borderRadius: "8px",
  whiteSpace: "pre-wrap" as const,
  wordBreak: "break-all" as const,
}

const warrantyBox = {
  backgroundColor: "#f0fff4",
  borderRadius: "8px",
  padding: "16px",
  margin: "20px 0",
  border: "2px solid #68d391",
}

const warrantyTitle = {
  fontSize: "16px",
  fontWeight: "700",
  color: "#276749",
  marginBottom: "8px",
}

const warrantyText = {
  fontSize: "14px",
  color: "#276749",
}

const warrantyNote = {
  fontSize: "13px",
  color: "#276749",
  marginTop: "8px",
}

const buttonSection = {
  textAlign: "center" as const,
  margin: "32px 0",
}

const button = {
  backgroundColor: "#6366f1",
  borderRadius: "8px",
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: "600",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "14px 32px",
}

const footer = {
  padding: "0 20px",
  textAlign: "center" as const,
}

const footerText = {
  fontSize: "14px",
  color: "#8898aa",
  marginBottom: "8px",
}

const footerCopyright = {
  fontSize: "12px",
  color: "#cbd5e0",
  marginBottom: "0",
}

export default DeliveryEmail