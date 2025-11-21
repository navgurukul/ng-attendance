import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { UserPlus, Download, ChevronLeft, ChevronRight } from "lucide-react";
import AdminSidebar from "./AdminDashboardSidebar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const ITEMS_PER_PAGE = 10;

const exportToCsv = (data) => {
  if (data.length === 0) {
    toast.info("No data to export.");
    return;
  }

  const headers = ["Status", "Department", "First Name", "Last Name", "Email", "Date", "Company Name", "Job Type", "Reason", "Document URL"];

  
  const csvRows = data.map(row => [
    row.status,
    row.department,
    row.first_name,
    row.last_name,
    row.email,
    row.date,
    row.company_name || 'N/A',
    row.job_type || 'N/A',
    row.reason || 'N/A',
    row.document_url || 'N/A'
  ].map(item => `"${item}"`).join(',')); 

  const csvContent = [
    headers.join(','),
    ...csvRows
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `student_tracking_export_${new Date().toISOString().split('T')[0]}.csv`);
  link.click();
  toast.success("Data exported successfully!");
};


export default function LifecycleTracker() {
  const [stats, setStats] = useState({
    newAdmissions: 0,
    dropouts: 0,
    placements: 0,
  });

  const [historyRecords, setHistoryRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filterStatus, setFilterStatus] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  const fetchDashboardData = useCallback(async () => {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
    const endOfMonth = today.toISOString().split('T')[0]; 

    setLoading(true);

    const { data: monthlyData, error: monthlyError } = await supabase
      .from('life_cycle_tracking')
      .select('status')
      .gte('date', startOfMonth)
      .lte('date', endOfMonth);

    if (monthlyError) {
      console.error('Error fetching monthly stats:', monthlyError);
      toast.error('Failed to load monthly statistics.');
    } else {
      const newAdmissions = monthlyData.filter(r => r.status === 'New Admission').length;
      const dropouts = monthlyData.filter(r => r.status === 'Dropout').length;
      const placements = monthlyData.filter(r => r.status === 'Placement').length;

      setStats({ newAdmissions, dropouts, placements });
    }

    await fetchHistory(filterStatus, fromDate, toDate, currentPage);

  }, [filterStatus, fromDate, toDate, currentPage]);


  const fetchHistory = async (status, from, to, page) => {
    setLoading(true);
    let query = supabase.from('life_cycle_tracking').select('*', { count: 'exact' });

    if (status !== 'all') {
      query = query.eq('status', status);
    }

    if (from) {
      query = query.gte('date', from);
    }
    if (to) {
      query = query.lte('date', to);
    }

    const offset = (page - 1) * ITEMS_PER_PAGE;
    query = query.order('date', { ascending: false }).range(offset, offset + ITEMS_PER_PAGE - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching tracking history:', error);
      toast.error('Failed to load tracking history.');
      setLoading(false);
      return;
    }

    setHistoryRecords(data || []);
    setTotalRecords(count || 0);
    setLoading(false);
  };

  useEffect(() => {
    fetchHistory(filterStatus, fromDate, toDate, currentPage);
  }, [filterStatus, fromDate, toDate, currentPage]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);


  const handleFilterChange = () => {
    setCurrentPage(1); 
    fetchHistory(filterStatus, fromDate, toDate, 1);
  };

  const totalPages = Math.ceil(totalRecords / ITEMS_PER_PAGE);

  const paginatedRecords = historyRecords.slice(0, ITEMS_PER_PAGE);


  return (
    <div className="min-h-screen bg-background flex">

      <AdminSidebar />

      <div className="flex-1 p-8 pt-[100px] md:ml-64">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
            <UserPlus className="h-8 w-8 text-primary" />
            Lifecycle Tracker
          </h1>
          <p className="text-muted-foreground">Track student admissions, dropouts, and placements.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">

          <Card className="p-4 border-[3px] border-foreground shadow-brutal bg-background">
            <div className="font-bold text-muted-foreground">New Admissions</div>
            <div className="text-4xl font-bold mt-2">{stats.newAdmissions}</div>
            <div className="text-xs text-muted-foreground mt-1">Current Month</div>
          </Card>

          <Card className="p-4 border-[3px] border-foreground shadow-brutal bg-background">
            <div className="font-bold text-muted-foreground">Dropouts</div>
            <div className="text-4xl font-bold mt-2">{stats.dropouts}</div>
            <div className="text-xs text-muted-foreground mt-1">Current Month</div>
          </Card>

          <Card className="p-4 border-[3px] border-foreground shadow-brutal bg-background">
            <div className="font-bold text-muted-foreground">Placements</div>
            <div className="text-4xl font-bold mt-2">{stats.placements}</div>
            <div className="text-xs text-muted-foreground mt-1">Current Month</div>
          </Card>
        </div>


        <Card className="p-6 border-[3px] border-foreground shadow-brutal bg-card">
          <h2 className="text-2xl font-bold mb-6">Student Tracking History ({totalRecords} records)</h2>

          
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6 items-end">

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border-[3px] border-foreground h-10 shadow-brutal-sm px-3"
            >
              <option value="all">Filter by Status (All)</option>
              <option value="New Admission">New Admission</option>
              <option value="Dropout">Dropout</option>
              <option value="Placement">Placement</option>
            </select>

            
            <div>
              <label className="text-xs text-muted-foreground block mb-1">From Date</label>
              <Input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="border-[3px] border-foreground h-10 shadow-brutal-sm"
              />
            </div>

           
            <div>
              <label className="text-xs text-muted-foreground block mb-1">To Date</label>
              <Input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="border-[3px] border-foreground h-10 shadow-brutal-sm"
              />
            </div>

            
            <Button
              onClick={() => fetchHistory(filterStatus, fromDate, toDate, 1)}
              className="h-10 border-[3px] border-foreground shadow-brutal-sm bg-primary hover:bg-primary/90"
              disabled={loading}
            >
              Apply Filter
            </Button>

            
            <Button
              onClick={() => exportToCsv(historyRecords)} 
              className="h-10 border-[3px] border-foreground shadow-brutal-sm bg-green-600 hover:bg-green-700"
              disabled={loading || historyRecords.length === 0}
            >
              <Download className="h-4 w-4 mr-2" /> Export to Excel
            </Button>
          </div>

          
          <div className="overflow-x-auto border-[3px] border-foreground shadow-brutal-sm">
            <table className="w-full">
              <thead className="bg-muted text-foreground">
                <tr>
                  <th className="px-4 py-3 text-left font-bold border-b-[3px] border-r-[3px] border-foreground">Date</th>
                  <th className="px-4 py-3 text-left font-bold border-b-[3px] border-r-[3px] border-foreground">Name</th>
                  <th className="px-4 py-3 text-left font-bold border-b-[3px] border-r-[3px] border-foreground">Email</th>
                  <th className="px-4 py-3 text-center font-bold border-b-[3px] border-r-[3px] border-foreground">Status</th>
                  <th className="px-4 py-3 text-left font-bold border-b-[3px] border-r-[3px] border-foreground">Department</th>
                  <th className="px-4 py-3 text-left font-bold border-b-[3px] border-foreground">Details</th>
                </tr>
              </thead>
              <tbody className="bg-background">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="text-center py-6 text-muted-foreground">Loading records...</td>
                  </tr>
                ) : paginatedRecords.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-6 text-muted-foreground">No records found matching the filters.</td>
                  </tr>
                ) : (
                  paginatedRecords.map((record, index) => (
                    <tr key={record.id} className={index % 2 === 0 ? "bg-background" : "bg-muted/50"}>
                      <td className="px-4 py-3 border-r-[3px] border-foreground text-sm">{record.date}</td>
                      <td className="px-4 py-3 font-medium border-r-[3px] border-foreground">
                        {record.first_name} {record.last_name}
                      </td>
                      <td className="px-4 py-3 border-r-[3px] border-foreground text-sm">{record.email}</td>
                      <td className="px-4 py-3 text-center border-r-[3px] border-foreground">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${record.status === 'Placement' ? 'bg-green-100 text-green-700' :
                            record.status === 'Dropout' ? 'bg-red-100 text-red-700' :
                              'bg-blue-100 text-blue-700'
                          }`}>
                          {record.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 border-r-[3px] border-foreground text-sm">{record.department}</td>
                      <td className="px-4 py-3 text-sm">
                        {record.status === 'Placement' ?
                          `Placed at ${record.company_name} (${record.job_type})` :
                          record.status === 'Dropout' ?
                            `Reason: ${record.reason}` :
                            'N/A'
                        }
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex justify-between items-center mt-4">
            <p className="text-sm text-muted-foreground">
              Showing {Math.min(currentPage * ITEMS_PER_PAGE, totalRecords)} of {totalRecords} records
            </p>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1 || loading}
                className="border-[2px] border-foreground"
              >
                <ChevronLeft className="h-4 w-4 mr-1" /> Previous
              </Button>
              <span className="self-center text-sm font-medium">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages || loading || totalPages === 0}
                className="border-[2px] border-foreground"
              >
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>

        </Card>
      </div>
    </div>
  );
}