import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import connectDB from "@/lib/mongo";
import User from "@/models/User"; // Correctly imported and used
import { IUser } from "@/types/user"; // Correctly imported and used

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
          session.user.id = dbUser._id.toString();
        }
      }
      return session;
    },
    async signIn({ user }) { // `user` is implicitly typed by NextAuth, no need for `_account`, `_profile` if not used
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
          commentedPotholes: [], // Initialize new field
        });
      }
      return true; // Allow sign in
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };