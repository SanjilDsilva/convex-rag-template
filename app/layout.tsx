import "@/app/globals.css";
import { ReactNode } from "react";
import { ConvexClientProvider } from "./ConvexClientProvider";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-background text-text-primary font-inter min-h-screen">
        <ConvexClientProvider>
          {children}
        </ConvexClientProvider>
      </body>
    </html>
  );
}