import mongoose, { Schema, model, models } from "mongoose";
import { IUserDocument } from "@/types/user";

const UserSchema = new Schema<IUserDocument>(
  {
    name: { type: String },
    email: { type: String, required: true, unique: true },
    image: { type: String },
    reportedPotholes: [{ type: Schema.Types.ObjectId, ref: "Pothole" }],
    upvotedPotholes: [{ type: Schema.Types.ObjectId, ref: "Pothole" }],
    spamReportedPotholes: [{ type: Schema.Types.ObjectId, ref: "Pothole" }],
    repairUpvotes: [{ type: Schema.Types.ObjectId, ref: "Pothole" }],
    downvotedRepairs: [{ type: Schema.Types.ObjectId, ref: "Pothole" }],
  },
  { timestamps: true }
);

const User = models.User || model<IUserDocument>("User", UserSchema);
export default User;