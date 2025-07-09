import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongo";
import Pothole from "@/models/Pothole";
import { Types } from "mongoose"; // Still needed for isValid check

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();

    const { id } = params;

    // Validate Pothole ID
    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid Pothole ID format." }, { status: 400 });
    }

    const pothole = await Pothole.findById(id)
      .populate("reportedBy", "username email profilePicture")
      .populate("upvotedBy", "username") // Optionally populate upvotedBy users
      .populate("spamReports.userId", "username") // Populate user who reported spam
      // .populate("taggedOfficials") // taggedOfficials are embedded, no need to populate if not refs
      .populate("comments.userId", "username profilePicture") // Populate user for comments
      .populate("repairReport.submittedBy", "username profilePicture") // Populate user for repair report
      .populate("repairReport.upvotes.userId", "username") // Populate users who upvoted repair report
      .populate("repairReport.downvotes.userId", "username"); // Populate users who downvoted repair report

    if (!pothole) {
      return NextResponse.json({ error: "Pothole not found." }, { status: 404 });
    }

    return NextResponse.json({ data: pothole }, { status: 200 });

  } catch (error) {
    console.error("Error fetching single pothole:", error);
    return NextResponse.json({ error: "Failed to fetch pothole details." }, { status: 500 });
  }
}