"use client"

import type React from "react"
import { useState, useEffect, useRef, useCallback } from "react" // Import useCallback
import { useRouter, useSearchParams } from "next/navigation"
import { useSession } from "next-auth/react"
import { toast, Toaster } from "sonner"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  ArrowLeft,
  Camera,
  CheckCircle,
  AlertTriangle,
  Loader2,
  MapPin,
  Calendar,
  User,
  Navigation,
  RefreshCw,
  X,
  ExternalLink,
} from "lucide-react"

interface PotholeBasicInfo {
  _id: string
  title: string
  description: string
  address: string
  status: string
  criticality: string
  location: {
    type: string
    coordinates: [number, number]
  }
  reportedBy: {
    name: string
  }
  reportedAt: Date
}

export default function ReportRepairedPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session } = useSession() // `session` is used later in handleSubmit, so the warning might have been premature based on an older state. Let's keep it.
  const potholeId = searchParams.get("potholeId")
  const videoRef = useRef<HTMLVideoElement>(null)

  const [pothole, setPothole] = useState<PotholeBasicInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [comment, setComment] = useState("")
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [imageBlob, setImageBlob] = useState<Blob | null>(null)
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null)
  const [cameraLoading, setCameraLoading] = useState(false)
  const [videoReady, setVideoReady] = useState(false)
  const [locationVerified, setLocationVerified] = useState(false)
  const [checkingLocation, setCheckingLocation] = useState(true)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [distance, setDistance] = useState<number | null>(null)
console.log("userLocation", userLocation)
  // Memoize verifyUserLocation to use in dependencies
  const verifyUserLocation = useCallback(async (potholeData: PotholeBasicInfo) => {
    setCheckingLocation(true)
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by this browser")
      setCheckingLocation(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLat = position.coords.latitude
        const userLng = position.coords.longitude
        const potholeLat = potholeData.location.coordinates[1]
        const potholeLng = potholeData.location.coordinates[0]

        setUserLocation({ lat: userLat, lng: userLng })
        const distanceInMeters = calculateDistance(userLat, userLng, potholeLat, potholeLng)
        setDistance(Math.round(distanceInMeters))

        if (distanceInMeters <= 100) {
          setLocationVerified(true)
          toast.success("Location verified! You can now report the repair.")
        } else {
          setLocationVerified(false)
          toast.error(
            `You are ${Math.round(distanceInMeters)}m away from the pothole. You need to be within 100m to report repairs.`,
          )
        }
        setCheckingLocation(false)
      },
      (error) => {
        console.error("Error getting location:", error)
        toast.error("Unable to get your location. Please enable location services.")
        setCheckingLocation(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      },
    )
  }, []) // No dependencies needed for verifyUserLocation itself as it only reads props and sets state.

  // Memoize fetchPotholeInfo to use in dependencies
  const fetchPotholeInfo = useCallback(async () => {
    if (!potholeId) {
      // This check is duplicated, but useful here if called directly
      toast.error("No pothole ID provided")
      router.push("/")
      return
    }
    try {
      const res = await fetch(`/api/potholes/${potholeId}`)
      const data = await res.json()
      if (res.ok) {
        setPothole(data.data)
        // Ensure verifyUserLocation is called with the fetched data
        verifyUserLocation(data.data)
      } else {
        toast.error("Failed to fetch pothole information")
        router.push("/")
      }
    } catch (error) {
      console.error("Error fetching pothole:", error)
      toast.error("An error occurred")
      router.push("/")
    } finally {
      setLoading(false)
    }
  }, [potholeId, router, verifyUserLocation]) // Add potholeId, router, and verifyUserLocation to dependencies

  // --- useEffect for initial pothole data fetch ---
  useEffect(() => {
    if (potholeId) {
      fetchPotholeInfo()
    } else {
      toast.error("No pothole ID provided")
      router.push("/")
    }
  }, [potholeId, fetchPotholeInfo, router]) // Add fetchPotholeInfo and router to dependencies

  // --- useEffect for camera stream cleanup ---
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop())
      }
    }
  }, [cameraStream])

  // --- Helper to calculate distance ---
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3
    const φ1 = (lat1 * Math.PI) / 180
    const φ2 = (lat2 * Math.PI) / 180
    const Δφ = ((lat2 - lat1) * Math.PI) / 180
    const Δλ = ((lon2 - lon1) * Math.PI) / 180
    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  // console.log("userLocation", userLocation) // Keep this if you need it for debugging, otherwise remove.

  const openGoogleMapsNavigation = () => {
    if (pothole) {
      const lat = pothole.location.coordinates[1]
      const lng = pothole.location.coordinates[0]
      // Corrected Google Maps URL - use 'maps.google.com' for navigation via web, not 'googleusercontent.com'
      // You might also want to encode the coordinates if they were part of a query string, but directly in path is fine.
      // The `0{lat}` part seems like a typo, should probably be just `${lat}`
      const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`
      window.open(url, "_blank")
    }
  }

  // Start camera - based on working LocationCameraSection
  const startCamera = async () => {
    setCameraLoading(true)
    setVideoReady(false)

    if (!videoRef.current) {
      toast.error("Video element not found in DOM. This is an internal error.")
      setCameraLoading(false)
      return
    }

    const video = videoRef.current

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 720, min: 480 },
          height: { ideal: 1280, min: 854 }, // 9:16 aspect ratio
        },
      })

      setCameraStream(stream)
      video.srcObject = stream

      // Ensure old listeners are cleared to prevent multiple firings
      // Use event listeners correctly and clean them up.
      // No need to set to null, just add and remove as needed or ensure they don't fire multiple times.
      // For simplicity, we'll ensure only one listener is active at a time by removing existing ones if any.
      video.onloadedmetadata = () => {
        console.log("Video metadata loaded.")
        video
          .play()
          .then(() => {
            console.log("Video playback started.")
            setVideoReady(true)
            setCameraLoading(false)
            toast.success("Camera started successfully!")
          })
          .catch((error) => {
            console.error("Error playing video:", error)
            let playErrorMsg = "Error starting video playback. " + (error instanceof DOMException ? error.message : "")
            if (error.name === "NotAllowedError") {
              playErrorMsg = "Playback denied. Ensure browser allows autoplay or user interaction."
            } else if (error.name === "NotReadableError") {
              playErrorMsg = "Video stream not readable. Camera might be in use elsewhere."
            }
            toast.error(playErrorMsg)
            setCameraLoading(false)
            stopCamera()
          })
      }

      video.oncanplay = () => {
        if (!videoReady) {
          console.log("Video canplay event fired.")
          video
            .play()
            .then(() => {
              setVideoReady(true)
              setCameraLoading(false)
              toast.success("Camera started successfully!")
            })
            .catch((error) => {
              console.error("Error playing video from oncanplay:", error)
              toast.error("Error starting video playback from oncanplay.")
              setCameraLoading(false)
              stopCamera()
            })
        }
      }

      video.onerror = (event) => {
        console.error("Video element error:", event)
        toast.error("An error occurred with the video stream.")
        setCameraLoading(false)
        stopCamera()
      }

      video.load()
    } catch (error) {
      console.error("Camera access error:", error)
      let errorMessage = "Unable to access camera. Please check permissions."

      if (error instanceof DOMException) {
        if (error.name === "NotAllowedError" || error.name === "SecurityError") {
          errorMessage = "Camera access denied. Please grant permission in your browser settings."
        } else if (error.name === "NotFoundError") {
          errorMessage = "No camera found on this device or it's unavailable."
        } else if (error.name === "NotReadableError") {
          errorMessage = "Camera is already in use by another application or device."
        } else if (error.name === "OverconstrainedError") {
          errorMessage = "Camera constraints not supported by device. Try different resolution settings."
        }
      }

      toast.error(errorMessage)
      setCameraStream(null)
      setCameraLoading(false)
    }
  }

  const stopCamera = () => {
    if (cameraStream) {
      console.log("Stopping camera stream...")
      cameraStream.getTracks().forEach((track) => track.stop())
      setCameraStream(null)
      setVideoReady(false)
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
      videoRef.current.onloadedmetadata = null
      videoRef.current.oncanplay = null
      videoRef.current.onerror = null
      videoRef.current.load()
    }
  }

  const capturePhoto = () => {
    if (!videoRef.current || !cameraStream || !videoReady) {
      toast.error("Camera not ready. Please wait for the camera to load or start it.")
      return
    }

    const video = videoRef.current
    const canvas = document.createElement("canvas")

    if (video.videoWidth === 0 || video.videoHeight === 0) {
      toast.error("Video stream has no dimensions. Cannot capture image. Try restarting camera.")
      return
    }

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext("2d")

    if (!ctx) {
      toast.error("Unable to get canvas context")
      return
    }

    try {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

      canvas.toBlob(
        (blob) => {
          if (blob) {
            const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
            const file = new File([blob], `repair-${timestamp}.jpg`, {
              type: "image/jpeg",
            })
            setImageBlob(file)
            const imageUrl = URL.createObjectURL(file)
            setCapturedImage(imageUrl)
            stopCamera()
            toast.success("Photo captured successfully!")
          } else {
            toast.error("Failed to capture image: Blob creation failed.")
          }
        },
        "image/jpeg",
        0.9,
      )
    } catch (error) {
      console.error("Error capturing image:", error)
      toast.error("Failed to capture image due to rendering error.")
    }
  }

  const retakePhoto = () => {
    setCapturedImage(null)
    setImageBlob(null)
    startCamera()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!session?.user?.id) {
      toast.error("You need to be logged in to report repairs")
      return
    }
    if (!locationVerified) {
      toast.error("You need to be at the pothole location to report repairs")
      return
    }
    if (!imageBlob) {
      toast.error("Please capture a photo of the repaired pothole")
      return
    }

    setSubmitting(true)
    try {
      const formData = new FormData()
      formData.append("image", imageBlob, "repair-photo.jpg")
      formData.append("comment", comment.trim())

      const res = await fetch(`/api/potholes/${potholeId}/repair-report`, {
        method: "POST",
        body: formData,
      })

      const data = await res.json()
      if (res.ok) {
        toast.success("Repair report submitted successfully!")
        router.push(`/potholes/${potholeId}`)
      } else {
        toast.error(data.error || "Failed to submit repair report")
      }
    } catch (error) {
      console.error("Error submitting repair report:", error)
      toast.error("An error occurred while submitting the report")
    } finally {
      setSubmitting(false)
    }
  }

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

  if (loading || checkingLocation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-black mx-auto mb-4" />
          <p className="text-lg text-gray-600">
            {loading ? "Loading pothole information..." : "Verifying your location..."}
          </p>
        </div>
      </div>
    )
  }

  if (!pothole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center max-w-md mx-4">
          <AlertTriangle className="h-16 w-16 text-black mx-auto mb-4" />
          <p className="text-black text-lg font-medium">Pothole not found</p>
        </div>
      </div>
    )
  }

  if (!locationVerified) {
    return (
      <div className="min-h-screen bg-white">
        <Toaster />

        {/* Header */}
        <div className="border-b border-gray-200">
          <div className="container mx-auto px-4 py-4">
            <button
              onClick={() => router.back()}
              className="inline-flex items-center text-black hover:text-gray-600 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              <span className="font-medium">Back</span>
            </button>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8 max-w-md">
          <div className="bg-gray-50 rounded-3xl p-8 border border-gray-200 text-center">
            <div className="bg-white rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6 border border-gray-200">
              <Navigation className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-black mb-4">Location Verification Required</h3>
            <p className="text-gray-600 mb-6">You need to be within 100 meters of the pothole to report repairs.</p>

            {distance && (
              <div className="bg-white rounded-2xl p-4 mb-6 border border-gray-200">
                <p className="text-sm text-gray-500">Current distance</p>
                <p className="text-2xl font-bold text-black">{distance}m</p>
              </div>
            )}

            <div className="space-y-3">
              <Button
                onClick={() => verifyUserLocation(pothole)}
                className="w-full bg-black hover:bg-gray-800 text-white"
                disabled={checkingLocation}
                size="lg"
              >
                {checkingLocation ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Checking Location...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retry Location Check
                  </>
                )}
              </Button>

              <Button
                onClick={openGoogleMapsNavigation}
                variant="outline"
                className="w-full border-2 border-gray-300 hover:border-black hover:bg-black hover:text-white bg-transparent"
                size="lg"
              >
                <Navigation className="h-4 w-4 mr-2" />
                Navigate to Pothole
                <ExternalLink className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <Toaster />

      {/* Header */}
      <div className="border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center text-black hover:text-gray-600 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            <span className="font-medium">Back to Pothole Details</span>
          </button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header Section */}
        <div className="text-center mb-8">
          <h1 className="text-3xl lg:text-4xl font-bold text-black mb-4">Report Pothole as Repaired</h1>
          <p className="text-gray-600 text-lg mb-6">Help the community by confirming this pothole has been fixed</p>

          <div className="inline-flex items-center bg-gray-50 rounded-full px-4 py-2 border border-gray-200">
            <CheckCircle className="h-4 w-4 text-gray-600 mr-2" />
            <span className="text-sm font-medium text-black">Location Verified</span>
            {distance && <span className="text-xs text-gray-500 ml-2">({distance}m away)</span>}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Pothole Information */}
          <div className="bg-gray-50 rounded-3xl p-6 lg:p-8 border border-gray-200">
            <h2 className="text-2xl font-bold text-black mb-6">Pothole Information</h2>

            <div className="space-y-6">
              <div>
                <h3 className="font-bold text-xl text-black mb-2">{pothole.title}</h3>
                <p className="text-gray-700 leading-relaxed">{pothole.description}</p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge className={`${getStatusColor(pothole.status)} font-semibold px-3 py-1`}>
                  {pothole.status?.replace(/_/g, " ").toUpperCase()}
                </Badge>
                <Badge className={`${getCriticalityColor(pothole.criticality)} font-semibold px-3 py-1`}>
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  {pothole.criticality?.toUpperCase()}
                </Badge>
              </div>

              <div className="space-y-4 pt-4 border-t border-gray-200">
                <div className="flex items-start">
                  <MapPin className="h-5 w-5 text-gray-400 mr-3 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-black">Address</p>
                    <p className="text-gray-600 text-sm">{pothole.address}</p>
                  </div>
                </div>

                <div className="flex items-center">
                  <User className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="font-semibold text-black">Reported by</p>
                    <p className="text-gray-600 text-sm">{pothole.reportedBy?.name || "N/A"}</p>
                  </div>
                </div>

                <div className="flex items-center">
                  <Calendar className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="font-semibold text-black">Reported on</p>
                    <p className="text-gray-600 text-sm">{new Date(pothole.reportedAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Report Form */}
          <div className="bg-gray-50 rounded-3xl p-6 lg:p-8 border border-gray-200">
            <h2 className="text-2xl font-bold text-black mb-6 flex items-center">
              <CheckCircle className="h-6 w-6 mr-3 text-gray-600" />
              Submit Repair Report
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Camera Section */}
              <div>
                <label className="block text-sm font-semibold text-black mb-3">
                  Capture Photo of Repaired Pothole *
                </label>

                {!capturedImage && !cameraStream && (
                  <div className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center bg-white">
                    <div className="bg-gray-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 border border-gray-200">
                      <Camera className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-gray-600 mb-4 font-medium">Take a photo of the repaired pothole</p>
                    <p className="text-gray-500 text-sm mb-6">Photo will be captured in mobile format (9:16 ratio)</p>
                    <Button
                      type="button"
                      onClick={startCamera}
                      className="bg-black hover:bg-gray-800 text-white"
                      disabled={cameraLoading}
                      size="lg"
                    >
                      {cameraLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Starting Camera...
                        </>
                      ) : (
                        <>
                          <Camera className="h-4 w-4 mr-2" />
                          Open Camera
                        </>
                      )}
                    </Button>
                  </div>
                )}

                {/* Camera View */}
                {cameraStream && (
                  <Card className="border-2 border-gray-300">
                    <CardContent className="p-4">
                      <div
                        className="relative bg-black rounded-lg overflow-hidden mx-auto"
                        style={{ aspectRatio: "9/16", maxWidth: "300px" }}
                      >
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          muted
                          className="w-full h-full object-cover"
                          style={{
                            display: "block",
                            backgroundColor: "#000",
                          }}
                        />
                        {!videoReady && cameraStream && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                            <div className="text-white text-center">
                              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                              <p>Loading camera...</p>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2 mt-4 justify-center">
                        <Button
                          type="button"
                          onClick={capturePhoto}
                          disabled={!videoReady}
                          className="bg-black hover:bg-gray-800 text-white"
                        >
                          <Camera className="h-4 w-4 mr-2" />
                          {videoReady ? "Capture Photo" : "Camera Loading..."}
                        </Button>
                        <Button
                          type="button"
                          onClick={stopCamera}
                          variant="outline"
                          className="border-2 border-gray-300 hover:border-black hover:bg-black hover:text-white bg-transparent"
                        >
                          <X className="h-4 w-4 mr-2" />
                          Close Camera
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {capturedImage && (
                  <div className="space-y-4">
                    <div
                      className="relative mx-auto rounded-2xl overflow-hidden border-2 border-gray-200"
                      style={{ aspectRatio: "9/16", maxWidth: "300px" }}
                    >
                      <Image
                        src={capturedImage || "/placeholder.svg?height=400&width=225"}
                        alt="Captured repair photo"
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="text-center">
                      <Button
                        type="button"
                        onClick={retakePhoto}
                        variant="outline"
                        className="border-2 border-gray-300 hover:border-black hover:bg-black hover:text-white bg-transparent"
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Retake Photo
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Comment */}
              <div>
                <label className="block text-sm font-semibold text-black mb-3">Additional Comments (Optional)</label>
                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Describe the repair work or any additional details..."
                  rows={4}
                  maxLength={500}
                  className="border-2 border-gray-200 focus:border-black resize-none rounded-2xl"
                />
                <p className="text-sm text-gray-500 mt-2">{comment.length}/500 characters</p>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={submitting || !capturedImage}
                className="w-full bg-black hover:bg-gray-800 text-white font-semibold"
                size="lg"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting Report...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Submit Repair Report
                  </>
                )}
              </Button>

              <p className="text-sm text-gray-600 text-center">
                Your report will be reviewed by the community and local authorities
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}