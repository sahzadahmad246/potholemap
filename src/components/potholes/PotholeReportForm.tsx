// components/PotholeReportForm.tsx
"use client"

import type React from "react"
import { useState } from "react"
import axios, { AxiosError } from "axios"
import { toast, Toaster } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, Send, Loader2 } from "lucide-react"

import LocationCameraSection from "./LocationCameraSection"
import PotholeDetailsForm from "./PotholeDetailsForm"

interface FormData {
  title: string
  description: string
  location: { type: "Point"; coordinates: [number, number] }
  address: string
  area: string
  criticality: "low" | "medium" | "high"
  // comment: string; // Removed as per request
  jurisdiction: string
  jurisdictionTwitterHandle: string
  dimensions: { length: string; width: string; depth: string }
  taggedOfficials: { role: string; name: string; twitterHandle: string }[]
}

export default function PotholeReportForm() {
  const [formData, setFormData] = useState<FormData>({
    title: "",
    description: "",
    location: { type: "Point", coordinates: [0, 0] },
    address: "",
    area: "",
    criticality: "medium",
    // comment: "", // Removed as per request
    jurisdiction: "",
    jurisdictionTwitterHandle: "",
    dimensions: { length: "", width: "", depth: "" },
    taggedOfficials: [{ role: "", name: "", twitterHandle: "" }],
  })

  const [images, setImages] = useState<File[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Callback to update formData for location/area
  const handleLocationUpdate = (latitude: number, longitude: number, address: string, area: string) => {
    setFormData((prev) => ({
      ...prev,
      location: { type: "Point", coordinates: [longitude, latitude] },
      address,
      area,
    }))
  }

  // Callback to update formData for other fields
  const handleFormDetailsChange = (newDetails: Partial<Omit<FormData, 'location' | 'address' | 'area'>>) => {
    setFormData((prev) => ({ ...prev, ...newDetails }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    const data = new FormData()
    data.append("title", formData.title)
    data.append("description", formData.description)
    data.append("location", JSON.stringify(formData.location))
    data.append("address", formData.address)

    if (formData.area) data.append("area", formData.area)
    if (formData.criticality) data.append("criticality", formData.criticality)
    // if (formData.comment) data.append("comment", formData.comment); // Removed
    if (formData.jurisdiction) data.append("jurisdiction", formData.jurisdiction)
    if (formData.jurisdictionTwitterHandle) data.append("jurisdictionTwitterHandle", formData.jurisdictionTwitterHandle)

    if (formData.dimensions.length || formData.dimensions.width || formData.dimensions.depth) {
      data.append(
        "dimensions",
        JSON.stringify({
          length: formData.dimensions.length ? Number.parseFloat(formData.dimensions.length) : undefined,
          width: formData.dimensions.width ? Number.parseFloat(formData.dimensions.width) : undefined,
          depth: formData.dimensions.depth ? Number.parseFloat(formData.dimensions.depth) : undefined,
        }),
      )
    }

    formData.taggedOfficials.forEach((official) => {
      if (official.role) data.append("taggedOfficials", JSON.stringify(official))
    })

    images.forEach((image) => data.append("images", image))

    try {
      await axios.post("/api/potholes", data, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      toast.success("Pothole reported successfully!")

      // Reset form
      setFormData({
        title: "",
        description: "",
        location: { type: "Point", coordinates: [0, 0] },
        address: "",
        area: "",
        criticality: "medium",
        // comment: "", // Removed
        jurisdiction: "",
        jurisdictionTwitterHandle: "",
        dimensions: { length: "", width: "", depth: "" },
        taggedOfficials: [{ role: "", name: "", twitterHandle: "" }],
      })
      setImages([])
    } catch (error) {
      const message = error instanceof AxiosError ? error.response?.data.error : "Unknown error"
      toast.error(`Error: ${message}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      <Toaster richColors position="top-center" />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-orange-500" />
            Report a Pothole
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Location and Camera Section */}
            <LocationCameraSection
              formData={formData}
              setImages={setImages}
              images={images}
              onLocationUpdate={handleLocationUpdate}
            />

            {/* Pothole Details Form */}
            <PotholeDetailsForm
              formData={formData}
              onFormDetailsChange={handleFormDetailsChange}
            />

            {/* Submit Button */}
            <Button type="submit" disabled={isSubmitting} className="w-full flex items-center gap-2" size="lg">
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {isSubmitting ? "Submitting Report..." : "Submit Pothole Report"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}