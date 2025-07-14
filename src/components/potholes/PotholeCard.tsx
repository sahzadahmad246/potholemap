"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useSession } from "next-auth/react"
import { toast } from "sonner"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  ThumbsUp,
  Flag,
  MapPin,
  Calendar,
  AlertTriangle,
  Navigation,
  ChevronLeft,
  ChevronRight,
  Circle,
} from "lucide-react"

interface PotholeCardProps {
  pothole: {
    _id: string
    title: string
    description: string
    images: { url: string }[]
    address: string
    upvotes: number
    reportedBy: { name: string; image?: string }
    reportedAt: string
    upvotedBy: string[]
    
    comments: { userId: { username: string }; comment: string }[]
    spamReportCount: number
    status: string
    criticality: string
    location: {
      type: string
      coordinates: [number, number]
    }
  }
  onUpvoteSuccess: () => void
}

const PotholeCard: React.FC<PotholeCardProps> = ({ pothole, onUpvoteSuccess }) => {
  const { data: session } = useSession()
  const userId = session?.user?.id
  const hasUpvoted = pothole.upvotedBy.includes(userId as string)
  const [isUpvoting, setIsUpvoting] = useState(false)
  const [isReportingSpam, setIsReportingSpam] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  const handleUpvote = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!userId) {
      toast.error("You need to be logged in to upvote.")
      return
    }

    setIsUpvoting(true)
    try {
      const res = await fetch(`/api/potholes/${pothole._id}/upvote`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(data.message)
        onUpvoteSuccess()
      } else {
        toast.error(data.error || "Failed to upvote/un-upvote.")
      }
    } catch (error) {
      console.error("Error upvoting:", error)
      toast.error("An error occurred while upvoting.")
    } finally {
      setIsUpvoting(false)
    }
  }

  const handleSpamReport = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!userId) {
      toast.error("You need to be logged in to report spam.")
      return
    }

    setIsReportingSpam(true)
    try {
      const res = await fetch(`/api/potholes/${pothole._id}/spam-report`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ image: "", comment: "" }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(data.message)
      } else {
        toast.error(data.message || data.error || "Failed to report spam.")
      }
    } catch (error) {
      console.error("Error reporting spam:", error)
      toast.error("An error occurred while reporting spam.")
    } finally {
      setIsReportingSpam(false)
    }
  }

  const handleGoogleMapsNavigation = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const [longitude, latitude] = pothole.location.coordinates
    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`
    window.open(googleMapsUrl, "_blank")
  }

  const nextImage = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setCurrentImageIndex((prev) => (prev === pothole.images.length - 1 ? 0 : prev + 1))
  }

  const prevImage = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setCurrentImageIndex((prev) => (prev === 0 ? pothole.images.length - 1 : prev - 1))
  }

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "active":
        return "bg-red-100 text-red-800 border-red-200"
      case "in_progress":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "repaired":
        return "bg-green-100 text-green-800 border-green-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getCriticalityColor = (criticality: string) => {
    switch (criticality?.toLowerCase()) {
      case "high":
        return "bg-red-100 text-red-800 border-red-200"
      case "medium":
        return "bg-orange-100 text-orange-800 border-orange-200"
      case "low":
        return "bg-green-100 text-green-800 border-green-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  return (
    <Link href={`/potholes/${pothole._id}`}>
      <div className="bg-white border-2 border-gray-100 rounded-2xl overflow-hidden hover:border-black hover:shadow-xl transition-all duration-300 cursor-pointer group">
        {/* Image Section */}
        {pothole.images && pothole.images.length > 0 && (
          <div className="relative w-full h-48 overflow-hidden bg-gray-50">
            <Image
              src={pothole.images[currentImageIndex]?.url || "/placeholder.svg?height=200&width=400"}
              alt={pothole.title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />

            {/* Image Navigation */}
            {pothole.images.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/70 hover:bg-black text-white rounded-full flex items-center justify-center transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/70 hover:bg-black text-white rounded-full flex items-center justify-center transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>

                {/* Image Indicators */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex space-x-1">
                  {pothole.images.map((_, index) => (
                    <Circle
                      key={index}
                      className={`h-2 w-2 ${
                        index === currentImageIndex ? "fill-white text-white" : "fill-white/50 text-white/50"
                      }`}
                    />
                  ))}
                </div>
              </>
            )}

            {/* Status and Criticality Badges */}
            <div className="absolute top-3 left-3 flex flex-col space-y-2">
              <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${getStatusColor(pothole.status)}`}>
                {pothole.status?.replace(/_/g, " ").toUpperCase()}
              </span>
              <span
                className={`px-2 py-1 rounded-full text-xs font-semibold border flex items-center ${getCriticalityColor(pothole.criticality)}`}
              >
                <AlertTriangle className="h-3 w-3 mr-1" />
                {pothole.criticality?.toUpperCase()}
              </span>
            </div>
          </div>
        )}

        {/* Content Section */}
        <div className="p-6">
          {/* Title and Description */}
          <div className="mb-4">
            <h3 className="text-xl font-bold text-black mb-2 line-clamp-1 group-hover:text-gray-700 transition-colors">
              {pothole.title}
            </h3>
            <p className="text-gray-600 text-sm line-clamp-2 leading-relaxed">{pothole.description}</p>
          </div>

          {/* Location */}
          <div className="flex items-start mb-4">
            <MapPin className="h-4 w-4 text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
            <p className="text-gray-500 text-sm line-clamp-2 leading-relaxed">{pothole.address}</p>
          </div>

          {/* Reporter and Date */}
          <div className="flex items-center justify-between mb-6 text-xs text-gray-500">
            <div className="flex items-center">
             <Avatar className="h-9 w-9 flex-shrink-0">
              <AvatarImage
                src={pothole.reportedBy.image || "/placeholder.svg"}
              />
              <AvatarFallback className="bg-gradient-to-br from-blue-400 to-purple-500 text-white text-sm">
                {pothole.reportedBy.name}
              </AvatarFallback>
            </Avatar>
              <span className="ps-2 truncate">{pothole.reportedBy.name}</span>
            </div>
           
            <div className="flex items-center">
              <Calendar className="h-3 w-3 mr-1" />
              <span>{new Date(pothole.reportedAt).toLocaleDateString()}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex space-x-2">
              {/* Upvote Button */}
              <button
                onClick={handleUpvote}
                disabled={isUpvoting}
                className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  hasUpvoted ? "bg-black text-white hover:bg-gray-800" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                } disabled:opacity-50`}
              >
                <ThumbsUp className="h-4 w-4 mr-1" />
                {isUpvoting ? "..." : pothole.upvotes}
              </button>

              {/* Spam Report Button */}
              <button
                onClick={handleSpamReport}
                disabled={isReportingSpam}
                className="flex items-center px-3 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-red-50 hover:text-red-600 transition-all duration-200 disabled:opacity-50"
              >
                <Flag className="h-4 w-4 mr-1" />
                {isReportingSpam ? "..." : pothole.spamReportCount}
              </button>
            </div>

            {/* Google Maps Navigation Button */}
            <button
              onClick={handleGoogleMapsNavigation}
              className="flex items-center px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
            >
              <Navigation className="h-4 w-4 mr-2" />
              Navigate
            </button>
          </div>
        </div>
      </div>
    </Link>
  )
}

export default PotholeCard
