// components/PotholeCard.tsx
"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner"; // Changed from react-hot-toast

interface PotholeCardProps {
  pothole: {
    _id: string;
    title: string;
    description: string;
    images: { url: string }[];
    address: string;
    upvotes: number;
    reportedBy: { username: string; profilePicture?: string };
    reportedAt: string;
    upvotedBy: string[]; // Array of user IDs who upvoted
    comments: { userId: { username: string }; comment: string }[];
    spamReportCount: number;
  };
  onUpvoteSuccess: () => void; // Callback to refresh data after upvote
}

const PotholeCard: React.FC<PotholeCardProps> = ({ pothole, onUpvoteSuccess }) => {
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const hasUpvoted = pothole.upvotedBy.includes(userId as string);
  const [isUpvoting, setIsUpvoting] = useState(false);
  const [isReportingSpam, setIsReportingSpam] = useState(false);

  const handleUpvote = async () => {
    if (!userId) {
      toast.error("You need to be logged in to upvote.");
      return;
    }
    setIsUpvoting(true);
    try {
      const res = await fetch(`/api/potholes/${pothole._id}/upvote`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message);
        onUpvoteSuccess(); // Refresh data in parent component
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
      // You might want to add a modal or a prompt for image/comment for spam report
      // For now, let's send without image/comment directly
      const res = await fetch(`/api/potholes/${pothole._id}/spam-report`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ image: "", comment: "" }), // You can add actual values
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message);
        // Optionally, you might want to refresh the card to reflect the new spamReportCount
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

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
      {pothole.images && pothole.images.length > 0 && (
        <div className="relative w-full h-48 overflow-hidden">
          <Image
            src={pothole.images[0].url}
            alt={pothole.title}
            layout="fill"
            objectFit="cover"
            className="transition-transform duration-300 hover:scale-105"
          />
        </div>
      )}
      <div className="p-4">
        <h3 className="text-xl font-semibold text-gray-800 mb-2">{pothole.title}</h3>
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{pothole.description}</p>
        <p className="text-gray-500 text-xs mb-2">
          <strong className="text-gray-700">Location:</strong> {pothole.address}
        </p>
        <p className="text-gray-500 text-xs mb-4">
          <strong className="text-gray-700">Reported by:</strong> {pothole.reportedBy.username} on{" "}
          {new Date(pothole.reportedAt).toLocaleDateString()}
        </p>

        <div className="flex items-center justify-between mt-4 border-t pt-4">
          <button
            onClick={handleUpvote}
            disabled={isUpvoting}
            className={`flex items-center px-3 py-1 rounded-full text-sm transition-colors duration-200 ${
              hasUpvoted
                ? "bg-blue-500 text-white hover:bg-blue-600"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            } disabled:opacity-50`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 mr-1"
              fill="currentColor"
              viewBox="0 0 16 16"
            >
              <path d="M7.414 2.586a2 2 0 0 0-2.828 0L.707 6.414A2 2 0 0 0 .707 9.242l4.243 4.243a2 2 0 0 0 2.828 0l4.243-4.243a2 2 0 0 0 0-2.828L7.414 2.586z" />
            </svg>
            {isUpvoting ? "Processing..." : `${pothole.upvotes} Upvotes`}
          </button>

          <button
            onClick={handleSpamReport}
            disabled={isReportingSpam}
            className="px-3 py-1 rounded-full text-sm bg-red-100 text-red-700 hover:bg-red-200 transition-colors duration-200 disabled:opacity-50"
          >
            {isReportingSpam ? "Reporting..." : `Report Spam (${pothole.spamReportCount})`}
          </button>
        </div>

        <Link href={`/potholes/${pothole._id}`} passHref>
          <button className="mt-4 w-full bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700 transition-colors duration-200 text-sm font-medium">
            View Details
          </button>
        </Link>
      </div>
    </div>
  );
};

export default PotholeCard;