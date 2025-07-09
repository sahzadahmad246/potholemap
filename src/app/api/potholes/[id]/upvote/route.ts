import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongo";
import Pothole from "@/models/Pothole";
// import User from "@/models/User"; // Not directly used in this file's logic
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { Types } from "mongoose";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();

    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = new Types.ObjectId(session.user.id);
    const potholeId = params.id;

    if (!Types.ObjectId.isValid(potholeId)) {
      return NextResponse.json({ error: "Invalid Pothole ID format." }, { status: 400 });
    }

    const pothole = await Pothole.findById(potholeId);

    if (!pothole) {
      return NextResponse.json({ error: "Pothole not found." }, { status: 404 });
    }

    const isUpvoted = pothole.upvotedBy.includes(userId);

    let updatedPothole;
    if (isUpvoted) {
      // User has already upvoted, so remove upvote
      updatedPothole = await Pothole.findByIdAndUpdate(
        potholeId,
        {
          $pull: { upvotedBy: userId },
          $inc: { upvotes: -1 },
        },
        { new: true } // Return the updated document
      );
      return NextResponse.json({ message: "Pothole un-upvoted successfully.", pothole: updatedPothole }, { status: 200 });
    } else {
      // User has not upvoted, add upvote
      updatedPothole = await Pothole.findByIdAndUpdate(
        potholeId,
        {
          $addToSet: { upvotedBy: userId }, // Use $addToSet to prevent duplicates
          $inc: { upvotes: 1 },
        },
        { new: true }
      );
      return NextResponse.json({ message: "Pothole upvoted successfully.", pothole: updatedPothole }, { status: 200 });
    }

  } catch (error) {
    console.error("Error upvoting/un-upvoting pothole:", error);
    return NextResponse.json({ error: "Failed to process upvote." }, { status: 500 });
  }
}