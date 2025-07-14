// src/app/api/potholes/[id]/repair-report/route.ts
import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongo";
import Pothole from "@/models/Pothole";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { Types } from "mongoose";
import { uploadImageStream, configureCloudinary } from "@/lib/cloudinary";

// Configure Cloudinary
configureCloudinary();

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

    // Parse FormData
    const formData = await req.formData();
    const image = formData.get("image") as File | null;
    const comment = formData.get("comment") as string | null;

    if (!image) {
      return NextResponse.json({ error: "Image is required." }, { status: 400 });
    }
    // API-side validation for comment length and type
    if (comment && (typeof comment !== "string" || comment.trim().length === 0)) {
      return NextResponse.json({ error: "Comment must be a non-empty string." }, { status: 400 });
    }
    if (comment && comment.length > 200) { // Max length from your schema
      return NextResponse.json({ error: `Comment cannot exceed 200 characters.` }, { status: 400 });
    }

    const pothole = await Pothole.findById(potholeId);
    if (!pothole) {
      return NextResponse.json({ error: "Pothole not found." }, { status: 404 });
    }

    // --- MODIFIED LOGIC START ---
    // Check if the pothole is already marked as 'repaired'
    if (pothole.status === "repaired") {
      return NextResponse.json({ error: "Pothole is already marked as repaired." }, { status: 400 });
    }

    // Allow repair report if status is 'active' or 'under_review' and no existing repairReport
    // The previous logic checked `pothole.repairReport`, which might exist even if the status isn't 'repaired'
    // This revised check ensures we only allow a new report if the status isn't 'repaired' and
    // if there's no pre-existing repairReport data (which would imply a previous attempt or incorrect state).
    // Given your original problem description, the most common scenario is the status being the blocker.
    if (pothole.repairReport && pothole.status !== "repaired") {
        // This case might imply a partial or failed previous attempt.
        // You might want to handle this more specifically, e.g., allow overwrite or require manual intervention.
        // For now, we'll block if a repairReport object exists AND the status isn't repaired (meaning it's 'active' or 'under_review' but already has a report object).
        // If the intention is to allow re-submission if the status is not 'repaired', then remove the `pothole.repairReport` check.
        // Based on your specific prompt: "actually its not [repaired]. issue is apu logic. check the pothole status if its active then allow"
        // This suggests we should allow it if 'active' or 'under_review', REGARDLESS of whether `repairReport` field has data.
        // If you always want to allow setting `repairReport` if status is not 'repaired', remove the `pothole.repairReport` check entirely.
        // For robustness, I'll keep the `pothole.repairReport` check as it indicates *some* data is present,
        // but we'll focus on the status being the primary gate.
        // If the goal is to allow *overwriting* a faulty repair report while the status is not 'repaired',
        // then you'd remove `pothole.repairReport` from this `if` condition and allow the update.
        // For this fix, let's assume if a report exists, and it's NOT repaired, something is amiss, so we block.
        // The most direct interpretation of your request means: if it's not "repaired", we can *set* a new report.
        // The previous `if (pothole.repairReport)` was the issue. We're now primarily gating on `status === "repaired"`.
        // If `pothole.repairReport` is null/undefined, the `findByIdAndUpdate` will set it.
        // If it exists but the status is not 'repaired', we'll still proceed to update, effectively overwriting.
    }
    // --- MODIFIED LOGIC END ---


    // Upload image to Cloudinary
    const imageBuffer = Buffer.from(await image.arrayBuffer());
    const { publicId, url } = await uploadImageStream(imageBuffer, "pothole_repair_reports");

    sessionMongo = await mongoose.startSession();
    sessionMongo.startTransaction();

    try {
      const updatedPothole = await Pothole.findByIdAndUpdate(
        potholeId,
        {
          $set: {
            repairReport: {
              submittedBy: userId,
              image: url,
              publicId, // Store Cloudinary publicId for potential deletion
              comment: comment ? comment.trim() : undefined,
              submittedAt: new Date(),
              upvotes: [],
              downvotes: [],
            },
            status: "repaired", // --- ALWAYS SET TO REPAIRED ON SUCCESSFUL SUBMISSION ---
            repairedAt: new Date(),
          },
        },
        { new: true, session: sessionMongo }
      ).populate("repairReport.submittedBy", "name image");

      await sessionMongo.commitTransaction();

      return NextResponse.json(
        { message: "Repair report submitted successfully.", repairReport: updatedPothole?.repairReport },
        { status: 201 }
      );
    } catch (error) {
      await sessionMongo.abortTransaction();
      throw error;
    } finally {
      if (sessionMongo) { // Ensure sessionMongo is not null before ending
        sessionMongo.endSession();
      }
    }
  } catch (error) {
    console.error("Error submitting repair report:", error);
    // Differentiate between known errors and generic server errors
    if (error instanceof mongoose.Error.CastError && error.path === '_id') {
        return NextResponse.json({ error: "Invalid Pothole ID." }, { status: 400 });
    }
    // Handle other potential known errors (e.g., Cloudinary upload failure)
    return NextResponse.json({ error: "Failed to submit repair report." }, { status: 500 });
  }
}