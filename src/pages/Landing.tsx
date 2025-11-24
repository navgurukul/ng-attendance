import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { QrCode, Users, Calendar, FileText, CheckCircle2, Clock } from "lucide-react";
import { Twitter, Linkedin, Mail } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background pt-20">
      <section className="container mx-auto px-10 py-2">
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
      <footer className="bg-gray-100 text-black pt-12 pb-6 border-t border-gray-300">
        <div className="container mx-auto px-4">

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-8">

           
            <div className="md:col-span-1">

             
              <p className="text-1xl font-bold mb-3">
               
                <span style={{ color: '#FF7F50' }}>Anish Jadhav Memorial</span><br />
                
                <span className="text-black">Foundation</span>
              </p>

              <p className="text-2xl font-bold mb-2">
                <span className="text-primary">Smart</span> Attendance
              </p>
              <p className="text-sm text-gray-700"> 
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4 text-primary uppercase">Quick Links</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link to="/features" className="text-gray-800 hover:text-primary transition-colors"> 
                    Core Features
                  </Link>
                </li>
                <li>
                  <Link to="/login" className="text-gray-800 hover:text-primary transition-colors"> 
                    Admin Login
                  </Link>
                </li>
                <li>
                  <Link to="/signup" className="text-gray-800 hover:text-primary transition-colors">
                    Student Signup
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4 text-primary uppercase">Resources</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link to="/faq" className="text-gray-800 hover:text-primary transition-colors"> 
                    FAQ & Help
                  </Link>
                </li>
                <li>
                  <Link to="/privacy" className="text-gray-800 hover:text-primary transition-colors"> 
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link to="/terms" className="text-gray-800 hover:text-primary transition-colors"> 
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4 text-primary uppercase">Connect</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center text-gray-800 hover:text-primary transition-colors"> 
                  <Mail className="h-5 w-5 mr-3" />
                  <a href="mailto:support@navgurukul.org">support@navgurukul.org</a>
                </div>
              </div>

              <div className="flex space-x-4 mt-6">
                <a href="https://twitter.com/navgurukul" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
                  <Twitter className="h-6 w-6 text-gray-700 hover:text-primary transition-colors" /> 
                </a>
                <a href="https://www.linkedin.com/school/navgurukul/posts/?feedView=all" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
                  <Linkedin className="h-6 w-6 text-gray-700 hover:text-primary transition-colors" /> 
                </a>
              </div>
            </div>

          </div>

        <div className="border-t border-gray-300 mt-4 pt-4 text-center text-xs text-gray-700"> 
            <p>
              &copy; {new Date().getFullYear()} Smart Attendance System. All rights reserved.
            </p>
            <p className="mt-1">
              Developed by <span className="font-medium text-gray-800">Mahima, Nasrina and Parvati</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}