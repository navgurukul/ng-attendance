import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from 'sonner';
import { ArrowLeft, User, Calendar, Loader2, CheckCircle, XCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from "@/lib/utils";

interface DetailedRecord {
    from: string;
    to: string;
    status: string;
}

interface ProfileData {
    full_name: string;
    email: string;
    roll_number: string | null;
    department: string | null;
    created_at: string;
}

const StudentReportPage = () => {
    const { studentId } = useParams();
    const navigate = useNavigate();
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [records, setRecords] = useState<DetailedRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchDetailedStudentRecords = async (id: string) => {
        setLoading(true);
        setError(null);

        const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('full_name, email, roll_number, department, created_at')
            .eq('id', id)
            .maybeSingle();

        if (profileError || !profileData) {
            setError("Student profile not found or access denied.");
            setLoading(false);
            return;
        }
        setProfile(profileData as ProfileData);

        const { data: attendanceData } = await supabase
            .from('attendance_records')
            .select('*')
            .eq('student_id', id);

        const { data: leaveData } = await supabase
            .from('leave_requests')
            .select('*')
            .eq('student_id', id)
            .eq('status', 'approved');

        let allRecords: DetailedRecord[] = [];

        attendanceData?.forEach((r) => {
            allRecords.push({
                from: r.attendance_date,
                to: r.attendance_date,
                status: r.status === "present" ? "Present" : r.status === "kitchen_duty" ? "Kitchen Duty" : "Unknown"
            });
        });

        leaveData?.forEach((l) => {
            allRecords.push({
                from: l.start_date,
                to: l.end_date,
                status: l.leave_type.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()) + " Leave"
            });
        });

        const accountCreatedAt = new Date(profileData.created_at);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (let d = new Date(accountCreatedAt); d < today; d.setDate(d.getDate() + 1)) {
            const dateStr = format(d, "yyyy-MM-dd");

            const isCovered = allRecords.some(r => {
                const start = new Date(r.from);
                const end = new Date(r.to);
                start.setHours(0, 0, 0, 0);
                end.setHours(0, 0, 0, 0);

                return d.getTime() >= start.getTime() && d.getTime() <= end.getTime();
            });

            if (!isCovered) {
                allRecords.push({
                    from: dateStr,
                    to: dateStr,
                    status: "Absent"
                });
            }
        }

        allRecords.sort((a, b) => new Date(b.from).getTime() - new Date(a.from).getTime());

        setRecords(allRecords);
        setLoading(false);
    };

    useEffect(() => {
        if (studentId) {
            fetchDetailedStudentRecords(studentId);
        } else {
            setError("Invalid student ID.");
        }
    }, [studentId]);

    const totalDays = records.length;
   
    const presentDays = records.filter(r => r.status.toLowerCase().includes('present') || r.status.toLowerCase().includes('kitchen')).length; 
    const attendanceRate = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;
    
    const rateColor = attendanceRate >= 75 ? 'text-green-600' : attendanceRate >= 50 ? 'text-yellow-600' : 'text-red-600';


    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[500px]">
                <Loader2 className="h-8 w-8 animate-spin mr-2" />
                <p className="text-xl text-muted-foreground">Loading detailed report...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto px-4 py-8">
                <Button onClick={() => navigate('/admin')} variant="outline" className="mb-6 border-[3px] border-foreground shadow-brutal-sm">
                    <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
                </Button>
                <div className="text-center py-20 border-[3px] border-red-500 bg-red-100 text-red-700 font-bold">
                    Error: {error}
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <Button onClick={() => navigate('/admin')} variant="outline" className="mb-6 border-[3px] border-foreground shadow-brutal-sm">
                <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
            </Button>

            <h1 className="text-4xl font-extrabold mb-6 border-b-4 border-foreground pb-2">
                Detailed Report: {profile?.full_name || 'Student'}
            </h1>

            <div className="grid md:grid-cols-3 gap-6 mb-8">
                <Card className="p-4 border-[3px] border-foreground shadow-brutal bg-primary/20">
                    <div className="flex items-center gap-3">
                        <User className="h-6 w-6 text-primary" />
                        <div>
                            <p className="text-sm text-muted-foreground">Roll No. / Dept.</p>
                            <p className="font-bold">{profile?.roll_number || 'N/A'} / {profile?.department || 'N/A'}</p>
                        </div>
                    </div>
                </Card>
                <Card className="p-4 border-[3px] border-foreground shadow-brutal bg-primary/20">
                    <div className="flex items-center gap-3">
                        <Clock className="h-6 w-6 text-primary" />
                        <div>
                            <p className="text-sm text-muted-foreground">Total Days Counted</p>
                            <p className="font-bold">{totalDays} Days</p>
                        </div>
                    </div>
                </Card>
                <Card className="p-4 border-[3px] border-foreground shadow-brutal bg-primary/20">
                    <div className="flex items-center gap-3">
                        <CheckCircle className="h-6 w-6 text-primary" />
                        <div>
                            <p className="text-sm text-muted-foreground">Overall Attendance</p>
                            <p className={cn("text-2xl font-bold", rateColor)}>{attendanceRate}%</p>
                        </div>
                    </div>
                </Card>
            </div>

            <Card className="p-6 border-[3px] border-foreground shadow-brutal bg-card">
                <h2 className="text-2xl font-bold mb-4 border-b pb-2">Attendance History ({totalDays} Records)</h2>
                
                <div className="overflow-x-auto border-[3px] border-foreground">
                    <table className="min-w-full divide-y divide-foreground/50">
                        <thead className="bg-primary text-primary-foreground">
                            <tr>
                                <th className="px-4 py-3 text-left font-bold border-r-[3px] border-foreground">Date From</th>
                                <th className="px-4 py-3 text-left font-bold border-r-[3px] border-foreground">Date To</th>
                                <th className="px-4 py-3 text-left font-bold">Status / Type</th>
                            </tr>
                        </thead>
                        <tbody className="bg-background divide-y divide-foreground/30">
                            {records.map((rec, index) => (
                                <tr key={index} className={index % 2 === 0 ? "bg-background" : "bg-muted"}>
                                    <td className="px-4 py-3 text-sm border-r-[3px] border-foreground">{format(new Date(rec.from), 'MMM dd, yyyy')}</td>
                                    <td className="px-4 py-3 text-sm border-r-[3px] border-foreground">{format(new Date(rec.to), 'MMM dd, yyyy')}</td>
                                    <td className={cn(
                                        "px-4 py-3 font-medium capitalize flex items-center gap-2",
                                        rec.status.toLowerCase().includes("present") && "text-green-600",
                                        rec.status.toLowerCase().includes("kitchen") && "text-blue-600",
                                        rec.status.toLowerCase() === "absent" && "text-red-600",
                                        rec.status.toLowerCase().includes("leave") && "text-yellow-700"
                                    )}>
                                        {rec.status.toLowerCase().includes("present") && <CheckCircle className="h-4 w-4" />}
                                        {rec.status.toLowerCase() === "absent" && <XCircle className="h-4 w-4" />}
                                        {rec.status.toLowerCase().includes("leave") && <Calendar className="h-4 w-4" />}
                                        {rec.status}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {records.length === 0 && (
                    <p className="text-center py-8 text-muted-foreground">No attendance records found for this student.</p>
                )}
            </Card>
        </div>
    );
};

export default StudentReportPage;