// src/app/page.tsx
import { Toaster } from "sonner";
import MapSectionWrapper from "@/components/home/MapSectionWrapper";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-8 lg:p-12">
      <h1 className="text-3xl md:text-4xl font-bold mb-8 text-center">
        Pothole Map
      </h1>
      <div className="w-full max-w-5xl">
        {/* Add other content here if needed */}
      </div>
      <Toaster richColors />
      <MapSectionWrapper />
    </main>
  );
}