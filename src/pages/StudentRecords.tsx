


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
import AdminSidebar from "./AdminDashboardSidebar";

interface HistoryEntry {
  date: string; // yyyy-mm-dd
  status: "present" | "kitchen" | "leave" | "absent" | "unknown";
}


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
  history?: HistoryEntry[]; // added: full day-by-day history
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

  // -----------------------
  // ✅ PAGINATION STATES
  // -----------------------
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 10;

  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;

  // -----------------------
  // Fetch Student Records
  // -----------------------
  const fetchStudentRecords = async () => {
    setStudentsLoading(true);

    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("*")
      .order("full_name");

    if (profilesError) {
      toast.error("Failed to fetch student records");
      setStudentsLoading(false);
      return;
    }

    const { data: attendanceData } = await supabase
      .from("attendance_records")
      .select("student_id, status, attendance_date");

    const { data: approvedLeaveData } = await supabase
      .from("leave_requests")
      .select("student_id, start_date, end_date, leave_type")
      .eq("status", "approved");

    const allRecords: Record<string, HistoryEntry[]> = {};

    profiles?.forEach((profile) => {
      allRecords[profile.id] = [];
      const accountCreatedAt = profile.created_at
        ? new Date(profile.created_at)
        : new Date();

      // Normalize accountCreatedAt to 00:00
      const acc = new Date(accountCreatedAt);
      acc.setHours(0, 0, 0, 0);

      // 1) Push attendance records (present / kitchen)
      attendanceData
        ?.filter((a) => a.student_id === profile.id)
        .forEach((a) => {
          const dateStr = (a.attendance_date || "").toString().split("T")[0];
          const normalizedStatus =
            a.status === "present"
              ? "present"
              : a.status === "kitchen_duty"
              ? "kitchen"
              : "unknown";
          // avoid duplicates
          if (!allRecords[profile.id].some((r) => r.date === dateStr)) {
            allRecords[profile.id].push({
              date: dateStr,
              status: normalizedStatus,
            });
          } else {
            // if duplicate exists, prefer present/kitchen over unknown
            const idx = allRecords[profile.id].findIndex((r) => r.date === dateStr);
            if (idx !== -1) {
              const existing = allRecords[profile.id][idx];
              if (existing.status === "unknown" && normalizedStatus !== "unknown") {
                allRecords[profile.id][idx] = { date: dateStr, status: normalizedStatus };
              }
            }
          }
        });

      // 2) Push leave days (mark as 'leave' for the date range)
      approvedLeaveData
        ?.filter((l) => l.student_id === profile.id)
        .forEach((l) => {
          const start = new Date(l.start_date);
          const end = new Date(l.end_date);
          start.setHours(0, 0, 0, 0);
          end.setHours(0, 0, 0, 0);

          let currentDate = new Date(start);
          while (currentDate <= end) {
            const dateStr = currentDate.toISOString().split("T")[0];
            if (!allRecords[profile.id].some((r) => r.date === dateStr)) {
              allRecords[profile.id].push({
                date: dateStr,
                status: "leave",
              });
            } else {
              // if there is an attendance record on same day, prefer attendance over leave
              const idx = allRecords[profile.id].findIndex((r) => r.date === dateStr);
              if (idx !== -1) {
                const existing = allRecords[profile.id][idx];
                if (existing.status === "unknown") {
                  allRecords[profile.id][idx] = { date: dateStr, status: "leave" };
                }
              }
            }
            currentDate.setDate(currentDate.getDate() + 1);
          }
        });

      // 3) Fill absent days from account creation up to TODAY (inclusive)
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      let currentDate = new Date(acc);
      while (currentDate <= today) {
        const dateStr = currentDate.toISOString().split("T")[0];
        if (!allRecords[profile.id].some((r) => r.date === dateStr)) {
          allRecords[profile.id].push({
            date: dateStr,
            status: "absent",
          });
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }

      // 4) Ensure the history is sorted chronologically (old -> new)
      allRecords[profile.id].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );
    });

    // build StudentRecord objects with history attached
    const records: StudentRecord[] = (profiles || []).map((profile) => {
      const studentHistory = allRecords[profile.id] || [];

      const totalDays = studentHistory.length;
      const presentDays = studentHistory.filter((r) => r.status === "present").length;
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
        history: studentHistory,
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

  const handleViewReport = (studentId: string) => {
    navigate(`/admin/student-report/${studentId}`);
  };

  const buildDateArrayBetween = (from?: Date | null, to?: Date | null) => {
    if (!from && !to) return null;
    const start = from ? new Date(from) : new Date(to as Date);
    const end = to ? new Date(to) : new Date(from as Date);
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    if (start > end) return null;
    const arr: string[] = [];
    let d = new Date(start);
    while (d <= end) {
      arr.push(d.toISOString().split("T")[0]);
      d.setDate(d.getDate() + 1);
    }
    return arr;
  };

  const filteredStudents = useMemo(() => {
    // prepare date range array (if any)
    const from = fromDate ? new Date(fromDate) : null;
    const to = toDate ? new Date(toDate) : null;
    const dateRange = buildDateArrayBetween(from, to); // null if no from/to

    return studentRecords.filter((student) => {
      // Name/email/roll/department filter
      const matchesName =
        student.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.roll_number?.toLowerCase().includes(searchQuery.toLowerCase() || "") ||
        student.department?.toLowerCase().includes(searchQuery.toLowerCase() || "");

      if (!matchesName) return false;

      // If no date range selected -> treat entire history
      const history: HistoryEntry[] = student.history || [];

      // If user selected a date range -> filter history to that range
      const historyInRange = dateRange
        ? history.filter((h) => dateRange.includes(h.date))
        : history.slice(); // copy full history

      // If user didn't select any date and filterStatus === 'all' -> include the student
      if (!dateRange && filterStatus === "all") {
        return true;
      }

      // If no history in the range -> then:
      //   - if dateRange exists, and we created history with 'absent' entries, historyInRange will contain those absent entries
      //   - So historyInRange empty only if student's account created after the range (rare). In that case treat as not matching.
      if (historyInRange.length === 0) {
        return false;
      }

      // Determine matching by status
      if (filterStatus === "all") {
        // If just filtering by date range but not by specific status, include students who have any record in range
        return historyInRange.length > 0;
      }

      // Normalize filterStatus to same tokens used in history
      const fs = filterStatus.toLowerCase();

      if (fs === "absent") {
        return historyInRange.some((h) => h.status === "absent");
      }

      if (fs === "present") {
        return historyInRange.some((h) => h.status === "present");
      }

      if (fs === "leave") {
        return historyInRange.some((h) => h.status === "leave");
      }

      if (fs === "kitchen") {
        return historyInRange.some((h) => h.status === "kitchen");
      }

      // fallback
      return false;
    });
  }, [searchQuery, fromDate, toDate, filterStatus, studentRecords]);

  // NOW PAGINATE FILTERED DATA
  const currentRecords = filteredStudents.slice(indexOfFirstRecord, indexOfLastRecord);
  const totalPages = Math.ceil(filteredStudents.length / recordsPerPage);

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row ">
      <AdminSidebar />

      <div className="flex-1 p-8 md:ml-64 pt-[100px] text-sm md:text-base lg:text-lg text-center">

        <div className="mb-8 flex flex-col items-center">
          <h1 className="text-4xl font-bold flex items-center mb-4 gap-3 text-xl md:text-2xl lg:text-4xl">
            <Users className="h-8 w-8 text-primary" />
            Student Records
          </h1>
          <p className="text-muted-foreground">
            View and manage comprehensive student attendance records.
          </p>
        </div>

        <Card className="p-6 border-[2px] border-[#111] shadow-brutal bg-card">

          <div className="flex items-center gap-3 mb-6">
            <div className="bg-primary p-2 border-[2px] border-[#111]">
              <Users className="h-6 w-6 text-primary-foreground" />
            </div>
            <h2 className="text-2xl font-bold">All Students</h2>
          </div>

          {/* FILTERS */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Input
              type="text"
              placeholder="Search by Name, Email, Roll No..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="border-[2px] border-[#111] h-12 shadow-brutal-sm"
            />

            <Input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="border-[2px] border-[#111] h-12 shadow-brutal-sm"
            />

            <Input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="border-[2px] border-[#111] h-12 shadow-brutal-sm"
            />

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border-[2px] border-[#111] h-12 shadow-brutal-sm px-3"
            >
              <option value="all">All Status</option>
              <option value="present">Present</option>
              <option value="leave">On Leave</option>
              <option value="kitchen">Kitchen Duty</option>
              <option value="absent">Absent</option>
            </select>
          </div>

          {/* TABLE */}
          {studentsLoading ? (
            <div className="flex items-center justify-center py-12 border-[2px] border-[#111] bg-muted">
              <p>Loading student records...</p>
            </div>
          ) : currentRecords.length === 0 ? (
            <div className="flex items-center justify-center py-12 border-[2px] border-[#111] bg-muted">
              <p>No students found.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto border-[2px] border-[#111]">
                <table className="w-full">
                  <thead className="bg-primary text-primary-foreground">
                    <tr>
                      <th className="px-4 py-3 text-left font-bold border-b-[2px] border-r-[2px] border-[#111]">Name</th>
                      <th className="px-4 py-3 text-left font-bold border-b-[2px] border-r-[2px] border-[#111]">Roll No</th>
                      <th className="px-4 py-3 text-left font-bold border-b-[2px] border-r-[2px] border-[#111]">Dept</th>
                      <th className="px-4 py-3 text-left font-bold border-b-[2px] border-r-[2px] border-[#111]">Email</th>
                      <th className="px-4 py-3 text-center font-bold border-b-[2px] border-r-[2px] border-[#111]">
                        Attendance %
                      </th>
                      <th className="px-4 py-3 text-center font-bold border-b-[2px] border-[#111]">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody className="bg-background">
                    {currentRecords.map((student, index) => (
                      <tr key={student.id} className={index % 2 === 0 ? "bg-background" : "bg-muted"}>
                        <td className="px-4 py-3 font-medium border-r-[2px] border-[#111]">
                          {student.full_name}
                        </td>

                        <td className="px-4 py-3 border-r-[2px] border-[#111]">
                          {student.roll_number || "-"}
                        </td>

                        <td className="px-4 py-3 border-r-[2px] border-[#111]">
                          {student.department || "-"}
                        </td>

                        <td className="px-4 py-3 border-r-[2px] border-[#111] text-sm">
                          {student.email}
                        </td>

                        <td className="px-4 py-3 text-center border-r-[2px] border-[#111]">
                          <span
                            className={`font-bold ${
                              student.attendance_rate >= 75
                                ? "text-green-600"
                                : student.attendance_rate >= 50
                                ? "text-yellow-600"
                                : "text-red-600"
                            }`}
                          >
                            {student.attendance_rate}%
                          </span>
                        </td>

                        <td className="px-4 py-3 text-center">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewReport(student.id)}
                            className="w-full"
                          >
                            View Report
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* -------------------------
                  PAGINATION SECTION
              -------------------------- */}
              {totalPages > 1 && (
                <div className="flex justify-center mt-6 gap-3">
                  <Button
                    variant="outline"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(currentPage - 1)}
                    className="border-[2px] border-[#111]"
                  >
                    Previous
                  </Button>

                  <span className="px-4 py-2 border-[2px] border-[#111] bg-muted font-bold">
                    Page {currentPage} of {totalPages}
                  </span>

                  <Button
                    variant="outline"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(currentPage + 1)}
                    className="border-[2px] border-[#111]"
                  >
                    Next
                  </Button>
                </div>
              )}

            </>
          )}
        </Card>
      </div>
    </div>
  );
}
// export default StudentRecords
