import { getServerSession } from "next-auth"
import { authOptions } from "../api/auth/[...nextauth]/route"
import connectDB from "@/lib/mongo"
import User from "@/models/User"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import SignOutButton from "@/components/auth/SignOutButton"
import type { IUser } from "@/types/user"
import { MapPin, ThumbsUp, AlertTriangle, Wrench, ThumbsDown, Calendar, UserIcon, Mail } from "lucide-react"

export default async function ProfilePage() {
  const session = await getServerSession(authOptions)

  if (!session || !session.user || !session.user.email) {
    redirect("/auth")
  }

  await connectDB()
  const user = await User.findOne({ email: session.user.email }).lean<IUser>()

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <UserIcon className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-muted-foreground">User not found</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const stats = [
    {
      label: "Reported Potholes",
      value: user.reportedPotholes.length,
      icon: MapPin,
      color: "bg-blue-500",
    },
    {
      label: "Upvoted Potholes",
      value: user.upvotedPotholes.length,
      icon: ThumbsUp,
      color: "bg-green-500",
    },
    {
      label: "Spam Reports",
      value: user.spamReportedPotholes.length,
      icon: AlertTriangle,
      color: "bg-yellow-500",
    },
    {
      label: "Repair Upvotes",
      value: user.repairUpvotes.length,
      icon: Wrench,
      color: "bg-purple-500",
    },
    {
      label: "Repair Downvotes",
      value: user.downvotedRepairs.length,
      icon: ThumbsDown,
      color: "bg-red-500",
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header Card */}
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <Avatar className="h-20 w-20 ring-4 ring-blue-100">
                <AvatarImage src={user.image || ""} alt={user.name || "User"} />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-xl font-semibold">
                  {user.name?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="text-center sm:text-left flex-1">
                <CardTitle className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                  {user.name || "User"}
                </CardTitle>
                <div className="flex items-center justify-center sm:justify-start gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span className="text-sm">{user.email}</span>
                </div>
                <div className="flex items-center justify-center sm:justify-start gap-2 text-muted-foreground mt-1">
                  <Calendar className="h-4 w-4" />
                  <span className="text-sm">
                    Joined{" "}
                    {user.createdAt
                      ? new Date(user.createdAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })
                      : "Unknown"}
                  </span>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {stats.map((stat, index) => (
            <Card
              key={index}
              className="border-0 shadow-md hover:shadow-lg transition-shadow duration-200 bg-white/80 backdrop-blur-sm"
            >
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-full ${stat.color} bg-opacity-10`}>
                    <stat.icon className={`h-6 w-6 ${stat.color.replace("bg-", "text-")}`} />
                  </div>
                  <div className="flex-1">
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    <p className="text-sm text-muted-foreground font-medium">{stat.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Activity Summary */}
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <UserIcon className="h-5 w-5" />
              Activity Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="text-center">
                <Badge variant="secondary" className="mb-2">
                  Total Reports
                </Badge>
                <p className="text-2xl font-bold text-blue-600">{user.reportedPotholes.length}</p>
              </div>
              <div className="text-center">
                <Badge variant="secondary" className="mb-2">
                  Total Votes
                </Badge>
                <p className="text-2xl font-bold text-green-600">
                  {user.upvotedPotholes.length + user.repairUpvotes.length}
                </p>
              </div>
              <div className="text-center">
                <Badge variant="secondary" className="mb-2">
                  Spam Reports
                </Badge>
                <p className="text-2xl font-bold text-yellow-600">{user.spamReportedPotholes.length}</p>
              </div>
              <div className="text-center">
                <Badge variant="secondary" className="mb-2">
                  Downvotes
                </Badge>
                <p className="text-2xl font-bold text-red-600">{user.downvotedRepairs.length}</p>
              </div>
            </div>

            <Separator />

            <div className="pt-4">
              <SignOutButton />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
