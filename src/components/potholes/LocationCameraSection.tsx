"use client"

import type React from "react"
import { useState, useRef, useEffect, type Dispatch, type SetStateAction } from "react"
import Image from "next/image"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Camera, MapPin, Upload, Loader2, X } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface LocationCameraSectionProps {
  formData: {
    location: { type: "Point"; coordinates: [number, number] }
    address: string
    area: string
  }
  setImages: Dispatch<SetStateAction<File[]>>
  images: File[]
  onLocationUpdate: (latitude: number, longitude: number, address: string, area: string) => void
}

export default function LocationCameraSection({
  formData,
  setImages,
  images,
  onLocationUpdate,
}: LocationCameraSectionProps) {
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null)
  const [locationLoading, setLocationLoading] = useState(false)
  const [cameraLoading, setCameraLoading] = useState(false)
  const [videoReady, setVideoReady] = useState(false)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Get user location and area name using OpenStreetMap Nominatim
  useEffect(() => {
    let hasShownToast = false
    if (navigator.geolocation) {
      setLocationLoading(true)
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords

          // Reverse geocode using OpenStreetMap Nominatim
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
            )
            const data = await response.json()
            const area =
              data.address?.neighbourhood || data.address?.suburb || data.address?.village || data.address?.city || ""
            const address = data.display_name || ""
            onLocationUpdate(latitude, longitude, address, area)
            if (!hasShownToast) {
              toast.success("Location detected successfully!")
              hasShownToast = true
            }
          } catch (error) {
            console.error("Error fetching area:", error)
            if (!hasShownToast) {
              toast.error("Unable to fetch area name. Please enter manually.")
              hasShownToast = true
            }
          } finally {
            setLocationLoading(false)
          }
        },
        (error) => {
          console.error("Geolocation error:", error)
          if (!hasShownToast) {
            toast.error("Unable to access location. Please enter coordinates manually.")
            hasShownToast = true
          }
          setLocationLoading(false)
        },
      )
    } else {
      if (!hasShownToast) {
        toast.error("Geolocation not supported by your browser.")
        hasShownToast = true
      }
    }
  }, [onLocationUpdate]) // Added onLocationUpdate to the dependency array

  // Start camera
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
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 },
        },
      })
      setCameraStream(stream)
      video.srcObject = stream
      // Ensure old listeners are cleared to prevent multiple firings
      video.onloadedmetadata = null
      video.oncanplay = null
      video.onerror = null
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

  // Stop camera
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

  // Capture image and overlay coordinates/area with 9:16 ratio
  const captureImage = () => {
    if (!videoRef.current || !canvasRef.current || !cameraStream || !videoReady) {
      toast.error("Camera not ready. Please wait for the camera to load or start it.")
      return
    }
    const video = videoRef.current
    const canvas = canvasRef.current
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      toast.error("Video stream has no dimensions. Cannot capture image. Try restarting camera.")
      return
    }

    // Set canvas to 9:16 aspect ratio
    const aspectRatio = 9 / 16
    let canvasWidth = video.videoWidth
    let canvasHeight = video.videoHeight

    // Adjust to maintain 9:16 ratio
    if (canvasWidth / canvasHeight > aspectRatio) {
      canvasWidth = canvasHeight * aspectRatio
    } else {
      canvasHeight = canvasWidth / aspectRatio
    }

    canvas.width = canvasWidth
    canvas.height = canvasHeight

    const ctx = canvas.getContext("2d")
    if (!ctx) {
      toast.error("Unable to get canvas context")
      return
    }
    try {
      // Calculate crop area to maintain aspect ratio
      const sourceX = (video.videoWidth - canvasWidth) / 2
      const sourceY = (video.videoHeight - canvasHeight) / 2

      ctx.drawImage(video, sourceX, sourceY, canvasWidth, canvasHeight, 0, 0, canvasWidth, canvasHeight)

      // Create overlay background
      const overlayHeight = 100
      const padding = 10
      // Semi-transparent background
      ctx.fillStyle = "rgba(0, 0, 0, 0.8)"
      ctx.fillRect(0, canvas.height - overlayHeight, canvas.width, overlayHeight)
      // Set text properties
      ctx.font = "bold 18px Arial"
      ctx.fillStyle = "white"
      ctx.textAlign = "left"
      // Prepare text content
      const lat = formData.location.coordinates[1].toFixed(6)
      const lon = formData.location.coordinates[0].toFixed(6)
      const locationText = `📍 Lat: ${lat}, Lon: ${lon}`
      const areaText = `🏘️ ${formData.area || "Unknown Area"}`
      const dateText = `📅 ${new Date().toLocaleString()}`
      // Draw text with proper spacing
      const lineHeight = 25
      let yPosition = canvas.height - overlayHeight + padding + lineHeight
      ctx.fillText(locationText, padding, yPosition)
      yPosition += lineHeight
      ctx.fillText(areaText, padding, yPosition)
      yPosition += lineHeight
      ctx.fillText(dateText, padding, yPosition)
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
            const file = new File([blob], `pothole-${timestamp}.jpg`, {
              type: "image/jpeg",
            })
            setImages((prev) => [...prev, file])
            toast.success("Image captured with location overlay!")
            stopCamera()
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

  // Remove image
  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index))
  }

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setImages((prev) => [...prev, ...Array.from(e.target.files || [])])
    }
  }

  const openImagePreview = (src: string) => {
    setPreviewImage(src)
  }

  const closeImagePreview = () => {
    setPreviewImage(null)
  }

  return (
    <>
      {/* Location Information */}
      <Card className="border-2 border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2 text-black">
            <MapPin className="h-5 w-5" />
            Location Information
            {locationLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="address" className="text-black font-semibold">
              Address *
            </Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) =>
                onLocationUpdate(
                  formData.location.coordinates[1],
                  formData.location.coordinates[0],
                  e.target.value,
                  formData.area,
                )
              }
              placeholder="Full address of the pothole location"
              required
              className="border-2 border-gray-200 focus:border-black"
            />
          </div>
          <div>
            <Label htmlFor="area" className="text-black font-semibold">
              Area/Neighborhood
            </Label>
            <Input
              id="area"
              value={formData.area}
              onChange={(e) =>
                onLocationUpdate(
                  formData.location.coordinates[1],
                  formData.location.coordinates[0],
                  formData.address,
                  e.target.value,
                )
              }
              placeholder="Area or neighborhood name"
              className="border-2 border-gray-200 focus:border-black"
            />
          </div>
          {formData.location.coordinates[0] !== 0 && (
            <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-200">
              <MapPin className="h-4 w-4" />
              <span>
                Coordinates: {formData.location.coordinates[1].toFixed(6)},{" "}
                {formData.location.coordinates[0].toFixed(6)}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Images Section */}
      <Card className="border-2 border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2 text-black">
            <Camera className="h-5 w-5" />
            Images
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            <Button
              type="button"
              onClick={startCamera}
              disabled={!!cameraStream || cameraLoading}
              variant="outline"
              className="flex items-center gap-2 border-2 border-gray-300 hover:border-black hover:bg-black hover:text-white bg-transparent"
            >
              {cameraLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
              {cameraStream ? "Camera Active" : "Open Camera"}
            </Button>
            <Label htmlFor="file-upload" className="cursor-pointer">
              <Button
                type="button"
                variant="outline"
                className="flex items-center gap-2 border-2 border-gray-300 hover:border-black hover:bg-black hover:text-white bg-transparent"
                asChild
              >
                <span>
                  <Upload className="h-4 w-4" />
                  Upload Files
                </span>
              </Button>
              <Input
                id="file-upload"
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileUpload}
                className="hidden"
              />
            </Label>
          </div>

          {/* Camera View with 9:16 ratio */}
          <Card className="border-2 border-dashed border-gray-300" style={{ display: cameraStream ? "block" : "none" }}>
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
                {videoReady && formData.location.coordinates[0] !== 0 && (
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-80 text-white p-2 text-sm">
                    <div>
                      📍 Lat: {formData.location.coordinates[1].toFixed(6)}, Lon:{" "}
                      {formData.location.coordinates[0].toFixed(6)}
                    </div>
                    <div>🏘️ {formData.area || "Unknown Area"}</div>
                    <div>📅 {new Date().toLocaleString()}</div>
                  </div>
                )}
              </div>
              <div className="flex gap-2 mt-4 justify-center">
                <Button
                  type="button"
                  onClick={captureImage}
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

          {/* Image Previews */}
          {images.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {images.map((img, index) => (
                <div key={index} className="relative group">
                  <Image
                    src={URL.createObjectURL(img) || "/placeholder.svg"}
                    alt={`Pothole Preview ${index + 1}`}
                    width={200}
                    height={150}
                    className="object-cover rounded-lg border-2 border-gray-200 w-full h-32 cursor-pointer hover:border-black transition-colors"
                    onClick={() => openImagePreview(URL.createObjectURL(img))}
                  />
                  <Button
                    type="button"
                    onClick={() => removeImage(index)}
                    size="sm"
                    variant="destructive"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Hidden canvas for image processing */}
          <canvas ref={canvasRef} style={{ display: "none" }} />

          {/* Larger Image Preview Dialog */}
          <Dialog open={!!previewImage} onOpenChange={closeImagePreview}>
            <DialogContent className="sm:max-w-[800px] w-full max-h-[90vh] flex flex-col">
              <DialogHeader>
                <DialogTitle>Image Preview</DialogTitle>
                <DialogDescription>A larger view of your captured image.</DialogDescription>
              </DialogHeader>
              <div className="flex-grow flex items-center justify-center overflow-hidden">
                {previewImage && (
                  <Image
                    src={previewImage || "/placeholder.svg"}
                    alt="Image Preview"
                    fill
                    style={{ objectFit: "contain" }}
                    className="rounded-md"
                  />
                )}
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </>
  )
}