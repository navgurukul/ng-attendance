import React, { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import AdminSidebar from "./AdminDashboardSidebar";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"; 
import { ScrollArea } from "@/components/ui/scroll-area"; 

export default function AdminDashboard() {
  const { user } = useAuth();
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

  const [isPresentListOpen, setIsPresentListOpen] = useState(false);
  
  const [presentStudents, setPresentStudents] = useState<{ full_name: string, email: string }[]>([]);
  const [listLoading, setListLoading] = useState(false);
 

  const fetchDashboardData = useCallback(async () => {
    const today = new Date().toISOString().split('T')[0];

    
    const { data: attendanceData } = await supabase
      .from('attendance_records')
      .select('status')
      .eq('attendance_date', today);

    const present = attendanceData?.filter(r => r.status === 'present').length || 0;
    const kitchen = attendanceData?.filter(r => r.status === 'kitchen_duty').length || 0;
    
    
    const { data: leaveData, error: leaveError } = await supabase
      .from('leave_requests')
      .select('leave_type')
      .eq('status', 'approved')
      .lte('start_date', today) 
      .gte('end_date', today); 
      
    if (leaveError) {
        console.error('Error fetching approved leaves for today:', leaveError);
    }
    const emergencyLeave = leaveData?.filter(l => l.leave_type === 'emergency').length || 0;
    const jobInterviewsLeave = leaveData?.filter(l => l.leave_type === 'job_interview').length || 0;
    const documentationLeave = leaveData?.filter(l => l.leave_type === 'documentation').length || 0;
    const collegeLeave = leaveData?.filter(l => l.leave_type === 'college').length || 0;
    const examLeave = leaveData?.filter(l => l.leave_type === 'exam').length || 0;
    const specialOccasionsLeave = leaveData?.filter(l => l.leave_type.trim() === 'special_occasions').length || 0;
    const healthGeneralLeave = leaveData?.filter(l => l.leave_type === 'health_general').length || 0;
    const healthPeriodLeave = leaveData?.filter(l => l.leave_type === 'health_period').length || 0;

    setStats({
      present,
      absent: 0,
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
  }, []);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user, fetchDashboardData]);


  const fetchPresentStudents = async () => {
    if (stats.present === 0) {
        setPresentStudents([]);
        setIsPresentListOpen(true);
        return;
    }
    
    setListLoading(true);
    const today = new Date().toISOString().split('T')[0];

    
    const { data: presentRecords, error: recordsError } = await supabase
        .from('attendance_records')
        .select('student_id')
        .eq('attendance_date', today)
        .eq('status', 'present');

    if (recordsError) {
        console.error('Error fetching present records:', recordsError);
        setListLoading(false);
        return;
    }

    const presentIds = presentRecords?.map(r => r.student_id) || [];
    
    
    const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('full_name, email') 
        .in('id', presentIds)
        .order('full_name');

    if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
    }

    setPresentStudents(profiles || []);
    setListLoading(false);
    setIsPresentListOpen(true); 
  };
  

  return (
    <div className="min-h-screen bg-background flex">
      <AdminSidebar/>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage attendance, leaves, and student records.</p>
        </div>
        
        <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          
          <Card 
            className="p-4 border-[3px] border-foreground shadow-brutal bg-primary text-primary-foreground cursor-pointer transition-transform duration-100 active:translate-y-0.5 active:shadow-none"
            onClick={fetchPresentStudents}
          >
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

       
        <Dialog open={isPresentListOpen} onOpenChange={setIsPresentListOpen}>
            <DialogContent className="sm:max-w-[425px] border-[3px] border-foreground shadow-brutal">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold">Students Present Today ({stats.present})</DialogTitle>
                </DialogHeader>
                {listLoading ? (
                    <p className="py-4 text-center text-muted-foreground">Loading names...</p>
                ) : presentStudents.length > 0 ? (
                    <ScrollArea className="h-72 w-full rounded-md border-[3px] border-foreground p-4 shadow-brutal-sm">
                        <ul className="space-y-4">
                            {presentStudents.map((student, index) => (
                                <li 
                                    key={index} 
                                    
                                    className="pb-2 mb-2 border-b border-muted-foreground/30 last:border-b-0 text-foreground" 
                                >
                                    
                                    <div className="font-semibold">{student.full_name}</div>
                                    
                                    <div className="text-sm text-muted-foreground">{student.email}</div> 
                                </li>
                            ))}
                        </ul>
                    </ScrollArea>
                ) : (
                    <p className="py-4 text-center text-muted-foreground">No students marked as present today.</p>
                )}
            </DialogContent>
        </Dialog>

      </div>
    </div>
  );
}