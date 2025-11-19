import React, { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { z } from "zod";
import { useNavigate } from "react-router-dom";

interface StudentRecord {
  id: string;
  full_name: string;
  email: string;
  roll_number: string | null;
  department: string | null;
  total_days: number;
  present_days: number;
  attendance_rate: number;
  latest_status: string;
  latest_status_date: string | null;
}

const searchQuerySchema = z.string().max(100, "Search query too long");

export default function StudentRecords() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState("");
  const [studentRecords, setStudentRecords] = useState<StudentRecord[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const fetchStudentRecords = async () => {
    setStudentsLoading(true);

    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .order('full_name');

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      toast.error('Failed to fetch student records');
      setStudentsLoading(false);
      return;
    }

    const { data: attendanceData, error: attendanceError } = await supabase
      .from('attendance_records')
      .select('student_id, status, attendance_date');

    const { data: approvedLeaveData, error: leaveError } = await supabase
      .from('leave_requests')
      .select('student_id, start_date, end_date, leave_type')
      .eq('status', 'approved');

    if (attendanceError || leaveError) {
      console.error('Error fetching attendance or leaves:', attendanceError || leaveError);
    }

    const allRecords: Record<string, any[]> = {};

    profiles?.forEach(profile => {
      allRecords[profile.id] = [];
      const accountCreatedAt = profile.created_at ? new Date(profile.created_at) : new Date();

      attendanceData?.filter(a => a.student_id === profile.id)
        .forEach(a => allRecords[profile.id].push({
          date: a.attendance_date,
          status: a.status === 'present' ? 'present' : a.status === 'kitchen_duty' ? 'kitchen' : 'unknown'
        }));

      approvedLeaveData?.filter(l => l.student_id === profile.id)
        .forEach(l => {
          let currentDate = new Date(l.start_date);
          const endDate = new Date(l.end_date);

          while (currentDate <= endDate) {
            const dateStr = currentDate.toISOString().split('T')[0];
            if (!allRecords[profile.id].some(r => r.date === dateStr)) {
              allRecords[profile.id].push({
                date: dateStr,
                status: 'leave'
              });
            }
            currentDate.setDate(currentDate.getDate() + 1);
          }
        });

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      let currentDate = new Date(accountCreatedAt);
      currentDate.setHours(0, 0, 0, 0);

      while (currentDate < today) {
        const dateStr = currentDate.toISOString().split('T')[0];
        if (!allRecords[profile.id].some(r => r.date === dateStr)) {
          allRecords[profile.id].push({
            date: dateStr,
            status: 'absent'
          });
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }
    });

    const records: StudentRecord[] = (profiles || []).map(profile => {
      const studentHistory = allRecords[profile.id]?.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()) || [];

      const totalDays = studentHistory.length;
      const presentDays = studentHistory.filter(r => r.status === 'present').length;
      const attendanceRate = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;

      const latestRecord = studentHistory.length ? studentHistory[studentHistory.length - 1] : null;

      return {
        id: profile.id,
        full_name: profile.full_name,
        email: profile.email,
        roll_number: profile.roll_number,
        department: profile.department,
        total_days: totalDays,
        present_days: presentDays,
        attendance_rate: Math.round(attendanceRate),
        latest_status: latestRecord ? latestRecord.status : "no record",
        latest_status_date: latestRecord ? latestRecord.date : null,
      };
    });

    setStudentRecords(records);
    setStudentsLoading(false);
  };

  useEffect(() => {
    if (user) {
      fetchStudentRecords();
    }
  }, [user]);

  const handleSearchChange = (value: string) => {
    const result = searchQuerySchema.safeParse(value);
    if (result.success) {
      setSearchQuery(value);
    }
  };

  const handleViewReport = (studentId: string, studentName: string) => {
    toast.info(`Navigating to detailed report for ${studentName}...`);
    navigate(`/admin/student-report/${studentId}`);
  };

  
  const filteredStudents = useMemo(() => {
    return studentRecords.filter((student) => {
      const matchesName =
        student.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.roll_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.department?.toLowerCase().includes(searchQuery.toLowerCase());

      const studentDate = student.latest_status_date
        ? new Date(student.latest_status_date)
        : null;

      const from = fromDate ? new Date(fromDate) : null;
      const to = toDate ? new Date(toDate) : null;

      const matchesDate =
        (!from || (studentDate && studentDate >= from)) &&
        (!to || (studentDate && studentDate <= to));

      const matchesStatus =
        filterStatus === "all" || student.latest_status === filterStatus;

      return matchesName && matchesDate && matchesStatus;
    });
  }, [searchQuery, fromDate, toDate, filterStatus, studentRecords]);

  
  return (
    <div className="min-h-screen bg-background flex">
      <div className="flex-1 p-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
            <Users className="h-8 w-8 text-primary" />
            Student Records
          </h1>
          <p className="text-muted-foreground">View and manage comprehensive student attendance records.</p>
        </div>

        <Card className="p-6 border-[3px] border-foreground shadow-brutal bg-card">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-primary p-2 border-[3px] border-foreground">
              <Users className="h-6 w-6 text-primary-foreground" />
            </div>
            <h2 className="text-2xl font-bold">All Students</h2>
          </div>

          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Input
              type="text"
              placeholder="Search by Name, Email, Roll No..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="border-[3px] border-foreground h-12 shadow-brutal-sm"
            />
            <Input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="border-[3px] border-foreground h-12 shadow-brutal-sm"
            />
            <Input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="border-[3px] border-foreground h-12 shadow-brutal-sm"
            />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border-[3px] border-foreground h-12 shadow-brutal-sm px-3"
            >
              <option value="all">All Status</option>
              <option value="present">Present</option>
              <option value="leave">On Leave</option>
              <option value="kitchen">Kitchen Duty</option>
              <option value="absent">Absent</option>
            </select>
          </div>

          
          {studentsLoading ? (
            <div className="flex items-center justify-center py-12 border-[3px] border-foreground bg-muted">
              <p className="text-muted-foreground">Loading student records...</p>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="flex items-center justify-center py-12 border-[3px] border-foreground bg-muted">
              <p className="text-muted-foreground">
                {searchQuery || fromDate || toDate || filterStatus !== 'all' ? 'No students found matching your filters' : 'No student records available'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto border-[3px] border-foreground">
              <table className="w-full">
                <thead className="bg-primary text-primary-foreground">
                  <tr>
                    <th className="px-4 py-3 text-left font-bold border-b-[3px] border-r-[3px] border-foreground">Name</th>
                    <th className="px-4 py-3 text-left font-bold border-b-[3px] border-r-[3px] border-foreground">Roll No</th>
                    <th className="px-4 py-3 text-left font-bold border-b-[3px] border-r-[3px] border-foreground">Dept</th>
                    <th className="px-4 py-3 text-left font-bold border-b-[3px] border-r-[3px] border-foreground">Email</th>
                    <th className="px-4 py-3 text-center font-bold border-b-[3px] border-r-[3px] border-foreground">
                      Attendance %
                    </th>
                    <th className="px-4 py-3 text-center font-bold border-b-[3px] border-foreground">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody className="bg-background">
                  {filteredStudents.map((student, index) => (
                    <React.Fragment key={student.id}>
                      <tr className={index % 2 === 0 ? "bg-background" : "bg-muted"}>
                        <td className="px-4 py-3 font-medium border-r-[3px] border-foreground">
                          {student.full_name}
                        </td>
                        <td className="px-4 py-3 border-r-[3px] border-foreground">
                          {student.roll_number || "-"}
                        </td>
                        <td className="px-4 py-3 border-r-[3px] border-foreground">
                          {student.department || "-"}
                        </td>
                        <td className="px-4 py-3 border-r-[3px] border-foreground text-sm">
                          {student.email}
                        </td>
                        <td className="px-4 py-3 text-center border-r-[3px] border-foreground">
                          <span
                            className={`font-bold ${
                              student.attendance_rate >= 75 ? 'text-green-600' :
                              student.attendance_rate >= 50 ? 'text-yellow-600' :
                              'text-red-600'
                            }`}
                          >
                            {student.attendance_rate}%
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewReport(student.id, student.full_name)}
                            className="w-full"
                          >
                            View Report
                          </Button>
                        </td>
                      </tr>
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}