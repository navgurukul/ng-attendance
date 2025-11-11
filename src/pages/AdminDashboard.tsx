import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Users, CheckCircle, XCircle, Calendar, QrCode as QrCodeIcon, Download, UserPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { QRCodeSVG } from "qrcode.react";

interface LeaveRequest {
  id: string;
  student_id: string;
  leave_type: string;
  reason: string;
  requested_at: string;
  profiles: {
    full_name: string;
  };
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [qrCode, setQrCode] = useState<string>("");
  const [qrExpiry, setQrExpiry] = useState<string>("");
  const [pendingLeaves, setPendingLeaves] = useState<LeaveRequest[]>([]);
  const [stats, setStats] = useState({
    present: 0,
    absent: 0,
    kitchen: 0,
    sickLeave: 0,
    personalLeave: 0,
    emergencyLeave: 0,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
      fetchPendingLeaves();
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
    console.log('Fetching pending leaves...');
    
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

    console.log('Leave requests result:', { data, error });

    if (error) {
      console.error('Error fetching leave requests:', error);
      toast.error(`Failed to fetch leave requests: ${error.message}`);
      return;
    }

    if (data) {
      console.log(`Found ${data.length} pending leave requests`);
      setPendingLeaves(data as any);
    }
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
                pendingLeaves.map((leave) => (
                  <div key={leave.id} className="p-4 border-[3px] border-foreground bg-background">
                    <div className="font-bold mb-1">{leave.profiles?.full_name || 'Unknown'}</div>
                    <div className="text-sm text-muted-foreground mb-2">
                      {leave.leave_type.charAt(0).toUpperCase() + leave.leave_type.slice(1)} • {new Date(leave.requested_at).toLocaleDateString()}
                    </div>
                    <div className="text-sm mb-3">{leave.reason}</div>
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
                ))
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
              placeholder="Search students by name or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border-[3px] border-foreground h-12 shadow-brutal-sm"
            />
          </div>

          <div className="flex items-center justify-center py-12 border-[3px] border-foreground bg-muted">
            <p className="text-muted-foreground">Student search and records view coming soon!</p>
          </div>
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
