import React, { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Users, CheckCircle, XCircle, Calendar, QrCode as QrCodeIcon, Download, UserPlus, FileEdit, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { QRCodeSVG } from "qrcode.react";
import { z } from "zod";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom"; 



interface LeaveRequest {
  id: string;
  student_id: string;
  leave_type: string;
  reason: string;
  requested_at: string;
  start_date: string;
  end_date: string;
  profiles: {
    full_name: string;
  };
}

interface CorrectionRequest {
  id: string;
  student_id: string;
  attendance_date: string;
  reason: string;
  status: string;
  created_at: string;
  profiles: {
    full_name: string;
  };
}

interface StudentRecord {
  id: string;
  full_name: string;
  email: string;
  roll_number: string | null;
  department: string | null;
  total_days: number;
  present_days: number;
  attendance_rate: number;
  latest_status: string;
  latest_status_date: string | null;
}

interface DetailedRecord {
  from: string;
  to: string;
  status: string;
}


const searchQuerySchema = z.string().max(100, "Search query too long");

export default function AdminDashboard() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [qrCode, setQrCode] = useState<string>("");
  const [qrExpiry, setQrExpiry] = useState<string>("");
  const [pendingLeaves, setPendingLeaves] = useState<LeaveRequest[]>([]);
  const [pendingCorrections, setPendingCorrections] = useState<CorrectionRequest[]>([]);
  const [studentRecords, setStudentRecords] = useState<StudentRecord[]>([]);
  const [stats, setStats] = useState({
    present: 0,
    absent: 0,
    kitchen: 0,
    emergencyLeave: 0,
    jobInterviewsLeave: 0,
    documentationLeave: 0,
    collegeLeave: 0,
    examLeave: 0,
    specialOccasionsLeave: 0,
    healthGeneralLeave: 0,
    healthPeriodLeave: 0,
  });
  const [loading, setLoading] = useState(false);
  const [studentsLoading, setStudentsLoading] = useState(false);

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const [totalCumulativePresent, setTotalCumulativePresent] = useState(0);

  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      fetchDashboardData();
      fetchPendingLeaves();
      fetchPendingCorrections();
      fetchStudentRecords();
    }
  }, [user]);

  // const fetchDashboardData = async () => {
  //   const today = new Date().toISOString().split('T')[0];


  //   const { data: attendanceData } = await supabase
  //     .from('attendance_records')
  //     .select('*')
  //     .eq('attendance_date', today);

  //   const present = attendanceData?.filter(r => r.status === 'present').length || 0;
  //   const kitchen = attendanceData?.filter(r => r.status === 'kitchen_duty').length || 0;

  //   const { data: leaveData } = await supabase
  //     .from('leave_requests')
  //     .select('*')
  //     .eq('status', 'approved');

  //   const emergencyLeave = leaveData?.filter(l => l.leave_type === 'emergency').length || 0;
  //   const jobInterviewsLeave = leaveData?.filter(l => l.leave_type === 'job_interview').length || 0;
  //   const documentationLeave = leaveData?.filter(l => l.leave_type === 'documentation').length || 0;
  //   const collegeLeave = leaveData?.filter(l => l.leave_type === 'college').length || 0;
  //   const examLeave = leaveData?.filter(l => l.leave_type === 'exam').length || 0;
  //   const specialOccasionsLeave = leaveData?.filter(l => l.leave_type === 'special_occasions ').length || 0;
  //   const healthGeneralLeave = leaveData?.filter(l => l.leave_type === 'health_general').length || 0;
  //   const healthPeriodLeave = leaveData?.filter(l => l.leave_type === 'health_period').length || 0;

  //   setStats({
  //     present,
  //     absent: 0, 
  //     kitchen,
  //     emergencyLeave,
  //     jobInterviewsLeave,
  //     documentationLeave,
  //     collegeLeave,
  //     examLeave,
  //     specialOccasionsLeave,
  //     healthGeneralLeave,
  //     healthPeriodLeave,
  //   });

  //   const { data: qrData } = await supabase
  //     .from('qr_codes')
  //     .select('*')
  //     .eq('attendance_date', today)
  //     .eq('is_active', true)
  //     .maybeSingle();

  //   if (qrData) {
  //     setQrCode(qrData.code);
  //     setQrExpiry(qrData.expires_at);
  //   }
  // };


const fetchDashboardData = async () => {
  const today = new Date().toISOString().split('T')[0]; // 'YYYY-MM-DD' format

  // 1. Fetch Today's Attendance Data
  const { data: attendanceData } = await supabase
    .from('attendance_records')
    .select('*')
    .eq('attendance_date', today);

  const present = attendanceData?.filter(r => r.status === 'present').length || 0;
  const kitchen = attendanceData?.filter(r => r.status === 'kitchen_duty').length || 0;
  
  // Note: 'absent' count calculation is missing in original code, it's set to 0. 
  // Calculating it accurately requires total expected attendance - present - leaves.
  // For now, it remains 0 as per your original logic.

  // 2. Fetch Approved Leave Data for the Current Date (Today)
  const { data: leaveData, error: leaveError } = await supabase
    .from('leave_requests')
    .select('leave_type')
    .eq('status', 'approved')
    // Filter for leaves where today's date is between start_date and end_date (inclusive)
    .lte('start_date', today) // start_date <= today
    .gte('end_date', today); // end_date >= today
    
    if (leaveError) {
        console.error('Error fetching approved leaves for today:', leaveError);
        // Fallback or handle error gracefully
    }

  // Count the specific leave types for today's approved leaves
  const emergencyLeave = leaveData?.filter(l => l.leave_type === 'emergency').length || 0;
  const jobInterviewsLeave = leaveData?.filter(l => l.leave_type === 'job_interview').length || 0;
  const documentationLeave = leaveData?.filter(l => l.leave_type === 'documentation').length || 0;
  const collegeLeave = leaveData?.filter(l => l.leave_type === 'college').length || 0;
  const examLeave = leaveData?.filter(l => l.leave_type === 'exam').length || 0;
  // NOTE: Corrected potential typo in 'special_occasions ' -> 'special_occasions'
  const specialOccasionsLeave = leaveData?.filter(l => l.leave_type.trim() === 'special_occasions').length || 0;
  const healthGeneralLeave = leaveData?.filter(l => l.leave_type === 'health_general').length || 0;
  const healthPeriodLeave = leaveData?.filter(l => l.leave_type === 'health_period').length || 0;

  setStats({
    present,
    absent: 0, // Keep as 0, or implement full absent calculation logic (requires total users)
    kitchen,
    emergencyLeave,
    jobInterviewsLeave,
    documentationLeave,
    collegeLeave,
    examLeave,
    specialOccasionsLeave,
    healthGeneralLeave,
    healthPeriodLeave,
  });

  // 3. Fetch QR Code data (No change needed here)
  const { data: qrData } = await supabase
    .from('qr_codes')
    .select('*')
    .eq('attendance_date', today)
    .eq('is_active', true)
    .maybeSingle();

  if (qrData) {
    setQrCode(qrData.code);
    setQrExpiry(qrData.expires_at);
  } else {
    setQrCode("");
    setQrExpiry("");
  }
};


  const fetchPendingLeaves = async () => {
    const { data, error } = await supabase
      .from('leave_requests')
      .select(`
        *,
        profiles!leave_requests_student_id_fkey (
          full_name
        )
      `)
      .eq('status', 'pending')
      .order('requested_at', { ascending: false });

    if (error) {
      console.error('Error fetching leave requests:', error);
      toast.error(`Failed to fetch leave requests: ${error.message}`);
      return;
    }

    if (data) {
      setPendingLeaves(data as any);
    }
  };

  const fetchPendingCorrections = async () => {
    const { data, error } = await supabase
      .from('attendance_correction_requests' as any)
      .select(`
        *,
        profiles!attendance_correction_requests_student_id_fkey (
          full_name
        )
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching correction requests:', error);
      return;
    }

    if (data) {
      setPendingCorrections(data as any);
    }
  };

  const fetchStudentRecords = async () => {
    setStudentsLoading(true);

    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .order('full_name');

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      toast.error('Failed to fetch student records');
      setStudentsLoading(false);
      return;
    }

    const { data: attendanceData, error: attendanceError } = await supabase
      .from('attendance_records')
      .select('student_id, status, attendance_date');

    const { data: approvedLeaveData, error: leaveError } = await supabase
      .from('leave_requests')
      .select('student_id, start_date, end_date, leave_type')
      .eq('status', 'approved');

    if (attendanceError || leaveError) {
      console.error('Error fetching attendance or leaves:', attendanceError || leaveError);
    }

    const allRecords: Record<string, any[]> = {};

    profiles?.forEach(profile => {
      allRecords[profile.id] = [];
      const accountCreatedAt = profile.created_at ? new Date(profile.created_at) : new Date();


      attendanceData?.filter(a => a.student_id === profile.id)
        .forEach(a => allRecords[profile.id].push({
          date: a.attendance_date,
          status: a.status === 'present' ? 'present' : a.status === 'kitchen_duty' ? 'kitchen' : 'unknown'
        }));


      approvedLeaveData?.filter(l => l.student_id === profile.id)
        .forEach(l => {
          let currentDate = new Date(l.start_date);
          const endDate = new Date(l.end_date);

          while (currentDate <= endDate) {
            const dateStr = currentDate.toISOString().split('T')[0];

            if (!allRecords[profile.id].some(r => r.date === dateStr)) {
              allRecords[profile.id].push({
                date: dateStr,
                status: 'leave'
              });
            }
            currentDate.setDate(currentDate.getDate() + 1);
          }
        });

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      let currentDate = new Date(accountCreatedAt);
      currentDate.setHours(0, 0, 0, 0);

      while (currentDate < today) {
        const dateStr = currentDate.toISOString().split('T')[0];

        if (!allRecords[profile.id].some(r => r.date === dateStr)) {
          allRecords[profile.id].push({
            date: dateStr,
            status: 'absent'
          });
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }
    });


    const records: StudentRecord[] = (profiles || []).map(profile => {
      const studentHistory = allRecords[profile.id]?.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()) || [];

      const totalDays = studentHistory.length;
      const presentDays = studentHistory.filter(r => r.status === 'present').length;
      const attendanceRate = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;

      const latestRecord = studentHistory.length ? studentHistory[studentHistory.length - 1] : null;

      return {
        id: profile.id,
        full_name: profile.full_name,
        email: profile.email,
        roll_number: profile.roll_number,
        department: profile.department,
        total_days: totalDays,
        present_days: presentDays,
        attendance_rate: Math.round(attendanceRate),
        latest_status: latestRecord ? latestRecord.status : "no record",
        latest_status_date: latestRecord ? latestRecord.date : null,
      };
    });


    const totalPresentAcrossAllStudents = records.reduce((sum, student) => sum + student.present_days, 0);
    setTotalCumulativePresent(totalPresentAcrossAllStudents);

    setStudentRecords(records);
    setStudentsLoading(false);
  };



  const handleGenerateQR = async () => {
    if (!user) return;

    setLoading(true);

    await supabase
      .from('qr_codes')
      .update({ is_active: false })
      .eq('is_active', true);

    const code = `ATT-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); 
    const today = new Date().toISOString().split('T')[0];


    const { error } = await supabase
      .from('qr_codes')
      .insert({
        code,
        generated_by: user.id,
        expires_at: expiresAt.toISOString(),
        attendance_date: today,
      });

    if (error) {
      toast.error("Failed to generate QR code");
    } else {
      setQrCode(code);
      setQrExpiry(expiresAt.toISOString());
      toast.success("Daily QR Code generated successfully!");
    }

    setLoading(false);
  };

  const handleApproveLeave = async (leaveId: string, studentName: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('leave_requests')
      .update({
        status: 'approved',
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', leaveId);

    if (error) {
      toast.error("Failed to approve leave");
    } else {
      toast.success(`Leave approved for ${studentName}`);
      fetchPendingLeaves();
      fetchStudentRecords();
    }
  };

  const handleRejectLeave = async (leaveId: string, studentName: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('leave_requests')
      .update({
        status: 'rejected',
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', leaveId);

    if (error) {
      toast.error("Failed to reject leave");
    } else {
      toast.error(`Leave rejected for ${studentName}`);
      fetchPendingLeaves();
    }
  };

  const handleApproveCorrection = async (correctionId: string, studentId: string, attendanceDate: string, studentName: string) => {
    if (!user) return;

    const { error: updateError } = await supabase
      .from('attendance_correction_requests' as any)
      .update({
        status: 'approved',
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', correctionId);

    if (updateError) {
      toast.error("Failed to approve correction");
      return;
    }

    const { error: insertError } = await supabase
      .from('attendance_records')
      .insert({
        student_id: studentId,
        attendance_date: attendanceDate,
        status: 'present'
      }, { onConflict: 'student_id, attendance_date' });

    if (insertError) {
      if (insertError.code === '23505') {
        toast.success(`Correction approved for ${studentName}, attendance was already marked.`);
      } else {
        console.error('Error creating attendance record:', insertError);
        toast.error("Correction approved but failed to mark attendance");
      }
    } else {
      toast.success(`Attendance corrected for ${studentName}`);
    }

    fetchPendingCorrections();
    fetchStudentRecords();
  };

  const handleRejectCorrection = async (correctionId: string, studentName: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('attendance_correction_requests' as any)
      .update({
        status: 'rejected',
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', correctionId);

    if (error) {
      toast.error("Failed to reject correction");
    } else {
      toast.error(`Correction rejected for ${studentName}`);
      fetchPendingCorrections();
    }
  };


  const handleViewReport = (studentId: string, studentName: string) => {
    toast.info(`Navigating to detailed report for ${studentName}...`);
    
    navigate(`/admin/student-report/${studentId}`); 
  };
  


  const handleExportReport = () => {
    toast.info("Report export feature coming soon!");
  };

  const handleSearchChange = (value: string) => {
    const result = searchQuerySchema.safeParse(value);
    if (result.success) {
      setSearchQuery(value);
    }
  };

  const filteredStudents = useMemo(() => {
    return studentRecords.filter((student) => {
      const matchesName =
        student.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.roll_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.department?.toLowerCase().includes(searchQuery.toLowerCase());

      const studentDate = student.latest_status_date
        ? new Date(student.latest_status_date)
        : null;

      const from = fromDate ? new Date(fromDate) : null;
      const to = toDate ? new Date(toDate) : null;

      const matchesDate =
        (!from || (studentDate && studentDate >= from)) &&
        (!to || (studentDate && studentDate <= to));

      const matchesStatus =
        filterStatus === "all" || student.latest_status === filterStatus;

      return matchesName && matchesDate && matchesStatus;
    });
  }, [searchQuery, fromDate, toDate, filterStatus, studentRecords]);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage attendance, leaves, and student records.</p>
        </div>

        <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <Card className="p-4 border-[3px] border-foreground shadow-brutal bg-primary text-primary-foreground">
            <div className="text-2xl font-bold mb-1">{stats.present}</div>
            <div className="text-sm">Present Today</div>
          </Card>
          <Card className="p-4 border-[3px] border-foreground shadow-brutal bg-card">
            <div className="text-2xl font-bold mb-1">{stats.absent}</div>
            <div className="text-sm text-muted-foreground">Absent</div>
          </Card>
          <Card className="p-4 border-[3px] border-foreground shadow-brutal bg-card">
            <div className="text-2xl font-bold mb-1">{stats.kitchen}</div>
            <div className="text-sm text-muted-foreground">Kitchen Duty</div>
          </Card>

          <Card className="p-4 border-[3px] border-foreground shadow-brutal bg-card">
            <div className="text-2xl font-bold mb-1">{stats.emergencyLeave}</div>
            <div className="text-sm text-muted-foreground">Emergency Leave</div>
          </Card>
          <Card className="p-4 border-[3px] border-foreground shadow-brutal bg-card">
            <div className="text-2xl font-bold mb-1">{stats.jobInterviewsLeave}</div>
            <div className="text-sm text-muted-foreground">Job Interviews Leave</div>
          </Card>
          <Card className="p-4 border-[3px] border-foreground shadow-brutal bg-card">
            <div className="text-2xl font-bold mb-1">{stats.documentationLeave}</div>
            <div className="text-sm text-muted-foreground">Documentation</div>
          </Card>
          <Card className="p-4 border-[3px] border-foreground shadow-brutal bg-card">
            <div className="text-2xl font-bold mb-1">{stats.collegeLeave}</div>
            <div className="text-sm text-muted-foreground">College</div>
          </Card>
          <Card className="p-4 border-[3px] border-foreground shadow-brutal bg-card">
            <div className="text-2xl font-bold mb-1">{stats.examLeave}</div>
            <div className="text-sm text-muted-foreground">Exam</div>
          </Card>
          <Card className="p-4 border-[3px] border-foreground shadow-brutal bg-card">
            <div className="text-2xl font-bold mb-1">{stats.specialOccasionsLeave}</div>
            <div className="text-sm text-muted-foreground">Special Occasions</div>
          </Card>
          <Card className="p-4 border-[3px] border-foreground shadow-brutal bg-card">
            <div className="text-2xl font-bold mb-1">{stats.healthGeneralLeave}</div>
            <div className="text-sm text-muted-foreground">Health General</div>
          </Card>
          <Card className="p-4 border-[3px] border-foreground shadow-brutal bg-card">
            <div className="text-2xl font-bold mb-1">{stats.healthPeriodLeave}</div>
            <div className="text-sm text-muted-foreground">Health Period Leave</div>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="p-6 border-[3px] border-foreground shadow-brutal bg-card">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-primary p-2 border-[3px] border-foreground">
                <QrCodeIcon className="h-6 w-6 text-primary-foreground" />
              </div>
              <h2 className="text-2xl font-bold">Daily QR Code</h2>
            </div>

            <div className="space-y-6">
              <div className="p-6 border-[3px] border-foreground bg-background">
                <div className="text-center mb-4">
                  <div className="font-bold text-lg mb-2">Today's QR Code</div>
                  <div className="text-sm text-muted-foreground">
                    {qrCode ? "Active QR code for attendance" : "Generate a new QR code for today"}
                  </div>
                </div>

                <div className="w-64 h-64 mx-auto border-[3px] border-foreground bg-white flex items-center justify-center mb-4 p-4">
                  {qrCode ? (
                    <QRCodeSVG value={qrCode} size={224} level="H" />
                  ) : (
                    <QrCodeIcon className="h-48 w-48 text-muted-foreground" />
                  )}
                </div>

                {qrCode && qrExpiry && (
                  <div className="text-xs text-center text-muted-foreground mb-4">
                    Expires: {new Date(qrExpiry).toLocaleString()}
                  </div>
                )}

                <Button
                  size="lg"
                  onClick={handleGenerateQR}
                  className="w-full"
                  disabled={loading}
                >
                  {qrCode ? "Generate New QR Code" : "Generate QR Code"}
                </Button>
              </div>

              <div className="p-4 border-[3px] border-foreground bg-muted">
                <div className="text-sm font-bold mb-2">Note:</div>
                <div className="text-sm text-muted-foreground">
                  Generate one QR code per day. Students scan it once to mark their daily attendance.
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6 border-[3px] border-foreground shadow-brutal bg-card">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-primary p-2 border-[3px] border-foreground">
                <Calendar className="h-6 w-6 text-primary-foreground" />
              </div>
              <h2 className="text-2xl font-bold">Pending Leave Requests</h2>
            </div>

            <div className="space-y-4 max-h-[500px] overflow-y-auto">
              {pendingLeaves.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No pending leave requests
                </div>
              ) : (
                pendingLeaves.map((leave) => {
                  const startDate = new Date(leave.start_date);
                  const endDate = new Date(leave.end_date);
                  const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

                  return (
                    <div key={leave.id} className="p-4 border-[3px] border-foreground bg-background">
                      <div className="font-bold mb-1">{leave.profiles?.full_name || 'Unknown'}</div>
                      <div className="text-sm text-muted-foreground mb-2">
                        {leave.leave_type.charAt(0).toUpperCase() + leave.leave_type.slice(1).replace(/_/g, " ")} • Requested {new Date(leave.requested_at).toLocaleDateString()}
                      </div>
                      <div className="text-sm font-medium mb-2 flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {startDate.toLocaleDateString()} - {endDate.toLocaleDateString()}
                        <span className="text-muted-foreground">({daysDiff} {daysDiff === 1 ? 'day' : 'days'})</span>
                      </div>
                      <div className="text-sm mb-3 p-2 bg-muted border-[2px] border-foreground">{leave.reason}</div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleApproveLeave(leave.id, leave.profiles?.full_name || 'Student')}
                          className="flex-1"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleRejectLeave(leave.id, leave.profiles?.full_name || 'Student')}
                          className="flex-1"
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </Card>

          <Card className="p-6 border-[3px] border-foreground shadow-brutal bg-card">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-primary p-2 border-[3px] border-foreground">
                <FileEdit className="h-6 w-6 text-primary-foreground" />
              </div>
              <h2 className="text-2xl font-bold">Attendance Corrections</h2>
            </div>

            <div className="space-y-4 max-h-[500px] overflow-y-auto">
              {pendingCorrections.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No pending correction requests
                </div>
              ) : (
                pendingCorrections.map((correction) => (
                  <div key={correction.id} className="p-4 border-[3px] border-foreground bg-background">
                    <div className="font-bold mb-1">{correction.profiles?.full_name || 'Unknown'}</div>
                    <div className="text-sm text-muted-foreground mb-2">
                      Requested {new Date(correction.created_at).toLocaleDateString()} at {new Date(correction.created_at).toLocaleTimeString()}
                    </div>
                    <div className="text-sm font-medium mb-2 flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Missed Date: {new Date(correction.attendance_date).toLocaleDateString()}
                    </div>
                    <div className="text-sm mb-3 p-2 bg-muted border-[2px] border-foreground">{correction.reason}</div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleApproveCorrection(
                          correction.id,
                          correction.student_id,
                          correction.attendance_date,
                          correction.profiles?.full_name || 'Student'
                        )}
                        className="flex-1"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Approve & Mark Present
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleRejectCorrection(correction.id, correction.profiles?.full_name || 'Student')}
                        className="flex-1"
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        <Card className="mt-6 p-6 border-[3px] border-foreground shadow-brutal bg-card">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-primary p-2 border-[3px] border-foreground">
              <Users className="h-6 w-6 text-primary-foreground" />
            </div>
            <h2 className="text-2xl font-bold">Student Records</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">

            <Input
              type="text"
              placeholder="Search by Name, Email, Roll No..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)} // Updated to use the handler
              className="border-[3px] border-foreground h-12 shadow-brutal-sm"
            />

            <Input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="border-[3px] border-foreground h-12 shadow-brutal-sm"
            />

            <Input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="border-[3px] border-foreground h-12 shadow-brutal-sm"
            />

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border-[3px] border-foreground h-12 shadow-brutal-sm px-3"
            >
              <option value="all">All</option>
              <option value="present">Present</option>
              <option value="leave">On Leave</option>
              <option value="kitchen">Kitchen Duty</option>
              <option value="absent">Absent</option>
            </select>

          </div>

          {studentsLoading ? (
            <div className="flex items-center justify-center py-12 border-[3px] border-foreground bg-muted">
              <p className="text-muted-foreground">Loading student records...</p>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="flex items-center justify-center py-12 border-[3px] border-foreground bg-muted">
              <p className="text-muted-foreground">
                {searchQuery || fromDate || toDate || filterStatus !== 'all' ? 'No students found matching your filters' : 'No student records available'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto border-[3px] border-foreground">
              <table className="w-full">
                <thead className="bg-primary text-primary-foreground">
                  <tr>
                    <th className="px-4 py-3 text-left font-bold border-b-[3px] border-r-[3px] border-foreground">Name</th>
                    <th className="px-4 py-3 text-left font-bold border-b-[3px] border-r-[3px] border-foreground">Roll Number</th>
                    <th className="px-4 py-3 text-left font-bold border-b-[3px] border-r-[3px] border-foreground">Department</th>
                    <th className="px-4 py-3 text-left font-bold border-b-[3px] border-r-[3px] border-foreground">Email</th>
                    <th className="px-4 py-3 text-center font-bold border-b-[3px] border-r-[3px] border-foreground">
                      Attendance %
                    </th>
                    <th className="px-4 py-3 text-center font-bold border-b-[3px] border-foreground">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody className="bg-background">
                  {filteredStudents.map((student, index) => (
                    <React.Fragment key={student.id}>
                      <tr
                        className={index % 2 === 0 ? "bg-background" : "bg-muted"}
                      >

                        <td className="px-4 py-3 font-medium border-r-[3px] border-foreground">
                          {student.full_name}
                        </td>


                        <td className="px-4 py-3 border-r-[3px] border-foreground">
                          {student.roll_number || "-"}
                        </td>


                        <td className="px-4 py-3 border-r-[3px] border-foreground">
                          {student.department || "-"}
                        </td>


                        <td className="px-4 py-3 border-r-[3px] border-foreground text-sm">
                          {student.email}
                        </td>


                        <td className="px-4 py-3 text-center border-r-[3px] border-foreground">
                          <span
                            className={`font-bold ${student.attendance_rate >= 75 ? 'text-green-600' :                              student.attendance_rate >= 50 ? 'text-yellow-600' :
                                'text-red-600'
                              }`}                          >
                            {student.attendance_rate}%
                          </span>
                        </td>


                        <td className="px-4 py-3 text-center">
                          <Button
                            size="sm"
                            variant="outline"
                            
                            onClick={() => handleViewReport(student.id, student.full_name)}
                            className="w-full"
                          >
                            View Report
                          </Button>
                        </td>


                      </tr>
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>


        <div className="grid lg:grid-cols-2 gap-6 mt-6">
          <Card className="p-6 border-[3px] border-foreground shadow-brutal bg-card">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-primary p-2 border-[3px] border-foreground">
                <Download className="h-6 w-6 text-primary-foreground" />
              </div>
              <h2 className="text-2xl font-bold">Reports & Downloads</h2>
            </div>
            <div className="space-y-3">
              <Button onClick={handleExportReport} variant="outline" className="w-full justify-start">
                Export Monthly Report (Excel)
              </Button>
              <Button onClick={handleExportReport} variant="outline" className="w-full justify-start">
                Export Attendance Summary (PDF)
              </Button>
              <Button onClick={handleExportReport} variant="outline" className="w-full justify-start">
                Export Leave Records (Excel)
              </Button>
            </div>
          </Card>

          <Card className="p-6 border-[3px] border-foreground shadow-brutal bg-card">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-primary p-2 border-[3px] border-foreground">
                <UserPlus className="h-6 w-6 text-primary-foreground" />
              </div>
              <h2 className="text-2xl font-bold">Lifecycle Tracker</h2>
            </div>
            <div className="space-y-3">
              <div className="p-4 border-[3px] border-foreground bg-background">
                <div className="font-bold">New Admissions</div>
                <div className="text-3xl font-bold mt-2">-</div>
              </div>
              <div className="p-4 border-[3px] border-foreground bg-background">
                <div className="font-bold">Dropouts</div>
                <div className="text-3xl font-bold mt-2">-</div>
              </div>
              <div className="p-4 border-[3px] border-foreground bg-background">
                <div className="font-bold">Placements</div>
                <div className="text-3xl font-bold mt-2">-</div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}