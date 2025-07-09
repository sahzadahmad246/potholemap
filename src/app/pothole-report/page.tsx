import PotholeReportForm from "@/components/potholes/PotholeReportForm";
import { Toaster } from "sonner";

export const metadata = {
  title: "Report a Pothole",
  description: "Submit a pothole report with images, location, and details",
};

export default function PotholePage() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center py-8">
      <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-3xl font-bold text-center mb-6">Report a Pothole</h1>
        <p className="text-gray-600 text-center mb-4">
          Help improve our roads by reporting potholes. Use your camera to capture images, and we’ll automatically tag the location and area.
        </p>
        <PotholeReportForm />
      </div>
      <Toaster richColors />
    </div>
  );
}