"use client"

import type React from "react"
import { useState } from "react"
import axios, { AxiosError } from "axios"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, Send, Loader2 } from "lucide-react"
import LocationCameraSection from "./LocationCameraSection"
import PotholeDetailsForm from "./PotholeDetailsForm"
import { useRouter } from "next/navigation" // Import useRouter

interface FormData {
  title: string
  description: string
  location: { type: "Point"; coordinates: [number, number] }
  address: string
  area: string
  criticality: "low" | "medium" | "high"
  dimensions: { length: string; width: string; depth: string }
  taggedOfficials: { role: string; name: string; twitterHandle: string }[]
}

export default function PotholeReportForm() {
  const router = useRouter() // Initialize useRouter
  const [formData, setFormData] = useState<FormData>({
    title: "",
    description: "",
    location: { type: "Point", coordinates: [0, 0] },
    address: "",
    area: "",
    criticality: "medium",
    dimensions: { length: "", width: "", depth: "" },
    taggedOfficials: [{ role: "", name: "", twitterHandle: "" }],
  })
  const [images, setImages] = useState<File[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleLocationUpdate = (latitude: number, longitude: number, address: string, area: string) => {
    setFormData((prev) => ({
      ...prev,
      location: { type: "Point", coordinates: [longitude, latitude] },
      address,
      area,
    }))
  }

  const handleFormDetailsChange = (newDetails: Partial<Omit<FormData, "location" | "address" | "area">>) => {
    setFormData((prev) => ({ ...prev, ...newDetails }))
  }

  const validateForm = () => {
    if (!formData.title.trim()) {
      toast.error("Please enter a title for the pothole report")
      return false
    }
    if (!formData.description.trim()) {
      toast.error("Please enter a description")
      return false
    }
    if (!formData.address.trim()) {
      toast.error("Please enter the address")
      return false
    }
    if (formData.location.coordinates[0] === 0 && formData.location.coordinates[1] === 0) {
      toast.error("Please allow location access or enter coordinates manually")
      return false
    }
    if (images.length === 0) {
      toast.error("Please add at least one image of the pothole")
      return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) {
      return
    }
    setIsSubmitting(true)
    const data = new FormData()
    data.append("title", formData.title)
    data.append("description", formData.description)
    data.append("location", JSON.stringify(formData.location))
    data.append("address", formData.address)
    if (formData.area) data.append("area", formData.area)
    if (formData.criticality) data.append("criticality", formData.criticality)
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
      const res = await axios.post("/api/potholes", data, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      // Assuming the API returns the new pothole's ID in res.data.potholeId
      const newPotholeId = res.data.potholeId
      toast.success("Pothole reported successfully! Redirecting to confirmation page...")
      router.push(`/potholes/submitted/${newPotholeId}`) // Redirect to the new success page
    } catch (error) {
      const message = error instanceof AxiosError ? error.response?.data.error : "Unknown error occurred"
      toast.error(`Failed to submit report: ${message}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto space-y-4">
        <Card className="border border-gray-300">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-black">
              <AlertTriangle className="h-6 w-6" />
              Report a Pothole
            </CardTitle>
            <p className="text-gray-600 text-sm">Help improve road safety by reporting potholes in your area.</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <LocationCameraSection
                formData={formData}
                setImages={setImages}
                images={images}
                onLocationUpdate={handleLocationUpdate}
              />
              <PotholeDetailsForm formData={formData} onFormDetailsChange={handleFormDetailsChange} />
              <div className="sticky bottom-0 bg-white p-4 border-t border-gray-200 -mx-6 -mb-6">
                <Button type="submit" disabled={isSubmitting} className="w-full bg-black hover:bg-gray-800" size="lg">
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                  {isSubmitting ? "Submitting Report..." : "Submit Pothole Report"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
