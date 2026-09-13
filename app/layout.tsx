import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Θεμιστοκλής 96 | Εθνική Μεγάλη Στοά της Ελλάδος",
  description: "Συμβολική Στοά Θεμιστοκλής υπ’ αριθμ. 96. Αξιωματικοί, πρόγραμμα εργασιών στο Τεκτονικό Μέγαρο Πειραιώς και Μητρώο Πρώην Σεβασμίων.",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};
export default function RootLayout({ children }: Readonly<{children: React.ReactNode}>) {
  return <html lang="el"><body>{children}</body></html>;
}
