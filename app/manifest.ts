import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Bubblepi Store",
    short_name: "Bubblepi",
    description: "Beli akun digital premium murah, instant delivery, bergaransi",
    start_url: "/",
    display: "standalone",
    background_color: "#060930",
    theme_color: "#F4ABC4",
    icons: [
      { src: "/logo.png", sizes: "any", type: "image/png" },
    ],
  }
}
