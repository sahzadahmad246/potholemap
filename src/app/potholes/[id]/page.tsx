"use client"

import type React from "react"
import { useEffect, useState, useCallback } from "react"
import Image from "next/image"
import { toast, Toaster } from "sonner"
import { useSession } from "next-auth/react"
import { useParams, useRouter } from "next/navigation"
import type { IPotholePopulated } from "@/types/pothole"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  MapPin,
  Calendar,
  User,
  AlertTriangle,
  ThumbsUp,
  ThumbsDown,
  Flag,
  MessageCircle,
  Ruler,
  CheckCircle,
  Twitter,
  Loader2,
  Camera,
  Send,
  Navigation,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react"
import { CommentItem } from "@/components/potholes/comment-item"
import Link from "next/link"
import TweetButton from "@/components/potholes/tweet-button" // Import the new TweetButton

const PotholeDetailsPage: React.FC = () => {
  const params = useParams()
  const id = params.id as string
  const { data: session } = useSession()
  const userId = session?.user?.id
  const [pothole, setPothole] = useState<IPotholePopulated | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isUpvotingPothole, setIsUpvotingPothole] = useState(false)
  const [isReportingSpam, setIsReportingSpam] = useState(false)
  const [commentText, setCommentText] = useState("")
  const [isCommenting, setIsCommenting] = useState(false)
  const [isUpvotingRepairReport, setIsUpvotingRepairReport] = useState(false)
  const [isDownvotingRepairReport, setIsDownvotingRepairReport] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [showFullscreenImage, setShowFullscreenImage] = useState(false) // New state for fullscreen
  const [fullscreenImageSrc, setFullscreenImageSrc] = useState<string | null>(null) // New state for fullscreen image src
  const router = useRouter()

  const fetchPotholeDetails = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/potholes/${id}`)
      const data = await res.json()
      if (res.ok) {
        setPothole(data.data as IPotholePopulated)
      } else {
        setError(data.error || "Failed to fetch pothole details.")
        toast.error(data.error || "Failed to fetch pothole details.")
      }
    } catch (err) {
      console.error("Error fetching pothole details:", err)
      setError("An unexpected error occurred.")
      toast.error("An unexpected error occurred.")
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    if (id) {
      fetchPotholeDetails()
    }
  }, [id, fetchPotholeDetails])

  const handlePotholeUpvote = async () => {
    if (!userId) {
      toast.error("You need to be logged in to upvote.")
      return
    }
    setIsUpvotingPothole(true)
    try {
      const res = await fetch(`/api/potholes/${id}/upvote`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(data.message)
        fetchPotholeDetails()
      } else {
        toast.error(data.error || "Failed to upvote/un-upvote.")
      }
    } catch (error) {
      console.error("Error upvoting pothole:", error)
      toast.error("An error occurred while upvoting the pothole.")
    } finally {
      setIsUpvotingPothole(false)
    }
  }

  const handleSpamReport = async () => {
    if (!userId) {
      toast.error("You need to be logged in to report spam.")
      return
    }
    setIsReportingSpam(true)
    try {
      const res = await fetch(`/api/potholes/${id}/spam-report`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ image: "", comment: "" }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(data.message)
        fetchPotholeDetails()
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

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId) {
      toast.error("You need to be logged in to comment.")
      return
    }
    if (commentText.trim().length === 0) {
      toast.error("Comment cannot be empty.")
      return
    }
    if (commentText.length > 200) {
      toast.error("Comment cannot exceed 200 characters.")
      return
    }
    setIsCommenting(true)
    try {
      const res = await fetch(`/api/potholes/${id}/comment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ comment: commentText }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(data.message)
        setCommentText("")
        fetchPotholeDetails()
      } else {
        toast.error(data.error || "Failed to add comment.")
      }
    } catch (error) {
      console.error("Error adding comment:", error)
      toast.error("An error occurred while adding comment.")
    } finally {
      setIsCommenting(false)
    }
  }

  const handleReportRepaired = () => {
    router.push(`/report-repaired?potholeId=${id}`)
  }

  const handleRepairReportUpvote = async () => {
    if (!userId) {
      toast.error("You need to be logged in to vote on repair reports.")
      return
    }
    setIsUpvotingRepairReport(true)
    try {
      const res = await fetch(`/api/potholes/${id}/repair-report/upvote`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(data.message)
        fetchPotholeDetails()
      } else {
        toast.error(data.error || "Failed to process upvote.")
      }
    } catch (error) {
      console.error("Error upvoting repair report:", error)
      toast.error("An error occurred while processing upvote.")
    } finally {
      setIsUpvotingRepairReport(false)
    }
  }

  const handleRepairReportDownvote = async () => {
    if (!userId) {
      toast.error("You need to be logged in to vote on repair reports.")
      return
    }
    const userComment = prompt("Optional: Enter a reason for downvoting (max 200 chars):")
    if (userComment !== null && userComment.length > 200) {
      toast.error("Downvote comment cannot exceed 200 characters.")
      return
    }
    setIsDownvotingRepairReport(true)
    try {
      const res = await fetch(`/api/potholes/${id}/repair-report/downvote`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ comment: userComment?.trim() || undefined }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(data.message)
        fetchPotholeDetails()
      } else {
        toast.error(data.error || "Failed to process downvote.")
      }
    } catch (error) {
      console.error("Error downvoting repair report:", error)
      toast.error("An error occurred while processing downvote.")
    } finally {
      setIsDownvotingRepairReport(false)
    }
  }

  const handleGoogleMapsNavigation = () => {
    if (pothole?.location?.coordinates) {
      const [longitude, latitude] = pothole.location.coordinates
      const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`
      window.open(googleMapsUrl, "_blank")
    }
  }

  const nextImage = () => {
    if (pothole?.images) {
      setCurrentImageIndex((prev) => (prev === pothole.images.length - 1 ? 0 : prev + 1))
    }
  }

  const prevImage = () => {
    if (pothole?.images) {
      setCurrentImageIndex((prev) => (prev === 0 ? pothole.images.length - 1 : prev - 1))
    }
  }

  // Function to open fullscreen image
  const openFullscreen = (imageUrl: string) => {
    setFullscreenImageSrc(imageUrl)
    setShowFullscreenImage(true)
  }

  // Function to close fullscreen image
  const closeFullscreen = () => {
    setShowFullscreenImage(false)
    setFullscreenImageSrc(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-black mx-auto mb-4" />
          <p className="text-lg text-gray-600">Loading pothole details...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center max-w-md mx-4">
          <AlertTriangle className="h-16 w-16 text-black mx-auto mb-4" />
          <p className="text-black text-lg font-medium">{error}</p>
        </div>
      </div>
    )
  }

  if (!pothole) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center max-w-md mx-4">
          <MapPin className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Pothole not found.</p>
        </div>
      </div>
    )
  }

  const hasUserUpvotedRepairReport = pothole.repairReport?.upvotes?.some(
    (vote) => vote.userId?._id?.toString() === userId,
  )
  const hasUserDownvotedRepairReport = pothole.repairReport?.downvotes?.some(
    (vote) => vote.userId?._id?.toString() === userId,
  )
  const hasUserUpvotedPothole = pothole.upvotedBy?.some((user) => user._id?.toString() === userId)
  const hasUserReportedSpam = pothole.spamReports?.some((report) => report.userId?._id?.toString() === userId)

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "active":
        return "bg-black text-white"
      case "in_progress":
        return "bg-gray-800 text-white"
      case "repaired":
        return "bg-gray-600 text-white"
      default:
        return "bg-gray-400 text-white"
    }
  }

  const getCriticalityColor = (criticality: string) => {
    switch (criticality?.toLowerCase()) {
      case "high":
        return "bg-black text-white"
      case "medium":
        return "bg-gray-700 text-white"
      case "low":
        return "bg-gray-500 text-white"
      default:
        return "bg-gray-400 text-white"
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <Toaster />
      {/* Navigation */}
      <div className="border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <Link href="/potholes" className="inline-flex items-center text-black hover:text-gray-600 transition-colors">
            <ArrowLeft className="h-5 w-5 mr-2" />
            <span className="font-medium">Back to Potholes</span>
          </Link>
        </div>
      </div>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Mobile Layout */}
        <div className="lg:hidden space-y-8">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-3xl font-bold text-black mb-4">{pothole.title}</h1>
            <div className="flex justify-center gap-2 mb-6">
              <Badge className={`${getStatusColor(pothole.status || "")} font-semibold px-3 py-1`}>
                {pothole.status?.replace(/_/g, " ").toUpperCase()}
              </Badge>
              <Badge className={`${getCriticalityColor(pothole.criticality || "")} font-semibold px-3 py-1`}>
                <AlertTriangle className="h-3 w-3 mr-1" />
                {pothole.criticality?.toUpperCase()}
              </Badge>
            </div>
            <p className="text-gray-700 text-lg leading-relaxed mb-6">{pothole.description}</p>
          </div>
          {/* Images */}
          {pothole.images && pothole.images.length > 0 && (
            <div className="relative">
              <div className="relative w-full h-80 rounded-3xl overflow-hidden bg-gray-100 border-2 border-gray-200">
                <Image
                  src={pothole.images[currentImageIndex]?.url || "/placeholder.svg?height=400&width=600"}
                  alt={`${pothole.title} image ${currentImageIndex + 1}`}
                  fill
                  className="object-contain cursor-pointer" // Changed to object-contain and added cursor
                  onClick={() => openFullscreen(pothole.images[currentImageIndex]?.url || "/placeholder.svg")}
                />
                {pothole.images.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/80 hover:bg-black text-white rounded-full flex items-center justify-center transition-colors"
                    >
                      <ChevronLeft className="h-6 w-6" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/80 hover:bg-black text-white rounded-full flex items-center justify-center transition-colors"
                    >
                      <ChevronRight className="h-6 w-6" />
                    </button>
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
                      {pothole.images.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentImageIndex(index)}
                          className={`w-3 h-3 rounded-full transition-colors ${
                            index === currentImageIndex ? "bg-white" : "bg-white/50 hover:bg-white/75"
                          }`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
              <p className="text-center text-sm text-gray-500 mt-3">
                {currentImageIndex + 1} of {pothole.images.length}
              </p>
            </div>
          )}
          {/* Quick Actions */}
          <div className="flex gap-3">
            <Button
              onClick={handlePotholeUpvote}
              disabled={isUpvotingPothole}
              variant={hasUserUpvotedPothole ? "default" : "outline"}
              className={`flex-1 ${
                hasUserUpvotedPothole
                  ? "bg-black hover:bg-gray-800 text-white"
                  : "border-2 border-gray-300 hover:border-black hover:bg-black hover:text-white"
              }`}
            >
              {isUpvotingPothole ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <ThumbsUp className="h-4 w-4 mr-2" />
              )}
              {pothole.upvotes}
            </Button>
            <Button onClick={handleGoogleMapsNavigation} className="flex-1 bg-black hover:bg-gray-800 text-white">
              <Navigation className="h-4 w-4 mr-2" />
              Navigate
            </Button>
            <Button
              onClick={handleSpamReport}
              disabled={isReportingSpam || hasUserReportedSpam}
              variant="outline"
              className="border-2 border-gray-300 hover:border-red-500 hover:text-red-600 bg-transparent"
            >
              <Flag className="h-4 w-4" />
            </Button>
          </div>
          {/* Information Cards */}
          <div className="space-y-6">
            {/* Location Info */}
            <div className="bg-gray-50 rounded-3xl p-6 border border-gray-200">
              <h3 className="text-xl font-bold text-black mb-4 flex items-center">
                <MapPin className="h-5 w-5 mr-2" />
                Location Details
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="font-medium text-black">Address</p>
                  <p className="text-gray-600">{pothole.address}</p>
                </div>
                {pothole.area && (
                  <div>
                    <p className="font-medium text-black">Area</p>
                    <p className="text-gray-600">{pothole.area}</p>
                  </div>
                )}
              </div>
            </div>
            {/* Report Info */}
            <div className="bg-gray-50 rounded-3xl p-6 border border-gray-200">
              <h3 className="text-xl font-bold text-black mb-4 flex items-center">
                <User className="h-5 w-5 mr-2" />
                Report Information
              </h3>
              <div className="space-y-3">
                <div className="flex items-center">
                  <User className="h-4 w-4 text-gray-400 mr-3" />
                  <div>
                    <p className="font-medium text-black">Reported by</p>
                    <p className="text-gray-600">{pothole.reportedBy?.name || "N/A"}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 text-gray-400 mr-3" />
                  <div>
                    <p className="font-medium text-black">Date</p>
                    <p className="text-gray-600">{new Date(pothole.reportedAt).toLocaleDateString()}</p>
                  </div>
                </div>
                {pothole.dimensions && (
                  <div className="flex items-start">
                    <Ruler className="h-4 w-4 text-gray-400 mr-3 mt-1" />
                    <div>
                      <p className="font-medium text-black">Dimensions</p>
                      <div className="text-gray-600 space-y-1">
                        {pothole.dimensions.length !== undefined && <p>Length: {pothole.dimensions.length}m</p>}
                        {pothole.dimensions.width !== undefined && <p>Width: {pothole.dimensions.width}m</p>}
                        {pothole.dimensions.depth !== undefined && <p>Depth: {pothole.dimensions.depth}m</p>}
                      </div>
                    </div>
                  </div>
                )}
                {pothole.repairedAt && (
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-gray-600 mr-3" />
                    <div>
                      <p className="font-semibold text-black">Repaired On</p>
                      <p className="text-gray-600 text-sm">{new Date(pothole.repairedAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        {/* Desktop Layout */}
        <div className="hidden lg:block">
          <div className="grid grid-cols-12 gap-8">
            {/* Main Content */}
            <div className="col-span-8 space-y-8">
              {/* Header */}
              <div>
                <h1 className="text-5xl font-bold text-black mb-6">{pothole.title}</h1>
                <div className="flex gap-3 mb-6">
                  <Badge className={`${getStatusColor(pothole.status || "")} font-semibold text-sm px-4 py-2`}>
                    {pothole.status?.replace(/_/g, " ").toUpperCase()}
                  </Badge>
                  <Badge
                    className={`${getCriticalityColor(pothole.criticality || "")} font-semibold text-sm px-4 py-2`}
                  >
                    <AlertTriangle className="h-4 w-4 mr-1" />
                    {pothole.criticality?.toUpperCase()}
                  </Badge>
                </div>
                <p className="text-gray-700 text-xl leading-relaxed mb-8">{pothole.description}</p>
                <div className="flex gap-4">
                  <Button
                    onClick={handlePotholeUpvote}
                    disabled={isUpvotingPothole}
                    variant={hasUserUpvotedPothole ? "default" : "outline"}
                    size="lg"
                    className={
                      hasUserUpvotedPothole
                        ? "bg-black hover:bg-gray-800 text-white"
                        : "border-2 border-gray-300 hover:border-black hover:bg-black hover:text-white"
                    }
                  >
                    {isUpvotingPothole ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <ThumbsUp className="h-4 w-4 mr-2" />
                    )}
                    {pothole.upvotes} Upvotes
                  </Button>
                  <Button
                    onClick={handleGoogleMapsNavigation}
                    size="lg"
                    className="bg-black hover:bg-gray-800 text-white"
                  >
                    <Navigation className="h-4 w-4 mr-2" />
                    Navigate
                  </Button>
                  <Button
                    onClick={handleSpamReport}
                    disabled={isReportingSpam || hasUserReportedSpam}
                    variant="outline"
                    size="lg"
                    className="border-2 border-gray-300 hover:border-red-500 hover:text-red-600 bg-transparent"
                  >
                    {isReportingSpam ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Flag className="h-4 w-4 mr-2" />
                    )}
                    {hasUserReportedSpam ? "Reported" : "Report Spam"}
                  </Button>
                  {pothole && <TweetButton pothole={pothole} size="lg" />}
                </div>
              </div>
              {/* Images */}
              {pothole.images && pothole.images.length > 0 && (
                <div className="bg-gray-50 rounded-3xl p-8 border border-gray-200">
                  <h2 className="text-3xl font-bold text-black mb-6 flex items-center">
                    <Camera className="h-7 w-7 mr-3" />
                    Images ({pothole.images.length})
                  </h2>
                  <div className="relative">
                    <div className="relative w-full h-[500px] rounded-2xl overflow-hidden bg-white border-2 border-gray-200">
                      <Image
                        src={pothole.images[currentImageIndex]?.url || "/placeholder.svg?height=500&width=800"}
                        alt={`${pothole.title} image ${currentImageIndex + 1}`}
                        fill
                        className="object-contain cursor-pointer" // Changed to object-contain and added cursor
                        onClick={() => openFullscreen(pothole.images[currentImageIndex]?.url || "/placeholder.svg")}
                      />
                      {pothole.images.length > 1 && (
                        <>
                          <button
                            onClick={prevImage}
                            className="absolute left-6 top-1/2 -translate-y-1/2 w-14 h-14 bg-black/80 hover:bg-black text-white rounded-full flex items-center justify-center transition-colors"
                          >
                            <ChevronLeft className="h-7 w-7" />
                          </button>
                          <button
                            onClick={nextImage}
                            className="absolute right-6 top-1/2 -translate-y-1/2 w-14 h-14 bg-black/80 hover:bg-black text-white rounded-full flex items-center justify-center transition-colors"
                          >
                            <ChevronRight className="h-7 w-7" />
                          </button>
                        </>
                      )}
                    </div>
                    {pothole.images.length > 1 && (
                      <div className="flex justify-center mt-6 space-x-3">
                        {pothole.images.map((_, index) => (
                          <button
                            key={index}
                            onClick={() => setCurrentImageIndex(index)}
                            className={`w-4 h-4 rounded-full transition-colors ${
                              index === currentImageIndex ? "bg-black" : "bg-gray-300 hover:bg-gray-400"
                            }`}
                          />
                        ))}
                      </div>
                    )}
                    <p className="text-center text-gray-500 mt-4">
                      {currentImageIndex + 1} of {pothole.images.length}
                    </p>
                  </div>
                </div>
              )}
            </div>
            {/* Sidebar */}
            <div className="col-span-4 space-y-6">
              {/* Key Information */}
              <div className="bg-gray-50 rounded-3xl p-6 border border-gray-200">
                <h3 className="text-2xl font-bold text-black mb-6">Information</h3>
                <div className="space-y-5">
                  <div className="flex items-start">
                    <MapPin className="h-5 w-5 text-gray-400 mr-3 mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-black">Address</p>
                      <p className="text-gray-600 text-sm leading-relaxed">{pothole.address}</p>
                    </div>
                  </div>
                  {pothole.area && (
                    <div className="flex items-center">
                      <MapPin className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <p className="font-semibold text-black">Area</p>
                        <p className="text-gray-600 text-sm">{pothole.area}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center">
                    <User className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="font-semibold text-black">Reported By</p>
                      <p className="text-gray-600 text-sm">{pothole.reportedBy?.name || "N/A"}</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="font-semibold text-black">Reported On</p>
                      <p className="text-gray-600 text-sm">{new Date(pothole.reportedAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  {pothole.dimensions && (
                    <div className="flex items-start">
                      <Ruler className="h-5 w-5 text-gray-400 mr-3 mt-1" />
                      <div>
                        <p className="font-medium text-black">Dimensions</p>
                        <div className="text-gray-600 text-sm space-y-1">
                          {pothole.dimensions.length !== undefined && <p>Length: {pothole.dimensions.length}m</p>}
                          {pothole.dimensions.width !== undefined && <p>Width: {pothole.dimensions.width}m</p>}
                          {pothole.dimensions.depth !== undefined && <p>Depth: {pothole.dimensions.depth}m</p>}
                        </div>
                      </div>
                    </div>
                  )}
                  {pothole.repairedAt && (
                    <div className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-gray-600 mr-3" />
                      <div>
                        <p className="font-semibold text-black">Repaired On</p>
                        <p className="text-gray-600 text-sm">{new Date(pothole.repairedAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              {/* Tagged Officials */}
              {pothole.taggedOfficials && pothole.taggedOfficials.length > 0 && (
                <div className="bg-gray-50 rounded-3xl p-6 border border-gray-200">
                  <h3 className="text-2xl font-bold text-black mb-6">Tagged Officials</h3>
                  <div className="space-y-4">
                    {pothole.taggedOfficials.map((official, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-200"
                      >
                        <div>
                          <p className="font-semibold text-black capitalize">{official.role}</p>
                          {official.name && <p className="text-sm text-gray-600">{official.name}</p>}
                        </div>
                        {official.twitterHandle && (
                          <a
                            href={`https://twitter.com/${official.twitterHandle}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-black hover:text-gray-600 transition-colors"
                          >
                            <Twitter className="h-5 w-5" />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        {/* Comments and Repair Section */}
        <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Comments Section */}
          <div className="bg-gray-50 rounded-3xl p-6 lg:p-8 border border-gray-200">
            <h2 className="text-2xl lg:text-3xl font-bold text-black mb-6 flex items-center">
              <MessageCircle className="h-6 w-6 lg:h-7 lg:w-7 mr-3" />
              Comments ({pothole.comments.length})
            </h2>
            {/* Add Comment Form */}
            <form onSubmit={handleAddComment} className="mb-8">
              <Textarea
                placeholder="Share your thoughts about this pothole..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                maxLength={200}
                className="mb-4 border-2 border-gray-200 focus:border-black resize-none rounded-2xl"
                rows={3}
              />
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">{commentText.length}/200 characters</span>
                <Button
                  type="submit"
                  disabled={isCommenting || commentText.trim().length === 0}
                  className="bg-black hover:bg-gray-800 text-white"
                >
                  {isCommenting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                  {isCommenting ? "Posting..." : "Post Comment"}
                </Button>
              </div>
            </form>
            <Separator className="mb-8" />
            {/* Comments List */}
            <div className="max-h-96 lg:max-h-[500px] overflow-y-auto">
              {pothole.comments.length === 0 ? (
                <div className="text-center py-12">
                  <div className="bg-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 border border-gray-200">
                    <MessageCircle className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-black mb-2">No comments yet</h3>
                  <p className="text-gray-500">Be the first to share your thoughts about this pothole.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pothole.comments.map((comment, index) => (
                    <CommentItem
                      key={comment._id?.toString() || index}
                      comment={comment}
                      currentUserId={userId}
                      potholeId={id}
                      onCommentUpdated={fetchPotholeDetails}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
          {/* Repair Section */}
          <div className="bg-gray-50 rounded-3xl p-6 lg:p-8 border border-gray-200">
            <h2 className="text-2xl lg:text-3xl font-bold text-black mb-6 flex items-center">
              {pothole.status?.toLowerCase() === "repaired" ? (
                <>
                  <CheckCircle className="h-6 w-6 lg:h-7 lg:w-7 mr-3 text-gray-600" />
                  Repair Report
                </>
              ) : (
                <>
                  <AlertTriangle className="h-6 w-6 lg:h-7 lg:w-7 mr-3 text-gray-600" />
                  Repair Status
                </>
              )}
            </h2>
            {pothole.status?.toLowerCase() === "repaired" && pothole.repairReport ? (
              <div className="bg-white border-2 border-gray-200 p-6 rounded-2xl">
                <div className="flex items-center space-x-3 mb-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage
                      src={pothole.repairReport.submittedBy?.image || "/placeholder.svg?height=48&width=48"}
                    />
                    <AvatarFallback className="bg-gray-200 text-black font-semibold">
                      {pothole.repairReport.submittedBy?.name?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-black">{pothole.repairReport.submittedBy?.name || "N/A"}</p>
                    <p className="text-sm text-gray-600">
                      {pothole.repairReport.submittedAt &&
                        new Date(pothole.repairReport.submittedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                {pothole.repairReport.image && (
                  <div className="relative w-full h-48 mb-4 rounded-xl overflow-hidden border border-gray-200">
                    <Image
                      src={pothole.repairReport.image || "/placeholder.svg?height=200&width=400"}
                      alt="Repair report image"
                      fill
                      className="object-contain cursor-pointer" // Changed to object-contain and added cursor
                      onClick={() => openFullscreen(pothole.repairReport?.image || "/placeholder.svg")}
                    />
                  </div>
                )}
                {pothole.repairReport.comment && (
                  <p className="text-gray-700 mb-6 bg-gray-50 p-4 rounded-xl border border-gray-200">
                    {pothole.repairReport.comment}
                  </p>
                )}
                <div className="flex gap-3">
                  <Button
                    onClick={handleRepairReportUpvote}
                    disabled={isUpvotingRepairReport || isDownvotingRepairReport}
                    variant={hasUserUpvotedRepairReport ? "default" : "outline"}
                    className={
                      hasUserUpvotedRepairReport
                        ? "bg-black hover:bg-gray-800 text-white"
                        : "border-2 border-gray-300 hover:border-black hover:bg-black hover:text-white"
                    }
                  >
                    {isUpvotingRepairReport ? (
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <ThumbsUp className="h-4 w-4 mr-1" />
                    )}
                    {pothole.repairReport.upvotes?.length || 0}
                  </Button>
                  <Button
                    onClick={handleRepairReportDownvote}
                    disabled={isUpvotingRepairReport || isDownvotingRepairReport}
                    variant={hasUserDownvotedRepairReport ? "destructive" : "outline"}
                    className={
                      hasUserDownvotedRepairReport
                        ? ""
                        : "border-2 border-gray-300 hover:border-red-500 hover:text-red-600"
                    }
                  >
                    {isDownvotingRepairReport ? (
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <ThumbsDown className="h-4 w-4 mr-1" />
                    )}
                    {pothole.repairReport.downvotes?.length || 0}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="bg-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 border border-gray-200">
                  <AlertTriangle className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-black mb-2">Pothole Not Yet Repaired</h3>
                <p className="text-gray-600 mb-6 max-w-sm mx-auto">
                  Have you noticed this pothole has been fixed? Help the community by reporting the repair.
                </p>
                <Button
                  onClick={handleReportRepaired}
                  className="bg-black hover:bg-gray-800 text-white font-medium"
                  size="lg"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Report This Pothole as Repaired
                </Button>
                <div className="mt-6 p-4 bg-white rounded-xl border border-gray-200">
                  <p className="text-sm text-gray-600">
                    <strong>Current Status:</strong> {pothole.status?.replace(/_/g, " ") || "Unknown"}
                  </p>
                  {pothole.reportedAt && (
                    <p className="text-sm text-gray-600 mt-1">
                      <strong>Reported:</strong> {new Date(pothole.reportedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Fullscreen Image Modal */}
      {showFullscreenImage && fullscreenImageSrc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90 p-4">
          <button
            onClick={closeFullscreen}
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"
            aria-label="Close fullscreen image"
          >
            <X className="h-8 w-8" />
          </button>
          <div className="relative w-full h-full max-w-screen-lg max-h-screen-lg flex items-center justify-center">
            <Image
              src={fullscreenImageSrc || "/placeholder.svg"}
              alt="Fullscreen preview"
              fill
              className="object-contain" // Ensure the full image is visible
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default PotholeDetailsPage
