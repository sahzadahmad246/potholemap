import { Schema, model, models } from "mongoose";
import { IPotholeDocument } from "@/types/pothole";

const PotholeSchema = new Schema<IPotholeDocument>(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    images: [
      {
        url: { type: String, required: true },
        publicId: { type: String, required: true },
      },
    ],
    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], required: true }, // [longitude, latitude]
    },
    address: { type: String, required: true },
    area: { type: String },
    reportedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    reportedAt: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ["active", "under_review", "repaired"],
      default: "active",
    },
    criticality: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    upvotes: { type: Number, default: 0 },
    upvotedBy: [{ type: Schema.Types.ObjectId, ref: "User" }],
    spamReports: [
      {
        userId: { type: Schema.Types.ObjectId, ref: "User" },
        image: { type: String },
        comment: { type: String },
        reportedAt: { type: Date, default: Date.now },
      },
    ],
    spamReportCount: { type: Number, default: 0 },
    taggedOfficials: [
      {
        role: {
          type: String,
          enum: ["contractor", "engineer", "corporator", "mla", "mp", "pradhan"],
        },
        name: { type: String },
        twitterHandle: { type: String },
      },
    ],
    repairReport: {
      submittedBy: { type: Schema.Types.ObjectId, ref: "User" },
      image: { type: String },
      comment: { type: String },
      submittedAt: { type: Date, default: Date.now },
      upvotes: [
        {
          userId: { type: Schema.Types.ObjectId, ref: "User" },
          image: { type: String },
          votedAt: { type: Date, default: Date.now },
        },
      ],
      downvotes: [
        {
          userId: { type: Schema.Types.ObjectId, ref: "User" },
          comment: { type: String },
          votedAt: { type: Date, default: Date.now },
        },
      ],
      confirmed: { type: Boolean, default: false },
    },
    repairedAt: { type: Date },
    hidden: { type: Boolean, default: false },
    lastUpdated: { type: Date, default: Date.now },
    deleted: { type: Boolean, default: false },
    dimensions: {
      length: { type: Number },
      width: { type: Number },
      depth: { type: Number },
    },
    comments: [
      {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        comment: {
          type: String,
          required: true,
          maxlength: [200, "Comment cannot exceed 200 characters"],
        },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: { createdAt: "reportedAt", updatedAt: "lastUpdated" },
  }
);

PotholeSchema.index({ location: "2dsphere" });
PotholeSchema.index({ status: 1, criticality: 1, reportedAt: -1 });

const Pothole = models.Pothole || model<IPotholeDocument>("Pothole", PotholeSchema);
export default Pothole;