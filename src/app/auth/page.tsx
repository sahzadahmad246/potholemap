"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FcGoogle } from "react-icons/fc";
import { MapPin, Shield, Users } from "lucide-react";

export default function AuthPage() {
  const { status } = useSession();
  const router = useRouter();

  // Redirect to /profile if user is authenticated
  useEffect(() => {
    if (status === "authenticated") {
      router.push("/profile");
    }
  }, [status, router]);

  const handleGoogleSignIn = async () => {
    await signIn("google", { callbackUrl: "/profile" });
  };

  const features = [
    {
      icon: MapPin,
      title: "Report Issues",
      description: "Help your community by reporting potholes and road issues",
    },
    {
      icon: Users,
      title: "Community Driven",
      description: "Vote and collaborate with others to prioritize repairs",
    },
    {
      icon: Shield,
      title: "Secure & Private",
      description: "Your data is protected with enterprise-grade security",
    },
  ];

  // Show loading state while checking session
  if (status === "loading") {
    return <div>Loading...</div>;
  }

  // Render auth page only if not authenticated
  if (status !== "authenticated") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6">
          {/* Main Auth Card */}
          <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4 p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full w-fit">
                <MapPin className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Welcome Back
              </CardTitle>
              <CardDescription className="text-base text-muted-foreground">
                Sign in to continue reporting and tracking road issues in your
                community
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={handleGoogleSignIn}
                className="w-full h-12 text-base font-medium bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200"
                variant="outline"
              >
                <FcGoogle size={24} className="mr-3" />
                Continue with Google
              </Button>

              <div className="text-center">
                <p className="text-xs text-muted-foreground">
                  By signing in, you agree to our{" "}
                  <a
                    href="#"
                    className="underline hover:text-blue-600 transition-colors"
                  >
                    Terms of Service
                  </a>{" "}
                  and{" "}
                  <a
                    href="#"
                    className="underline hover:text-blue-600 transition-colors"
                  >
                    Privacy Policy
                  </a>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Features Cards */}
          <div className="grid gap-3">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="border-0 shadow-md bg-white/70 backdrop-blur-sm"
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <feature.icon className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-sm text-gray-900">
                        {feature.title}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return null; // Return null while redirecting
}
