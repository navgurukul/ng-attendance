import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { CheckCircle, XCircle, Calendar, CalendarCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import AdminSidebar from "./AdminDashboardSidebar";

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



export default function PendingLeaveRequests() {
  const { user } = useAuth();
  const [pendingLeaves, setPendingLeaves] = useState<LeaveRequest[]>([]);


  const fetchStudentRecords = () => {
    toast.info("Dashboard Student Records need a manual refresh.");
    return Promise.resolve();
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

  useEffect(() => {
    if (user) {
      fetchPendingLeaves();
    }
  }, [user]);


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


  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">

      <AdminSidebar />

      <div className="flex-1 md:p-8 flex flex-col pt-10">
        <h1 className="text-4xl font-bold mb-4 flex gap-3">
          <CalendarCheck className="h-8 w-8 text-primary" />
          Pending Leave Requests
        </h1>
        <p className="text-muted-foreground mb-6 ml-10">Review and process all student leave applications.</p>

        <div className="w-full max-w-4xl grid lg:grid-cols-1 gap-6 mr-50">

          <Card className="p-6 border-[2px] border-foreground shadow-brutal bg-card">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-primary p-2 border-[3px] border-foreground">
                <Calendar className="h-6 w-6 text-primary-foreground" />
              </div>
              <h2 className="text-2xl font-bold">Pending Requests</h2>
            </div>

            <div className="space-y-4 max-h-[600px] overflow-y-auto">
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
        </div>
      </div>
    </div>
  );
}