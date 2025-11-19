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
    totalStudentsCount: 0,
  });

  const [isPresentListOpen, setIsPresentListOpen] = useState(false);
  const [presentStudents, setPresentStudents] = useState<{ full_name: string, email: string }[]>([]);
  const [listLoading, setListLoading] = useState(false);

  const [isTotalListOpen, setIsTotalListOpen] = useState(false);
  const [totalStudents, setTotalStudents] = useState<{ full_name: string, email: string }[]>([]);
  const [totalListLoading, setTotalListLoading] = useState(false);

  const [isAbsentListOpen, setIsAbsentListOpen] = useState(false);
  const [absentStudents, setAbsentStudents] = useState<{ full_name: string, email: string }[]>([]);
  const [absentListLoading, setAbsentListLoading] = useState(false);


  const [isKitchenListOpen, setIsKitchenListOpen] = useState(false);
  const [kitchenDutyStudents, setKitchenDutyStudents] = useState<{ full_name: string, email: string }[]>([]);
  const [kitchenListLoading, setKitchenListLoading] = useState(false);


  const fetchDashboardData = useCallback(async () => {
    const today = new Date().toISOString().split('T')[0];

    const { count: totalStudentsCount, error: countError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('Error fetching total student count:', countError);
    }
    const finalTotalCount = totalStudentsCount || 0;


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

    const totalAccounted = present + kitchen + emergencyLeave + jobInterviewsLeave + documentationLeave + collegeLeave + examLeave + specialOccasionsLeave + healthGeneralLeave + healthPeriodLeave;
    const absent = Math.max(0, finalTotalCount - totalAccounted);

    setStats({
      present,
      absent, 
      kitchen,
      emergencyLeave,
      jobInterviewsLeave,
      documentationLeave,
      collegeLeave,
      examLeave,
      specialOccasionsLeave,
      healthGeneralLeave,
      healthPeriodLeave,
      totalStudentsCount: finalTotalCount, 
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

  
  const fetchTotalStudents = async () => {
    if (stats.totalStudentsCount === 0) {
      setTotalStudents([]);
      setIsTotalListOpen(true);
      return;
    }

    setTotalListLoading(true);

    
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('full_name, email')
      .order('full_name');

    if (profilesError) {
      console.error('Error fetching all profiles:', profilesError);
      setTotalListLoading(false);
      return;
    }

    setTotalStudents(profiles || []);
    setTotalListLoading(false);
    setIsTotalListOpen(true); 
  };

 
  const fetchAbsentStudents = async () => {
    if (stats.absent === 0) {
      setAbsentStudents([]);
      setIsAbsentListOpen(true);
      return;
    }

    setAbsentListLoading(true);
    const today = new Date().toISOString().split('T')[0];

    const { data: allProfiles, error: allProfilesError } = await supabase
      .from('profiles')
      .select('id, full_name, email');

    if (allProfilesError) {
      console.error('Error fetching all profiles:', allProfilesError);
      setAbsentListLoading(false);
      return;
    }

    const { data: presentOrKitchenRecords } = await supabase
      .from('attendance_records')
      .select('student_id')
      .eq('attendance_date', today)
      .or('status.eq.present,status.eq.kitchen_duty');

    const { data: approvedLeaveRecords } = await supabase
      .from('leave_requests')
      .select('student_id')
      .eq('status', 'approved')
      .lte('start_date', today)
      .gte('end_date', today);

    
    const accountedForIdsSet = new Set();
    presentOrKitchenRecords?.forEach(r => accountedForIdsSet.add(r.student_id));
    approvedLeaveRecords?.forEach(r => accountedForIdsSet.add(r.student_id));

    const absentProfiles = allProfiles.filter(profile =>
      !accountedForIdsSet.has(profile.id)
    );

    setAbsentStudents(absentProfiles);
    setAbsentListLoading(false);
    setIsAbsentListOpen(true); 
  };


  
  const fetchKitchenDutyStudents = async () => {
    if (stats.kitchen === 0) {
      setKitchenDutyStudents([]);
      setIsKitchenListOpen(true);
      return;
    }

    setKitchenListLoading(true);
    const today = new Date().toISOString().split('T')[0];

    
    const { data: kitchenRecords, error: recordsError } = await supabase
      .from('attendance_records')
      .select('student_id')
      .eq('attendance_date', today)
      .eq('status', 'kitchen_duty');

    if (recordsError) {
      console.error('Error fetching kitchen duty records:', recordsError);
      setKitchenListLoading(false);
      return;
    }

    const kitchenIds = kitchenRecords?.map(r => r.student_id) || [];

   
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('full_name, email')
      .in('id', kitchenIds)
      .order('full_name');

    if (profilesError) {
      console.error('Error fetching profiles for kitchen duty:', profilesError);
    }

    setKitchenDutyStudents(profiles || []);
    setKitchenListLoading(false);
    setIsKitchenListOpen(true); 
  };
 


  return (
    <div className="min-h-screen bg-background flex">
      <AdminSidebar />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage attendance, leaves, and student records.</p>
        </div>

        <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">

          
          <Card
            className="p-4 border-[3px] border-foreground shadow-brutal bg-card cursor-pointer transition-transform duration-100 active:translate-y-0.5 active:shadow-none"
            onClick={fetchTotalStudents}
          >
            <div className="text-2xl font-bold mb-1">{stats.totalStudentsCount}</div>
            <div className="text-sm text-muted-foreground">Total Students</div>
          </Card>

         
          <Card
            className="p-4 border-[3px] border-foreground shadow-brutal bg-primary text-primary-foreground cursor-pointer transition-transform duration-100 active:translate-y-0.5 active:shadow-none"
            onClick={fetchPresentStudents}
          >
            <div className="text-2xl font-bold mb-1">{stats.present}</div>
            <div className="text-sm">Present Today</div>
          </Card>

          
          <Card
            className="p-4 border-[3px] border-foreground shadow-brutal bg-card cursor-pointer transition-transform duration-100 active:translate-y-0.5 active:shadow-none"
            onClick={fetchAbsentStudents}
          >
            <div className="text-2xl font-bold mb-1">{stats.absent}</div>
            <div className="text-sm text-muted-foreground">Absent</div>
          </Card>

         
          <Card
            className="p-4 border-[3px] border-foreground shadow-brutal bg-card cursor-pointer transition-transform duration-100 active:translate-y-0.5 active:shadow-none"
            onClick={fetchKitchenDutyStudents}
          >
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

        <Dialog open={isAbsentListOpen} onOpenChange={setIsAbsentListOpen}>
          <DialogContent className="sm:max-w-[425px] border-[3px] border-foreground shadow-brutal">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">Students Absent Today ({stats.absent})</DialogTitle>
            </DialogHeader>
            {absentListLoading ? (
              <p className="py-4 text-center text-muted-foreground">Loading names...</p>
            ) : absentStudents.length > 0 ? (
              <ScrollArea className="h-72 w-full rounded-md border-[3px] border-foreground p-4 shadow-brutal-sm">
                <ul className="space-y-4">
                  {absentStudents.map((student, index) => (
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
              <p className="py-4 text-center text-muted-foreground">No students are currently marked as absent.</p>
            )}
          </DialogContent>
        </Dialog>


       
        <Dialog open={isTotalListOpen} onOpenChange={setIsTotalListOpen}>
          <DialogContent className="sm:max-w-[425px] border-[3px] border-foreground shadow-brutal">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">Total Registered Students ({stats.totalStudentsCount})</DialogTitle>
            </DialogHeader>
            {totalListLoading ? (
              <p className="py-4 text-center text-muted-foreground">Loading student list...</p>
            ) : totalStudents.length > 0 ? (
              <ScrollArea className="h-72 w-full rounded-md border-[3px] border-foreground p-4 shadow-brutal-sm">
                <ul className="space-y-4">
                  {totalStudents.map((student, index) => (
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
              <p className="py-4 text-center text-muted-foreground">No students have registered yet.</p>
            )}
          </DialogContent>
        </Dialog>

       
        <Dialog open={isKitchenListOpen} onOpenChange={setIsKitchenListOpen}>
          <DialogContent className="sm:max-w-[425px] border-[3px] border-foreground shadow-brutal">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">Students on Kitchen Duty Today ({stats.kitchen})</DialogTitle>
            </DialogHeader>
            {kitchenListLoading ? (
              <p className="py-4 text-center text-muted-foreground">Loading names...</p>
            ) : kitchenDutyStudents.length > 0 ? (
              <ScrollArea className="h-72 w-full rounded-md border-[3px] border-foreground p-4 shadow-brutal-sm">
                <ul className="space-y-4">
                  {kitchenDutyStudents.map((student, index) => (
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
              <p className="py-4 text-center text-muted-foreground">No students assigned to kitchen duty today.</p>
            )}
          </DialogContent>
        </Dialog>
        
      </div>
    </div>
  );
}