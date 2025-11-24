import React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Download } from "lucide-react";
import AdminSidebar from "./AdminDashboardSidebar"; 

export default function ReportsAndDownloads() {




  
  const handleExportReport = () => {
   
    toast.info("Report export feature coming soon! Processing mock export...");
  };

  
  return (
    <div className="min-h-screen bg-background flex">
     
      <AdminSidebar />

      <div className="flex-1 p-8 pt-[100px] md:ml-64 text-sm md:text-base lg:text-lg">
        <div className="mb-8 flex flex-col items-center">
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-3 text-xl md:text-2xl lg:text-4xl">
            <Download className="h-8 w-8 text-primary" />
            Reports & Downloads
          </h1>
          <p className="text-muted-foreground">Generate and export key attendance and leave reports.</p>
        </div>

        <Card className="p-6 bg-card max-w-6xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-primary p-2 border-[3px] border-foreground">
              <Download className="h-6 w-6 text-primary-foreground" />
            </div>
            <h2 className="text-2xl font-bold">Export Options</h2>
          </div>
          
          <div className="space-y-3">
            <Button onClick={handleExportReport} variant="outline" className="w-full justify-start border-[2px] border-foreground hover:bg-muted">
              Export Monthly Report (Excel)
            </Button>
            <Button onClick={handleExportReport} variant="outline" className="w-full justify-start border-[2px] border-foreground hover:bg-muted">
              Export Attendance Summary (PDF)
            </Button>
            <Button onClick={handleExportReport} variant="outline" className="w-full justify-start border-[2px] border-foreground hover:bg-muted">
              Export Leave Records (Excel)
            </Button>
          </div>
        </Card>
        
        <Card className="mt-6 p-6 border-[3px] border-dashed border-foreground bg-muted/30 max-w-6xl">
            <h3 className="font-bold text-lg">Report History</h3>
            <p className="text-sm text-muted-foreground">All generated reports will be listed here for download.</p>
        </Card>
      </div>
    </div>
  );
}