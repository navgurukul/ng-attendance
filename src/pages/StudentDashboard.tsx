import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { QrCode, Calendar, ClipboardList, ChefHat, AlertCircle, Camera } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Html5QrcodeScanner } from "html5-qrcode";

export default function StudentDashboard() {
  const { user } = useAuth();
  const [leaveType, setLeaveType] = useState("");
  const [leaveReason, setLeaveReason] = useState("");
  const [todayMarked, setTodayMarked] = useState(false);
  const [stats, setStats] = useState({ present: 0, absent: 0, leaves: 0, kitchenDuty: 0, percentage: 0 });
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    if (user) {
      fetchAttendanceData();
      checkTodayAttendance();
    }
  }, [user]);

  const fetchAttendanceData = async () => {
    if (!user) return;

    // Fetch user profile to get account creation date
    const { data: profileData } = await supabase
      .from('profiles')
      .select('created_at')
      .eq('id', user.id)
      .maybeSingle();

    const { data, error } = await supabase
      .from('attendance_records')
      .select('*')
      .eq('student_id', user.id);

    if (error) {
      console.error('Error fetching attendance:', error);
      return;
    }

    const present = data?.filter(r => r.status === 'present').length || 0;
    const kitchenDuty = data?.filter(r => r.status === 'kitchen_duty').length || 0;
    
    const { data: leaveData } = await supabase
      .from('leave_requests')
      .select('*')
      .eq('student_id', user.id)
      .eq('status', 'approved');
    
    const leaves = leaveData?.length || 0;
    
    // Calculate elapsed days from account creation date to today
    const now = new Date();
    const accountCreatedAt = profileData?.created_at ? new Date(profileData.created_at) : now;
    const elapsedDays = Math.max(1, Math.floor((now.getTime() - accountCreatedAt.getTime()) / (1000 * 60 * 60 * 24)) + 1);
    
    // Calculate absent days: elapsed days with no attendance, no kitchen duty, and no approved leave
    const daysWithRecord = present + kitchenDuty + leaves;
    const absent = Math.max(0, elapsedDays - daysWithRecord);
    
    // Attendance percentage based only on days present out of elapsed days
    const percentage = elapsedDays > 0 ? Math.round((present / elapsedDays) * 100) : 0;

    setStats({ present, absent, leaves, kitchenDuty, percentage });
  };

  const checkTodayAttendance = async () => {
    if (!user) return;

    const today = new Date().toISOString().split('T')[0];
    const { data } = await supabase
      .from('attendance_records')
      .select('*')
      .eq('student_id', user.id)
      .eq('attendance_date', today)
      .maybeSingle();

    setTodayMarked(!!data);
  };

  const startQRScanner = () => {
    setScanning(true);
    
    // Wait for the div to render before initializing scanner
    setTimeout(() => {
      // Calculate responsive qrbox size based on screen width
      const screenWidth = window.innerWidth;
      const qrboxSize = screenWidth < 640 ? Math.min(screenWidth - 80, 250) : 250;
      
      const html5QrcodeScanner = new Html5QrcodeScanner(
        "qr-reader",
        { fps: 10, qrbox: { width: qrboxSize, height: qrboxSize } },
        false
      );

      html5QrcodeScanner.render(onScanSuccess, onScanFailure);

      async function onScanSuccess(decodedText: string) {
        html5QrcodeScanner.clear();
        setScanning(false);
        await handleQRScan(decodedText);
      }

      function onScanFailure(error: any) {
        console.warn(`QR scan error: ${error}`);
      }
    }, 100);
  };

  const handleQRScan = async (qrCode: string) => {
    if (!user) return;

    setLoading(true);
    
    // Verify QR code is valid and active
    const { data: qrData, error: qrError } = await supabase
      .from('qr_codes')
      .select('*')
      .eq('code', qrCode)
      .eq('is_active', true)
      .maybeSingle();

    if (qrError || !qrData) {
      toast.error("Invalid or expired QR code");
      setLoading(false);
      return;
    }

    // Check if QR code has expired
    if (new Date(qrData.expires_at) < new Date()) {
      toast.error("QR code has expired");
      setLoading(false);
      return;
    }

    // Mark attendance
    const { error } = await supabase
      .from('attendance_records')
      .insert({
        student_id: user.id,
        qr_code_id: qrData.id,
        status: 'present'
      });

    if (error) {
      if (error.code === '23505') {
        toast.error("Attendance already marked for today");
      } else {
        toast.error("Failed to mark attendance");
      }
    } else {
      toast.success("Attendance marked successfully!");
      setTodayMarked(true);
      fetchAttendanceData();
    }

    setLoading(false);
  };

  const handleKitchenDuty = async () => {
    if (!user) return;

    setLoading(true);

    const { error } = await supabase
      .from('attendance_records')
      .insert({
        student_id: user.id,
        status: 'kitchen_duty'
      });

    if (error) {
      if (error.code === '23505') {
        toast.error("Attendance already marked for today");
      } else {
        toast.error("Failed to mark kitchen duty");
      }
    } else {
      toast.success("Kitchen duty marked! Attendance credited.");
      setTodayMarked(true);
      fetchAttendanceData();
    }

    setLoading(false);
  };

  const handleLeaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !leaveType || !leaveReason) return;

    setLoading(true);

    const { error } = await supabase
      .from('leave_requests')
      .insert({
        student_id: user.id,
        leave_type: leaveType,
        reason: leaveReason
      });

    if (error) {
      toast.error("Failed to submit leave request");
    } else {
      toast.success("Leave request submitted for approval");
      setLeaveType("");
      setLeaveReason("");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Student Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Mark your attendance and manage leaves.</p>
        </div>

        {/* Attendance Overview */}
        <div className="grid md:grid-cols-5 gap-4 mb-8">
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

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Daily Attendance QR Scanning */}
          <Card className="p-6 border-[3px] border-foreground shadow-brutal bg-card">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-primary p-2 border-[3px] border-foreground">
                <QrCode className="h-6 w-6 text-primary-foreground" />
              </div>
              <h2 className="text-2xl font-bold">Daily Attendance</h2>
            </div>

            <div className="space-y-6">
              <div className="p-6 border-[3px] border-foreground bg-background text-center">
                <div className="mb-4">
                  <div className="text-lg font-bold mb-2">Today's Attendance</div>
                  <div className="text-sm text-muted-foreground">
                    {todayMarked ? "✓ Marked" : "Not marked yet"}
                  </div>
                </div>
                
                {!todayMarked ? (
                  <div className="space-y-4">
                    {!scanning ? (
                      <>
                        <div className="w-48 h-48 mx-auto border-[3px] border-foreground bg-muted flex items-center justify-center">
                          <Camera className="h-32 w-32 text-muted-foreground" />
                        </div>
                        <Button 
                          size="lg" 
                          onClick={startQRScanner}
                          className="w-full"
                          disabled={loading}
                        >
                          <QrCode className="mr-2 h-5 w-5" />
                          Scan QR Code
                        </Button>
                      </>
                    ) : (
                      <div id="qr-reader" className="w-full"></div>
                    )}
                  </div>
                ) : (
                  <div className="py-8">
                    <div className="w-24 h-24 mx-auto bg-primary border-[3px] border-foreground flex items-center justify-center mb-4">
                      <svg className="h-16 w-16 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div className="text-xl font-bold text-primary">Attendance Marked!</div>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 p-4 border-[3px] border-foreground bg-muted">
              <div className="flex items-center gap-3 mb-3">
                <ChefHat className="h-5 w-5" />
                <span className="font-bold">Kitchen Duty Today?</span>
              </div>
              <Button 
                onClick={handleKitchenDuty} 
                variant="outline" 
                className="w-full"
                disabled={loading || todayMarked}
              >
                Mark Kitchen Duty
              </Button>
            </div>
          </Card>

          {/* Leave Request Form */}
          <Card className="p-6 border-[3px] border-foreground shadow-brutal bg-card">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-primary p-2 border-[3px] border-foreground">
                <Calendar className="h-6 w-6 text-primary-foreground" />
              </div>
              <h2 className="text-2xl font-bold">Request Leave</h2>
            </div>

            <form onSubmit={handleLeaveSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="leaveType" className="font-bold">Leave Type</Label>
                <select
                  id="leaveType"
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value)}
                  required
                  className="w-full h-12 px-4 border-[3px] border-foreground shadow-brutal-sm bg-background focus:shadow-brutal"
                >
                  <option value="">Select leave type</option>
                  <option value="sick">Sick Leave</option>
                  <option value="personal">Personal Leave</option>
                  <option value="emergency">Emergency Leave</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason" className="font-bold">Reason</Label>
                <Textarea
                  id="reason"
                  placeholder="Please provide a detailed reason for your leave..."
                  value={leaveReason}
                  onChange={(e) => setLeaveReason(e.target.value)}
                  required
                  className="border-[3px] border-foreground min-h-[120px] shadow-brutal-sm focus:shadow-brutal resize-none"
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Submitting..." : "Submit Leave Request"}
              </Button>
            </form>

            <div className="mt-6 p-4 border-[3px] border-foreground bg-background">
              <div className="flex items-center gap-3 mb-3">
                <AlertCircle className="h-5 w-5 text-primary" />
                <span className="font-bold">Missed a Scan?</span>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Contact admin to request attendance correction.
              </p>
            </div>
          </Card>
        </div>

        {/* Reports Section */}
        <Card className="mt-6 p-6 border-[3px] border-foreground shadow-brutal bg-card">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-primary p-2 border-[3px] border-foreground">
              <ClipboardList className="h-6 w-6 text-primary-foreground" />
            </div>
            <h2 className="text-2xl font-bold">Attendance Reports</h2>
          </div>
          <div className="flex items-center justify-center py-12 border-[3px] border-foreground bg-muted">
            <p className="text-muted-foreground">Charts and detailed reports coming soon!</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
