"use client"

import { useEffect, useState } from "react"
import PotholeCard from "@/components/potholes/PotholeCard"
import type { IPotholePopulated } from "@/types/pothole"
import { Loader2 } from "lucide-react" // Import Loader2 icon

const PotholeListPage = () => {
  const [location, setLocation] = useState<[number, number] | null>(null)
  const [potholes, setPotholes] = useState<IPotholePopulated[]>([])
  const [isLoadingPotholes, setIsLoadingPotholes] = useState(true) // New loading state

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => setLocation([pos.coords.latitude, pos.coords.longitude]),
      (err) => {
        console.error("Location error:", err)
        setIsLoadingPotholes(false) // Stop loading if location access fails
      },
      { enableHighAccuracy: true },
    )
  }, [])

  useEffect(() => {
    if (!location) return

    const fetchPotholes = async () => {
      setIsLoadingPotholes(true) // Start loading
      try {
        const res = await fetch(`/api/potholes/nearby?latitude=${location[0]}&longitude=${location[1]}&limit=50`)
        const data = await res.json()
        setPotholes(data.data || [])
      } catch (error) {
        console.error("Error fetching potholes:", error)
        // Optionally show a toast error here
      } finally {
        setIsLoadingPotholes(false) // Stop loading
      }
    }
    fetchPotholes()
  }, [location])

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Nearby Reported Potholes</h1>
      {isLoadingPotholes ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-12 w-12 animate-spin text-black mx-auto mb-4" />
          <p className="text-lg text-gray-600">Finding potholes near you...</p>
        </div>
      ) : potholes.length === 0 ? (
        <div className="text-center text-gray-500 py-12">No potholes found nearby.</div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {potholes.map((p) => (
            <PotholeCard
              key={p._id.toString()}
              pothole={{
                ...p,
                _id: p._id.toString(),
                reportedAt: new Date(p.reportedAt).toISOString(),
                upvotedBy: p.upvotedBy.map((u) => u._id?.toString?.() || u.toString()),
                reportedBy: {
                  name: p.reportedBy.name,
                  image: p.reportedBy.image,
                },
                comments: p.comments.map((c) => ({
                  comment: c.comment,
                  userId: { username: c.userId.name },
                })),
              }}
              onUpvoteSuccess={() => {}}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default PotholeListPage
