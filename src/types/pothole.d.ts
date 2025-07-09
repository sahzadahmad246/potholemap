// types/pothole.d.ts
import { Types, Document } from "mongoose";

// 1. Interface for the RAW Pothole data (as stored in MongoDB)
export interface IPotholeRaw {
  title: string;
  description: string;
  images: { url: string; publicId: string }[];
  location: { type: "Point"; coordinates: [number, number] };
  address: string;
  area?: string;
  reportedBy: Types.ObjectId; // This is an ObjectId in the raw document
  reportedAt: Date;
  status: "active" | "under_review" | "repaired";
  criticality: "low" | "medium" | "high";
  upvotes: number;
  upvotedBy: Types.ObjectId[]; // Array of ObjectIds
  spamReports: { userId: Types.ObjectId; image?: string; comment?: string; reportedAt: Date }[];
  spamReportCount: number;
  taggedOfficials: { role: "contractor" | "engineer" | "corporator" | "mla" | "mp" | "pradhan"; name?: string; twitterHandle?: string }[];
  repairReport?: {
    submittedBy: Types.ObjectId;
    image?: string;
    comment?: string;
    submittedAt: Date;
    upvotes: { userId: Types.ObjectId; image?: string; votedAt: Date }[];
    downvotes: { userId: Types.ObjectId; comment?: string; votedAt: Date }[];
    confirmed: boolean;
  };
  repairedAt?: Date;
  hidden: boolean;
  lastUpdated: Date;
  deleted: boolean;
  dimensions?: { length?: number; width?: number; depth?: number };
  comments: {
    _id?: Types.ObjectId; // Subdocuments often have their own _id
    userId: Types.ObjectId; // This is an ObjectId in the raw document
    comment: string;
    createdAt: Date;
  }[];
  _id: Types.ObjectId; // MongoDB _id
}

// 2. Mongoose Document Interface for the Pothole Model
// This combines the raw data with Mongoose Document methods
export interface IPotholeDocument extends IPotholeRaw, Document {}

// --- User Profile Interface (for populated fields) ---
// Define a simplified user interface that gets populated
export interface IUserProfile {
  _id: Types.ObjectId; // Or string if you prefer to deal with string IDs after JSON serialization
  username: string;
  email?: string;
  profilePicture?: string;
}

// --- Comments with Populated User ---
export interface ICommentPopulated {
  _id?: Types.ObjectId;
  userId: IUserProfile; // userId is now a populated user object
  comment: string;
  createdAt: Date;
}

// 3. Interface for the POPULATED Pothole data (as returned by API / after Mongoose populate)
export interface IPotholePopulated extends Omit<IPotholeRaw, 'reportedBy' | 'upvotedBy' | 'spamReports' | 'repairReport' | 'comments'> {
  // Override fields that get populated
  reportedBy: IUserProfile;
  upvotedBy: IUserProfile[]; // If you populate upvotedBy in some cases
  spamReports: Array<{
    userId: IUserProfile;
    image?: string;
    comment?: string;
    reportedAt: Date;
  }>;
  repairReport?: {
    submittedBy: IUserProfile;
    image?: string;
    comment?: string;
    submittedAt: Date;
    upvotes: { userId: IUserProfile; image?: string; votedAt: Date }[];
    downvotes: { userId: IUserProfile; comment?: string; votedAt: Date }[];
    confirmed: boolean;
  };
  comments: ICommentPopulated[];
  distance?: number; // Add distance field as it's added by $geoNear
}