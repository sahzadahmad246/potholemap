// src/components/home/MapSectionWrapper.tsx
"use client";

import dynamic from "next/dynamic";

// Dynamically import MapSection with SSR disabled
const MapSection = dynamic(() => import("@/components/home/MapSection"), {
  ssr: false, // Disable server-side rendering
});

export default function MapSectionWrapper() {
  return <MapSection />;
}