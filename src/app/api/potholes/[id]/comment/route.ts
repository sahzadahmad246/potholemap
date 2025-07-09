import mongoose from "mongoose"; // Import mongoose for session management
import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongo";
import Pothole from "@/models/Pothole";
import User from "@/models/User"; // Import User model to update user's commentedPotholes
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { Types } from "mongoose";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  let sessionMongo: mongoose.ClientSession | null = null;
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

    const { comment } = await req.json();

    if (!comment || typeof comment !== "string" || comment.trim().length === 0) {
      return NextResponse.json({ error: "Comment text is required." }, { status: 400 });
    }
    if (comment.length > 200) {
        return NextResponse.json({ error: "Comment cannot exceed 200 characters." }, { status: 400 });
    }

    const pothole = await Pothole.findById(potholeId);

    if (!pothole) {
      return NextResponse.json({ error: "Pothole not found." }, { status: 404 });
    }

    // Start a transaction for atomicity
    sessionMongo = await mongoose.startSession();
    sessionMongo.startTransaction();

    try {
      // Add comment to Pothole
      const updatedPothole = await Pothole.findByIdAndUpdate(
        potholeId,
        {
          $push: {
            comments: {
              userId: userId,
              comment: comment.trim(),
              createdAt: new Date(),
            },
          },
        },
        { new: true, session: sessionMongo }
      );

      // Add pothole ID to user's commentedPotholes, using $addToSet to prevent duplicates
      await User.findByIdAndUpdate(
        userId,
        { $addToSet: { commentedPotholes: new Types.ObjectId(potholeId) } },
        { session: sessionMongo }
      );

      await sessionMongo.commitTransaction();

      const newComment = updatedPothole?.comments[updatedPothole.comments.length - 1];

      return NextResponse.json({ message: "Comment added successfully.", comment: newComment }, { status: 201 });

    } catch (error) {
      if (sessionMongo) {
        await sessionMongo.abortTransaction();
      }
      throw error; // Re-throw to be caught by the outer catch block
    } finally {
      if (sessionMongo) {
        sessionMongo.endSession();
      }
    }

  } catch (error) {
    console.error("Error adding comment to pothole:", error);
    return NextResponse.json({ error: "Failed to add comment." }, { status: 500 });
  }
}