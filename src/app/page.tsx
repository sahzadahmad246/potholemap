import { getServerSession } from "next-auth"
import { authOptions } from "./api/auth/[...nextauth]/route"
import { redirect } from "next/navigation"
import Navbar from "@/components/home/Navbar"
import MapSection from "@/components/home/MapSection"
import PotholeFeed from "@/components/home/PotholeFeed"

export default async function HomePage() {
  const session = await getServerSession(authOptions)

  if (!session || !session.user) {
    redirect("/auth")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <Navbar user={session.user} />
      <main className="container mx-auto px-4 py-6 space-y-6">
        <MapSection />
        <PotholeFeed />
      </main>
    </div>
  )
}
