import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { QrCode, Calendar, ClipboardList, ChefHat, AlertCircle } from "lucide-react";

export default function StudentDashboard() {
  const [leaveType, setLeaveType] = useState("");
  const [leaveReason, setLeaveReason] = useState("");

  const [todayMarked, setTodayMarked] = useState(false);

  const handleQRScan = () => {
    setTodayMarked(true);
    toast.success("Attendance marked for today!");
  };

  const handleKitchenDuty = () => {
    setTodayMarked(true);
    toast.success("Kitchen duty marked! Attendance credited for today.");
  };

  const handleLeaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (leaveType && leaveReason) {
      toast.success("Leave request submitted for approval");
      setLeaveType("");
      setLeaveReason("");
    }
  };

  const handleCorrectionRequest = () => {
    toast.info("Correction request feature coming soon!");
  };

  const attendanceStats = {
    present: 18,
    absent: 2,
    leaves: 3,
    percentage: 90,
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Student Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Mark your attendance and manage leaves.</p>
        </div>

        {/* Attendance Overview */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card className="p-6 border-[3px] border-foreground shadow-brutal bg-card">
            <div className="text-3xl font-bold mb-1">{attendanceStats.present}</div>
            <div className="text-sm text-muted-foreground">Days Present</div>
          </Card>
          <Card className="p-6 border-[3px] border-foreground shadow-brutal bg-card">
            <div className="text-3xl font-bold mb-1">{attendanceStats.absent}</div>
            <div className="text-sm text-muted-foreground">Days Absent</div>
          </Card>
          <Card className="p-6 border-[3px] border-foreground shadow-brutal bg-card">
            <div className="text-3xl font-bold mb-1">{attendanceStats.leaves}</div>
            <div className="text-sm text-muted-foreground">Leaves Taken</div>
          </Card>
          <Card className="p-6 border-[3px] border-foreground shadow-brutal bg-primary text-primary-foreground">
            <div className="text-3xl font-bold mb-1">{attendanceStats.percentage}%</div>
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
                    <div className="w-48 h-48 mx-auto border-[3px] border-foreground bg-muted flex items-center justify-center">
                      <QrCode className="h-32 w-32 text-muted-foreground" />
                    </div>
                    <Button 
                      size="lg" 
                      onClick={handleQRScan}
                      className="w-full"
                    >
                      Scan QR Code
                    </Button>
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
              <Button onClick={handleKitchenDuty} variant="outline" className="w-full">
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
                  <option value="casual">Casual Leave</option>
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

              <Button type="submit" className="w-full">
                Submit Leave Request
              </Button>
            </form>

            <div className="mt-6 p-4 border-[3px] border-foreground bg-background">
              <div className="flex items-center gap-3 mb-3">
                <AlertCircle className="h-5 w-5 text-primary" />
                <span className="font-bold">Missed a Scan?</span>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Submit a correction request if you forgot to scan QR code.
              </p>
              <Button onClick={handleCorrectionRequest} variant="outline" size="sm" className="w-full">
                Request Correction
              </Button>
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