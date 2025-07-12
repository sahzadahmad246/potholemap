import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongo";
import Pothole from "@/models/Pothole";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { Types } from "mongoose";
import {IPotholeDocument} from "@/types/pothole";
interface RepairReportVote {
  userId: Types.ObjectId;
  comment?: string;
  votedAt: Date;
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  let sessionMongo: mongoose.ClientSession | null = null;
  try {
    await connectDB();

    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = new Types.ObjectId(session.user.id);
    const { id: potholeId } = await params;

    if (!Types.ObjectId.isValid(potholeId)) {
      return NextResponse.json({ error: "Invalid Pothole ID format." }, { status: 400 });
    }

    const { comment } = await req.json();

    if (comment && (typeof comment !== "string" || comment.trim().length === 0)) {
      return NextResponse.json({ error: "Comment must be a non-empty string." }, { status: 400 });
    }
    if (comment && comment.length > 200) {
      return NextResponse.json({ error: "Comment cannot exceed 200 characters." }, { status: 400 });
    }

    const pothole = await Pothole.findById(potholeId);
    if (!pothole) {
      return NextResponse.json({ error: "Pothole not found." }, { status: 404 });
    }

    if (!pothole.repairReport) {
      return NextResponse.json({ error: "No repair report exists for this pothole." }, { status: 404 });
    }

    const hasUpvoted = pothole.repairReport.upvotes.some((vote: { userId: Types.ObjectId }) =>
      vote.userId.equals(userId)
    );
    const hasDownvoted = pothole.repairReport.downvotes.some((vote: RepairReportVote) =>
      vote.userId.equals(userId)
    );

    sessionMongo = await mongoose.startSession();
    sessionMongo.startTransaction();

    let message = "";
    let status = 200;

    try {
      let updateQuery: mongoose.UpdateQuery<IPotholeDocument> = {};

      if (hasDownvoted) {
        // User has downvoted, so remove the downvote (un-downvote)
        updateQuery = {
          $pull: { "repairReport.downvotes": { userId: userId } },
        };
        message = "Downvote removed successfully.";
      } else {
        // User has not downvoted, so add the downvote
        // First, check if they have upvoted and remove it
        if (hasUpvoted) {
          await Pothole.findByIdAndUpdate(
            potholeId,
            { $pull: { "repairReport.upvotes": { userId: userId } } },
            { session: sessionMongo }
          );
          // Optionally, you might want to adjust the message if an upvote was removed
          // message = "Removed upvote and added downvote successfully.";
        }
        updateQuery = {
          $push: {
            "repairReport.downvotes": {
              userId,
              comment: comment ? comment.trim() : undefined,
              votedAt: new Date(),
            },
          },
        };
        message = "Downvote added successfully.";
        status = 201; // Created a new vote
      }

      const updatedPothole = await Pothole.findByIdAndUpdate(
        potholeId,
        updateQuery,
        { new: true, session: sessionMongo }
      ).populate("repairReport.submittedBy repairReport.upvotes.userId repairReport.downvotes.userId", "name image");

      await sessionMongo.commitTransaction();

      return NextResponse.json(
        { message, repairReport: updatedPothole?.repairReport },
        { status }
      );
    } catch (error) {
      await sessionMongo.abortTransaction();
      throw error;
    } finally {
      if (sessionMongo) {
        sessionMongo.endSession();
      }
    }
  } catch (error) {
    console.error("Error processing downvote/un-downvote:", error);
    if (error instanceof mongoose.Error.CastError) {
      return NextResponse.json({ error: "Invalid ID format." }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to process downvote/un-downvote." }, { status: 500 });
  }
}