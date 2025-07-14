"use client"

import { useEffect, useState } from "react"
import PotholeCard from "@/components/potholes/PotholeCard"
import { IPotholePopulated } from "@/types/pothole"

const PotholeListPage = () => {
  const [location, setLocation] = useState<[number, number] | null>(null)
  const [potholes, setPotholes] = useState<IPotholePopulated[]>([])

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      pos => setLocation([pos.coords.latitude, pos.coords.longitude]),
      err => console.error("Location error:", err),
      { enableHighAccuracy: true }
    )
  }, [])

  useEffect(() => {
    if (!location) return
    const fetchPotholes = async () => {
      const res = await fetch(
        `/api/potholes/nearby?latitude=${location[0]}&longitude=${location[1]}&limit=50`
      )
      const data = await res.json()
      setPotholes(data.data || [])
    }
    fetchPotholes()
  }, [location])

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Nearby Reported Potholes</h1>
      {potholes.length === 0 ? (
        <div className="text-center text-gray-500">No potholes found nearby.</div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {potholes.map(p => (
            <PotholeCard
              key={p._id.toString()}
              pothole={{
                ...p,
                _id: p._id.toString(),
                reportedAt: new Date(p.reportedAt).toISOString(),
                upvotedBy: p.upvotedBy.map(u => u._id?.toString?.() || u.toString()),
                reportedBy: {
                  name: p.reportedBy.name,
                  image: p.reportedBy.image,
                },
                comments: p.comments.map(c => ({
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
