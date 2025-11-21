import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Calendar as CalendarIcon, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { z } from "zod";
import { cn } from "@/lib/utils";
import StudentSidebar from "./StudentSidebar";


const leaveRequestSchema = z.object({
    leaveType: z.enum(['emergency', 'job_interview', 'documentation', 'college', 'exam', 'special_occasion', 'health_general', 'health_period'], { "required_error": "Please select a leave type" }),
    reason: z.string().trim().min(10, "Reason must be at least 10 characters").max(500, "Reason must be less than 500 characters"),
    startDate: z.date({ required_error: "Start date is required" }),
    endDate: z.date({ required_error: "End date is required" })
}).refine(data => data.endDate >= data.startDate, {
    message: "End date must be on or after start date",
    path: ["endDate"]
});


interface LeaveRequest {
    id: string;
    leave_type: string;
    reason: string;
    start_date: string;
    end_date: string;
    status: string;
    created_at: string;
}

export default function LeaveRequest() {
    const { user } = useAuth();
    const [leaveType, setLeaveType] = useState("");
    const [leaveReason, setLeaveReason] = useState("");
    const [startDate, setStartDate] = useState<Date>();
    const [endDate, setEndDate] = useState<Date>();
    const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (user) fetchLeaveRequests();
    }, [user]);

    const fetchLeaveRequests = async () => {
        if (!user) return;

        const { data, error } = await supabase
            .from('leave_requests')
            .select('*')
            .eq('student_id', user.id)
            .order('start_date', { ascending: false });

        if (error) {
            console.error('Error fetching leave requests:', error);
            return;
        }

        setLeaveRequests((data as any) || []);
    };

    const handleLeaveSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setFormErrors({});

        const validation = leaveRequestSchema.safeParse({
            leaveType,
            reason: leaveReason,
            startDate,
            endDate
        });

        if (!validation.success) {
            const errors: Record<string, string> = {};
            validation.error.errors.forEach(err => {
                errors[err.path[0]] = err.message;
            });
            setFormErrors(errors);
            toast.error("Please fix the form errors");
            return;
        }

        setLoading(true);

        const formattedStartDate = format(startDate!, "yyyy-MM-dd");
        const formattedEndDate = format(endDate!, "yyyy-MM-dd");

        const { data: existingLeaves, error: existingLeavesError } = await supabase
            .from('leave_requests')
            .select('*')
            .eq('student_id', user.id)
            .eq('status', 'approved')
            .lte('start_date', formattedEndDate)
            .gte('end_date', formattedStartDate);

        if (existingLeavesError) {
            toast.error("Failed to check existing leave requests");
            setLoading(false);
            return;
        }

        if (existingLeaves && existingLeaves.length > 0) {
            toast.error(
                `You already have approved leave (${existingLeaves[0].leave_type}) in this date range.`
            );
            setLoading(false);
            return;
        }


        const { data: presentDates, error: presentError } = await supabase
            .from('attendance_records')
            .select('*')
            .eq('student_id', user.id)
            .gte('attendance_date', formattedStartDate)
            .lte('attendance_date', formattedEndDate)
            .eq('status', 'present');

        if (presentError) {
            toast.error("Failed to check attendance status");
            setLoading(false);
            return;
        }

        if (presentDates && presentDates.length > 0) {
            toast.error("You were marked PRESENT on one or more dates in this range.");
            setLoading(false);
            return;
        }

        const { data: kitchenDutyDates, error: kitchenError } = await supabase
            .from('attendance_records')
            .select('*')
            .eq('student_id', user.id)
            .gte('attendance_date', formattedStartDate)
            .lte('attendance_date', formattedEndDate)
            .eq('status', 'kitchen_duty');

        if (kitchenError) {
            toast.error("Failed to check kitchen duty status");
            setLoading(false);
            return;
        }

        if (kitchenDutyDates && kitchenDutyDates.length > 0) {
            toast.error("You had KITCHEN DUTY on one or more dates in this range.");
            setLoading(false);
            return;
        }


        const { error } = await supabase
            .from('leave_requests')
            .insert({
                student_id: user.id,
                leave_type: leaveType,
                reason: leaveReason.trim(),
                start_date: formattedStartDate,
                end_date: formattedEndDate
            });

        if (error) {
            toast.error("Failed to submit leave request");
        } else {
            toast.success("Leave request submitted for approval");
            setLeaveType("");
            setLeaveReason("");
            setStartDate(undefined);
            setEndDate(undefined);
            fetchLeaveRequests();
        }

        setLoading(false);
    };



    return (
        <div className="min-h-screen bg-background flex flex-col md:flex-row mb-[100px] pt-20">
            <div className="w-full md:w-auto">
                <StudentSidebar />
            </div>
            <div className="flex-1 px-4 py-6 md:px-8 md:py-10 md:ml-64">
                <h1 className="text-4xl font-bold mb-4 text-center">Apply your Leave here</h1>
                <Card className="p-4 md:p-6 border-[3px] border-foreground shadow-brutal bg-card max-w-xl mx-auto">

                    <div className="flex items-center gap-3 mb-6">
                        <div className="bg-primary p-2 border-[3px] border-foreground">
                            <CalendarIcon className="h-6 w-6 text-primary-foreground" />
                        </div>
                        <h2 className="text-xl md:text-2xl font-bold">Request Leave</h2>
                    </div>

                    <form onSubmit={handleLeaveSubmit} className="space-y-4">

                        <div className="space-y-2">
                            <Label htmlFor="leaveType" className="font-bold">Leave Type</Label>
                            <select
                                id="leaveType"
                                value={leaveType}
                                onChange={(e) => setLeaveType(e.target.value)}
                                className={cn(
                                    "w-full h-12 px-4 border-[3px] border-foreground shadow-brutal-sm bg-background focus:shadow-brutal",
                                    formErrors.leaveType && "border-red-500"
                                )}
                            >
                                <option value="">Select leave type</option>
                                <option value="emergency">Emergency</option>
                                <option value="job_interview">Job interviews Leave</option>
                                <option value="documentation">documentation</option>
                                <option value="college">college</option>
                                <option value="exam">exam</option>
                                <option value="special_occasion">special occasions </option>
                                <option value="health_general">health general</option>
                                <option value="health_period">Health period Leave</option>
                            </select>

                            {formErrors.leaveType && (
                                <p className="text-sm text-red-600">{formErrors.leaveType}</p>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="font-bold">Start Date</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className={cn(
                                                "w-full justify-start text-left font-normal border-[3px] shadow-brutal-sm h-12",
                                                !startDate && "text-muted-foreground",
                                                formErrors.startDate && "border-red-500"
                                            )}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {startDate ? format(startDate, "PPP") : "Pick a date"}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={startDate}
                                            onSelect={setStartDate}
                                            disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>

                                {formErrors.startDate && (
                                    <p className="text-sm text-red-600">{formErrors.startDate}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label className="font-bold">End Date</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className={cn(
                                                "w-full justify-start text-left font-normal border-[3px] shadow-brutal-sm h-12",
                                                !endDate && "text-muted-foreground",
                                                formErrors.endDate && "border-red-500"
                                            )}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {endDate ? format(endDate, "PPP") : "Pick a date"}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={endDate}
                                            onSelect={setEndDate}
                                            disabled={(date) => {
                                                const today = new Date(new Date().setHours(0, 0, 0, 0));
                                                if (date < today) return true;
                                                if (startDate && date < startDate) return true;
                                                return false;
                                            }}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>

                                {formErrors.endDate && (
                                    <p className="text-sm text-red-600">{formErrors.endDate}</p>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="reason" className="font-bold">Reason</Label>
                            <Textarea
                                id="reason"
                                placeholder="Please provide a detailed reason..."
                                value={leaveReason}
                                onChange={(e) => setLeaveReason(e.target.value)}
                                className={cn(
                                    "border-[3px] border-foreground min-h-[120px] shadow-brutal-sm focus:shadow-brutal resize-none",
                                    formErrors.reason && "border-red-500"
                                )}
                            />
                            {formErrors.reason && (
                                <p className="text-sm text-red-600">{formErrors.reason}</p>
                            )}
                        </div>

                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? "Submitting..." : "Submit Leave Request"}
                        </Button>
                    </form>

                    <div className="mt-6 p-4 border-[3px] border-foreground bg-background">
                        <div className="flex items-center gap-3 mb-3">
                            <AlertCircle className="h-5 w-5 text-primary" />
                            <span className="font-bold">Leave Requests</span>
                        </div>

                        {leaveRequests.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No leave requests yet</p>
                        ) : (
                            <div className="space-y-2 max-h-40 overflow-y-auto">
                                {leaveRequests.map((leave) => (
                                    <div key={leave.id} className="text-sm p-2 border-[2px] border-foreground bg-muted">
                                        <div className="flex flex-col md:flex-row md:justify-between">
                                            <span>
                                                {leave.leave_type.toUpperCase()}: {new Date(leave.start_date).toLocaleDateString()} - {new Date(leave.end_date).toLocaleDateString()}
                                            </span>

                                            <span className={cn(
                                                "text-xs font-bold px-2 py-1 mt-1 md:mt-0 border-[2px] border-foreground",
                                                leave.status === 'pending' && "bg-yellow-200 text-yellow-900",
                                                leave.status === 'approved' && "bg-green-200 text-green-900",
                                                leave.status === 'rejected' && "bg-red-200 text-red-900"
                                            )}>
                                                {leave.status.toUpperCase()}
                                            </span>
                                        </div>

                                        <div className="mt-1 text-xs italic">{leave.reason}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                </Card>
            </div>
        </div>
    );


}