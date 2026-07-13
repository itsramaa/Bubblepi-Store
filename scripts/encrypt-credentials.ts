import { PrismaClient } from "@prisma/client"
import { encrypt, isEncrypted } from "../lib/crypto"

const db = new PrismaClient()

async function main() {
  console.log("Starting credential encryption migration...")

  const total = await db.accountStock.count()
  console.log(`Total records: ${total}`)

  let processed = 0
  let skipped = 0
  let encrypted = 0

  // Process in batches of 100
  const batchSize = 100
  let cursor: string | undefined

  while (true) {
    const batch = await db.accountStock.findMany({
      take: batchSize,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      orderBy: { id: "asc" },
      select: { id: true, credentials: true },
    })

    if (batch.length === 0) break

    for (const record of batch) {
      if (isEncrypted(record.credentials)) {
        skipped++
      } else {
        await db.accountStock.update({
          where: { id: record.id },
          data: { credentials: encrypt(record.credentials) },
        })
        encrypted++
      }
      processed++
    }

    cursor = batch[batch.length - 1].id
    console.log(`Progress: ${processed}/${total} (encrypted: ${encrypted}, skipped: ${skipped})`)
  }

  console.log(`Done! Encrypted: ${encrypted}, Already encrypted (skipped): ${skipped}`)
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect())
