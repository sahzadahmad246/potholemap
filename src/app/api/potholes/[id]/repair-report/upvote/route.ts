import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongo";
import Pothole from "@/models/Pothole";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { Types } from "mongoose";
import { IPotholeDocument } from "@/types/pothole";
interface RepairReportVote {
  userId: Types.ObjectId;
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

    const pothole = await Pothole.findById(potholeId);
    if (!pothole) {
      return NextResponse.json({ error: "Pothole not found." }, { status: 404 });
    }

    if (!pothole.repairReport) {
      return NextResponse.json({ error: "No repair report exists for this pothole." }, { status: 404 });
    }

    const hasUpvoted = pothole.repairReport.upvotes.some((vote: RepairReportVote) =>
      vote.userId.equals(userId)
    );
    const hasDownvoted = pothole.repairReport.downvotes.some((vote: { userId: Types.ObjectId }) => // Adjusted type for downvotes
      vote.userId.equals(userId)
    );

    sessionMongo = await mongoose.startSession();
    sessionMongo.startTransaction();

    let message = "";
    let status = 200;

    try {
      let updateQuery: mongoose.UpdateQuery<IPotholeDocument> = {};

      if (hasUpvoted) {
        // User has upvoted, so remove the upvote (un-upvote)
        updateQuery = {
          $pull: { "repairReport.upvotes": { userId: userId } },
        };
        message = "Upvote removed successfully.";
      } else {
        // User has not upvoted, so add the upvote
        // First, check if they have downvoted and remove it
        if (hasDownvoted) {
          await Pothole.findByIdAndUpdate(
            potholeId,
            { $pull: { "repairReport.downvotes": { userId: userId } } },
            { session: sessionMongo }
          );
          // Optionally, you might want to adjust the message if a downvote was removed
          // message = "Removed downvote and added upvote successfully.";
        }
        updateQuery = {
          $push: { "repairReport.upvotes": { userId, votedAt: new Date() } },
        };
        message = "Upvote added successfully.";
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
    console.error("Error processing upvote/un-upvote:", error);
    if (error instanceof mongoose.Error.CastError) {
      return NextResponse.json({ error: "Invalid ID format." }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to process upvote/un-upvote." }, { status: 500 });
  }
}