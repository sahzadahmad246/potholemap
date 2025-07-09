// app/potholes/[id]/page.tsx
"use client";

import React, { useEffect, useState, useCallback } from "react";

import Image from "next/image";
import { toast } from "sonner"; // Or 'sonner' if you've fully switched
import { ClipLoader } from "react-spinners";
import { useSession } from "next-auth/react";
import { Toaster } from "sonner"; // Or 'sonner'

// Import the populated interface for client-side usage
import { IPotholePopulated } from "@/types/pothole";


// Since Next.js passes params directly to the page component
// and `params.id` is directly usable in client components in current versions,
// we don't need React.use() here for params itself.
// The warning is more for server components or certain contexts.
const PotholeDetailsPage: React.FC<{ params: { id: string } }> = ({ params }) => {

  const { id } = params; // Access id directly from params
  const { data: session } = useSession();
  const userId = session?.user?.id;

  const [pothole, setPothole] = useState<IPotholePopulated | null>(null); // Use the populated type
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpvoting, setIsUpvoting] = useState(false);
  const [isReportingSpam, setIsReportingSpam] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [isCommenting, setIsCommenting] = useState(false);

  const fetchPotholeDetails = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/potholes/${id}`);
      const data = await res.json();
      if (res.ok) {
        // Cast to IPotholePopulated to ensure type safety in component
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

  const handleUpvote = async () => {
    if (!userId) {
      toast.error("You need to be logged in to upvote.");
      return;
    }
    setIsUpvoting(true);
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
        fetchPotholeDetails(); // Refresh data
      } else {
        toast.error(data.error || "Failed to upvote/un-upvote.");
      }
    } catch (error) {
      console.error("Error upvoting:", error);
      toast.error("An error occurred while upvoting.");
    } finally {
      setIsUpvoting(false);
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
        body: JSON.stringify({ image: "", comment: "" }),
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

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <ClipLoader size={50} color={"#4F46E5"} loading={loading} />
        <p className="ml-3 text-lg text-gray-700">Loading pothole details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen text-red-600 text-lg">
        <p>{error}</p>
      </div>
    );
  }

  if (!pothole) {
    return (
      <div className="flex justify-center items-center min-h-screen text-gray-600 text-lg">
        <p>Pothole not found.</p>
      </div>
    );
  }

  // Use optional chaining for safety
  const hasUserUpvoted = pothole.upvotedBy?.some((user) => user._id?.toString() === userId);
  const hasUserReportedSpam = pothole.spamReports?.some((report) => report.userId?._id?.toString() === userId);


  return (
    <div className="container mx-auto px-4 py-8">
      <Toaster />
      <div className="bg-white rounded-lg shadow-xl overflow-hidden p-6 md:p-8">
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">{pothole.title}</h1>
        <p className="text-gray-700 text-lg mb-6">{pothole.description}</p>

        {pothole.images && pothole.images.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {pothole.images.map((image, index) => (
              <div key={index} className="relative w-full h-64 rounded-md overflow-hidden">
                <Image
                  src={image.url}
                  alt={`${pothole.title} image ${index + 1}`}
                  layout="fill"
                  objectFit="cover"
                  className="transition-transform duration-300 hover:scale-105"
                />
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 mb-6 text-gray-700">
          <div>
            <p className="text-sm font-semibold text-gray-500">Address:</p>
            <p className="text-base">{pothole.address}</p>
          </div>
          {pothole.area && (
            <div>
              <p className="text-sm font-semibold text-gray-500">Area:</p>
              <p className="text-base">{pothole.area}</p>
            </div>
          )}
          <div>
            <p className="text-sm font-semibold text-gray-500">Reported By:</p>
            {/* Safely access reportedBy.username */}
            <p className="text-base">{pothole.reportedBy?.username || "N/A"}</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-500">Reported On:</p>
            <p className="text-base">{new Date(pothole.reportedAt).toLocaleDateString()}</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-500">Status:</p>
            <p className="text-base capitalize">{pothole.status?.replace(/_/g, " ")}</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-500">Criticality:</p>
            <p className="text-base capitalize">{pothole.criticality}</p>
          </div>
          {pothole.dimensions && (
            <>
              {pothole.dimensions.length !== undefined && ( // Check for actual value, not just existence of dimensions object
                <div>
                  <p className="text-sm font-semibold text-gray-500">Length:</p>
                  <p className="text-base">{pothole.dimensions.length} meters</p>
                </div>
              )}
              {pothole.dimensions.width !== undefined && (
                <div>
                  <p className="text-sm font-semibold text-gray-500">Width:</p>
                  <p className="text-base">{pothole.dimensions.width} meters</p>
                </div>
              )}
              {pothole.dimensions.depth !== undefined && (
                <div>
                  <p className="text-sm font-semibold text-gray-500">Depth:</p>
                  <p className="text-base">{pothole.dimensions.depth} meters</p>
                </div>
              )}
            </>
          )}
          {pothole.repairedAt && (
            <div>
              <p className="text-sm font-semibold text-gray-500">Repaired On:</p>
              <p className="text-base">{new Date(pothole.repairedAt).toLocaleDateString()}</p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4 mt-6 border-t pt-6">
          <button
            onClick={handleUpvote}
            disabled={isUpvoting}
            className={`flex items-center px-4 py-2 rounded-full font-medium transition-colors duration-200 ${
              hasUserUpvoted
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-gray-200 text-gray-800 hover:bg-gray-300"
            } disabled:opacity-50`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2"
              fill="currentColor"
              viewBox="0 0 16 16"
            >
              <path d="M7.414 2.586a2 2 0 0 0-2.828 0L.707 6.414A2 2 0 0 0 .707 9.242l4.243 4.243a2 2 0 0 0 2.828 0l4.243-4.243a2 2 0 0 0 0-2.828L7.414 2.586z" />
            </svg>
            {isUpvoting ? "Processing..." : `${pothole.upvotes} Upvotes`}
          </button>

          <button
            onClick={handleSpamReport}
            disabled={isReportingSpam || hasUserReportedSpam}
            className={`flex items-center px-4 py-2 rounded-full font-medium transition-colors duration-200 ${
              hasUserReportedSpam
                ? "bg-red-300 text-red-800 cursor-not-allowed"
                : "bg-red-100 text-red-700 hover:bg-red-200"
            } disabled:opacity-50`}
          >
            {isReportingSpam
              ? "Reporting..."
              : hasUserReportedSpam
              ? "Spam Reported"
              : `Report as Spam (${pothole.spamReportCount})`}
          </button>
        </div>

        {/* Comments Section */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Comments ({pothole.comments.length})</h2>
          <form onSubmit={handleAddComment} className="mb-6">
            <textarea
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 resize-y"
              rows={3}
              placeholder="Add a comment..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              maxLength={200}
            ></textarea>
            <div className="flex justify-between items-center mt-2">
              <span className="text-sm text-gray-500">{commentText.length}/200 characters</span>
              <button
                type="submit"
                disabled={isCommenting || commentText.trim().length === 0}
                className="px-5 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 font-medium"
              >
                {isCommenting ? "Posting..." : "Post Comment"}
              </button>
            </div>
          </form>

          {pothole.comments.length === 0 ? (
            <p className="text-gray-500">No comments yet. Be the first to comment!</p>
          ) : (
            <div className="space-y-4">
              {pothole.comments.map((comment, index) => (
                <div key={comment._id?.toString() || index} className="bg-gray-50 p-4 rounded-md shadow-sm">
                  <div className="flex items-center mb-2">
                    {/* Safely access comment.userId.profilePicture */}
                    {comment.userId?.profilePicture && (
                      <Image
                        src={comment.userId.profilePicture}
                        alt={comment.userId?.username || "User"}
                        width={32}
                        height={32}
                        className="rounded-full mr-3"
                      />
                    )}
                    {/* Safely access comment.userId.username */}
                    <span className="font-semibold text-gray-800">{comment.userId?.username || "Unknown User"}</span>
                    <span className="text-gray-500 text-sm ml-auto">
                      {new Date(comment.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-gray-700">{comment.comment}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Repair Report Section */}
        {pothole.repairReport && (
          <div className="mt-8 border-t pt-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Repair Report</h2>
            <div className="bg-gray-50 p-6 rounded-lg shadow-sm">
              <div className="flex items-center mb-3">
                {/* Safely access pothole.repairReport.submittedBy.profilePicture */}
                {pothole.repairReport.submittedBy?.profilePicture && (
                  <Image
                    src={pothole.repairReport.submittedBy.profilePicture}
                    alt={pothole.repairReport.submittedBy?.username || "User"}
                    width={40}
                    height={40}
                    className="rounded-full mr-3"
                  />
                )}
                {/* Safely access pothole.repairReport.submittedBy.username */}
                <span className="font-semibold text-gray-800">
                  Reported by: {pothole.repairReport.submittedBy?.username || "N/A"}
                </span>
                <span className="text-gray-500 text-sm ml-auto">
                  on {new Date(pothole.repairReport.submittedAt).toLocaleDateString()}
                </span>
              </div>
              {pothole.repairReport.image && (
                <div className="relative w-full h-72 mb-4 rounded-md overflow-hidden">
                  <Image
                    src={pothole.repairReport.image}
                    alt="Repair report image"
                    layout="fill"
                    objectFit="cover"
                  />
                </div>
              )}
              {pothole.repairReport.comment && (
                <p className="text-gray-700 mb-4">{pothole.repairReport.comment}</p>
              )}
              <div className="flex justify-between items-center text-sm text-gray-600">
                <span>
                  Upvotes: {pothole.repairReport.upvotes?.length || 0} | Downvotes:{" "}
                  {pothole.repairReport.downvotes?.length || 0}
                </span>
                <span
                  className={`font-semibold ${
                    pothole.repairReport.confirmed ? "text-green-600" : "text-yellow-600"
                  }`}
                >
                  {pothole.repairReport.confirmed ? "Confirmed Repair" : "Repair Pending Confirmation"}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Tagged Officials Section */}
        {pothole.taggedOfficials && pothole.taggedOfficials.length > 0 && (
          <div className="mt-8 border-t pt-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Tagged Officials</h2>
            <ul className="space-y-2">
              {pothole.taggedOfficials.map((official, index) => (
                <li key={index} className="bg-gray-50 p-3 rounded-md shadow-sm">
                  <span className="font-medium text-gray-800 capitalize">{official.role}:</span>{" "}
                  {official.name && <span className="text-gray-700">{official.name}</span>}
                  {official.twitterHandle && (
                    <a
                      href={`https://twitter.com/${official.twitterHandle}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline ml-2"
                    >
                      @{official.twitterHandle}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default PotholeDetailsPage;