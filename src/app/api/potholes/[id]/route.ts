// src/app/api/potholes/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongo";
import Pothole from "@/models/Pothole";
import { Types } from "mongoose";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();

    const { id } = await params; // Await params to access id

    // Validate Pothole ID
    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid Pothole ID format." }, { status: 400 });
    }

    const pothole = await Pothole.findById(id)
      .populate("reportedBy", "name email image") // Changed username to name, profilePicture to image
      .populate("upvotedBy", "name") // Changed username to name
      .populate("spamReports.userId", "name") // Changed username to name
      .populate("comments.userId", "name image") // Changed username to name, profilePicture to image
      .populate("repairReport.submittedBy", "name image") // Changed username to name, profilePicture to image
      .populate("repairReport.upvotes.userId", "name") // Changed username to name
      .populate("repairReport.downvotes.userId", "name"); // Changed username to name

    if (!pothole) {
      return NextResponse.json({ error: "Pothole not found." }, { status: 404 });
    }

    return NextResponse.json({ data: pothole }, { status: 200 });
  } catch (error) {
    console.error("Error fetching single pothole:", error);
    return NextResponse.json({ error: "Failed to fetch pothole details." }, { status: 500 });
  }
}