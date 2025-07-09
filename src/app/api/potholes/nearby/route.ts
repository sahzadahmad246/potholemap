// src/app/api/potholes/nearby/route.ts
import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongo";
import Pothole from "@/models/Pothole";
import { PipelineStage } from "mongoose";
import { IPotholePopulated } from "@/types/pothole"; // Import the POPULATED Pothole type

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const latitude = parseFloat(searchParams.get("latitude") || "");
    const longitude = parseFloat(searchParams.get("longitude") || "");
    let maxDistance = parseFloat(searchParams.get("maxDistance") || "5000"); // Default 5km (in meters)
    const limit = parseInt(searchParams.get("limit") || "10", 10); // Default 10 potholes
    const page = parseInt(searchParams.get("page") || "1", 10); // Default page 1
    const skip = (page - 1) * limit;

    // Validate coordinates
    if (isNaN(latitude) || isNaN(longitude) || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return NextResponse.json({ error: "Invalid latitude or longitude." }, { status: 400 });
    }
    if (isNaN(maxDistance) || maxDistance <= 0) {
      maxDistance = 100000; // 100 km, or a sufficiently large default
    }
    if (isNaN(limit) || limit <= 0 || limit > 50) {
      return NextResponse.json({ error: "Invalid limit. Must be between 1 and 50." }, { status: 400 });
    }
    if (isNaN(page) || page <= 0) {
      return NextResponse.json({ error: "Invalid page." }, { status: 400 });
    }

    let potholes: IPotholePopulated[] = []; // Now correctly typed
    let totalCount = 0;

    const baseMatchStage = {
      status: { $ne: "repaired" },
      deleted: false,
      hidden: false,
    };

    const buildPopulationStages = (): PipelineStage[] => ([
        {
            $lookup: {
                from: "users",
                localField: "reportedBy",
                foreignField: "_id",
                as: "reportedBy",
            },
        },
        {
            $unwind: {
                path: "$reportedBy",
                preserveNullAndEmptyArrays: true,
            },
        },
        {
            $lookup: {
                from: "users",
                localField: "comments.userId",
                foreignField: "_id",
                as: "commentUsers",
            },
        },
        {
            $addFields: {
                comments: {
                    $map: {
                        input: "$comments",
                        as: "comment",
                        in: {
                            _id: "$$comment._id",
                            comment: "$$comment.comment",
                            createdAt: "$$comment.createdAt",
                            userId: {
                                $arrayElemAt: [
                                    "$commentUsers",
                                    { $indexOfArray: ["$commentUsers._id", "$$comment.userId"] },
                                ],
                            },
                        },
                    },
                },
            },
        },
        {
            $project: {
                commentUsers: 0,
            },
        },
    ]);


    // --- Strategy: Try with maxDistance first using aggregation ---
    const initialPipeline: PipelineStage[] = [
      {
        $geoNear: {
          near: {
            type: "Point",
            coordinates: [longitude, latitude],
          },
          distanceField: "distance",
          maxDistance: maxDistance,
          spherical: true,
          query: baseMatchStage,
        },
      },
      { $skip: skip },
      { $limit: limit },
      ...buildPopulationStages(), // Spread the population stages
    ];

    const resultFromInitialSearch = await Pothole.aggregate<IPotholePopulated>(initialPipeline);
    potholes = resultFromInitialSearch;

    // Calculate total count for pagination for the initial search area
    const countPipeline: PipelineStage[] = [
      {
        $geoNear: {
          near: {
            type: "Point",
            coordinates: [longitude, latitude],
          },
          distanceField: "distance", // required for $geoNear stage to work
          maxDistance: maxDistance,
          spherical: true,
          query: baseMatchStage,
        },
      },
      { $count: "total" },
    ];
    const countResult = await Pothole.aggregate<{ total: number }>(countPipeline);
    totalCount = countResult.length > 0 ? countResult[0].total : 0;


    if (potholes.length === 0) {
      console.log("No potholes found within initial maxDistance. Fetching closest ones without maxDistance.");

      // --- Fallback: If no potholes found within maxDistance, find the absolute closest ones ---
      const fallbackPipeline: PipelineStage[] = [
        {
          $geoNear: {
            near: {
              type: "Point",
              coordinates: [longitude, latitude],
            },
            distanceField: "distance",
            spherical: true,
            query: baseMatchStage,
          },
        },
        { $limit: limit },
        ...buildPopulationStages(), // Spread the population stages again
      ];

      const resultFromFallbackSearch = await Pothole.aggregate<IPotholePopulated>(fallbackPipeline);
      potholes = resultFromFallbackSearch;
      totalCount = potholes.length; // Total count is the number of items found in fallback
    }

    return NextResponse.json({
      data: potholes,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
    }, { status: 200 });

  } catch (error) {
    console.error("Error fetching potholes by location:", error);
    return NextResponse.json({ error: "Failed to fetch potholes." }, { status: 500 });
  }
}