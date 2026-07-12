import { notFound } from "next/navigation"
import { db } from "@/lib/db"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"
import AddToCartButton from "@/components/store/AddToCartButton"

interface ProductDetailPageProps {
  params: Promise<{ slug: string }>
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { slug } = await params

  const product = await db.product.findUnique({
    where: { slug },
    include: { variants: true },
  })

  if (!product) notFound()

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="aspect-square relative rounded-lg overflow-hidden bg-muted">
          <Image src={product.image} alt={product.name} fill className="object-cover" />
        </div>
        <div>
          <Badge className="mb-4">{product.category}</Badge>
          <h1 className="text-3xl font-bold">{product.name}</h1>
          <p className="text-muted-foreground mt-4">{product.description}</p>

          <div className="mt-8">
            <h2 className="text-lg font-semibold mb-4">Pilih Varian:</h2>
            <div className="space-y-3">
              {product.variants.map((variant) => (
                <AddToCartButton
                  key={variant.id}
                  variant={variant}
                  product={product}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
