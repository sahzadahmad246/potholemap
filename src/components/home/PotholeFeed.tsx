"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ThumbsUp, MessageCircle, MapPin, Calendar, AlertTriangle } from "lucide-react"
import Image from "next/image"

// Static data for demonstration
const potholeData = [
  {
    id: 1,
    title: "Large Pothole on Main Street",
    description:
      "Deep pothole causing damage to vehicles. Located near the intersection with Oak Avenue. Multiple cars have reported tire damage.",
    address: "1234 Main Street",
    city: "Downtown",
    image: "/download.jpeg?height=300&width=400",
    upvotes: 24,
    comments: 8,
    reportedBy: {
      name: "Sarah Johnson",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    reportedAt: "2024-01-15",
    severity: "High",
    status: "Open",
  },
  {
    id: 2,
    title: "Multiple Small Potholes",
    description:
      "Several small to medium potholes scattered across the residential area. Making the road bumpy and uncomfortable for cyclists.",
    address: "567 Elm Street",
    city: "Riverside",
    image: "/placeholder.svg?height=300&width=400",
    upvotes: 12,
    comments: 3,
    reportedBy: {
      name: "Mike Chen",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    reportedAt: "2024-01-14",
    severity: "Medium",
    status: "Under Review",
  },
  {
    id: 3,
    title: "Dangerous Pothole Near School",
    description:
      "Large pothole right in front of Lincoln Elementary School. Safety concern for parents dropping off children. Needs immediate attention.",
    address: "890 School Drive",
    city: "Westside",
    image: "/placeholder.svg?height=300&width=400",
    upvotes: 45,
    comments: 15,
    reportedBy: {
      name: "Jennifer Martinez",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    reportedAt: "2024-01-13",
    severity: "Critical",
    status: "Escalated",
  },
]

export default function PotholeFeed() {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "Critical":
        return "bg-red-100 text-red-800 border-red-200"
      case "High":
        return "bg-orange-100 text-orange-800 border-orange-200"
      case "Medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Open":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "Under Review":
        return "bg-purple-100 text-purple-800 border-purple-200"
      case "Escalated":
        return "bg-red-100 text-red-800 border-red-200"
      case "Fixed":
        return "bg-green-100 text-green-800 border-green-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Recent Reports</h2>
        <Button variant="outline" size="sm">
          View All
        </Button>
      </div>

      <div className="grid gap-6">
        {potholeData.map((pothole) => (
          <Card
            key={pothole.id}
            className="border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-shadow duration-200"
          >
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={pothole.reportedBy.avatar || "/placeholder.svg"} alt={pothole.reportedBy.name} />
                    <AvatarFallback>{pothole.reportedBy.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-gray-900">{pothole.reportedBy.name}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {new Date(pothole.reportedAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Badge className={getSeverityColor(pothole.severity)}>
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    {pothole.severity}
                  </Badge>
                  <Badge variant="outline" className={getStatusColor(pothole.status)}>
                    {pothole.status}
                  </Badge>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{pothole.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{pothole.description}</p>
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>
                  {pothole.address}, {pothole.city}
                </span>
              </div>

              <div className="relative w-full h-48 sm:h-64 rounded-lg overflow-hidden">
                <Image src={pothole.image || "/placeholder.svg"} alt={pothole.title} fill className="object-cover" />
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                  >
                    <ThumbsUp className="h-4 w-4" />
                    <span>{pothole.upvotes}</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2 text-gray-600 hover:text-gray-700 hover:bg-gray-50"
                  >
                    <MessageCircle className="h-4 w-4" />
                    <span>{pothole.comments}</span>
                  </Button>
                </div>
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                  View Details
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
