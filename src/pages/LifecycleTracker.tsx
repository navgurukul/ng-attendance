import React from "react";
import { Card } from "@/components/ui/card";
import { UserPlus } from "lucide-react";
import AdminSidebar from "./AdminDashboardSidebar"; 

export default function LifecycleTracker() {
  return (
    <div className="min-h-screen bg-background flex">
      
      <AdminSidebar />

      <div className="flex-1 p-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
            <UserPlus className="h-8 w-8 text-primary" />
            Lifecycle Tracker
          </h1>
          <p className="text-muted-foreground">Track student admissions, dropouts, and placements.</p>
        </div>

        <Card className="p-6 border-[3px] border-foreground shadow-brutal bg-card max-w-3xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-primary p-2 border-[3px] border-foreground">
              <UserPlus className="h-6 w-6 text-primary-foreground" />
            </div>
            <h2 className="text-2xl font-bold">Student Lifecycle Data</h2>
          </div>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                <div className="p-4 border-[3px] border-foreground bg-background">
                    <div className="font-bold text-muted-foreground">New Admissions</div>
                    <div className="text-4xl font-bold mt-2">-</div>
                    <div className="text-xs text-muted-foreground mt-1">Current Academic Year</div>
                </div>

                <div className="p-4 border-[3px] border-foreground bg-background">
                    <div className="font-bold text-muted-foreground">Dropouts</div>
                    <div className="text-4xl font-bold mt-2">-</div>
                    <div className="text-xs text-muted-foreground mt-1">Discontinued Students</div>
                </div>

                
                <div className="p-4 border-[3px] border-foreground bg-background">
                    <div className="font-bold text-muted-foreground">Placements</div>
                    <div className="text-4xl font-bold mt-2">-</div>
                    <div className="text-xs text-muted-foreground mt-1">Secured Jobs</div>
                </div>
            </div>

            <div className="p-8 border-[3px] border-dashed border-foreground bg-muted/30 flex items-center justify-center text-muted-foreground mt-4">
                Detailed lifecycle charts and analytics coming soon.
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}