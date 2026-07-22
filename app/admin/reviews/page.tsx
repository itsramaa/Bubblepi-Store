import { fetchFromGo, parseJson } from "@/lib/api-client"
import ReviewList from "./ReviewList"
import type { Review } from "@/types"

export const dynamic = "force-dynamic"

export default async function ReviewsPage() {
  const res = await fetchFromGo("/admin/reviews")
  const reviews = await parseJson<Review[]>(res)
  return <ReviewList reviews={reviews} />
}