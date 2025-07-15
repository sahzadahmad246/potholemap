"use client"

import type React from "react"
import { useEffect, useState, useCallback } from "react"
import { toast, Toaster } from "sonner"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { CheckCircle, Loader2, AlertTriangle } from "lucide-react"
import Link from "next/link"
import type { IPotholePopulated } from "@/types/pothole" // Import the correct type
import TweetButton from "@/components/potholes/tweet-button" // Import the new TweetButton

const PotholeSubmittedPage: React.FC = () => {
  const params = useParams()
  const id = params.id as string
  
  const [pothole, setPothole] = useState<IPotholePopulated | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
          <AlertTriangle className="h-16 w-16 text-black mx-auto mb-4" />
          <p className="text-black text-lg font-medium">Pothole not found.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster />
      <div className="max-w-md mx-auto pt-20 px-4">
        <div className="text-center space-y-6 bg-white p-8 rounded-3xl shadow-lg border border-gray-200">
          <CheckCircle className="h-20 w-20 text-green-500 mx-auto" />
          <h2 className="text-3xl font-bold text-black">Pothole Reported!</h2>
          <p className="text-gray-700 text-lg">
            Thank you for reporting the pothole at <span className="font-semibold text-black">{pothole.address}</span>.
            Your report has been submitted and will be reviewed by the relevant authorities.
          </p>
          <div className="space-y-4 pt-4">
            {pothole && <TweetButton pothole={pothole} size="lg" className="w-full" />}
            <Link href={`/potholes/${pothole._id}`} passHref>
              <Button
                variant="outline"
                className="w-full border-2 border-gray-300 hover:border-black hover:bg-black hover:text-white bg-transparent"
                size="lg"
              >
                View Pothole Details
              </Button>
            </Link>
            <Link href="/report" passHref>
              <Button
                variant="outline"
                className="w-full border-2 border-gray-300 hover:border-black hover:bg-black hover:text-white bg-transparent"
                size="lg"
              >
                Report Another Pothole
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PotholeSubmittedPage
