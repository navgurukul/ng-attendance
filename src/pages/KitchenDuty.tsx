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

  const handleKitchenDuty = async () => {
    if (!user) return;

    setLoading(true);

    const { error } = await supabase
      .from("attendance_records")
      .insert({
        student_id: user.id,
        status: "kitchen_duty",
      });

    if (error) {
      if (error.code === "23505") {
        toast.error("Kitchen duty already marked for today");
      } else {
        toast.error("Failed to mark kitchen duty");
      }
    } else {
      toast.success("Kitchen duty marked successfully!");
      setTodayMarked(true);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex">
      <StudentSidebar />

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-4">Kitchen Duty</h1>
        <p className="text-muted-foreground mb-6">
          Mark your kitchen duty for today.
        </p>

        <Card className="p-6 border-[3px] border-foreground shadow-brutal bg-muted">
          <div className="flex items-center gap-3 mb-4">
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
