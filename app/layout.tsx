import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

const title = "Huh Cat — Interactive Playground";
const description =
  "An interactive web design project featuring hand-drawn cats, playful animation and sound. No real contract address or token functionality.";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("host") ?? "localhost:3000";
  const protocol =
    requestHeaders.get("x-forwarded-proto") ??
    (host.startsWith("localhost") ? "http" : "https");
  const imageUrl = `${protocol}://${host}/og.png`;

  return {
    title,
    description,
    icons: {
      icon: "/figma-assets/favicon.png?v=huh-cat",
      shortcut: "/figma-assets/favicon.png?v=huh-cat",
      apple: "/figma-assets/favicon.png?v=huh-cat",
    },
    openGraph: {
      title,
      description,
      type: "website",
      images: [
        {
          url: imageUrl,
          width: 1728,
          height: 907,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preload" href="/figma-assets/huh-cat.gif" as="image" />
      </head>
      <body>{children}</body>
    </html>
  );
}
