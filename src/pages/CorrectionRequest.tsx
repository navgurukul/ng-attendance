import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Calendar as CalendarIcon, FileEdit } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { z } from "zod";
import { cn } from "@/lib/utils";
import StudentSidebar from "./StudentSidebar";

const correctionRequestSchema = z.object({
  attendanceDate: z.date({
    required_error: "Attendance date is required",
  }),
  reason: z
    .string()
    .trim()
    .min(20, "Reason must be at least 20 characters")
    .max(500, "Reason must be less than 500 characters"),
});


interface CorrectionRequest {
  id: string;
  attendance_date: string;
  reason: string;
  status: string;
  created_at: string;
  admin_notes: string | null;
}

export default function CorrectionRequestForm() {
  const { user } = useAuth();
  const [correctionDate, setCorrectionDate] = useState<Date>();
  const [correctionReason, setCorrectionReason] = useState("");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [correctionRequests, setCorrectionRequests] = useState<
    CorrectionRequest[]
  >([]);

  useEffect(() => {
    if (user) fetchCorrectionRequests();
  }, [user]);

  const fetchCorrectionRequests = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("attendance_correction_requests" as any)
      .select("*")
      .eq("student_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching correction requests:", error);
      return;
    }

    setCorrectionRequests((data as any) || []);
  };
  const handleCorrectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setFormErrors({});

    const validation = correctionRequestSchema.safeParse({
      attendanceDate: correctionDate,
      reason: correctionReason,
    });

    if (!validation.success) {
      const errors: Record<string, string> = {};
      validation.error.errors.forEach((err) => {
        errors[err.path[0]] = err.message;
      });
      setFormErrors(errors);
      toast.error("Please fix the form errors");
      return;
    }

    setLoading(true);

    const selectedDate = format(correctionDate!, "yyyy-MM-dd");

    const { data: present } = await supabase
      .from("attendance_records")
      .select("*")
      .eq("student_id", user.id)
      .eq("attendance_date", selectedDate)
      .eq("status", "present")
      .maybeSingle();

    if (present) {
      toast.error("You were already PRESENT on this date.");
      setLoading(false);
      return;
    }

    const { data: leaveData } = await supabase
      .from("leave_requests")
      .select("*")
      .eq("student_id", user.id)
      .lte("start_date", selectedDate)
      .gte("end_date", selectedDate);

    if (leaveData && leaveData.length > 0) {
      toast.error("You were on LEAVE during this date.");
      setLoading(false);
      return;
    }
    const { data: kitchenTurn } = await supabase
      .from("attendance_records")
      .select("*")
      .eq("student_id", user.id)
      .eq("attendance_date", selectedDate)
      .eq("status", "kitchen_duty")
      .maybeSingle();

    if (kitchenTurn) {
      toast.error("You had KITCHEN DUTY on this date.");
      setLoading(false);
      return;
    }

    const { data: existingRequest } = await supabase
      .from("attendance_correction_requests" as any)
      .select("*")
      .eq("student_id", user.id)
      .eq("attendance_date", selectedDate)
      .maybeSingle();

    if (existingRequest) {
      toast.error("Correction request already submitted for this date.");
      setLoading(false);
      return;
    }

    const { error } = await supabase
      .from("attendance_correction_requests" as any)
      .insert({
        student_id: user.id,
        attendance_date: format(correctionDate!, "yyyy-MM-dd"),
        reason: correctionReason.trim(),
      });

    if (error) {
      toast.error("Failed to submit correction request");
    } else {
      toast.success("Attendance correction request submitted");
      setCorrectionDate(undefined);
      setCorrectionReason("");
      fetchCorrectionRequests();
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row pt-20 md:ml-64">
      <div className="w-full md:w-auto">
        <StudentSidebar />
      </div>

      <div className="flex-1 px-4 py-6 md:px-8 md:py-10">
        <h1 className="text-3xl font-bold mb-6 text-center">Correction Request</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6 border-[2px] border-[#111] shadow-lg rounded-xl bg-card hover:shadow-xl transition-all max-w-xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-primary p-2 border-[3px] border-foreground rounded">
                <FileEdit className="h-6 w-6 text-primary-foreground" />
              </div>
              <h2 className="text-2xl font-bold">
                Attendance Correction Request
              </h2>
            </div>

            <form onSubmit={handleCorrectionSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label className="font-bold">Attendance Date</Label>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal border-[2px] shadow h-12",
                        !correctionDate && "text-muted-foreground",
                        formErrors.attendanceDate && "border-red-500"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {correctionDate
                        ? format(correctionDate, "PPP")
                        : "Pick a date"}
                    </Button>
                  </PopoverTrigger>

                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={correctionDate}
                      onSelect={setCorrectionDate}
                      disabled={(date) => {
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        date.setHours(0, 0, 0, 0);
                        return date.getTime() !== today.getTime();
                      }}
                    />
                  </PopoverContent>
                </Popover>

                {formErrors.attendanceDate && (
                  <p className="text-sm text-red-600">
                    {formErrors.attendanceDate}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label className="font-bold">Reason</Label>
                <Textarea
                  placeholder="Explain the issue (min 20 characters)..."
                  value={correctionReason}
                  onChange={(e) => setCorrectionReason(e.target.value)}
                  className={cn(
                    "border-[2px] border-foreground min-h-[130px] shadow resize-none",
                    formErrors.reason && "border-red-500"
                  )}
                />
                {formErrors.reason && (
                  <p className="text-sm text-red-600">{formErrors.reason}</p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                Submit Correction Request
              </Button>
            </form>
          </Card>

          <Card className="p-6 border-[2px] border-foreground bg-card shadow-lg rounded-xl">
            <h3 className="text-xl font-bold mb-4">Your Requests</h3>

            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
              {correctionRequests.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  No correction requests submitted yet.
                </p>
              ) : (
                correctionRequests.map((req) => (
                  <div
                    key={req.id}
                    className="border-[2px] border-foreground bg-muted p-4 rounded-lg shadow-sm hover:shadow-lg hover:scale-[1.01] transition-all"
                  >
                    <div className="flex justify-between mb-2">
                      <p className="font-bold">
                        {format(new Date(req.attendance_date), "PPP")}
                      </p>

                      <span
                        className={cn(
                          "text-xs px-3 py-1 rounded-md border font-bold",
                          req.status === "approved" &&
                            "bg-green-200 border-green-500 text-green-800",
                          req.status === "rejected" &&
                            "bg-red-200 border-red-500 text-red-800",
                          req.status === "pending" &&
                            "bg-yellow-200 border-yellow-500 text-yellow-800"
                        )}
                      >
                        {req.status.toUpperCase()}
                      </span>
                    </div>

                    <p className="text-sm break-words italic">{req.reason}</p>

                    {req.admin_notes && (
                      <p className="text-xs mt-2 opacity-80">
                        Admin Notes: {req.admin_notes}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
