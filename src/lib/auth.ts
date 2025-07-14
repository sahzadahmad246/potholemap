import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import connectDB from "@/lib/mongo"; // Adjust path as necessary based on your actual mongo.ts location
import User from "@/models/User";
import { IUser } from "@/types/user"; // Ensure IUser is correctly imported

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async session({ session }) {
      if (session.user?.email) {
        await connectDB();
        // Use lean() for better performance as we only need the data, not Mongoose methods
        const dbUser = await User.findOne({ email: session.user.email }).lean<IUser>();
        if (dbUser) {
          // Extend session user with id
          session.user.id = dbUser._id.toString();
        }
      }
      return session;
    },
    async signIn({ user }) {
      await connectDB();
      const existingUser = await User.findOne({ email: user.email });
      if (!existingUser) {
        await User.create({
          name: user.name,
          email: user.email,
          image: user.image,
          reportedPotholes: [],
          upvotedPotholes: [],
          spamReportedPotholes: [],
          repairUpvotes: [],
          downvotedRepairs: [],
          commentedPotholes: [],
        });
      }
      return true; // Allow sign in
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};