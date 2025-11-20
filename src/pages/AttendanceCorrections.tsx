import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { CheckCircle, XCircle, Calendar, FileEdit } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import AdminSidebar from "./AdminDashboardSidebar"; 

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

export default function AttendanceCorrections() {
  const { user } = useAuth();
  const [pendingCorrections, setPendingCorrections] = useState<CorrectionRequest[]>([]);

 
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

  useEffect(() => {
    if (user) {
      fetchPendingCorrections();
    }
  }, [user]);


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
      .upsert({ 
        student_id: studentId,
        attendance_date: attendanceDate,
        status: 'present'
      }, { onConflict: 'student_id, attendance_date' });

    if (insertError) {
      console.error('Error creating attendance record:', insertError);
      toast.error("Correction approved but failed to mark attendance");
    } else {
      toast.success(`Attendance corrected for ${studentName}`);
    }

    fetchPendingCorrections(); 
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

  return (
    <div className="min-h-screen bg-background flex">
     
      <AdminSidebar />

      <div className="flex-1 p-8 pt-[100px]">
        <div className="mb-8 text-center flex flex-col items-center">
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
            <span><FileEdit className="h-8 w-8 text-primary" /></span>
            Attendance Corrections
          </h1>
          <p className="text-muted-foreground">Manage pending attendance correction requests.</p>
        </div>

        <Card className="p-6 border-[3px] border-foreground shadow-brutal bg-card max-w-4xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-primary p-2 border-[3px] border-foreground">
              <FileEdit className="h-6 w-6 text-primary-foreground" />
            </div>
            <h2 className="text-2xl font-bold">Pending Requests</h2>
          </div>

          <div className="space-y-4 max-h-[600px] overflow-y-auto">
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
    </div>
  );
}