import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { QrCode, Users, Calendar, FileText, CheckCircle2, Clock } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-block mb-6 px-6 py-2 bg-primary text-primary-foreground border-[3px] border-foreground shadow-brutal font-bold">
            BETA VERSION
          </div>
          <h1 className="text-6xl font-bold mb-6 leading-tight">
            Smart Attendance
            <br />
            <span className="text-primary">System</span>
          </h1>
          <p className="text-xl mb-10 text-muted-foreground max-w-2xl mx-auto">
            Modern attendance tracking with QR codes, leave management, and real-time analytics.
            Built by Parvati, Mahima, and Nasrina.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link to="/login">
              <Button size="lg" className="text-lg">
                Get Started
              </Button>
            </Link>
            <Link to="/signup">
              <Button size="lg" variant="outline" className="text-lg">
                Sign Up Free
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-4xl font-bold text-center mb-12">Core Features</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          <Card className="p-6 border-[3px] border-foreground shadow-brutal bg-card hover:shadow-brutal-lg transition-all">
            <div className="bg-primary p-3 w-fit border-[3px] border-foreground mb-4">
              <QrCode className="h-8 w-8 text-primary-foreground" />
            </div>
            <h3 className="text-xl font-bold mb-2">QR Code Scanning</h3>
            <p className="text-muted-foreground">
              One scan per day for quick and contactless attendance marking. Simple and efficient.
            </p>
          </Card>

          <Card className="p-6 border-[3px] border-foreground shadow-brutal bg-card hover:shadow-brutal-lg transition-all">
            <div className="bg-primary p-3 w-fit border-[3px] border-foreground mb-4">
              <Calendar className="h-8 w-8 text-primary-foreground" />
            </div>
            <h3 className="text-xl font-bold mb-2">Leave Management</h3>
            <p className="text-muted-foreground">
              Submit leave requests with type selection and approval workflow. Track all your leave history.
            </p>
          </Card>

          <Card className="p-6 border-[3px] border-foreground shadow-brutal bg-card hover:shadow-brutal-lg transition-all">
            <div className="bg-primary p-3 w-fit border-[3px] border-foreground mb-4">
              <FileText className="h-8 w-8 text-primary-foreground" />
            </div>
            <h3 className="text-xl font-bold mb-2">Detailed Reports</h3>
            <p className="text-muted-foreground">
              View attendance analytics with charts and graphs. Export data in Excel or PDF format.
            </p>
          </Card>

          <Card className="p-6 border-[3px] border-foreground shadow-brutal bg-card hover:shadow-brutal-lg transition-all">
            <div className="bg-primary p-3 w-fit border-[3px] border-foreground mb-4">
              <CheckCircle2 className="h-8 w-8 text-primary-foreground" />
            </div>
            <h3 className="text-xl font-bold mb-2">Kitchen Duty</h3>
            <p className="text-muted-foreground">
              Mark kitchen duty and get automatic attendance credit. Simple one-click process.
            </p>
          </Card>

          <Card className="p-6 border-[3px] border-foreground shadow-brutal bg-card hover:shadow-brutal-lg transition-all">
            <div className="bg-primary p-3 w-fit border-[3px] border-foreground mb-4">
              <Users className="h-8 w-8 text-primary-foreground" />
            </div>
            <h3 className="text-xl font-bold mb-2">Admin Dashboard</h3>
            <p className="text-muted-foreground">
              Complete oversight of all students. Generate QR codes, approve leaves, and track lifecycle.
            </p>
          </Card>

          <Card className="p-6 border-[3px] border-foreground shadow-brutal bg-card hover:shadow-brutal-lg transition-all">
            <div className="bg-primary p-3 w-fit border-[3px] border-foreground mb-4">
              <Clock className="h-8 w-8 text-primary-foreground" />
            </div>
            <h3 className="text-xl font-bold mb-2">Correction Requests</h3>
            <p className="text-muted-foreground">
              Missed a scan? Submit correction requests with reason for admin review.
            </p>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center bg-primary border-[4px] border-foreground shadow-brutal-lg p-12">
          <h2 className="text-4xl font-bold text-primary-foreground mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-primary-foreground/90 mb-8">
            Join hundreds of students using Smart Attendance System.
          </p>
          <Link to="/signup">
            <Button size="lg" variant="outline" className="bg-background hover:bg-background/90 text-lg">
              Create Your Account
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t-[4px] border-foreground py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-muted-foreground">
            Built with ❤️ by <span className="font-bold">Parvati, Mahima, and Nasrina</span>
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            © 2025 Smart Attendance System. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}