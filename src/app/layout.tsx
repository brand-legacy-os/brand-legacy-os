import type { Metadata } from "next";
import { Fraunces, Archivo } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: "variable",
  style: ["normal", "italic"],
  axes: ["opsz"],
});

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  weight: "variable",
  axes: ["wdth"],
});

export const metadata: Metadata = {
  title: "Brand Legacy OS",
  description: "Sistema operacional interno da Brand Legacy.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${fraunces.variable} ${archivo.variable} h-full`}>
      <body className="min-h-full bg-canvas text-ink antialiased">
        {children}
      </body>
    </html>
  );
}
