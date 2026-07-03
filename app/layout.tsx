import type { Metadata } from "next";
import "./styles/index.css";

export const metadata: Metadata = {
  title: "Limitless Fitness Gym",
  description: "Official tablet management portal for Limitless Fitness Gym.",
};



export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}