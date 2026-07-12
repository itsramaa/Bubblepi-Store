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
} from "@react-email/components"

interface AccountDeliveryProps {
  orderNumber: string
  items: Array<{ name: string; credentials: string[] }>
  trackingUrl: string
}

export default function AccountDeliveryEmail({
  orderNumber,
  items,
  trackingUrl,
}: AccountDeliveryProps) {
  return (
    <Html>
      <Head />
      <Preview>Bubblepi Store - Akun Anda Sudah Siap! {orderNumber}</Preview>
      <Body style={{ fontFamily: "Arial, sans-serif", backgroundColor: "#FAFAFA" }}>
        <Container style={{ maxWidth: 600, margin: "0 auto", padding: 20 }}>
          <Heading style={{ color: "#7C3AED", textAlign: "center" }}>
            Bubblepi Store
          </Heading>
          <Heading as="h2">Akun Anda Sudah Siap! 🎉</Heading>
          <Text>Pesanan {orderNumber} sudah selesai diproses.</Text>

          {items.map((item, i) => (
            <div key={i} style={{ marginBottom: 20 }}>
              <Text style={{ fontWeight: "bold" }}>{item.name}</Text>
              {item.credentials.map((cred, j) => (
                <Text
                  key={j}
                  style={{
                    fontFamily: "monospace",
                    backgroundColor: "#F3F4F6",
                    padding: 8,
                    borderRadius: 4,
                    wordBreak: "break-all",
                  }}
                >
                  {cred}
                </Text>
              ))}
            </div>
          ))}

          <Hr />
          <Text style={{ fontWeight: "bold", color: "#DC2626" }}>
            ⚠️ Jangan bagikan credentials ini ke orang lain!
          </Text>
          <Text style={{ fontWeight: "bold" }}>
            Simpan credentials ini di tempat aman. Kami TIDAK menyimpan backup.
          </Text>

          <Text>
            <Link href={trackingUrl}>Lacak Status Pesanan</Link>
          </Text>
        </Container>
      </Body>
    </Html>
  )
}
