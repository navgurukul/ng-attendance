
import React, { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import AdminSidebar from "./AdminDashboardSidebar";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Trophy, TrendingDown } from "lucide-react";

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

  const [isLeaveMenuOpen, setIsLeaveMenuOpen] = useState(false);
  const [isSpecificLeaveListOpen, setIsSpecificLeaveListOpen] = useState(false);
  const [specificLeaveStudents, setSpecificLeaveStudents] = useState<{ full_name: string, email: string }[]>([]);
  const [specificLeaveType, setSpecificLeaveType] = useState("");
  const [specificListLoading, setSpecificListLoading] = useState(false);

  const [topStudent, setTopStudent] = useState<{ name: string, email: string, percentage: number } | null>(null);
  const [bottomStudent, setBottomStudent] = useState<{ name: string, email: string, percentage: number } | null>(null);


  const fetchDashboardData = useCallback(async () => {
    const today = new Date();

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
    const todayISO = today.toISOString().split('T')[0];

   
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name, email, created_at'); 

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
    }
    const finalTotalCount = profiles?.length || 0;


    const { data: attendanceDataToday } = await supabase
      .from('attendance_records')
      .select('status')
      .eq('attendance_date', todayISO);

    const present = attendanceDataToday?.filter(r => r.status === 'present').length || 0;
    const kitchen = attendanceDataToday?.filter(r => r.status === 'kitchen_duty').length || 0;


    const { data: leaveDataToday, error: leaveError } = await supabase
      .from('leave_requests')
      .select('leave_type')
      .eq('status', 'approved')
      .lte('start_date', todayISO)
      .gte('end_date', todayISO);

    if (leaveError) {
      console.error('Error fetching approved leaves for today:', leaveError);
    }
    const emergencyLeave = leaveDataToday?.filter(l => l.leave_type === 'emergency').length || 0;
    const jobInterviewsLeave = leaveDataToday?.filter(l => l.leave_type === 'job_interview').length || 0;
    const documentationLeave = leaveDataToday?.filter(l => l.leave_type === 'documentation').length || 0;
    const collegeLeave = leaveDataToday?.filter(l => l.leave_type === 'college').length || 0;
    const examLeave = leaveDataToday?.filter(l => l.leave_type === 'exam').length || 0;
    const specialOccasionsLeave = leaveDataToday?.filter(l => l.leave_type.trim() === 'special_occasions').length || 0;
    const healthGeneralLeave = leaveDataToday?.filter(l => l.leave_type === 'health_general').length || 0;
    const healthPeriodLeave = leaveDataToday?.filter(l => l.leave_type === 'health_period').length || 0;

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

    const { data: allAttendance, error: allAttendanceError } = await supabase
      .from('attendance_records')
      .select('student_id, status, attendance_date')
      .gte('attendance_date', startOfMonth)
      .lte('attendance_date', todayISO);

    if (profiles && allAttendance && profiles.length > 0) {
      let maxAttendance = -1;
      let minAttendance = 101;
      let topStudentData = null;
      let bottomStudentData = null;

      profiles.forEach(profile => {
        const studentAttendance = allAttendance.filter(a => a.student_id === profile.id);
        const presentDays = studentAttendance.filter(a => a.status === 'present').length;

        const accountCreatedAt = new Date(profile.created_at);
        const startCheckDate = accountCreatedAt > new Date(startOfMonth) ? accountCreatedAt : new Date(startOfMonth);

        let totalAccountableDays = 0;
        let checkDate = new Date(startCheckDate.getFullYear(), startCheckDate.getMonth(), startCheckDate.getDate());
        const endCheckDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());

        while (checkDate <= endCheckDate) {
          totalAccountableDays++;
          checkDate.setDate(checkDate.getDate() + 1);
        }

        if (totalAccountableDays > 0) {
          const percentage = (presentDays / totalAccountableDays) * 100;

          if (percentage >= maxAttendance) {
            maxAttendance = percentage;
            topStudentData = {
              name: profile.full_name,
              email: profile.email,
              percentage: Math.round(percentage)
            };
          }

          if (percentage <= minAttendance) {
            minAttendance = percentage;
            bottomStudentData = {
              name: profile.full_name,
              email: profile.email,
              percentage: Math.round(percentage)
            };
          }
        }
      });

      if (topStudentData && bottomStudentData && topStudentData.name === bottomStudentData.name && finalTotalCount > 1) {
       
        if (topStudentData.percentage === 100) {
          
          
          setBottomStudent(null);
        } else {
          
          
        }
      }

      setTopStudent(topStudentData);
      setBottomStudent(bottomStudentData);

    } else {
      setTopStudent(null);
      setBottomStudent(null);
    }
  }, [user]);


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
  

 
  const fetchSpecificLeaveStudents = async (leave_type: string, display_name: string) => {
   
    setIsLeaveMenuOpen(false);
    setSpecificLeaveType(display_name);
    setIsSpecificLeaveListOpen(true);
    setSpecificListLoading(true);

    const today = new Date().toISOString().split('T')[0];

    
    const { data: leaveRecords, error: recordsError } = await supabase
      .from('leave_requests')
      .select('student_id')
      .eq('status', 'approved')
      .eq('leave_type', leave_type)
      .lte('start_date', today)
      .gte('end_date', today);

    if (recordsError) {
      console.error(`Error fetching ${display_name} records:`, recordsError);
      setSpecificListLoading(false);
      return;
    }

    const studentIds = leaveRecords?.map(r => r.student_id) || [];

    
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('full_name, email')
      .in('id', studentIds)
      .order('full_name');

    if (profilesError) {
      console.error(`Error fetching profiles for ${display_name}:`, profilesError);
    }

    setSpecificLeaveStudents(profiles || []);
    setSpecificListLoading(false);
  };

  
  const fetchLeaveTypeMenu = () => {
    setIsLeaveMenuOpen(true);
  };

  
  const getLeaveCount = (leaveType: string): number => {
    switch (leaveType) {
      case 'emergency': return stats.emergencyLeave;
      case 'job_interview': return stats.jobInterviewsLeave;
      case 'documentation': return stats.documentationLeave;
      case 'college': return stats.collegeLeave;
      case 'exam': return stats.examLeave;
      case 'special_occasions': return stats.specialOccasionsLeave;
      case 'health_general': return stats.healthGeneralLeave;
      case 'health_period': return stats.healthPeriodLeave;
      default: return 0;
    }
  };

 
  const LEAVE_TYPES_MENU = [
    { db_name: 'emergency', display_name: 'Emergency Leave' },
    { db_name: 'job_interview', display_name: 'Job Interviews Leave' },
    { db_name: 'documentation', display_name: 'Documentation Leave' },
    { db_name: 'college', display_name: 'College Leave' },
    { db_name: 'exam', display_name: 'Exam Leave' },
    { db_name: 'special_occasions', display_name: 'Special Occasions Leave' },
    { db_name: 'health_general', display_name: 'Health General Leave' },
    { db_name: 'health_period', display_name: 'Health Period Leave' },
  ];


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

          
          <Card
            className="p-4 border-[3px] border-foreground shadow-brutal bg-card cursor-pointer transition-transform duration-100 active:translate-y-0.5 active:shadow-none"
            onClick={fetchLeaveTypeMenu}
          >
            <div className="text-2xl font-bold mb-1">
              {stats.emergencyLeave + stats.jobInterviewsLeave + stats.documentationLeave + stats.collegeLeave + stats.examLeave + stats.specialOccasionsLeave + stats.healthGeneralLeave + stats.healthPeriodLeave}
            </div>
            <div className="text-sm text-muted-foreground">Leave Types</div>
          </Card>

        </div>

       
        {topStudent && (
          <Card className="p-6 mt-8 border-[3px] border-foreground shadow-brutal bg-yellow-50">
            <div className="flex items-center gap-4 mb-2">
              <Trophy className="h-8 w-8 text-yellow-600 fill-yellow-400" />
              <div>
                <h2 className="text-xl font-bold text-gray-800">Campus Top Presenter: {topStudent.name}</h2>
                <p className="text-sm text-gray-600">Email: {topStudent.email}</p>
                <p className="text-lg text-gray-700 font-semibold">
                  Attendance (This Month): <span className="text-green-600">{topStudent.percentage}%</span>
                </p>
              </div>
            </div>
            <blockquote className="border-l-4 border-yellow-500 pl-4 text-gray-600 italic text-sm">
              "🌟 Outstanding dedication! Congratulations {topStudent.name} for achieving the highest attendance this month. Your commitment is truly inspiring! 🌟"
            </blockquote>
          </Card>
        )}

      
        {bottomStudent && (
          <Card className="p-6 mt-6 border-[3px] border-foreground shadow-brutal bg-red-50">
            <div className="flex items-center gap-4 mb-2">
              <TrendingDown className="h-8 w-8 text-red-600" />
              <div>
                <h2 className="text-xl font-bold text-gray-800">Lowest Presenter: {bottomStudent.name}</h2>
                <p className="text-sm text-gray-600">Email: {bottomStudent.email}</p>
                <p className="text-lg text-gray-700 font-semibold">
                  Attendance (This Month): <span className="text-red-600">{bottomStudent.percentage}%</span>
                </p>
              </div>
            </div>
            <blockquote className="border-l-4 border-red-500 pl-4 text-gray-600 italic text-sm">
              "⚠️ Attendance alert! {bottomStudent.name}, your monthly attendance is the lowest. Please prioritize your presence to avoid further warnings. ⚠️"
            </blockquote>
          </Card>
        )}


       
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

        <Dialog open={isLeaveMenuOpen} onOpenChange={setIsLeaveMenuOpen}>
          <DialogContent className="sm:max-w-[425px] border-[3px] border-foreground shadow-brutal">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">Select Leave Type</DialogTitle>
            </DialogHeader>
            <ScrollArea className="h-72 w-full rounded-md border-[3px] border-foreground p-4 shadow-brutal-sm">
              <ul className="space-y-2">
                {LEAVE_TYPES_MENU.map((leave) => (
                  <li key={leave.db_name}>
                    <Button
                      variant="outline"
                      className="w-full justify-between border-[2px] border-foreground h-12 shadow-brutal-sm hover:bg-primary/10"

                      onClick={() => fetchSpecificLeaveStudents(leave.db_name, leave.display_name)}
                    >
                      <span className="font-medium">{leave.display_name}</span>

                      <span className={`font-bold p-1 rounded text-sm ${getLeaveCount(leave.db_name) > 0 ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'}`}>
                        {getLeaveCount(leave.db_name)} Today
                      </span>
                    </Button>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          </DialogContent>
        </Dialog>


        <Dialog open={isSpecificLeaveListOpen} onOpenChange={setIsSpecificLeaveListOpen}>
          <DialogContent className="sm:max-w-[425px] border-[3px] border-foreground shadow-brutal">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">{specificLeaveType} ({specificLeaveStudents.length})</DialogTitle>
            </DialogHeader>
            {specificListLoading ? (
              <p className="py-4 text-center text-muted-foreground">Loading student list...</p>
            ) : specificLeaveStudents.length > 0 ? (
              <ScrollArea className="h-72 w-full rounded-md border-[3px] border-foreground p-4 shadow-brutal-sm">
                <ul className="space-y-4">
                  {specificLeaveStudents.map((student, index) => (
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
              <p className="py-4 text-center text-muted-foreground">No students on {specificLeaveType.toLowerCase()} today.</p>
            )}
          </DialogContent>
        </Dialog>

      </div>
    </div>
  );
}