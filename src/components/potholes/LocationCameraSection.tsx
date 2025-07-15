"use client";

import type React from "react";
import { useState, useRef, useEffect, useCallback, type Dispatch, type SetStateAction } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera, MapPin, Upload, Loader2, X, RefreshCw, Map } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import dynamic from "next/dynamic";
import type { MapSelectorProps } from "../home/map-selector";

// Dynamically import the map component with proper typing
const MapSelector = dynamic<MapSelectorProps>(() => import("../home/map-selector"), { ssr: false });

interface LocationCameraSectionProps {
  formData: {
    location: { type: "Point"; coordinates: [number, number] };
    address: string;
    area: string;
  };
  setImages: Dispatch<SetStateAction<File[]>>;
  images: File[];
  onLocationUpdate: (latitude: number, longitude: number, address: string, area: string) => void;
}

export default function LocationCameraSection({
  formData,
  setImages,
  images,
  onLocationUpdate,
}: LocationCameraSectionProps) {
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [locationDetected, setLocationDetected] = useState(false);
  const [showMapSelector, setShowMapSelector] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Memoized location detection function
  const detectLocation = useCallback(async () => {
    if (locationDetected) return;

    setLocationLoading(true);

    if (!navigator.geolocation) {
      toast.error("Geolocation not supported by your browser.");
      setLocationLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
          );
          const data = await response.json();
          const area =
            data.address?.neighbourhood || data.address?.suburb || data.address?.village || data.address?.city || "";
          const address = data.display_name || "";

          onLocationUpdate(latitude, longitude, address, area);
          setLocationDetected(true);
          toast.success("Location detected successfully!");
        } catch (error) {
          console.error("Error fetching area:", error);
          toast.error("Unable to fetch area name. Please enter manually.");
        } finally {
          setLocationLoading(false);
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        let errorMessage = "Unable to access location.";

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location access denied. Please enable location permissions.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information unavailable.";
            break;
          case error.TIMEOUT:
            errorMessage = "Location request timed out.";
            break;
        }

        toast.error(errorMessage);
        setLocationLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000,
      },
    );
  }, [locationDetected, onLocationUpdate]);

  useEffect(() => {
    detectLocation();
  }, [detectLocation]);

    const startCamera = async () => {
    setCameraLoading(true);
    setVideoReady(false);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      setCameraStream(stream);
      
      // Use a timeout to ensure the video element is available in the DOM
      const checkVideoElement = () => {
        if (videoRef.current) {
          const video = videoRef.current;
          video.srcObject = stream;

          video.onloadedmetadata = () => {
            video.play()
              .then(() => {
                setVideoReady(true);
                setCameraLoading(false);
                toast.success("Camera started successfully!");
              })
              .catch((error) => {
                console.error("Error playing video:", error);
                toast.error("Error starting video playback.");
                setCameraLoading(false);
                stopCamera();
              });
          };

          video.onerror = () => {
            toast.error("An error occurred with the video stream.");
            setCameraLoading(false);
            stopCamera();
          };
        } else {
          // If video element isn't available yet, try again after a short delay
          setTimeout(checkVideoElement, 100);
        }
      };

      checkVideoElement();
    } catch (error) {
      console.error("Camera access error:", error);
      let errorMessage = "Unable to access camera.";

      if (error instanceof DOMException) {
        switch (error.name) {
          case "NotAllowedError":
          case "SecurityError":
            errorMessage = "Camera access denied. Please grant permission.";
            break;
          case "NotFoundError":
            errorMessage = "No camera found on this device.";
            break;
          case "NotReadableError":
            errorMessage = "Camera is already in use.";
            break;
          case "OverconstrainedError":
            errorMessage = "Camera constraints not supported.";
            break;
        }
      }

      toast.error(errorMessage);
      setCameraStream(null);
      setCameraLoading(false);
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
      setVideoReady(false);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const captureImage = () => {
    if (!videoRef.current || !canvasRef.current || !cameraStream || !videoReady) {
      toast.error("Camera not ready. Please wait or restart camera.");
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (video.videoWidth === 0 || video.videoHeight === 0) {
      toast.error("Video stream has no dimensions. Try restarting camera.");
      return;
    }

    const aspectRatio = 9 / 16;
    let canvasWidth = video.videoWidth;
    let canvasHeight = video.videoHeight;

    if (canvasWidth / canvasHeight > aspectRatio) {
      canvasWidth = canvasHeight * aspectRatio;
    } else {
      canvasHeight = canvasWidth / aspectRatio;
    }

    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      toast.error("Unable to get canvas context");
      return;
    }

    try {
      const sourceX = (video.videoWidth - canvasWidth) / 2;
      const sourceY = (video.videoHeight - canvasHeight) / 2;

      ctx.drawImage(video, sourceX, sourceY, canvasWidth, canvasHeight, 0, 0, canvasWidth, canvasHeight);

      const overlayHeight = 100;
      const padding = 10;

      ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
      ctx.fillRect(0, canvas.height - overlayHeight, canvas.width, overlayHeight);

      ctx.font = "bold 18px Arial";
      ctx.fillStyle = "white";
      ctx.textAlign = "left";

      const lat = formData.location.coordinates[1].toFixed(6);
      const lon = formData.location.coordinates[0].toFixed(6);
      const locationText = `📍 ${lat}, ${lon}`;
      const areaText = `🏘️ ${formData.area || "Unknown Area"}`;
      const dateText = `📅 ${new Date().toLocaleString()}`;

      const lineHeight = 25;
      let yPosition = canvas.height - overlayHeight + padding + lineHeight;

      ctx.fillText(locationText, padding, yPosition);
      yPosition += lineHeight;
      ctx.fillText(areaText, padding, yPosition);
      yPosition += lineHeight;
      ctx.fillText(dateText, padding, yPosition);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
            const file = new File([blob], `pothole-${timestamp}.jpg`, {
              type: "image/jpeg",
            });
            setImages((prev) => [...prev, file]);
            toast.success("Image captured with location overlay!");
            stopCamera();
          } else {
            toast.error("Failed to capture image.");
          }
        },
        "image/jpeg",
        0.9,
      );
    } catch (error) {
      console.error("Error capturing image:", error);
      toast.error("Failed to capture image.");
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    toast.success("Image removed");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setImages((prev) => [...prev, ...newFiles]);
      toast.success(`${newFiles.length} image(s) added`);
    }
  };

  const openImagePreview = (src: string) => {
    setPreviewImage(src);
  };

  const closeImagePreview = () => {
    setPreviewImage(null);
  };

  const handleMapLocationSelect = (lat: number, lng: number, address: string, area: string) => {
    onLocationUpdate(lat, lng, address, area);
    setShowMapSelector(false);
    toast.success("Location selected from map!");
  };

  return (
    <>
      {/* Location Information */}
      <Card className="border border-gray-300">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2 text-black">
            <MapPin className="h-5 w-5" />
            Location Information
            {locationLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div>
              <Label htmlFor="address" className="text-black font-medium">
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
                className="border border-gray-300 focus:border-black mt-1"
              />
            </div>
            <div>
              <Label htmlFor="area" className="text-black font-medium">
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
                className="border border-gray-300 focus:border-black mt-1"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              type="button"
              onClick={() => {
                setLocationDetected(false);
                detectLocation();
              }}
              variant="outline"
              className="border border-gray-300 hover:border-black hover:bg-black hover:text-white flex-1"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Auto Detect
            </Button>
            <Button
              type="button"
              onClick={() => setShowMapSelector(true)}
              variant="outline"
              className="border border-gray-300 hover:border-black hover:bg-black hover:text-white flex-1"
            >
              <Map className="h-4 w-4 mr-2" />
              Select on Map
            </Button>
          </div>

          {formData.location.coordinates[0] !== 0 && formData.location.coordinates[1] !== 0 && (
            <div className="flex items-center gap-2 text-sm text-black bg-gray-100 p-3 rounded border">
              <MapPin className="h-4 w-4 flex-shrink-0" />
              <span className="break-all">
                {formData.location.coordinates[1].toFixed(6)}, {formData.location.coordinates[0].toFixed(6)}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Images Section */}
      <Card className="border border-gray-300">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2 text-black">
            <Camera className="h-5 w-5" />
            Images *
          </CardTitle>
          <p className="text-sm text-gray-600">Add at least one clear image of the pothole.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              type="button"
              onClick={startCamera}
              disabled={!!cameraStream || cameraLoading}
              variant="outline"
              className="border border-gray-300 hover:border-black hover:bg-black hover:text-white flex-1 bg-transparent"
            >
              {cameraLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Camera className="h-4 w-4 mr-2" />}
              {cameraStream ? "Camera Active" : "Open Camera"}
            </Button>

            <Label htmlFor="file-upload" className="cursor-pointer flex-1">
              <Button
                type="button"
                variant="outline"
                className="w-full border border-gray-300 hover:border-black hover:bg-black hover:text-white bg-transparent"
                asChild
              >
                <span>
                  <Upload className="h-4 w-4 mr-2" />
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

          {/* Camera View */}
          {cameraStream && (
            <div className="border border-gray-300 rounded p-4">
              <div
                className="relative bg-black rounded overflow-hidden mx-auto"
                style={{ aspectRatio: "9/16", maxWidth: "280px" }}
              >
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                {!videoReady && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="text-white text-center">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                      <p>Loading camera...</p>
                    </div>
                  </div>
                )}
                {videoReady && formData.location.coordinates[0] !== 0 && formData.location.coordinates[1] !== 0 && (
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-80 text-white p-2 text-xs">
                    <div>
                      📍 {formData.location.coordinates[1].toFixed(6)}, {formData.location.coordinates[0].toFixed(6)}
                    </div>
                    <div>🏘️ {formData.area || "Unknown Area"}</div>
                    <div>📅 {new Date().toLocaleString()}</div>
                  </div>
                )}
              </div>
              <div className="flex flex-col sm:flex-row gap-2 mt-4">
                <Button
                  type="button"
                  onClick={captureImage}
                  disabled={!videoReady}
                  className="bg-black hover:bg-gray-800 text-white flex-1"
                >
                  <Camera className="h-4 w-4 mr-2" />
                  {videoReady ? "Capture Photo" : "Camera Loading..."}
                </Button>
                <Button
                  type="button"
                  onClick={stopCamera}
                  variant="outline"
                  className="border border-gray-300 hover:border-black hover:bg-black hover:text-white flex-1 bg-transparent"
                >
                  <X className="h-4 w-4 mr-2" />
                  Close Camera
                </Button>
              </div>
            </div>
          )}

          {/* Image Previews */}
          {images.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {images.map((img, index) => (
                <div key={index} className="relative group">
                  <Image
                    src={URL.createObjectURL(img) || "/placeholder.svg"}
                    alt={`Pothole Preview ${index + 1}`}
                    width={200}
                    height={150}
                    className="object-cover rounded border w-full h-24 cursor-pointer hover:border-gray-500 transition-colors"
                    onClick={() => openImagePreview(URL.createObjectURL(img))}
                  />
                  <Button
                    type="button"
                    onClick={() => removeImage(index)}
                    size="sm"
                    variant="destructive"
                    className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {images.length === 0 && (
            <div className="text-center py-8 text-gray-500 border border-dashed border-gray-300 rounded">
              <Camera className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No images added yet. Please add at least one image.</p>
            </div>
          )}

          <canvas ref={canvasRef} style={{ display: "none" }} />

          {/* Image Preview Dialog */}
          <Dialog open={!!previewImage} onOpenChange={closeImagePreview}>
            <DialogContent className="max-w-4xl w-full max-h-[90vh]">
              <DialogHeader>
                <DialogTitle>Image Preview</DialogTitle>
                <DialogDescription>A larger view of your captured image.</DialogDescription>
              </DialogHeader>
              <div className="flex items-center justify-center overflow-hidden relative min-h-[400px]">
                {previewImage && (
                  <Image
                    src={previewImage || "/placeholder.svg"}
                    alt="Image Preview"
                    fill
                    style={{ objectFit: "contain" }}
                    className="rounded"
                  />
                )}
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      {/* Map Selector Dialog */}
      <Dialog open={showMapSelector} onOpenChange={setShowMapSelector}>
        <DialogContent className="max-w-4xl w-full max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Select Location on Map</DialogTitle>
            <DialogDescription>Click on the map to select the exact location of the pothole.</DialogDescription>
          </DialogHeader>
          <div className="h-[500px] w-full">
            <MapSelector
              initialPosition={
                formData.location.coordinates[0] !== 0 && formData.location.coordinates[1] !== 0
                  ? [formData.location.coordinates[1], formData.location.coordinates[0]] as [number, number]
                  : [28.6139, 77.209] as [number, number]
              }
              onLocationSelect={handleMapLocationSelect}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}