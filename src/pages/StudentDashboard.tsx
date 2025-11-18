import { useAuth } from "@/hooks/useAuth";
import StudentSidebar from "./StudentSidebar";



export default function StudentDashboard() {
  const { user } = useAuth();
  return (
    <div className="min-h-screen bg-background flex">
      <StudentSidebar />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Student Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Mark your attendance and manage leaves.</p>
        </div>
      </div>
    </div>
  );
}
