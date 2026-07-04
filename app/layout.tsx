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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const result = await getGymSettings();
  
  const themeColor = result.success && result.data?.theme_color 
    ? result.data.theme_color 
    : "#DFFF00";

  return (
    <html 
      lang="en" 
      style={{ "--theme-color": themeColor } as React.CSSProperties}
    >
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}