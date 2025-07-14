"use client";

import { useRef, useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L, { Icon } from "leaflet";
import "leaflet/dist/leaflet.css";
import { toast } from "sonner";

// Configure default Leaflet icon
const defaultIcon = new Icon({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

L.Marker.prototype.options.icon = defaultIcon;

export interface MapSelectorProps {
  initialPosition: [number, number];
  onLocationSelect: (lat: number, lng: number, address: string, area: string) => void;
}

function LocationMarker({
  onLocationSelect,
}: {
  onLocationSelect: (lat: number, lng: number, address: string, area: string) => void;
}) {
  const [position, setPosition] = useState<[number, number] | null>(null);

  useMapEvents({
    click: async (e) => {
      const { lat, lng } = e.latlng;
      setPosition([lat, lng]);

      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        );
        if (!response.ok) {
          throw new Error("Failed to fetch address");
        }
        const data = await response.json();
        const area =
          data.address?.neighbourhood ||
          data.address?.suburb ||
          data.address?.village ||
          data.address?.city ||
          "Unknown Area";
        const address = data.display_name || "Address not found";

        onLocationSelect(lat, lng, address, area);
      } catch (error) {
        console.error("Error fetching address:", error);
        onLocationSelect(lat, lng, "", "Unknown Area");
        toast.error("Unable to fetch address. Please try again.");
      }
    },
  });

  return position === null ? null : <Marker position={position} />;
}

export default function MapSelector({ initialPosition, onLocationSelect }: MapSelectorProps) {
  const mapRef = useRef<L.Map | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>(initialPosition);

  // Attempt to get user's current location if initialPosition is the fallback
  useEffect(() => {
    // Check if initialPosition is the default Delhi coordinates
    if (initialPosition[0] === 28.6139 && initialPosition[1] === 77.209) {
      if (!navigator.geolocation) {
        toast.error("Geolocation not supported by your browser.");
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setMapCenter([latitude, longitude]);
          if (mapRef.current) {
            mapRef.current.setView([latitude, longitude], 15);
          }
          toast.success("Map centered on your current location!");
        },
        (error) => {
          console.error("Geolocation error:", error);
          let errorMessage = "Unable to access location.";
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = "Location access denied. Using default location.";
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = "Location information unavailable.";
              break;
            case error.TIMEOUT:
              errorMessage = "Location request timed out.";
              break;
          }
          toast.error(errorMessage);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000,
        },
      );
    }
  }, [initialPosition]);

  return (
    <MapContainer
      center={mapCenter}
      zoom={15}
      style={{ height: "100%", width: "100%" }}
      ref={mapRef}
    >
      <TileLayer
        attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <LocationMarker onLocationSelect={onLocationSelect} />
    </MapContainer>
  );
}