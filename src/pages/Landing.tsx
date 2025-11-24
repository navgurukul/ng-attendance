import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { QrCode, Users, Calendar, FileText, CheckCircle2, Clock } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background pt-20">
      <section className="container mx-auto px-10 py-2 bg-gray-60">
        <div className="grid md:grid-cols-2 gap-5 items-center">

          <div className="text-center md:text-left">
            <img
              src="/navgurukul_logo.png"
              alt="Navgurukul Logo"
              className="w-50 mx-auto md:mx-0 mb-6"
            />

            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
              Smart Attendance <br />
              <span className="text-primary">System</span>
            </h1>

            <p className="text-lg md:text-xl mb-10 text-muted-foreground max-w-xl">
              Modern attendance tracking with QR codes, leave management, and real-time analytics.
            </p>

            <div className="flex gap-4 justify-center md:justify-start flex-wrap">
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
          <div className="flex justify-center">
            <img
              src="/gairl_with_qr.png"
              alt="Hero Illustration"
              className="w-[300px] md:w-[450px] lg:w-[520px]"
            />
          </div>

        </div>
      </section>
      <section className="container mx-auto px-4 py-16 bg-[#f9f9f9]">
        <h2 className="text-4xl font-bold text-center mb-12">Core Features</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          <Card className="p-6 border border-gray-300 bg-[#ffffff] shadow-md hover:shadow-lg rounded-xl transition-all">
            <div className="bg-primary p-3 w-fit border border-gray-300 mb-4 rounded-[5px]">
              <QrCode className="h-8 w-8 text-primary-foreground " />
            </div>
            <h3 className="text-xl font-bold mb-2">QR Code Scanning</h3>
            <p className="text-muted-foreground">
              One scan per day for quick and contactless attendance marking.
            </p>
          </Card>


          <Card className="p-6 border border-gray-300 bg-[#ffffff] shadow-md hover:shadow-lg rounded-xl transition-all">
            <div className="bg-primary p-3 w-fit border border-gray-300 mb-4 rounded-[5px]">
              <Calendar className="h-8 w-8 text-primary-foreground" />
            </div>
            <h3 className="text-xl font-bold mb-2">Leave Management</h3>
            <p className="text-muted-foreground">
              Submit leave requests with type selection and approval workflow. Track all your leave history.
            </p>
          </Card>

          <Card className="p-6 border border-gray-300 bg-[#ffffff] shadow-md hover:shadow-lg rounded-xl transition-all">
            <div className="bg-primary p-3 w-fit border border-gray-300 mb-4 rounded-[5px]">
              <FileText className="h-8 w-8 text-primary-foreground" />
            </div>
            <h3 className="text-xl font-bold mb-2">Detailed Reports</h3>
            <p className="text-muted-foreground">
              View attendance analytics with charts and graphs. Export data in Excel or PDF format.
            </p>
          </Card>

          <Card className="p-6 border border-gray-300 bg-[#ffffff] shadow-md hover:shadow-lg rounded-xl transition-all">
            <div className="bg-primary p-3 w-fit border border-gray-300 mb-4 rounded-[5px]">
              <CheckCircle2 className="h-8 w-8 text-primary-foreground" />
            </div>
            <h3 className="text-xl font-bold mb-2">Kitchen Duty</h3>
            <p className="text-muted-foreground">
              Mark kitchen duty and get automatic attendance credit. Simple one-click process.
            </p>
          </Card>

          <Card className="p-6 border border-gray-300 bg-[#ffffff] shadow-md hover:shadow-lg rounded-xl transition-all">
            <div className="bg-primary p-3 w-fit border border-gray-300 mb-4 rounded-[5px]">
              <Users className="h-8 w-8 text-primary-foreground" />
            </div>
            <h3 className="text-xl font-bold mb-2">Admin Dashboard</h3>
            <p className="text-muted-foreground">
              Complete oversight of all students. Generate QR codes, approve leaves, and track lifecycle.
            </p>
          </Card>

          <Card className="p-6 border border-gray-300 bg-[#ffffff] shadow-md hover:shadow-lg rounded-xl transition-all">
            <div className="bg-primary p-3 w-fit border border-gray-300 mb-4 rounded-[5px]">
              <Clock className="h-8 w-8 text-primary-foreground" />
            </div>
            <h3 className="text-xl font-bold mb-2">Correction Requests</h3>
            <p className="text-muted-foreground">
              Missed a scan? Submit correction requests with reason for admin review.
            </p>
          </Card>
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