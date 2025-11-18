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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
    const [correctionRequests, setCorrectionRequests] = useState<CorrectionRequest[]>([]);

    useEffect(() => {
        if (user) fetchCorrectionRequests();
    }, [user]);

    const fetchCorrectionRequests = async () => {
        if (!user) return;

        const { data, error } = await supabase
            .from('attendance_correction_requests' as any)
            .select('*')
            .eq('student_id', user.id)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching correction requests:', error);
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

        const { error } = await supabase
            .from('attendance_correction_requests' as any)
            .insert({
                student_id: user.id,
                attendance_date: format(correctionDate!, 'yyyy-MM-dd'),
                reason: correctionReason.trim()
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
        <div className="min-h-screen bg-background flex">
            <StudentSidebar />
            <Card className="p-6 border-[3px] border-foreground shadow-brutal bg-card">
                <div className="flex items-center gap-3 mb-6">
                    <div className="bg-primary p-2 border-[3px] border-foreground">
                        <FileEdit className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <h2 className="text-2xl font-bold">Attendance Correction Request</h2>
                </div>

                <form onSubmit={handleCorrectionSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label className="font-bold">Attendance Date</Label>

                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className={cn(
                                        "w-full justify-start text-left font-normal border-[3px] shadow-brutal-sm h-12",
                                        !correctionDate && "text-muted-foreground",
                                        formErrors.attendanceDate && "border-red-500"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {correctionDate ? format(correctionDate, "PPP") : "Pick a date"}
                                </Button>
                            </PopoverTrigger>

                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="single"
                                    selected={correctionDate}
                                    onSelect={setCorrectionDate}
                                    className="pointer-events-auto"
                                />
                            </PopoverContent>
                        </Popover>

                        {formErrors.attendanceDate && (
                            <p className="text-sm text-red-600">{formErrors.attendanceDate}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="correctionReason" className="font-bold">
                            Reason
                        </Label>
                        <Textarea
                            id="correctionReason"
                            placeholder="Explain the issue (min 20 characters)..."
                            value={correctionReason}
                            onChange={(e) => setCorrectionReason(e.target.value)}
                            className={cn(
                                "border-[3px] border-foreground min-h-[120px] shadow-brutal-sm focus:shadow-brutal resize-none",
                                formErrors.reason && "border-red-500"
                            )}
                        />
                        {formErrors.reason && (
                            <p className="text-sm text-red-600">{formErrors.reason}</p>
                        )}
                    </div>

                    <Button
                        type="submit"
                        className="w-full"
                        disabled={loading}
                    >
                        Submit Correction Request
                    </Button>
                </form>

                <div className="mt-6">
                    <h3 className="text-xl font-bold mb-3">Your Requests</h3>
                    <div className="space-y-4 max-h-[250px] overflow-y-auto pr-2">
                        {correctionRequests.length === 0 ? (
                            <p className="text-muted-foreground text-sm">No correction requests submitted yet.</p>
                        ) : (
                            correctionRequests.map((req) => (
                                <Card key={req.id} className="p-4 border-[2px] border-foreground bg-muted">
                                    <div className="font-bold">
                                        Date: {format(new Date(req.attendance_date), "PPP")}
                                    </div>
                                    <div className="text-sm mt-1">Reason: {req.reason}</div>
                                    <div
                                        className={cn(
                                            "mt-2 text-sm font-bold",
                                            req.status === "approved" && "text-green-600",
                                            req.status === "rejected" && "text-red-600",
                                            req.status === "pending" && "text-yellow-600"
                                        )}
                                    >
                                        Status: {req.status.toUpperCase()}
                                    </div>
                                    {req.admin_notes && (
                                        <p className="text-xs mt-2 opacity-80">Admin Notes: {req.admin_notes}</p>
                                    )}
                                </Card>
                            ))
                        )}
                    </div>
                </div>
            </Card>
        </div>
    );
}
