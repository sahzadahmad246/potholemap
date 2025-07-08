import { Types, Document } from "mongoose";

export interface IUser {
  name?: string;
  email: string;
  image?: string;
  reportedPotholes: Types.ObjectId[];
  upvotedPotholes: Types.ObjectId[];
  spamReportedPotholes: Types.ObjectId[];
  repairUpvotes: Types.ObjectId[];
  downvotedRepairs: Types.ObjectId[];
  createdAt?: Date;
  updatedAt?: Date;
  _id: Types.ObjectId; // Make _id required
}

export interface IUserDocument extends IUser, Document {}