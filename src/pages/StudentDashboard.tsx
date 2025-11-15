import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { QrCode, Calendar as CalendarIcon, ClipboardList, ChefHat, AlertCircle, Camera, FileEdit } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Html5QrcodeScanner } from "html5-qrcode";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { z } from "zod";

const leaveRequestSchema = z.object({
  leaveType: z.enum(['emergency', 'job_interview', 'documentation','college','exam','special_occasions ', 'health_general', 'health_period'], {"required_error": "Please select a leave type" }),
  reason: z.string().trim().min(10, "Reason must be at least 10 characters").max(500, "Reason must be less than 500 characters"),
  startDate: z.date({ required_error: "Start date is required" }),
  endDate: z.date({ required_error: "End date is required" })
}).refine(data => data.endDate >= data.startDate, {
  message: "End date must be on or after start date",
  path: ["endDate"]
});

const correctionRequestSchema = z.object({
  attendanceDate: z.date({ required_error: "Attendance date is required" }),
  reason: z.string().trim().min(20, "Reason must be at least 20 characters").max(500, "Reason must be less than 500 characters")
});

interface CorrectionRequest {
  id: string;
  attendance_date: string;
  reason: string;
  status: string;
  created_at: string;
  admin_notes: string | null;
}

interface LeaveRequest {
  id: string;
  leave_type: string;
  reason: string;
  start_date: string;
  end_date: string;
  status: string;
  created_at: string;
}


export default function StudentDashboard() {
  const { user } = useAuth();
  const [leaveType, setLeaveType] = useState("");
  const [leaveReason, setLeaveReason] = useState("");
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [todayMarked, setTodayMarked] = useState(false);
  const [stats, setStats] = useState({ present: 0, absent: 0, leaves: 0, kitchenDuty: 0, percentage: 0 });
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [correctionDate, setCorrectionDate] = useState<Date>();
  const [correctionReason, setCorrectionReason] = useState("");
  const [correctionRequests, setCorrectionRequests] = useState<CorrectionRequest[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);

  useEffect(() => {
    if (user) {
      fetchAttendanceData();
      checkTodayAttendance();
      fetchCorrectionRequests();
       fetchLeaveRequests();
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

    // Validate form
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

    const { error } = await supabase
      .from('leave_requests')
      .insert({
        student_id: user.id,
        leave_type: leaveType,
        reason: leaveReason.trim(),
        start_date: format(startDate!, 'yyyy-MM-dd'),
        end_date: format(endDate!, 'yyyy-MM-dd')
      });

    if (error) {
      toast.error("Failed to submit leave request");
    } else {
      toast.success("Leave request submitted for approval");
      setLeaveType("");
      setLeaveReason("");
      setStartDate(undefined);
      setEndDate(undefined);
    }

    setLoading(false);
  };

  const handleCorrectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setFormErrors({});

    const validation = correctionRequestSchema.safeParse({
      attendanceDate: correctionDate,
      reason: correctionReason
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
                <CalendarIcon className="h-6 w-6 text-primary-foreground" />
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
                  <option value="special_occasions">special occasions </option>
                  <option value="health_general">health general</option>
                  <option value="health_period">Health period Leave</option>
                </select>
                {formErrors.leaveType && (
                  <p className="text-sm text-red-600">{formErrors.leaveType}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
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
                        className="pointer-events-auto"
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
                        className="pointer-events-auto"
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
                  placeholder="Please provide a detailed reason for your leave (min 10 characters)..."
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
          <div className="flex justify-between items-center">
            <span>
              {leave.leave_type.charAt(0).toUpperCase() + leave.leave_type.slice(1).replace(/_/g, " ")}: {new Date(leave.start_date).toLocaleDateString()} - {new Date(leave.end_date).toLocaleDateString()}
            </span>
            <span className={cn(
              "text-xs font-bold px-2 py-1 border-[2px] border-foreground",
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
          
      
          {/* Attendance Correction Form */}
          <Card className="p-6 border-[3px] border-foreground shadow-brutal bg-card">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-primary p-2 border-[3px] border-foreground">
                <FileEdit className="h-6 w-6 text-primary-foreground" />
              </div>
              <h2 className="text-2xl font-bold">Attendance Correction</h2>
            </div>

            <form onSubmit={handleCorrectionSubmit} className="space-y-4">
              <div className="p-4 border-[3px] border-foreground bg-muted mb-4">
                <p className="text-sm">
                  <strong>Missed marking attendance?</strong> Submit a correction request with a valid reason. 
                  Admin will review and approve if appropriate.
                </p>
              </div>

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
                      {correctionDate ? format(correctionDate, "PPP") : "Pick the missed date"}
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
                        return date >= today;
                      }}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
                {formErrors.attendanceDate && (
                  <p className="text-sm text-red-600">{formErrors.attendanceDate}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="correctionReason" className="font-bold">Reason for Missing Attendance</Label>
                <Textarea
                  id="correctionReason"
                  placeholder="Explain why you missed marking attendance (min 20 characters)..."
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

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Submitting..." : "Submit Correction Request"}
              </Button>
            </form>

            
            <div className="mt-6 p-4 border-[3px] border-foreground bg-background">
              <div className="flex items-center gap-3 mb-3">
                <AlertCircle className="h-5 w-5 text-primary" />
                <span className="font-bold">Correction Requests</span>
              </div>
              
              {correctionRequests.length === 0 ? (
                <p className="text-sm text-muted-foreground">No correction requests yet</p>
              ) : (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {correctionRequests.map((req) => (
                    <div key={req.id} className="text-sm p-2 border-[2px] border-foreground bg-muted">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{new Date(req.attendance_date).toLocaleDateString()}</span>
                        <span className={cn(
                          "text-xs font-bold px-2 py-1 border-[2px] border-foreground",
                          req.status === 'pending' && "bg-yellow-200 text-yellow-900",
                          req.status === 'approved' && "bg-green-200 text-green-900",
                          req.status === 'rejected' && "bg-red-200 text-red-900"
                        )}>
                          {req.status.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
