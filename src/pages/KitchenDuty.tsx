

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { ChefHat } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import StudentSidebar from "./StudentSidebar";

export default function KitchenDuty() {
  const { user } = useAuth();
  const [todayMarked, setTodayMarked] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) checkTodayKitchenDuty();
  }, [user]);

  const checkTodayKitchenDuty = async () => {
    if (!user) return;

    const today = new Date().toISOString().split("T")[0];

    const { data } = await supabase
      .from("attendance_records")
      .select("*")
      .eq("student_id", user.id)
      .eq("attendance_date", today)
      .eq("status", "kitchen_duty")
      .maybeSingle();

    setTodayMarked(!!data);
  };

  const checkTodayStatus = async () => {
    if (!user) return [];

    const today = new Date().toISOString().split("T")[0];

    const { data, error } = await supabase
      .from("attendance_records")
      .select("status")
      .eq("student_id", user.id)
      .eq("attendance_date", today);

    if (error) return [];
    return data;
  };

  const handleKitchenDuty = async () => {
    if (!user) return;

    setLoading(true);
    const today = new Date().toISOString().split("T")[0];
    const statusList = await checkTodayStatus();

    const hasPresent = statusList.some((r) => r.status === "present");
    const hasLeaveStatus = statusList.some((r) => r.status === "leave");
    const hasKitchen = statusList.some((r) => r.status === "kitchen_duty");

    if (hasKitchen) {
      toast.error("Kitchen duty already marked for today");
      setLoading(false);
      return;
    }

    if (hasPresent) {
      toast.error("Today you are present");
      setLoading(false);
      return;
    }

    const { data: leaveData } = await supabase
      .from("leave_requests")
      .select("*")
      .eq("student_id", user.id)
      .eq("status", "approved")
      .lte("start_date", today)
      .gte("end_date", today);

    if (leaveData && leaveData.length > 0) {
      toast.error("You are on leave today");
      setLoading(false);
      return;
    }
    if (hasLeaveStatus) {
      toast.error("You are on leave today");
      setLoading(false);
      return;
    }

    const { error } = await supabase.from("attendance_records").insert({
      student_id: user.id,
      status: "kitchen_duty",
      attendance_date: today,
    });

    if (error) {
      toast.error("Failed to mark kitchen duty");
    } else {
      toast.success("Kitchen duty marked successfully!");
      setTodayMarked(true);
    }

    setLoading(false);
  };

  // Confirmation alert
  const handleConfirm = () => {
    const ok = window.confirm("Do you really have kitchen duty today?");
    if (ok) {
      handleKitchenDuty();
    } else {
      toast.info("Kitchen duty not marked");
    }
  };

  return (
    <div className="flex w-full min-h-screen bg-gray-50 pt-20">
      <StudentSidebar />

      <div className="flex-1 px-4 py-6 md:px-8 md:py-10 text-center md:ml-64 text-sm md:text-base lg:text-lg">
        <h1 className="font-bold mb-4 text-xl md:text-2xl lg:text-4xl">
          Kitchen Duty
        </h1>
        <p className="text-muted-foreground mb-6">
          Mark your kitchen duty for today.
        </p>

        {/* BIGGER CARD */}
        <Card className="p-12 md:p-14 border-[2px] border-[#111] shadow-lg bg-card max-w-3xl mx-auto hover:shadow-2xl rounded-2xl transition-all">
          <div className="flex items-center gap-4 mb-8 text-center justify-center">
            <ChefHat className="h-10 w-10" />
            <h2 className="text-3xl font-bold">Kitchen Duty Today</h2>
          </div>

          <div className="text-center mb-8 text-2xl font-semibold">
            {todayMarked ? "✓ Already Marked" : "Not marked yet"}
          </div>

          {/* DARK ORANGE BUTTON */}
          <Button
            className="w-full bg-[#D81B60] text-white font-semibold rounded-xl py-7 text-xl hover:bg-[#C2185B] hover:shadow-lg"
            disabled={loading || todayMarked}
            onClick={handleConfirm}
          >
            Mark Kitchen Duty
          </Button>
        </Card>
      </div>
    </div>
  );
}
