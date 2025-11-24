import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import StudentSidebar from "./StudentSidebar";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";

export default function StudentDashboard() {
  const { user } = useAuth();

  const [statusText, setStatusText] = useState("Loading...");
  const [statusLabel, setStatusLabel] = useState("Today's Status");

  useEffect(() => {
    if (!user) return;
    evaluateStatus();
  }, [user]);

  const evaluateStatus = async () => {
    const now = new Date();

    const hours = now.getHours();
    const minutes = now.getMinutes();

    const today = now.toISOString().split("T")[0];
    const { data: att } = await supabase
      .from("attendance_records")
      .select("status")
      .eq("student_id", user.id)
      .eq("attendance_date", today)
      .maybeSingle();


    const { data: leave } = await supabase
      .from("leave_requests")
      .select("*")
      .eq("student_id", user.id)
      .eq("status", "approved")
      .lte("start_date", today)
      .gte("end_date", today)
      .maybeSingle();

    if (att || leave) {
      setStatusLabel("Today's Status");

      if (att?.status === "present") {
        setStatusText("Present");
        return;
      }
      if (att?.status === "kitchen_duty") {
        setStatusText("Kitchen Duty");
        return;
      }
      if (leave) {
        setStatusText("Leave");
        return;
      }
    }

    if (hours < 9 || (hours === 9 && minutes < 20)) {
      setStatusLabel("Yesterday Status");
      setStatusText("Absent");
      return;
    }

    setStatusLabel("Today's Status");
    setStatusText("Absent");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex pt-20">
      <StudentSidebar />

      <div className="container mx-auto px-4 py-8  text-center flex flex-col items-center md:ml-64 text-sm md:text-base lg:text-lg">

        <div className="mb-8">
          <h1 className="font-bold mb-2 text-xl md:text-2xl lg:text-4xl">Student Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Mark your attendance and manage leaves.
          </p>
        </div>

        <Card className="w-full max-w-md shadow-lg border border-gray-300 bg-white min-h-[300px] flex items-center justify-center">
          <CardContent className="p-6">
            <h2 className="text-3xl font-bold mb-2">{statusLabel}</h2>

            <p
              className={`text-2xl font-semibold ${
                statusText === "Present"
                  ? "text-green-600"
                  : statusText === "Kitchen Duty"
                  ? "text-orange-600"
                  : statusText === "Leave"
                  ? "text-blue-600"
                  : statusText === "Loading..."
                  ? "text-gray-600"
                  : "text-red-600"
              }`}
            >
              {statusText}
            </p>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
