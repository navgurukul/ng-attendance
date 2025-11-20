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

  return (
    <div className="flex w-full min-h-screen bg-background pt-20">
      <StudentSidebar />

      <div className="flex-1 px-4 py-6 md:px-8 md:py-10 text-center">
        <h1 className="text-4xl font-bold mb-4">Kitchen Duty</h1>
        <p className="text-muted-foreground mb-6">
          Mark your kitchen duty for today.
        </p>

        <Card className="p-4 md:p-6 border-[3px] border-foreground shadow-brutal bg-card max-w-xl mx-auto">
          <div className="flex items-center gap-3 mb-4 text-center justify-center">
            <ChefHat className="h-6 w-6" />
            <h2 className="text-xl font-bold">Kitchen Duty Today</h2>
          </div>

          <div className="text-center mb-4 text-lg font-semibold">
            {todayMarked ? "✓ Already Marked" : "Not marked yet"}
          </div>

          <Button
            variant="outline"
            className="w-full"
            disabled={loading || todayMarked}
            onClick={handleKitchenDuty}
          >
            Mark Kitchen Duty
          </Button>
        </Card>
      </div>
    </div>
  );
}

