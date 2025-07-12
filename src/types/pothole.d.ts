import type { Types, Document } from "mongoose"

// 1. Interface for the RAW Pothole data (as stored in MongoDB)
export interface IPotholeRaw {
  title: string
  description: string
  images: { url: string; publicId: string }[]
  location: { type: "Point"; coordinates: [number, number] }
  address: string
  area?: string
  reportedBy: Types.ObjectId
  reportedAt: Date
  status: "active" | "under_review" | "repaired"
  criticality: "low" | "medium" | "high"
  upvotes: number
  upvotedBy: Types.ObjectId[]
  spamReports: {
    userId: Types.ObjectId
    image?: string
    comment?: string
    reportedAt: Date
  }[]
  spamReportCount: number
  taggedOfficials: {
    role: "contractor" | "engineer" | "corporator" | "mla" | "mp" | "pradhan"
    name?: string
    twitterHandle?: string
  }[]
  repairReport?: {
    submittedBy: Types.ObjectId
    image?: string
    comment?: string
    submittedAt: Date
    upvotes: { userId: Types.ObjectId; image?: string; votedAt: Date }[]
    downvotes: { userId: Types.ObjectId; comment?: string; votedAt: Date }[]
    confirmed: boolean
  }
  repairedAt?: Date
  hidden: boolean
  lastUpdated: Date
  deleted: boolean
  dimensions?: { length?: number; width?: number; depth?: number }
  comments: {
    _id?: Types.ObjectId
    userId: Types.ObjectId
    comment: string
    createdAt: Date
  }[]
  _id: Types.ObjectId
}

// 2. Mongoose Document Interface for the Pothole Model
export interface IPotholeDocument extends IPotholeRaw, Document {}

// 3. User Profile Interface (for populated fields)
export interface IUserProfile {
  _id: Types.ObjectId
  name: string // Changed from username to name
  email?: string
  image?: string // Changed from profilePicture to image
}

// 4. Comments with Populated User
export interface ICommentPopulated {
  _id: Types.ObjectId
  userId: {
    _id: Types.ObjectId
    name: string
    image?: string
  }
  comment: string
  createdAt: Date
}

// 5. Interface for the POPULATED Pothole data (as returned by API)
export interface IPotholePopulated
  extends Omit<IPotholeRaw, "reportedBy" | "upvotedBy" | "spamReports" | "repairReport" | "comments"> {
  reportedBy: IUserProfile
  upvotedBy: IUserProfile[]
  spamReports: Array<{
    userId: IUserProfile
    image?: string
    comment?: string
    reportedAt: Date
  }>
  repairReport?: {
    submittedBy: IUserProfile
    image?: string
    publicId?: string;
    comment?: string
    submittedAt: Date
    upvotes: { userId: IUserProfile; votedAt: Date }[]
    downvotes: { userId: IUserProfile; comment?: string; votedAt: Date }[]
    confirmed: boolean
  }
  comments: ICommentPopulated[]
  distance?: number
}
