// src/app/api/potholes/[id]/spam/route.ts

import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongo";
import Pothole from "@/models/Pothole";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth"; // Correctly importing from the dedicated utility file
import { Types } from "mongoose";

// Define the RouteContext explicitly. This is crucial.
interface RouteContext {
  params: {
    id: string;
  };
}

// Change the function signature slightly to use the defined interface
// and ensure `context` is clearly typed.
export async function POST(req: NextRequest, context: RouteContext) { // <--- CHANGE IS HERE
  const { id: potholeId } = context.params; // <--- Extract `id` directly here

  try {
    await connectDB();

    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = new Types.ObjectId(session.user.id);

    // Use potholeId directly here
    if (!Types.ObjectId.isValid(potholeId)) {
      return NextResponse.json({ error: "Invalid Pothole ID format." }, { status: 400 });
    }

    const { image, comment } = await req.json();

    const pothole = await Pothole.findById(potholeId);

    if (!pothole) {
      return NextResponse.json({ error: "Pothole not found." }, { status: 404 });
    }

    const alreadyReported = pothole.spamReports.some(
      (report: { userId?: Types.ObjectId }) => report.userId && report.userId.equals(userId)
    );

    if (alreadyReported) {
      return NextResponse.json({ message: "You have already reported this pothole as spam." }, { status: 409 });
    }

    const updatedPothole = await Pothole.findByIdAndUpdate(
      potholeId,
      {
        $push: {
          spamReports: {
            userId: userId,
            image: image || undefined,
            comment: comment || undefined,
            reportedAt: new Date(),
          },
        },
        $inc: { spamReportCount: 1 },
      },
      { new: true }
    );

    if (updatedPothole && updatedPothole.spamReportCount >= 5 && updatedPothole.status === "active") {
        await Pothole.findByIdAndUpdate(potholeId, { status: "under_review" });
    }

    return NextResponse.json({ message: "Pothole reported as spam successfully.", pothole: updatedPothole }, { status: 200 });

  } catch (error) {
    console.error("Error reporting pothole as spam:", error);
    return NextResponse.json({ error: "Failed to report pothole as spam." }, { status: 500 });
  }
}