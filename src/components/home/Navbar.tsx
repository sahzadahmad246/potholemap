"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MapPin, User, Settings, LogOut, Plus, Menu, Eye, FileText, LogIn } from "lucide-react"
import Link from "next/link"
import { signOut, signIn, useSession } from "next-auth/react"
import { useState } from "react"

export default function Navbar() {
  const { data: session, status } = useSession()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const navigationItems = [
    { href: "/potholes", label: "View Potholes", icon: Eye },
    { href: "/pothole-report", label: "Report Pothole", icon: Plus },
    { href: "/reports", label: "My Reports", icon: FileText },
  ]

  // Show loading state while session is being fetched
  if (status === "loading") {
    return (
      <nav className="sticky top-0 z-50 bg-white border-b-2 border-gray-200">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <div className="p-2 bg-black rounded-xl">
                <MapPin className="h-6 w-6 text-white" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold text-black">PAM</h1>
                <p className="text-xs text-gray-600 -mt-1">Pothole Alert Map</p>
              </div>
            </Link>
            <div className="animate-pulse">
              <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
            </div>
          </div>
        </div>
      </nav>
    )
  }

  // Render navbar for unauthenticated users
  if (!session?.user) {
    return (
      <nav className="sticky top-0 z-50 bg-white border-b-2 border-gray-200">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Brand Logo */}
            <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <div className="p-2 bg-black rounded-xl">
                <MapPin className="h-6 w-6 text-white" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold text-black">PAM</h1>
                <p className="text-xs text-gray-600 -mt-1">Pothole Alert Map</p>
              </div>
            </Link>

            {/* Public Navigation - Desktop */}
            <div className="hidden md:flex items-center gap-1">
              <Link href="/potholes">
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2 text-black hover:bg-gray-100 hover:text-black font-medium"
                >
                  <Eye className="h-4 w-4" />
                  View Potholes
                </Button>
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="text-black hover:bg-gray-100"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </div>

            {/* Sign In Button - Desktop */}
            <div className="hidden md:flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => signIn()}
                className="gap-2 border-2 border-gray-300 hover:border-black hover:bg-black hover:text-white"
              >
                <LogIn className="h-4 w-4" />
                Sign In
              </Button>
            </div>
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden border-t border-gray-200 py-4">
              <div className="flex flex-col space-y-2">
                <Link href="/potholes" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 text-black hover:bg-gray-100 font-medium"
                  >
                    <Eye className="h-4 w-4" />
                    View Potholes
                  </Button>
                </Link>
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <Button
                    variant="outline"
                    className="w-full gap-2 border-2 border-gray-300 hover:border-black hover:bg-black hover:text-white bg-transparent"
                    onClick={() => {
                      setIsMobileMenuOpen(false)
                      signIn()
                    }}
                  >
                    <LogIn className="h-4 w-4" />
                    Sign In
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>
    )
  }

  // Render navbar for authenticated users (existing code)
  const user = session.user

  return (
    <nav className="sticky top-0 z-50 bg-white border-b-2 border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="p-2 bg-black rounded-xl">
              <MapPin className="h-6 w-6 text-white" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold text-black">PAM</h1>
              <p className="text-xs text-gray-600 -mt-1">Pothole Alert Map</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navigationItems.map((item) => {
              const Icon = item.icon
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2 text-black hover:bg-gray-100 hover:text-black font-medium"
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Button>
                </Link>
              )
            })}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-black hover:bg-gray-100"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>

          {/* User Profile */}
          <div className="hidden md:block">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full hover:bg-gray-100">
                  <Avatar className="h-10 w-10 border-2 border-gray-200">
                    <AvatarImage src={user.image || ""} alt={user.name || "User"} />
                    <AvatarFallback className="bg-black text-white font-semibold">
                      {user.name?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 border-2 border-gray-200" align="end" forceMount>
                <div className="flex items-center justify-start gap-2 p-3 bg-gray-50">
                  <div className="flex flex-col space-y-1 leading-none">
                    {user.name && <p className="font-semibold text-black">{user.name}</p>}
                    {user.email && <p className="w-[200px] truncate text-sm text-gray-600">{user.email}</p>}
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="cursor-pointer text-black hover:bg-gray-100">
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem className="text-black hover:bg-gray-100">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer text-black hover:bg-red-50 hover:text-red-600 focus:bg-red-50 focus:text-red-600"
                  onClick={() => signOut({ callbackUrl: "/auth" })}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            <div className="flex flex-col space-y-2">
              {navigationItems.map((item) => {
                const Icon = item.icon
                return (
                  <Link key={item.href} href={item.href} onClick={() => setIsMobileMenuOpen(false)}>
                    <Button
                      variant="ghost"
                      className="w-full justify-start gap-3 text-black hover:bg-gray-100 font-medium"
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </Button>
                  </Link>
                )
              })}
              <div className="border-t border-gray-200 pt-4 mt-4">
                <div className="flex items-center gap-3 px-3 py-2">
                  <Avatar className="h-8 w-8 border border-gray-200">
                    <AvatarImage src={user.image || ""} alt={user.name || "User"} />
                    <AvatarFallback className="bg-black text-white text-sm font-semibold">
                      {user.name?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-black text-sm">{user.name}</p>
                    <p className="text-xs text-gray-600">{user.email}</p>
                  </div>
                </div>
                <Link href="/profile" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start gap-3 text-black hover:bg-gray-100">
                    <User className="h-4 w-4" />
                    Profile
                  </Button>
                </Link>
                <Button variant="ghost" className="w-full justify-start gap-3 text-black hover:bg-gray-100">
                  <Settings className="h-4 w-4" />
                  Settings
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 text-black hover:bg-red-50 hover:text-red-600"
                  onClick={() => {
                    setIsMobileMenuOpen(false)
                    signOut({ callbackUrl: "/auth" })
                  }}
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
