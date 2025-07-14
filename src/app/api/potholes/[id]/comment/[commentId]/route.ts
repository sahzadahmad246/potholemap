// src/app/api/potholes/[id]/comments/[commentId]/route.ts
import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongo";
import Pothole from "@/models/Pothole";
import User from "@/models/User";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { Types } from "mongoose";

interface Comment {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  comment: string;
  createdAt: Date;
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string; commentId: string }> }) {
  let sessionMongo: mongoose.ClientSession | null = null;
  try {
    await connectDB();

    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = new Types.ObjectId(session.user.id);
    const { id: potholeId, commentId } = await params;

    if (!Types.ObjectId.isValid(potholeId) || !Types.ObjectId.isValid(commentId)) {
      return NextResponse.json({ error: "Invalid Pothole ID or Comment ID format." }, { status: 400 });
    }

    const pothole = await Pothole.findById(potholeId);
    if (!pothole) {
      return NextResponse.json({ error: "Pothole not found." }, { status: 404 });
    }

    const comment = pothole.comments.find((c: Comment) => c._id.toString() === commentId);
    if (!comment) {
      return NextResponse.json({ error: "Comment not found." }, { status: 404 });
    }
    if (comment.userId.toString() !== userId.toString()) {
      return NextResponse.json({ error: "You can only delete your own comments." }, { status: 403 });
    }

    sessionMongo = await mongoose.startSession();
    sessionMongo.startTransaction();

    try {
      await Pothole.findByIdAndUpdate(
        potholeId,
        {
          $pull: { comments: { _id: new Types.ObjectId(commentId) } },
        },
        { session: sessionMongo }
      );

      const updatedPothole = await Pothole.findById(potholeId).session(sessionMongo);
      const hasOtherComments = updatedPothole?.comments.some((c: Comment) => c.userId.toString() === userId.toString());

      if (!hasOtherComments) {
        await User.findByIdAndUpdate(
          userId,
          { $pull: { commentedPotholes: new Types.ObjectId(potholeId) } },
          { session: sessionMongo }
        );
      }

      await sessionMongo.commitTransaction();

      return NextResponse.json({ message: "Comment deleted successfully." }, { status: 200 });
    } catch (error) {
      await sessionMongo.abortTransaction();
      throw error;
    } finally {
      sessionMongo.endSession();
    }
  } catch (error) {
    console.error("Error deleting comment:", error);
    return NextResponse.json({ error: "Failed to delete comment." }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string; commentId: string }> }) {
  let sessionMongo: mongoose.ClientSession | null = null;
  try {
    await connectDB();

    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = new Types.ObjectId(session.user.id);
    const { id: potholeId, commentId } = await params;

    if (!Types.ObjectId.isValid(potholeId) || !Types.ObjectId.isValid(commentId)) {
      return NextResponse.json({ error: "Invalid Pothole ID or Comment ID format." }, { status: 400 });
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

    const existingComment = pothole.comments.find((c: Comment) => c._id.toString() === commentId);
    if (!existingComment) {
      return NextResponse.json({ error: "Comment not found." }, { status: 404 });
    }
    if (existingComment.userId.toString() !== userId.toString()) {
      return NextResponse.json({ error: "You can only edit your own comments." }, { status: 403 });
    }

    sessionMongo = await mongoose.startSession();
    sessionMongo.startTransaction();

    try {
      const updatedPothole = await Pothole.findOneAndUpdate(
        { _id: potholeId, "comments._id": new Types.ObjectId(commentId) },
        {
          $set: {
            "comments.$.comment": comment.trim(),
            "comments.$.createdAt": new Date(),
          },
        },
        { new: true, session: sessionMongo }
      ).populate("comments.userId", "name image");

      await sessionMongo.commitTransaction();

      const updatedComment = updatedPothole?.comments.find((c: Comment) => c._id.toString() === commentId);

      return NextResponse.json({ message: "Comment updated successfully.", comment: updatedComment }, { status: 200 });
    } catch (error) {
      await sessionMongo.abortTransaction();
      throw error;
    } finally {
      sessionMongo.endSession();
    }
  } catch (error) {
    console.error("Error updating comment:", error);
    return NextResponse.json({ error: "Failed to update comment." }, { status: 500 });
  }
}