import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Users, CheckCircle, XCircle, Calendar, QrCode as QrCodeIcon, Download, UserPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { QRCodeSVG } from "qrcode.react";
import { z } from "zod";

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

interface StudentRecord {
  id: string;
  full_name: string;
  email: string;
  roll_number: string | null;
  department: string | null;
  total_days: number;
  present_days: number;
  attendance_rate: number;
}

const searchQuerySchema = z.string().max(100, "Search query too long");

export default function AdminDashboard() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [qrCode, setQrCode] = useState<string>("");
  const [qrExpiry, setQrExpiry] = useState<string>("");
  const [pendingLeaves, setPendingLeaves] = useState<LeaveRequest[]>([]);
  const [studentRecords, setStudentRecords] = useState<StudentRecord[]>([]);
  const [stats, setStats] = useState({
    present: 0,
    absent: 0,
    kitchen: 0,
    sickLeave: 0,
    personalLeave: 0,
    emergencyLeave: 0,
  });
  const [loading, setLoading] = useState(false);
  const [studentsLoading, setStudentsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
      fetchPendingLeaves();
      fetchStudentRecords();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    const today = new Date().toISOString().split('T')[0];

    // Fetch today's attendance
    const { data: attendanceData } = await supabase
      .from('attendance_records')
      .select('*')
      .eq('attendance_date', today);

    const present = attendanceData?.filter(r => r.status === 'present').length || 0;
    const kitchen = attendanceData?.filter(r => r.status === 'kitchen_duty').length || 0;

    // Fetch leave stats
    const { data: leaveData } = await supabase
      .from('leave_requests')
      .select('*')
      .eq('status', 'approved');

    const sickLeave = leaveData?.filter(l => l.leave_type === 'sick').length || 0;
    const personalLeave = leaveData?.filter(l => l.leave_type === 'personal').length || 0;
    const emergencyLeave = leaveData?.filter(l => l.leave_type === 'emergency').length || 0;

    setStats({
      present,
      absent: 0, // Calculate based on total students
      kitchen,
      sickLeave,
      personalLeave,
      emergencyLeave,
    });

    // Check if QR code exists for today
    const { data: qrData } = await supabase
      .from('qr_codes')
      .select('*')
      .eq('attendance_date', today)
      .eq('is_active', true)
      .maybeSingle();

    if (qrData) {
      setQrCode(qrData.code);
      setQrExpiry(qrData.expires_at);
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

  const fetchStudentRecords = async () => {
    setStudentsLoading(true);
    
    // Fetch all student profiles
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

    // Fetch all attendance records
    const { data: attendance, error: attendanceError } = await supabase
      .from('attendance_records')
      .select('student_id, status');

    if (attendanceError) {
      console.error('Error fetching attendance:', attendanceError);
    }

    // Calculate attendance stats for each student
    const records: StudentRecord[] = (profiles || []).map(profile => {
      const studentAttendance = attendance?.filter(a => a.student_id === profile.id) || [];
      const presentDays = studentAttendance.filter(a => a.status === 'present').length;
      const totalDays = studentAttendance.length;
      const attendanceRate = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;

      return {
        id: profile.id,
        full_name: profile.full_name,
        email: profile.email,
        roll_number: profile.roll_number,
        department: profile.department,
        total_days: totalDays,
        present_days: presentDays,
        attendance_rate: Math.round(attendanceRate),
      };
    });

    setStudentRecords(records);
    setStudentsLoading(false);
  };

  const handleGenerateQR = async () => {
    if (!user) return;

    setLoading(true);

    // Deactivate old QR codes
    await supabase
      .from('qr_codes')
      .update({ is_active: false })
      .eq('is_active', true);

    // Generate new QR code
    const code = `ATT-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // Valid for 24 hours

    const { error } = await supabase
      .from('qr_codes')
      .insert({
        code,
        generated_by: user.id,
        expires_at: expiresAt.toISOString(),
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
    if (!searchQuery.trim()) return studentRecords;
    
    const query = searchQuery.toLowerCase().trim();
    return studentRecords.filter(student => 
      student.full_name.toLowerCase().includes(query) ||
      student.email.toLowerCase().includes(query) ||
      student.roll_number?.toLowerCase().includes(query) ||
      student.department?.toLowerCase().includes(query)
    );
  }, [searchQuery, studentRecords]);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage attendance, leaves, and student records.</p>
        </div>

        {/* Overview Cards */}
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
            <div className="text-2xl font-bold mb-1">{stats.sickLeave}</div>
            <div className="text-sm text-muted-foreground">Sick Leave</div>
          </Card>
          <Card className="p-4 border-[3px] border-foreground shadow-brutal bg-card">
            <div className="text-2xl font-bold mb-1">{stats.personalLeave}</div>
            <div className="text-sm text-muted-foreground">Personal Leave</div>
          </Card>
          <Card className="p-4 border-[3px] border-foreground shadow-brutal bg-card">
            <div className="text-2xl font-bold mb-1">{stats.emergencyLeave}</div>
            <div className="text-sm text-muted-foreground">Emergency</div>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* QR Code Generator */}
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

          {/* Leave Approvals */}
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
                        {leave.leave_type.charAt(0).toUpperCase() + leave.leave_type.slice(1)} • Requested {new Date(leave.requested_at).toLocaleDateString()}
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
        </div>

        {/* Student Records */}
        <Card className="mt-6 p-6 border-[3px] border-foreground shadow-brutal bg-card">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-primary p-2 border-[3px] border-foreground">
              <Users className="h-6 w-6 text-primary-foreground" />
            </div>
            <h2 className="text-2xl font-bold">Student Records</h2>
          </div>

          <div className="mb-4">
            <Input
              placeholder="Search students by name, email, roll number, or department..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="border-[3px] border-foreground h-12 shadow-brutal-sm"
            />
          </div>

          {studentsLoading ? (
            <div className="flex items-center justify-center py-12 border-[3px] border-foreground bg-muted">
              <p className="text-muted-foreground">Loading student records...</p>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="flex items-center justify-center py-12 border-[3px] border-foreground bg-muted">
              <p className="text-muted-foreground">
                {searchQuery ? 'No students found matching your search' : 'No student records available'}
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
                    <th className="px-4 py-3 text-center font-bold border-b-[3px] border-r-[3px] border-foreground">Present Days</th>
                    <th className="px-4 py-3 text-center font-bold border-b-[3px] border-foreground">Attendance %</th>
                  </tr>
                </thead>
                <tbody className="bg-background">
                  {filteredStudents.map((student, index) => (
                    <tr key={student.id} className={index % 2 === 0 ? 'bg-background' : 'bg-muted'}>
                      <td className="px-4 py-3 font-medium border-r-[3px] border-foreground">{student.full_name}</td>
                      <td className="px-4 py-3 border-r-[3px] border-foreground">{student.roll_number || '-'}</td>
                      <td className="px-4 py-3 border-r-[3px] border-foreground">{student.department || '-'}</td>
                      <td className="px-4 py-3 border-r-[3px] border-foreground text-sm">{student.email}</td>
                      <td className="px-4 py-3 text-center font-bold border-r-[3px] border-foreground">
                        {student.present_days}/{student.total_days}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`font-bold ${
                          student.attendance_rate >= 75 ? 'text-green-600' :
                          student.attendance_rate >= 50 ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {student.attendance_rate}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Reports & Lifecycle */}
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
