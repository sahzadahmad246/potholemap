// src/components/home/MapSection.tsx
"use client"
import { useEffect, useState, useRef, useCallback } from "react"
import dynamic from "next/dynamic"
import { Crosshair, MapPin, Navigation } from "lucide-react"
import { Button } from "@/components/ui/button"
import MapPotholeDetailsCard from "./MapPotholeMiniCard"
import type { IPotholePopulated } from "@/types/pothole"
import { useMapEvents } from "react-leaflet"
import { Popup } from "react-leaflet/Popup"

const Map = dynamic(() => import("react-leaflet").then((mod) => mod.MapContainer), { ssr: false })
const TileLayer = dynamic(() => import("react-leaflet").then((mod) => mod.TileLayer), { ssr: false })
const Marker = dynamic(() => import("react-leaflet").then((mod) => mod.Marker), { ssr: false })

import "leaflet/dist/leaflet.css"
import L from "leaflet"

// Define a type for our cache
type PotholeCache = {
  [key: string]: {
    data: IPotholePopulated[]
    timestamp: number // To potentially use for cache invalidation later
    bounds: L.LatLngBounds // Store the bounds for which this data was fetched
  }
}

// --- Debounce Utility defined OUTSIDE the component ---
// This ensures 'debounce' itself is a stable reference.
const debounce = <Args extends unknown[]>(func: (...args: Args) => void, delay: number) => {
  let timeout: NodeJS.Timeout
  return (...args: Args): void => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), delay)
  }
}

const MapSection = () => {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null)
  const [potholes, setPotholes] = useState<IPotholePopulated[]>([])
  const [selected, setSelected] = useState<IPotholePopulated | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const mapRef = useRef<L.Map | null>(null)
  const [mapBounds, setMapBounds] = useState<L.LatLngBounds | null>(null)
  const [potholeCache, setPotholeCache] = useState<PotholeCache>({})

  // Helper to generate a cache key from LatLngBounds
  const getCacheKey = (bounds: L.LatLngBounds): string => {
    const precision = 4
    return `${bounds.getSouthWest().lat.toFixed(precision)},${bounds.getSouthWest().lng.toFixed(
      precision,
    )}-${bounds.getNorthEast().lat.toFixed(precision)},${bounds.getNorthEast().lng.toFixed(precision)}`
  }

  // --- Geolocation Effect ---
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const location: [number, number] = [pos.coords.latitude, pos.coords.longitude]
        setUserLocation(location)
        setIsLoading(false)
      },
      (err) => {
        console.error("Location error:", err)
        setIsLoading(false)
      },
      { enableHighAccuracy: true },
    )
  }, [])

  // --- Map Event Handler Component ---
  const MapEventsHandler = () => {
    useMapEvents({
      click: () => setSelected(null),
      moveend: () => {
        if (mapRef.current) {
          setMapBounds(mapRef.current.getBounds())
        }
      },
    })
    return null
  }

  // --- Pothole Fetching Logic with Caching ---
  const fetchPotholes = useCallback(
    async (bounds: L.LatLngBounds | null, centerLocation: [number, number] | null) => {
      if (!bounds && !centerLocation) return

      let url = "/api/potholes/nearby?"
      let cacheKey = ""
      let currentBounds: L.LatLngBounds | null = null

      if (bounds) {
        url += `minLat=${bounds.getSouthWest().lat}&maxLat=${bounds.getNorthEast().lat}&minLng=${bounds.getSouthWest().lng}&maxLng=${bounds.getNorthEast().lng}`
        cacheKey = getCacheKey(bounds)
        currentBounds = bounds
      } else if (centerLocation) {
        url += `latitude=${centerLocation[0]}&longitude=${centerLocation[1]}`
        if (mapRef.current) {
          currentBounds = mapRef.current.getBounds()
          cacheKey = getCacheKey(currentBounds)
        } else {
          cacheKey = `center-${centerLocation[0].toFixed(4)}-${centerLocation[1].toFixed(4)}`
        }
      }
      url += `&limit=50`

      // Check cache first
      if (cacheKey && potholeCache[cacheKey]) {
        console.log("Fetching from cache for key:", cacheKey)
        setPotholes(potholeCache[cacheKey].data)
        setIsLoading(false)
        return
      }

      console.log("Fetching from API for key:", cacheKey || "no-cache-key")
      setIsLoading(true)
      try {
        const res = await fetch(url)
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`)
        }
        const data = await res.json()
        const fetchedPotholes = data.data || []
        setPotholes(fetchedPotholes)

        // Store in cache if we have valid bounds to key it by
        if (cacheKey && currentBounds) {
          setPotholeCache((prevCache) => ({
            ...prevCache,
            [cacheKey]: {
              data: fetchedPotholes,
              timestamp: Date.now(),
              bounds: currentBounds,
            },
          }))
        }
      } catch (error) {
        console.error("Error fetching potholes:", error)
        setPotholes([])
      } finally {
        setIsLoading(false)
      }
    },
    [potholeCache], // Depend on potholeCache to ensure we have the latest state when checking
  )

  // Use useRef to create a stable debounced function instance
  const debouncedFetchPotholesRef = useRef(debounce(fetchPotholes, 500));

  // Update the ref's current function if fetchPotholes changes
  // This is crucial to ensure the debounced function always calls the latest fetchPotholes
  useEffect(() => {
    debouncedFetchPotholesRef.current = debounce(fetchPotholes, 500);
  }, [fetchPotholes]);


  // --- Effect for Triggering Pothole Fetches ---
  useEffect(() => {
    if (mapBounds) {
      debouncedFetchPotholesRef.current(mapBounds, null)
    } else if (userLocation) {
      debouncedFetchPotholesRef.current(null, userLocation)
    }
  }, [mapBounds, userLocation, debouncedFetchPotholesRef]); // Add debouncedFetchPotholesRef to dependencies

  // --- Set Initial Map Bounds ---
  useEffect(() => {
    if (userLocation && mapRef.current && !mapBounds) {
      setMapBounds(mapRef.current.getBounds())
    }
  }, [userLocation, mapBounds])

  // --- Enhanced User Location Marker ---
  const userIcon = L.divIcon({
    html: `
      <div class="relative">
        <div class="absolute inset-0 bg-blue-400 rounded-full animate-ping opacity-75" style="width: 32px; height: 32px; margin: -6px;"></div>
        <div style="
          width: 20px;
          height: 20px;
          background: linear-gradient(135deg, #3B82F6, #1D4ED8);
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4), 0 2px 4px rgba(0,0,0,0.1);
          position: relative;
          z-index: 10;
        "></div>
      </div>
    `,
    className: "user-location-marker",
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  })

  // --- Enhanced Pothole Marker ---
  const potholeIcon = L.divIcon({
    html: `
      <div style="
        width: 28px;
        height: 28px;
        background: linear-gradient(135deg, #EF4444, #DC2626);
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4), 0 2px 4px rgba(0,0,0,0.1);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 14px;
        font-weight: bold;
        transition: all 0.2s ease;
      ">⚠</div>
    `,
    className: "pothole-marker",
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  })

  // --- Recenter Map Function ---
  const recenterMap = () => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const newLocation: [number, number] = [pos.coords.latitude, pos.coords.longitude]
        setUserLocation(newLocation)
        if (mapRef.current) {
          mapRef.current.setView(newLocation, 14)
          setMapBounds(mapRef.current.getBounds()) // Update bounds after recentering
        }
      },
      (err) => console.error("Location error:", err),
      { enableHighAccuracy: true },
    )
  }

  // --- Loading and Error States ---
  if (isLoading && !userLocation) {
    return (
      <div className="flex items-center justify-center h-[80vh] bg-gradient-to-br from-blue-50 via-white to-indigo-50 rounded-xl border border-gray-200 shadow-lg">
        <div className="text-center p-8">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-6"></div>
            <Navigation className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Finding Your Location</h3>
          <p className="text-gray-600">Please allow location access to view nearby potholes</p>
        </div>
      </div>
    )
  }

  if (!userLocation) {
    return (
      <div className="flex items-center justify-center h-[80vh] bg-gradient-to-br from-red-50 via-white to-orange-50 rounded-xl border border-gray-200 shadow-lg">
        <div className="text-center p-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <MapPin className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Location Access Required</h3>
          <p className="text-gray-600 mb-6">We need your location to show nearby potholes</p>
          <Button
            onClick={recenterMap}
            className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white px-6 py-2 rounded-lg shadow-lg transition-all duration-200"
          >
            <Navigation className="w-4 h-4 mr-2" />
            Enable Location
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="relative h-[80vh] w-full overflow-hidden rounded-xl border border-gray-200 shadow-xl bg-white">
      {/* Map Container */}
      <div className="relative h-full w-full">
        <Map
          center={userLocation}
          zoom={14}
          scrollWheelZoom
          className="h-full w-full z-0 rounded-xl"
          ref={mapRef}
          zoomControl={true}
        >
          <MapEventsHandler />
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          {/* User Location Marker */}
          <Marker position={userLocation} icon={userIcon}>
            <Popup>
              <div className="text-center p-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Navigation className="w-4 h-4 text-blue-600" />
                </div>
                <p className="font-semibold text-blue-700">You are here</p>
                <p className="text-xs text-gray-500 mt-1">Current location</p>
              </div>
            </Popup>
          </Marker>
          {/* Pothole Markers */}
          {potholes.map((p) => (
            <Marker
              key={p._id.toString()}
              position={[p.location.coordinates[1], p.location.coordinates[0]]}
              icon={potholeIcon}
              eventHandlers={{
                click: (e) => {
                  L.DomEvent.stopPropagation(e)
                  setSelected(p)
                },
              }}
            />
          ))}
        </Map>

        {/* Enhanced Recenter Button */}
        <div className="absolute top-4 right-4 z-[1000]">
          <Button
            size="icon"
            onClick={recenterMap}
            className="bg-white/90 backdrop-blur-sm hover:bg-white text-gray-700 border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-200 rounded-full w-12 h-12"
            title="Center on my location"
          >
            <Crosshair className="w-5 h-5" />
          </Button>
        </div>

        {/* Enhanced Map Legend with Pothole Count */}
        <div className="absolute bottom-4 right-4 z-[1000] bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 p-4 hidden md:block">
          <h4 className="font-semibold text-gray-800 mb-3 text-sm">Map Legend</h4>
          <div className="space-y-3 text-sm">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-5 h-5 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full border-2 border-white shadow-sm"></div>
                <div className="absolute -inset-1 bg-blue-400 rounded-full animate-ping opacity-30"></div>
              </div>
              <span className="text-gray-700 font-medium">Your Location</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-5 h-5 bg-gradient-to-br from-red-500 to-red-600 rounded-full border-2 border-white shadow-sm flex items-center justify-center text-white text-xs font-bold">
                ⚠
              </div>
              <span className="text-gray-700 font-medium">Reported Potholes</span>
            </div>
            {/* Pothole Count integrated here */}
            <div className="flex items-center space-x-3 pt-3 border-t border-gray-100 mt-3">
              {isLoading ? (
                <div className="w-3 h-3 bg-gray-300 rounded-full animate-pulse"></div>
              ) : (
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              )}
              <span className="text-sm font-semibold text-gray-700">
                {isLoading ? "Loading..." : `${potholes.length} pothole${potholes.length !== 1 ? "s" : ""} in view`}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Mini Pothole Card Overlay */}
      {selected && (
        <div className="absolute inset-0 z-[1001] pointer-events-none">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm pointer-events-auto transition-all duration-200"
            onClick={() => setSelected(null)}
          />
          <div className="absolute bottom-4 left-4 right-4 md:bottom-6 md:left-6 md:right-auto md:w-80 pointer-events-auto">
            <MapPotholeDetailsCard
              pothole={{
                ...selected,
                _id: selected._id.toString(),
                reportedAt: new Date(selected.reportedAt).toISOString(),
                upvotedBy: selected.upvotedBy.map((u) => u._id?.toString?.() || u.toString()),
                reportedBy: {
                  name: selected.reportedBy.name,
                  image: selected.reportedBy.image,
                },
                comments: selected.comments.map((c) => ({
                  comment: c.comment,
                  userId: { username: c.userId.name },
                })),
              }}
              onClose={() => setSelected(null)}
            />
          </div>
        </div>
      )}

      <style jsx global>{`
        .leaflet-control-zoom {
          border: none !important;
          border-radius: 12px !important;
          overflow: hidden !important;
          box-shadow: 0 8px 25px -5px rgba(0, 0, 0, 0.1), 0 4px 10px -3px rgba(0, 0, 0, 0.05) !important;
        }
        .leaflet-control-zoom a {
          background-color: rgba(255, 255, 255, 0.95) !important;
          backdrop-filter: blur(10px) !important;
          border: 1px solid rgba(229, 231, 235, 0.8) !important;
          color: #374151 !important;
          font-weight: 600 !important;
          transition: all 0.2s ease !important;
          width: 36px !important;
          height: 36px !important;
          line-height: 34px !important;
        }
        .leaflet-control-zoom a:hover {
          background-color: white !important;
          border-color: #d1d5db !important;
          transform: scale(1.05) !important;
        }
        .leaflet-popup-content-wrapper {
          border-radius: 12px !important;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04) !important;
          border: 1px solid rgba(229, 231, 235, 0.8) !important;
          backdrop-filter: blur(10px) !important;
        }
        .leaflet-popup-tip {
          box-shadow: none !important;
        }
        .user-location-marker,
        .pothole-marker {
          background: transparent !important;
          border: none !important;
        }
        .pothole-marker:hover div {
          transform: scale(1.1) !important;
        }
        .leaflet-container {
          font-family: inherit !important;
        }
        @keyframes ping {
          75%,
          100% {
            transform: scale(2);
            opacity: 0;
          }
        }
        .animate-ping {
          animation: ping 1s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
      `}</style>
    </div>
  )
}

export default MapSection