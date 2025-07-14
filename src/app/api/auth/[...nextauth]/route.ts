import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth"; // Import from your new utility file

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };