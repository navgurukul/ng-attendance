import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import StudentSidebar from "./StudentSidebar";

export default function ViewHistory() {
    const { user } = useAuth();
    const [stats, setStats] = useState({ present: 0, absent: 0, leaves: 0, kitchenDuty: 0, percentage: 0 });
    const [reportStatus, setReportStatus] = useState<"all" | "present" | "leave" | "kitchen_duty" | "absent">("all");
    const [reportFromDate, setReportFromDate] = useState<Date>();
    const [reportToDate, setReportToDate] = useState<Date>();
    const [filteredRecords, setFilteredRecords] = useState<any[]>([]);

    const [currentPage, setCurrentPage] = useState(1);
    const recordsPerPage = 10;

    useEffect(() => {
        setCurrentPage(1);
    }, [reportStatus, reportFromDate, reportToDate]);

    useEffect(() => {
        if (!user) return;

        const fetchRecords = async () => {
            const { data: attendanceData } = await supabase
                .from("attendance_records")
                .select("*")
                .eq("student_id", user.id);

            const { data: leaveData } = await supabase
                .from("leave_requests")
                .select("*")
                .eq("student_id", user.id)
                .eq("status", "approved");

            let allRecords: any[] = [];

            attendanceData?.forEach((r) => {
                allRecords.push({
                    from: r.attendance_date,
                    to: r.attendance_date,
                    status:
                        r.status === "present"
                            ? "Present"
                            : r.status === "kitchen_duty"
                                ? "Kitchen Duty"
                                : "Unknown",
                });
            });

            leaveData?.forEach((l) => {
                allRecords.push({
                    from: l.start_date,
                    to: l.end_date,
                    status: l.leave_type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
                });
            });

            const { data: profileData } = await supabase
                .from("profiles")
                .select("created_at")
                .eq("id", user.id)
                .maybeSingle();

            const accountCreatedAt = profileData?.created_at ? new Date(profileData.created_at) : new Date();
            const today = new Date();

            for (let d = new Date(accountCreatedAt); d <= today; d.setDate(d.getDate() + 1)) {
                const dateStr = format(d, "yyyy-MM-dd");
                if (!allRecords.some((r) => dateStr >= r.from && dateStr <= r.to)) {
                    allRecords.push({
                        from: dateStr,
                        to: dateStr,
                        status: "Absent",
                    });
                }
            }


            let filtered = allRecords;

            if (reportStatus !== "all") {
                filtered = filtered.filter((r) => {
                    switch (reportStatus) {
                        case "present":
                            return r.status.toLowerCase() === "present";
                        case "kitchen_duty":
                            return r.status.toLowerCase() === "kitchen duty";
                        case "leave":
                            const leaveTypes = [
                                "emergency",
                                "job interview",
                                "documentation",
                                "college",
                                "exam",
                                "special occasion",
                                "health general",
                                "health period",
                            ];
                            return leaveTypes.includes(r.status.toLowerCase());
                        case "absent":
                            return r.status.toLowerCase() === "absent";
                        default:
                            return true;
                    }
                });
            }

            const normalize = (dateStr) => {
                const d = new Date(dateStr);
                return new Date(d.getFullYear(), d.getMonth(), d.getDate());
            };

            if (reportFromDate) {
                const from = normalize(reportFromDate);
                filtered = filtered.filter((r) => normalize(r.from) >= from);
            }

            if (reportToDate) {
                const to = normalize(reportToDate);
                filtered = filtered.filter((r) => normalize(r.to) <= to);
            }

            filtered.sort((a, b) => new Date(b.from).getTime() - new Date(a.from).getTime());

            setFilteredRecords(filtered);
        };

        fetchRecords();
    }, [user, reportStatus, reportFromDate, reportToDate]);

    useEffect(() => {
        if (user) fetchAttendanceData();
    }, [user]);

    const fetchAttendanceData = async () => {
        if (!user) return;

        const { data: profileData } = await supabase
            .from("profiles")
            .select("created_at")
            .eq("id", user.id)
            .maybeSingle();

        const { data, error } = await supabase
            .from("attendance_records")
            .select("*")
            .eq("student_id", user.id);

        if (error) return;

        const present = data?.filter((r) => r.status === "present").length || 0;
        const kitchenDuty = data?.filter((r) => r.status === "kitchen_duty").length || 0;

        const { data: leaveData } = await supabase
            .from("leave_requests")
            .select("*")
            .eq("student_id", user.id)
            .eq("status", "approved");

        const leaves = leaveData?.length || 0;

        const now = new Date();
        const accountCreatedAt = profileData?.created_at ? new Date(profileData.created_at) : now;
        const elapsedDays = Math.max(1, Math.floor((now.getTime() - accountCreatedAt.getTime()) / 86400000) + 1);

        const daysWithRecord = present + kitchenDuty + leaves;
        const absent = Math.max(0, elapsedDays - daysWithRecord);

        const percentage = Math.round((present / elapsedDays) * 100);

        setStats({ present, absent, leaves, kitchenDuty, percentage });
    };

    const indexOfLastRecord = currentPage * recordsPerPage;
    const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
    const currentRecords = filteredRecords.slice(indexOfFirstRecord, indexOfLastRecord);

    const totalPages = Math.ceil(filteredRecords.length / recordsPerPage);

    const handleNext = () => {
        if (currentPage < totalPages) setCurrentPage(currentPage + 1);
    };

    const handlePrev = () => {
        if (currentPage > 1) setCurrentPage(currentPage - 1);
    };

    return (
        <div className="min-h-screen bg-background flex flex-col md:flex-row">
            <StudentSidebar />

            <div className="container mx-auto p-6">
                <h1 className="text-3xl font-bold mb-6 justify-center items-center flex">View Attendance Reports History</h1>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mb-8">
                    <Card className="p-6 border-[3px] border-foreground shadow-brutal bg-card">
                        <div className="text-3xl font-bold mb-1">{stats.present}</div>
                        <div className="text-sm text-muted-foreground">Days Present</div>
                    </Card>
                    <Card className="p-6 border-[3px] border-foreground shadow-brutal bg-card">
                        <div className="text-3xl font-bold mb-1">{stats.kitchenDuty}</div>
                        <div className="text-sm text-muted-foreground">Kitchen Duty</div>
                    </Card>
                    <Card className="p-6 border-[3px] border-foreground shadow-brutal bg-card">
                        <div className="text-3xl font-bold mb-1">{stats.absent}</div>
                        <div className="text-sm text-muted-foreground">Days Absent</div>
                    </Card>
                    <Card className="p-6 border-[3px] border-foreground shadow-brutal bg-card">
                        <div className="text-3xl font-bold mb-1">{stats.leaves}</div>
                        <div className="text-sm text-muted-foreground">Leaves Taken</div>
                    </Card>
                    <Card className="p-6 border-[3px] border-foreground shadow-brutal bg-primary text-primary-foreground">
                        <div className="text-3xl font-bold mb-1">{stats.percentage}%</div>
                        <div className="text-sm">Attendance Rate</div>
                    </Card>
                </div>

                <div className="flex flex-col sm:flex-row flex-wrap justify-center items-center gap-4 mb-6">
                    <select
                        value={reportStatus}
                        onChange={(e) => setReportStatus(e.target.value as any)}
                        className="border-[2px] border-foreground px-3 py-2 rounded-md"
                    >
                        <option value="all">All</option>
                        <option value="present">Present</option>
                        <option value="leave">Leave</option>
                        <option value="kitchen_duty">Kitchen Duty</option>
                        <option value="absent">Absent</option>
                    </select>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" className="px-4 py-2">
                                From: {reportFromDate ? format(reportFromDate, "PPP") : "Pick date"}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent>
                            <Calendar mode="single" selected={reportFromDate} onSelect={setReportFromDate} />
                        </PopoverContent>
                    </Popover>

                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" className="px-4 py-2">
                                To: {reportToDate ? format(reportToDate, "PPP") : "Pick date"}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent>
                            <Calendar mode="single" selected={reportToDate} onSelect={setReportToDate} />
                        </PopoverContent>
                    </Popover>
                </div>
                {filteredRecords.length === 0 ? (
                    <p className="text-center text-sm text-muted-foreground">No records found for selected filters.</p>
                ) : (
                    <div className="overflow-x-auto mb-6">
                        <table className="w-full border-collapse border-[2px] border-foreground">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="border-[2px] border-foreground px-2 py-2">From</th>
                                    <th className="border-[2px] border-foreground px-2 py-2">To</th>
                                    <th className="border-[2px] border-foreground px-2 py-2">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentRecords.map((rec, idx) => (
                                    <tr key={idx} className="text-sm text-center">
                                        <td className="border-[2px] border-foreground px-2 py-2">
                                            {new Date(rec.from).toLocaleDateString()}
                                        </td>
                                        <td className="border-[2px] border-foreground px-2 py-2">
                                            {new Date(rec.to).toLocaleDateString()}
                                        </td>
                                        <td className="border-[2px] border-foreground px-2 py-2 capitalize">
                                            {rec.status}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {filteredRecords.length > 0 && (
                    <div className="flex justify-center items-center gap-4">
                        <Button onClick={handlePrev} disabled={currentPage === 1} className="px-4 py-2">
                            Previous
                        </Button>

                        <span className="text-sm">
                            Page {currentPage} of {totalPages}
                        </span>

                        <Button onClick={handleNext} disabled={currentPage === totalPages} className="px-4 py-2">
                            Next
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
