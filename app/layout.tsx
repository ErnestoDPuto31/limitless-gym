import type { Metadata } from "next";
import "./styles/index.css";
import { getGymSettings } from "@/app/actions/settingsActions";

export async function generateMetadata(): Promise<Metadata> {
  const result = await getGymSettings();
  const gymName = result.success && result.data ? result.data.gym_name : "Limitless Fitness Gym";

  return {
    title: gymName,
    description: `Official management portal for ${gymName}.`,
  };
}

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