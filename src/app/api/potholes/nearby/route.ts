import { type NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/mongo"
import Pothole from "@/models/Pothole"
import type { PipelineStage } from "mongoose"
import type { IPotholePopulated } from "@/types/pothole"

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    await connectDB()
    const { searchParams } = new URL(req.url)

    const latitude = Number.parseFloat(searchParams.get("latitude") || "")
    const longitude = Number.parseFloat(searchParams.get("longitude") || "")
    const maxDistanceRaw = Number.parseFloat(searchParams.get("maxDistance") || "0") // 0 = no limit

    const minLat = Number.parseFloat(searchParams.get("minLat") || "")
    const maxLat = Number.parseFloat(searchParams.get("maxLat") || "")
    const minLng = Number.parseFloat(searchParams.get("minLng") || "")
    const maxLng = Number.parseFloat(searchParams.get("maxLng") || "")

    const limit = Math.min(Number.parseInt(searchParams.get("limit") || "50", 10), 100)
    const page = Number.parseInt(searchParams.get("page") || "1", 10)
    const minimal = searchParams.get("minimal") === "true"
    const skip = (page - 1) * limit

    const baseMatch = {
      deleted: false,
      hidden: false,
      status: { $ne: "repaired" },
    }

    let geoQueryStage: PipelineStage | null = null
    let countGeoQueryStage: PipelineStage | null = null

    const useBoundingBox =
      !Number.isNaN(minLat) && !Number.isNaN(maxLat) && !Number.isNaN(minLng) && !Number.isNaN(maxLng)
    const useGeoNear = !Number.isNaN(latitude) && !Number.isNaN(longitude)

    if (useBoundingBox) {
      // Validate bounding box coordinates
      if (minLat > maxLat || minLng > maxLng) {
        return NextResponse.json({ error: "Invalid bounding box coordinates." }, { status: 400 })
      }
      // MongoDB stores coordinates as [longitude, latitude]
      const boxCoordinates = [
        [minLng, minLat], // bottom-left
        [maxLng, maxLat], // top-right
      ]
      geoQueryStage = {
        $match: {
          ...baseMatch,
          "location.coordinates": {
            $geoWithin: {
              $box: boxCoordinates,
            },
          },
        },
      }
      countGeoQueryStage = {
        $match: {
          ...baseMatch,
          "location.coordinates": {
            $geoWithin: {
              $box: boxCoordinates,
            },
          },
        },
      }
    } else if (useGeoNear) {
      // Validate center coordinates
      if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
        return NextResponse.json({ error: "Invalid latitude or longitude." }, { status: 400 })
      }
      geoQueryStage = {
        $geoNear: {
          near: { type: "Point", coordinates: [longitude, latitude] },
          distanceField: "distance",
          spherical: true,
          query: baseMatch,
          ...(maxDistanceRaw > 0 && { maxDistance: maxDistanceRaw }),
        },
      }
      countGeoQueryStage = {
        $geoNear: {
          near: { type: "Point", coordinates: [longitude, latitude] },
          distanceField: "distance",
          spherical: true,
          query: baseMatch,
          ...(maxDistanceRaw > 0 && { maxDistance: maxDistanceRaw }),
        },
      }
    } else {
      return NextResponse.json(
        { error: "Missing location parameters (latitude/longitude or bounding box)." },
        { status: 400 },
      )
    }

    const populationStages: PipelineStage[] = [
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
                  $arrayElemAt: ["$commentUsers", { $indexOfArray: ["$commentUsers._id", "$$comment.userId"] }],
                },
              },
            },
          },
        },
      },
      { $project: { commentUsers: 0 } },
    ]

    const pipeline: PipelineStage[] = [geoQueryStage, { $skip: skip }, { $limit: limit }, ...populationStages]

    const potholes = await Pothole.aggregate<IPotholePopulated>(pipeline)

    const countPipeline: PipelineStage[] = [countGeoQueryStage, { $count: "total" }]
    const countResult = await Pothole.aggregate<{ total: number }>(countPipeline)
    const total = countResult[0]?.total || 0

    return NextResponse.json(
      minimal
        ? { data: potholes }
        : {
            data: potholes,
            pagination: {
              total,
              page,
              limit,
              totalPages: Math.ceil(total / limit),
            },
          },
      { status: 200 },
    )
  } catch (error) {
    console.error("Pothole API error:", error)
    return NextResponse.json({ error: "Failed to fetch potholes." }, { status: 500 })
  }
}
