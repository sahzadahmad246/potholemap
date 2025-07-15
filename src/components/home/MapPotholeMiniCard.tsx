"use client"

import type React from "react"
import Link from "next/link"
import { MapPin, Calendar, AlertTriangle, Navigation } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { formatTimeAgo } from "@/lib/formatTimeAgo" // Re-using the utility

interface MapPotholeDetailsCardProps {
  pothole: {
    _id: string
    title: string
    description: string
    images: { url: string }[] // Still part of the type, but won't be rendered
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
  onClose: () => void // Added onClose prop for consistency
}

const MapPotholeDetailsCard: React.FC<MapPotholeDetailsCardProps> = ({ pothole, onClose }) => {
  const handleGoogleMapsNavigation = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const [longitude, latitude] = pothole.location.coordinates
    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`
    window.open(googleMapsUrl, "_blank")
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
    <div className="bg-white border-2 border-gray-100 rounded-2xl overflow-hidden shadow-xl transition-all duration-300 cursor-pointer group relative">
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-3 right-3 w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors z-10"
        title="Close"
      >
        <span className="text-gray-600 font-bold text-lg">×</span>
      </button>
      {/* Content Section */}
      <div className="p-6 pt-4">
        {/* Status and Criticality Badges */}
        <div className="flex flex-wrap gap-2 mb-4">
          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusColor(pothole.status)}`}>
            {pothole.status?.replace(/_/g, " ").toUpperCase()}
          </span>
          <span
            className={`px-2.5 py-1 rounded-full text-xs font-semibold border flex items-center ${getCriticalityColor(pothole.criticality)}`}
          >
            <AlertTriangle className="h-3 w-3 mr-1" />
            {pothole.criticality?.toUpperCase()}
          </span>
        </div>
        {/* Title and Description */}
        <div className="mb-4">
          <h3 className="text-xl font-bold text-black mb-1 line-clamp-1">{pothole.title}</h3>
          <p className="text-gray-600 text-sm line-clamp-2 leading-relaxed">
            {pothole.description || "No description provided."}
          </p>
        </div>
        {/* Location */}
        <div className="flex items-start mb-4">
          <MapPin className="h-4 w-4 text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
          <p className="text-gray-500 text-sm line-clamp-2 leading-relaxed">{pothole.address}</p>
        </div>
        {/* Reporter and Date */}
        <div className="flex items-center justify-between mb-6 text-xs text-gray-500">
          <div className="flex items-center">
            <Avatar className="h-8 w-8 flex-shrink-0">
              <AvatarImage
                src={pothole.reportedBy.image || "/placeholder.svg"}
                alt={pothole.reportedBy.name || "Reporter"}
              />
              <AvatarFallback className="bg-gradient-to-br from-blue-400 to-purple-500 text-white text-sm">
                {pothole.reportedBy.name ? pothole.reportedBy.name.charAt(0).toUpperCase() : "U"}
              </AvatarFallback>
            </Avatar>
            <span className="ps-2 truncate">{pothole.reportedBy.name || "Anonymous"}</span>
          </div>
          <div className="flex items-center">
            <Calendar className="h-3 w-3 mr-1" />
            <span>{formatTimeAgo(new Date(pothole.reportedAt))}</span>
          </div>
        </div>
        {/* Action Buttons */}
        <div className="flex justify-end">
          {/* Google Maps Navigation Button */}
          <Link href={`/potholes/${pothole._id}`} passHref>
            <button
              onClick={handleGoogleMapsNavigation}
              className="flex items-center px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
            >
              <Navigation className="h-4 w-4 mr-2" />
              Navigate
            </button>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default MapPotholeDetailsCard
