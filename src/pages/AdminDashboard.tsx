import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Users, CheckCircle, XCircle, Calendar, QrCode, Download, UserPlus } from "lucide-react";

export default function AdminDashboard() {
  const [searchQuery, setSearchQuery] = useState("");

  const handleGenerateQR = (slot: string) => {
    toast.success(`QR Code generated for ${slot}`);
  };

  const handleApproveLeave = (studentName: string) => {
    toast.success(`Leave approved for ${studentName}`);
  };

  const handleRejectLeave = (studentName: string) => {
    toast.error(`Leave rejected for ${studentName}`);
  };

  const handleExportReport = () => {
    toast.info("Report export feature coming soon!");
  };

  // Mock data
  const overviewStats = {
    present: 145,
    absent: 12,
    kitchen: 8,
    sickLeave: 5,
    casualLeave: 3,
    emergencyLeave: 1,
  };

  const pendingLeaves = [
    { id: 1, name: "Priya Sharma", type: "Sick Leave", date: "2025-11-12", reason: "Fever and cold" },
    { id: 2, name: "Rahul Kumar", type: "Casual Leave", date: "2025-11-13", reason: "Family function" },
    { id: 3, name: "Anjali Patel", type: "Emergency", date: "2025-11-12", reason: "Medical emergency" },
  ];

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
            <div className="text-2xl font-bold mb-1">{overviewStats.present}</div>
            <div className="text-sm">Present Today</div>
          </Card>
          <Card className="p-4 border-[3px] border-foreground shadow-brutal bg-card">
            <div className="text-2xl font-bold mb-1">{overviewStats.absent}</div>
            <div className="text-sm text-muted-foreground">Absent</div>
          </Card>
          <Card className="p-4 border-[3px] border-foreground shadow-brutal bg-card">
            <div className="text-2xl font-bold mb-1">{overviewStats.kitchen}</div>
            <div className="text-sm text-muted-foreground">Kitchen Duty</div>
          </Card>
          <Card className="p-4 border-[3px] border-foreground shadow-brutal bg-card">
            <div className="text-2xl font-bold mb-1">{overviewStats.sickLeave}</div>
            <div className="text-sm text-muted-foreground">Sick Leave</div>
          </Card>
          <Card className="p-4 border-[3px] border-foreground shadow-brutal bg-card">
            <div className="text-2xl font-bold mb-1">{overviewStats.casualLeave}</div>
            <div className="text-sm text-muted-foreground">Casual Leave</div>
          </Card>
          <Card className="p-4 border-[3px] border-foreground shadow-brutal bg-card">
            <div className="text-2xl font-bold mb-1">{overviewStats.emergencyLeave}</div>
            <div className="text-sm text-muted-foreground">Emergency</div>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* QR Code Generator */}
          <Card className="p-6 border-[3px] border-foreground shadow-brutal bg-card">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-primary p-2 border-[3px] border-foreground">
                <QrCode className="h-6 w-6 text-primary-foreground" />
              </div>
              <h2 className="text-2xl font-bold">Generate QR Codes</h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border-[3px] border-foreground bg-background">
                <div>
                  <div className="font-bold">Slot 1: 9:00 AM</div>
                  <div className="text-sm text-muted-foreground">Morning Session</div>
                </div>
                <Button size="sm" onClick={() => handleGenerateQR("9:00 AM")}>
                  Generate
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 border-[3px] border-foreground bg-background">
                <div>
                  <div className="font-bold">Slot 2: 2:00 PM</div>
                  <div className="text-sm text-muted-foreground">Afternoon Session</div>
                </div>
                <Button size="sm" onClick={() => handleGenerateQR("2:00 PM")}>
                  Generate
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 border-[3px] border-foreground bg-background">
                <div>
                  <div className="font-bold">Slot 3: 5:30 PM</div>
                  <div className="text-sm text-muted-foreground">Evening Session</div>
                </div>
                <Button size="sm" onClick={() => handleGenerateQR("5:30 PM")}>
                  Generate
                </Button>
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

            <div className="space-y-4">
              {pendingLeaves.map((leave) => (
                <div key={leave.id} className="p-4 border-[3px] border-foreground bg-background">
                  <div className="font-bold mb-1">{leave.name}</div>
                  <div className="text-sm text-muted-foreground mb-2">
                    {leave.type} • {leave.date}
                  </div>
                  <div className="text-sm mb-3">{leave.reason}</div>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      onClick={() => handleApproveLeave(leave.name)}
                      className="flex-1"
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Approve
                    </Button>
                    <Button 
                      size="sm" 
                      variant="destructive"
                      onClick={() => handleRejectLeave(leave.name)}
                      className="flex-1"
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
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
                <div className="text-3xl font-bold mt-2">12</div>
              </div>
              <div className="p-4 border-[3px] border-foreground bg-background">
                <div className="font-bold">Dropouts</div>
                <div className="text-3xl font-bold mt-2">2</div>
              </div>
              <div className="p-4 border-[3px] border-foreground bg-background">
                <div className="font-bold">Placements</div>
                <div className="text-3xl font-bold mt-2">8</div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}