import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Bubblepi Store",
    short_name: "Bubblepi",
    description: "Tempat beli akun digital dengan harga termurah",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#595B83",
    icons: [
      { src: "/favicon.ico", sizes: "48x48", type: "image/x-icon" },
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  }
}
