// app/potholes/page.tsx
"use client";

import React, { useEffect, useState, useCallback } from "react";
import PotholeCard from "@/components/potholes/PotholeCard";
import { toast } from "sonner"; // Changed from react-hot-toast
import { ClipLoader } from "react-spinners"; // A loading spinner
import { useSearchParams } from "next/navigation"; // For pagination

interface Pothole {
  _id: string;
  title: string;
  description: string;
  images: { url: string }[];
  address: string;
  upvotes: number;
  reportedBy: { username: string; profilePicture?: string };
  reportedAt: string;
  upvotedBy: string[];
  comments: { userId: { username: string }; comment: string }[];
  spamReportCount: number;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const NearbyPotholesPage: React.FC = () => {
  const [potholes, setPotholes] = useState<Pothole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });

  const searchParams = useSearchParams();
  const currentPage = parseInt(searchParams.get("page") || "1", 10);

  const fetchPotholes = useCallback(
    async (lat: number, lon: number, page: number) => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/potholes/nearby?latitude=${lat}&longitude=${lon}&page=${page}`
        );
        const data = await res.json();
        if (res.ok) {
          setPotholes(data.data);
          setPagination(data.pagination);
        } else {
          setError(data.error || "Failed to fetch potholes.");
          toast.error(data.error || "Failed to fetch potholes.");
        }
      } catch (err) {
        console.error("Error fetching potholes:", err);
        setError("An unexpected error occurred.");
        toast.error("An unexpected error occurred.");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    // Get user's current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setLocation({ latitude, longitude });
        },
        (err) => {
          console.error("Error getting geolocation:", err);
          setError("Please enable location services to see nearby potholes.");
          toast.error("Please enable location services to see nearby potholes.");
          setLoading(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      setError("Geolocation is not supported by your browser.");
      toast.error("Geolocation is not supported by your browser.");
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (location) {
      fetchPotholes(location.latitude, location.longitude, currentPage);
    }
  }, [location, currentPage, fetchPotholes]);

  const handlePageChange = (newPage: number) => {
    if (location) {
      // Navigate to the new page, Next.js handles the URL update
      window.history.pushState(null, "", `/potholes?page=${newPage}`);
      fetchPotholes(location.latitude, location.longitude, newPage);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <ClipLoader size={50} color={"#4F46E5"} loading={loading} />
        <p className="ml-3 text-lg text-gray-700">Finding potholes near you...</p>
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

  return (
    <div className="container mx-auto px-4 py-8">
      {/* <Toaster /> Remove this as it should be in root layout */}
      <h1 className="text-4xl font-extrabold text-gray-900 mb-8 text-center">Nearby Potholes</h1>
      {potholes.length === 0 && !loading && (
        <p className="text-center text-gray-600 text-lg">No potholes found nearby.</p>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {potholes.map((pothole) => (
          <PotholeCard
            key={pothole._id}
            pothole={pothole}
            onUpvoteSuccess={() => fetchPotholes(location!.latitude, location!.longitude, currentPage)}
          />
        ))}
      </div>

      {pagination.totalPages > 1 && (
        <div className="flex justify-center mt-8 space-x-2">
          <button
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page === 1}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
          >
            Previous
          </button>
          {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((pageNumber) => (
            <button
              key={pageNumber}
              onClick={() => handlePageChange(pageNumber)}
              className={`px-4 py-2 rounded-md ${
                pageNumber === pagination.page
                  ? "bg-indigo-700 text-white"
                  : "bg-gray-200 text-gray-800 hover:bg-gray-300"
              }`}
            >
              {pageNumber}
            </button>
          ))}
          <button
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page === pagination.totalPages}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default NearbyPotholesPage;