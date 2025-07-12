"use client";

import type React from "react";
import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { toast, Toaster } from "sonner";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import type { IPotholePopulated } from "@/types/pothole"; // Ensure this type has repairReport.upvotes and .downvotes populated with userId
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  MapPin,
  Calendar,
  User,
  AlertTriangle,
  ThumbsUp,
  ThumbsDown, // Import ThumbsDown icon
  Flag,
  MessageCircle,
  Ruler,
  CheckCircle,
  Twitter,
  Loader2,
  Camera,
  Send,
} from "lucide-react";
import { CommentItem } from "@/components/potholes/comment-item";

const PotholeDetailsPage: React.FC = () => {
  const params = useParams();
  const id = params.id as string;
  const { data: session } = useSession();
  const userId = session?.user?.id;

  const [pothole, setPothole] = useState<IPotholePopulated | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpvotingPothole, setIsUpvotingPothole] = useState(false); // Renamed to avoid confusion
  const [isReportingSpam, setIsReportingSpam] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [isCommenting, setIsCommenting] = useState(false);
  // New states for repair report voting
  const [isUpvotingRepairReport, setIsUpvotingRepairReport] = useState(false);
  const [isDownvotingRepairReport, setIsDownvotingRepairReport] = useState(false);
 

  const router = useRouter();

  const fetchPotholeDetails = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/potholes/${id}`);
      const data = await res.json();
      if (res.ok) {
        setPothole(data.data as IPotholePopulated);
      } else {
        setError(data.error || "Failed to fetch pothole details.");
        toast.error(data.error || "Failed to fetch pothole details.");
      }
    } catch (err) {
      console.error("Error fetching pothole details:", err);
      setError("An unexpected error occurred.");
      toast.error("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchPotholeDetails();
    }
  }, [id, fetchPotholeDetails]);

  // Main pothole upvote/un-upvote (existing logic)
  const handlePotholeUpvote = async () => {
    if (!userId) {
      toast.error("You need to be logged in to upvote.");
      return;
    }
    setIsUpvotingPothole(true);
    try {
      const res = await fetch(`/api/potholes/${id}/upvote`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message);
        fetchPotholeDetails();
      } else {
        toast.error(data.error || "Failed to upvote/un-upvote.");
      }
    } catch (error) {
      console.error("Error upvoting pothole:", error);
      toast.error("An error occurred while upvoting the pothole.");
    } finally {
      setIsUpvotingPothole(false);
    }
  };

  const handleSpamReport = async () => {
    if (!userId) {
      toast.error("You need to be logged in to report spam.");
      return;
    }
    setIsReportingSpam(true);
    try {
      const res = await fetch(`/api/potholes/${id}/spam-report`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ image: "", comment: "" }), // Consider allowing image/comment for spam reports too
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message);
        fetchPotholeDetails();
      } else {
        toast.error(data.message || data.error || "Failed to report spam.");
      }
    } catch (error) {
      console.error("Error reporting spam:", error);
      toast.error("An error occurred while reporting spam.");
    } finally {
      setIsReportingSpam(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) {
      toast.error("You need to be logged in to comment.");
      return;
    }
    if (commentText.trim().length === 0) {
      toast.error("Comment cannot be empty.");
      return;
    }
    if (commentText.length > 200) {
      toast.error("Comment cannot exceed 200 characters.");
      return;
    }
    setIsCommenting(true);
    try {
      const res = await fetch(`/api/potholes/${id}/comment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ comment: commentText }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message);
        setCommentText("");
        fetchPotholeDetails();
      } else {
        toast.error(data.error || "Failed to add comment.");
      }
    } catch (error) {
      console.error("Error adding comment:", error);
      toast.error("An error occurred while adding comment.");
    } finally {
      setIsCommenting(false);
    }
  };

  const handleReportRepaired = () => {
    router.push(`/report-repaired?potholeId=${id}`);
  };

  // --- NEW: Repair Report Upvote/Downvote Handlers ---
  const handleRepairReportUpvote = async () => {
    if (!userId) {
      toast.error("You need to be logged in to vote on repair reports.");
      return;
    }
    setIsUpvotingRepairReport(true);
    try {
      const res = await fetch(`/api/potholes/${id}/repair-report/upvote`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message);
        fetchPotholeDetails(); // Re-fetch to update counts and button states
      } else {
        toast.error(data.error || "Failed to process upvote.");
      }
    } catch (error) {
      console.error("Error upvoting repair report:", error);
      toast.error("An error occurred while processing upvote.");
    } finally {
      setIsUpvotingRepairReport(false);
    }
  };

  const handleRepairReportDownvote = async () => {
    if (!userId) {
      toast.error("You need to be logged in to vote on repair reports.");
      return;
    }

    // You might want a modal or a prompt for the comment for downvotes
    // For simplicity, let's use a prompt for now, but a proper UI modal is better.
    const userComment = prompt("Optional: Enter a reason for downvoting (max 200 chars):");
    if (userComment !== null && userComment.length > 200) {
      toast.error("Downvote comment cannot exceed 200 characters.");
      return;
    }

    setIsDownvotingRepairReport(true);
    try {
      const res = await fetch(`/api/potholes/${id}/repair-report/downvote`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ comment: userComment || undefined }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message);
        fetchPotholeDetails(); // Re-fetch to update counts and button states
      } else {
        toast.error(data.error || "Failed to process downvote.");
      }
    } catch (error) {
      console.error("Error downvoting repair report:", error);
      toast.error("An error occurred while processing downvote.");
    } finally {
      setIsDownvotingRepairReport(false);
    }
  };
  // --- END: Repair Report Upvote/Downvote Handlers ---

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-lg text-gray-600">Loading pothole details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="max-w-md mx-4">
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 text-lg">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!pothole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="max-w-md mx-4">
          <CardContent className="pt-6 text-center">
            <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">Pothole not found.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Determine if the current user has upvoted or downvoted the repair report
  const hasUserUpvotedRepairReport = pothole.repairReport?.upvotes?.some(
    (vote) => vote.userId?.toString() === userId
  );
  const hasUserDownvotedRepairReport = pothole.repairReport?.downvotes?.some(
    (vote) => vote.userId?.toString() === userId
  );

  const hasUserUpvotedPothole = pothole.upvotedBy?.some((user) => user._id?.toString() === userId);
  const hasUserReportedSpam = pothole.spamReports?.some((report) => report.userId?._id?.toString() === userId);

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "reported":
        return "bg-yellow-100 text-yellow-800";
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      case "repaired":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getCriticalityColor = (criticality: string) => {
    switch (criticality?.toLowerCase()) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-orange-100 text-orange-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster />
      <div className="container mx-auto px-4 py-6 lg:py-8">
        {/* Mobile Layout */}
        <div className="lg:hidden space-y-6">
          {/* Header Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-gray-900">{pothole.title}</CardTitle>
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge className={getStatusColor(pothole.status || "")}>{pothole.status?.replace(/_/g, " ")}</Badge>
                <Badge className={getCriticalityColor(pothole.criticality || "")}>
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  {pothole.criticality}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 mb-4">{pothole.description}</p>

              {/* Key Info */}
              <div className="space-y-3">
                <div className="flex items-center text-sm text-gray-600">
                  <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                  <span>{pothole.address}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <User className="h-4 w-4 mr-2 text-gray-400" />
                  <span>Reported by {pothole.reportedBy?.name || "N/A"}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                  <span>{new Date(pothole.reportedAt).toLocaleDateString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Images */}
          {pothole.images && pothole.images.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Camera className="h-5 w-5 mr-2" />
                  Images ({pothole.images.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4">
                  {pothole.images.map((image, index) => (
                    <div key={index} className="relative w-full h-64 rounded-lg overflow-hidden">
                      <Image
                        src={image.url || "/placeholder.svg"}
                        alt={`${pothole.title} image ${index + 1}`}
                        fill
                        style={{ objectFit: "cover" }}
                        className="transition-transform duration-300 hover:scale-105"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={handlePotholeUpvote} // Changed to handlePotholeUpvote
                  disabled={isUpvotingPothole} // Changed to isUpvotingPothole
                  variant={hasUserUpvotedPothole ? "default" : "outline"}
                  className="flex-1"
                >
                  {isUpvotingPothole ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <ThumbsUp className="h-4 w-4 mr-2" />
                  )}
                  {isUpvotingPothole ? "Processing..." : `${pothole.upvotes} Upvotes`}
                </Button>
                <Button
                  onClick={handleSpamReport}
                  disabled={isReportingSpam || hasUserReportedSpam}
                  variant="outline"
                  className="flex-1 bg-transparent"
                >
                  {isReportingSpam ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Flag className="h-4 w-4 mr-2" />
                  )}
                  {isReportingSpam
                    ? "Reporting..."
                    : hasUserReportedSpam
                      ? "Spam Reported"
                      : `Report Spam (${pothole.spamReportCount})`}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {pothole.area && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Area</p>
                  <p className="text-base text-gray-900">{pothole.area}</p>
                </div>
              )}

              {pothole.dimensions && (
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-2">Dimensions</p>
                  <div className="flex items-center space-x-4 text-sm">
                    {pothole.dimensions.length !== undefined && (
                      <div className="flex items-center">
                        <Ruler className="h-4 w-4 mr-1 text-gray-400" />
                        <span>L: {pothole.dimensions.length}m</span>
                      </div>
                    )}
                    {pothole.dimensions.width !== undefined && (
                      <div className="flex items-center">
                        <Ruler className="h-4 w-4 mr-1 text-gray-400" />
                        <span>W: {pothole.dimensions.width}m</span>
                      </div>
                    )}
                    {pothole.dimensions.depth !== undefined && (
                      <div className="flex items-center">
                        <Ruler className="h-4 w-4 mr-1 text-gray-400" />
                        <span>D: {pothole.dimensions.depth}m</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {pothole.repairedAt && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Repaired On</p>
                  <div className="flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                    <span className="text-base text-gray-900">{new Date(pothole.repairedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Desktop Layout */}
        <div className="hidden lg:block">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Header */}
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-3xl font-bold text-gray-900 mb-2">{pothole.title}</CardTitle>
                      <p className="text-gray-700 text-lg mb-4">{pothole.description}</p>
                      <div className="flex flex-wrap gap-2">
                        <Badge className={getStatusColor(pothole.status || "")}>
                          {pothole.status?.replace(/_/g, " ")}
                        </Badge>
                        <Badge className={getCriticalityColor(pothole.criticality || "")}>
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          {pothole.criticality}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-6">
                    <Button
                      onClick={handlePotholeUpvote} // Changed to handlePotholeUpvote
                      disabled={isUpvotingPothole} // Changed to isUpvotingPothole
                      variant={hasUserUpvotedPothole ? "default" : "outline"}
                      size="lg"
                    >
                      {isUpvotingPothole ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <ThumbsUp className="h-4 w-4 mr-2" />
                      )}
                      {isUpvotingPothole ? "Processing..." : `${pothole.upvotes} Upvotes`}
                    </Button>
                    <Button
                      onClick={handleSpamReport}
                      disabled={isReportingSpam || hasUserReportedSpam}
                      variant="outline"
                      size="lg"
                    >
                      {isReportingSpam ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Flag className="h-4 w-4 mr-2" />
                      )}
                      {isReportingSpam
                        ? "Reporting..."
                        : hasUserReportedSpam
                          ? "Spam Reported"
                          : `Report Spam (${pothole.spamReportCount})`}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Images */}
              {pothole.images && pothole.images.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Camera className="h-5 w-5 mr-2" />
                      Images ({pothole.images.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      {pothole.images.map((image, index) => (
                        <div key={index} className="relative w-full h-64 rounded-lg overflow-hidden">
                          <Image
                            src={image.url || "/placeholder.svg"}
                            alt={`${pothole.title} image ${index + 1}`}
                            fill
                            style={{ objectFit: "cover" }}
                            className="transition-transform duration-300 hover:scale-105"
                          />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Key Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-3 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Address</p>
                      <p className="text-sm text-gray-900">{pothole.address}</p>
                    </div>
                  </div>

                  {pothole.area && (
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-3 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-500">Area</p>
                        <p className="text-sm text-gray-900">{pothole.area}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center">
                    <User className="h-4 w-4 mr-3 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Reported By</p>
                      <p className="text-sm text-gray-900">{pothole.reportedBy?.name || "N/A"}</p>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-3 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Reported On</p>
                      <p className="text-sm text-gray-900">{new Date(pothole.reportedAt).toLocaleDateString()}</p>
                    </div>
                  </div>

                  {pothole.dimensions && (
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-2">Dimensions</p>
                      <div className="space-y-1">
                        {pothole.dimensions.length !== undefined && (
                          <div className="flex items-center text-sm">
                            <Ruler className="h-3 w-3 mr-2 text-gray-400" />
                            <span>Length: {pothole.dimensions.length}m</span>
                          </div>
                        )}
                        {pothole.dimensions.width !== undefined && (
                          <div className="flex items-center text-sm">
                            <Ruler className="h-3 w-3 mr-2 text-gray-400" />
                            <span>Width: {pothole.dimensions.width}m</span>
                          </div>
                        )}
                        {pothole.dimensions.depth !== undefined && (
                          <div className="flex items-center text-sm">
                            <Ruler className="h-3 w-3 mr-2 text-gray-400" />
                            <span>Depth: {pothole.dimensions.depth}m</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {pothole.repairedAt && (
                    <div className="flex items-center">
                      <CheckCircle className="h-4 w-4 mr-3 text-green-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-500">Repaired On</p>
                        <p className="text-sm text-gray-900">{new Date(pothole.repairedAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Tagged Officials */}
              {pothole.taggedOfficials && pothole.taggedOfficials.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Tagged Officials</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {pothole.taggedOfficials.map((official, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium text-gray-900 capitalize">{official.role}</p>
                            {official.name && <p className="text-sm text-gray-600">{official.name}</p>}
                          </div>
                          {official.twitterHandle && (
                            <a
                              href={`https://twitter.com/${official.twitterHandle}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-500 hover:text-blue-600"
                            >
                              <Twitter className="h-4 w-4" />
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>

        {/* Comments and Repair Section */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Comments Section */}
          <Card className="lg:order-1">
            <CardHeader>
              <CardTitle className="flex items-center">
                <MessageCircle className="h-5 w-5 mr-2" />
                Comments ({pothole.comments.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Add Comment Form */}
              <form onSubmit={handleAddComment} className="mb-6">
                <Textarea
                  placeholder="Add a comment..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  maxLength={200}
                  className="mb-3"
                  rows={3}
                />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">{commentText.length}/200 characters</span>
                  <Button type="submit" disabled={isCommenting || commentText.trim().length === 0}>
                    {isCommenting ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4 mr-2" />
                    )}
                    {isCommenting ? "Posting..." : "Post Comment"}
                  </Button>
                </div>
              </form>

              <Separator className="mb-6" />

              {/* Comments List */}
              <div className="max-h-96 lg:max-h-[500px] overflow-y-auto">
                {pothole.comments.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                      <MessageCircle className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No comments yet</h3>
                    <p className="text-gray-500">Be the first to share your thoughts about this pothole.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
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
            </CardContent>
          </Card>

          {/* Repair Section */}
          <Card className="lg:order-2">
            <CardHeader>
              <CardTitle className="flex items-center">
                {pothole.status?.toLowerCase() === "repaired" ? (
                  <>
                    <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                    Repair Report
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-5 w-5 mr-2 text-orange-600" />
                    Repair Status
                  </>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pothole.status?.toLowerCase() === "repaired" && pothole.repairReport ? (
                /* Existing Repair Report Content */
                <div className="bg-green-50 p-6 rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarImage src={pothole.repairReport.submittedBy?.image || "/placeholder.svg"} />
                        <AvatarFallback>{pothole.repairReport.submittedBy?.name?.charAt(0) || "U"}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-gray-900">{pothole.repairReport.submittedBy?.name || "N/A"}</p>
                        <p className="text-sm text-gray-600">
                          {pothole.repairReport.submittedAt &&
                            new Date(pothole.repairReport.submittedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  {pothole.repairReport.image && (
                    <div className="relative w-full h-48 lg:h-64 mb-4 rounded-lg overflow-hidden">
                      <Image
                        src={pothole.repairReport.image || "/placeholder.svg"}
                        alt="Repair report image"
                        fill
                        style={{ objectFit: "cover" }}
                      />
                    </div>
                  )}

                  {pothole.repairReport.comment && <p className="text-gray-700 mb-4">{pothole.repairReport.comment}</p>}

                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <div className="flex items-center space-x-4">
                        {/* Repair Report Upvote Button */}
                        <Button
                            onClick={handleRepairReportUpvote}
                            disabled={isUpvotingRepairReport || isDownvotingRepairReport}
                            variant={hasUserUpvotedRepairReport ? "default" : "outline"}
                            className="flex items-center"
                        >
                            {isUpvotingRepairReport ? (
                                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                            ) : (
                                <ThumbsUp className="h-4 w-4 mr-1" />
                            )}
                            {hasUserUpvotedRepairReport ? "Upvoted" : `${pothole.repairReport.upvotes?.length || 0} Upvotes`}
                        </Button>

                        {/* Repair Report Downvote Button */}
                        <Button
                            onClick={handleRepairReportDownvote}
                            disabled={isUpvotingRepairReport || isDownvotingRepairReport}
                            variant={hasUserDownvotedRepairReport ? "destructive" : "outline"} // Use destructive for downvote
                            className="flex items-center"
                        >
                            {isDownvotingRepairReport ? (
                                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                            ) : (
                                <ThumbsDown className="h-4 w-4 mr-1" /> 
                            )}
                            {hasUserDownvotedRepairReport ? "Downvoted" : `${pothole.repairReport.downvotes?.length || 0} Downvotes`}
                        </Button>
                    </div>
                  </div>
                </div>
              ) : (
                /* Report Repaired Section */
                <div className="text-center py-8">
                  <div className="bg-orange-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <AlertTriangle className="h-8 w-8 text-orange-600" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Pothole Not Yet Repaired</h3>
                  <p className="text-gray-600 mb-6 max-w-sm mx-auto">
                    Have you noticed this pothole has been fixed? Help the community by reporting the repair.
                  </p>
                  <Button
                    onClick={handleReportRepaired}
                    className="bg-green-600 hover:bg-green-700 text-white"
                    size="lg"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Report This Pothole as Repaired
                  </Button>
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
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
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PotholeDetailsPage;