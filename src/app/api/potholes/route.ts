import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/mongo";
import Pothole from "@/models/Pothole";
import User from "@/models/User";
import { uploadImageStream, deleteImage, configureCloudinary } from "@/lib/cloudinary";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// Configure Cloudinary once when the module is loaded
configureCloudinary();

export async function POST(req: NextRequest) {
  // Change to const as it's only pushed to, not reassigned
  const uploadedImages: { url: string; publicId: string }[] = [];
  let sessionMongo: mongoose.ClientSession | null = null; // Still 'let' because it's assigned later

  try {
    // Connect to MongoDB
    await connectDB();

    // Get authenticated user
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse form data
    const formData = await req.formData();
    const title = formData.get("title")?.toString();
    const description = formData.get("description")?.toString();
    const location = formData.get("location")?.toString();
    const address = formData.get("address")?.toString();
    const area = formData.get("area")?.toString();
    const criticality = formData.get("criticality")?.toString();
    const taggedOfficialsRaw = formData.getAll("taggedOfficials");
    const dimensions = formData.get("dimensions")?.toString();
    const images = formData.getAll("images") as File[];

    // Validate required fields
    if (!title || !description || images.length === 0 || !location || !address) {
      return NextResponse.json(
        { error: "Missing required fields: title, description, images, location, address" },
        { status: 400 }
      );
    }

    // Validate location
    let parsedLocation;
    try {
      parsedLocation = JSON.parse(location);
      if (
        parsedLocation.type !== "Point" ||
        !Array.isArray(parsedLocation.coordinates) ||
        parsedLocation.coordinates.length !== 2 ||
        typeof parsedLocation.coordinates[0] !== "number" ||
        typeof parsedLocation.coordinates[1] !== "number"
      ) {
        throw new Error("Invalid location format");
      }
    } catch (e) {
      console.error("Location parsing error:", e);
      return NextResponse.json({ error: "Invalid location format" }, { status: 400 });
    }

    // Validate optional fields for tagged officials
    let parsedTaggedOfficials: { role: string; name?: string; twitterHandle?: string }[] = [];
    if (taggedOfficialsRaw.length > 0) {
      try {
        parsedTaggedOfficials = taggedOfficialsRaw.map((item) => JSON.parse(item.toString())).filter((official) =>
          ["contractor", "engineer", "corporator", "mla", "mp", "pradhan"].includes(official.role)
        );
      } catch (e) {
        console.error("Tagged officials parsing error:", e);
        return NextResponse.json({ error: "Invalid taggedOfficials format" }, { status: 400 });
      }
    }

    // Validate optional fields for dimensions
    let parsedDimensions;
    if (dimensions) {
      try {
        parsedDimensions = JSON.parse(dimensions);
        if (
          (parsedDimensions.length !== undefined && typeof parsedDimensions.length !== "number") ||
          (parsedDimensions.width !== undefined && typeof parsedDimensions.width !== "number") ||
          (parsedDimensions.depth !== undefined && typeof parsedDimensions.depth !== "number")
        ) {
          throw new Error("Invalid dimensions format");
        }
      } catch (e) {
        console.error("Dimensions parsing error:", e);
        return NextResponse.json({ error: "Invalid dimensions format" }, { status: 400 });
      }
    }

    // --- Image Upload to Cloudinary ---
    for (const file of images) {
      if (!(file instanceof File)) {
        return NextResponse.json({ error: "Invalid image format (not a File instance)" }, { status: 400 });
      }
      try {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const { url, publicId } = await uploadImageStream(buffer, "potholes");
        uploadedImages.push({ url, publicId });
      } catch (e) {
        console.error(`Error uploading image "${file.name}" to Cloudinary:`, e);
        // Clean up already uploaded images if one fails
        for (const img of uploadedImages) {
          await deleteImage(img.publicId).catch(deleteErr => console.error("Error during partial image cleanup delete:", deleteErr));
        }
        return NextResponse.json(
          { error: `Image upload failed for ${file.name}. Reason: ${e instanceof Error ? e.message : 'Unknown'}` },
          { status: 500 }
        );
      }
    }

    // Create pothole document
    const pothole = new Pothole({
      title,
      description,
      images: uploadedImages,
      location: parsedLocation,
      address,
      area: area || undefined,
      reportedBy: session.user.id,
      criticality: criticality || "medium",
      taggedOfficials: parsedTaggedOfficials.length > 0 ? parsedTaggedOfficials : undefined,
      dimensions: parsedDimensions || undefined,
      comments: [], // Comments array starts empty, meant for user comments post-report
    });

    // Save pothole and update user with transaction
    sessionMongo = await mongoose.startSession();
    sessionMongo.startTransaction();
    try {
      await pothole.save({ session: sessionMongo });
      await User.findByIdAndUpdate(
        session.user.id,
        { $push: { reportedPotholes: pothole._id } },
        { session: sessionMongo }
      );
      await sessionMongo.commitTransaction();
    } catch (error) {
      await sessionMongo.abortTransaction();
      console.error("MongoDB transaction failed:", error);
      // Clean up uploaded images if transaction fails
      for (const image of uploadedImages) {
        await deleteImage(image.publicId).catch(deleteErr => console.error("Error during transaction rollback image cleanup:", deleteErr));
      }
      throw error; // Re-throw to be caught by the outer catch block
    } finally {
      if (sessionMongo) {
        sessionMongo.endSession();
      }
    }

    return NextResponse.json(
      { message: "Pothole reported successfully", pothole },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating pothole (overall catch):", error);
    // This outer catch block will handle errors that occur *before* a transaction is started,
    // or unhandled errors from the transaction block itself.
    // Ensure images are deleted if they were uploaded but something else failed.
    if (uploadedImages.length > 0) {
        // If an error occurred and the images were uploaded, try to delete them.
        // This acts as a final safety net for images not cleaned up by the transaction block.
        for (const image of uploadedImages) {
            await deleteImage(image.publicId).catch(deleteErr => console.error("Error during final image cleanup delete:", deleteErr));
        }
    }

    let errorMessage = "Internal server error";
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}