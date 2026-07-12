import { db } from "@/lib/db"
import ReviewList from "./ReviewList"

export const dynamic = "force-dynamic"

export default async function ReviewsPage() {
  const reviews = await db.review.findMany({
    include: { product: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  })
  return <ReviewList reviews={JSON.parse(JSON.stringify(reviews))} />
}
