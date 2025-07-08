import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import connectDB from "@/lib/mongo";
import User from "@/models/User";
import { IUser } from "@/types/user";

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
        const dbUser = await User.findOne({ email: session.user.email }).lean<IUser>();
        if (dbUser) {
          session.user.id = dbUser._id.toString();
        }
      }
      return session;
    },
    async signIn({ user, account, profile }) {
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
        });
      }
      return true;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };