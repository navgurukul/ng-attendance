import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { QrCode, Camera } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Html5QrcodeScanner } from "html5-qrcode";
import StudentSidebar from "./StudentSidebar";

export default function QRScanner() {
  const { user } = useAuth();
  const [todayMarked, setTodayMarked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    if (user) checkTodayAttendance();
  }, [user]);


  const checkTodayAttendance = async () => {
    if (!user) return;

    const today = new Date().toISOString().split("T")[0];

    const { data } = await supabase
      .from("attendance_records")
      .select("*")
      .eq("student_id", user.id)
      .eq("attendance_date", today)
      .maybeSingle();

    setTodayMarked(!!data);
  };


  const checkScanEligibility = async (today: string) => {
    if (!user) return false;


    const { data: present } = await supabase
      .from("attendance_records")
      .select("*")
      .eq("student_id", user.id)
      .eq("attendance_date", today)
      .eq("status", "present")
      .maybeSingle();

    if (present) {
      toast.error("You are already marked PRESENT today.");
      return false;
    }


    const { data: leave } = await supabase
      .from("leave_requests")
      .select("*")
      .eq("student_id", user.id)
      .eq("status", "approved")
      .lte("start_date", today)
      .gte("end_date", today)
      .maybeSingle();

    if (leave) {
      toast.error("You are on approved LEAVE today.");
      return false;
    }


    const { data: kitchen } = await supabase
      .from("attendance_records")
      .select("*")
      .eq("student_id", user.id)
      .eq("attendance_date", today)
      .eq("status", "kitchen_duty")
      .maybeSingle();

    if (kitchen) {
      toast.error("Today you have KITCHEN TURN duty.");
      return false;
    }

    return true;
  };



  const startQRScanner = async () => {
    if (!user) return;

    const today = new Date().toISOString().split("T")[0];

    const allow = await checkScanEligibility(today);

    if (!allow) return;


    setScanning(true);

    setTimeout(() => {
      const screenWidth = window.innerWidth;
      const qrboxSize =
        screenWidth < 480 ? screenWidth - 50 : screenWidth < 768 ? 280 : 300;

      const scanner = new Html5QrcodeScanner(
        "qr-reader",
        { fps: 10, qrbox: { width: qrboxSize, height: qrboxSize } },
        false
      );

      scanner.render(onScanSuccess, onScanFailure);

      async function onScanSuccess(decodedText: string) {
        scanner.clear();
        setScanning(false);
        await handleQRScan(decodedText);
      }

      function onScanFailure(error: any) {
        console.log("Scan error:", error);
      }
    }, 100);
  };

  const handleQRScan = async (qrCode: string) => {
    if (!user) return;
    setLoading(true);

    const { data: qrData } = await supabase
      .from("qr_codes")
      .select("*")
      .eq("code", qrCode)
      .eq("is_active", true)
      .maybeSingle();

    if (!qrData) {
      toast.error("Invalid or expired QR code");
      setLoading(false);
      return;
    }

    if (new Date(qrData.expires_at) < new Date()) {
      toast.error("QR code expired");
      setLoading(false);
      return;
    }

    const { error } = await supabase.from("attendance_records").insert({
      student_id: user.id,
      qr_code_id: qrData.id,
      status: "present",
    });

    if (error) {
      if (error.code === "23505") {
        toast.error("Attendance already marked");
      } else {
        toast.error("Failed to mark attendance");
      }
    } else {
      toast.success("Attendance marked!");
      setTodayMarked(true);
    }

    setLoading(false);
  };

  return (

    <div className="flex w-full min-h-screen bg-gray-50 pt-20">

      <StudentSidebar />

      <div className="flex-1 px-4 py-6 md:px-8 md:py-10 md:ml-64 text-sm md:text-base lg:text-lg">

        <h1 className="font-bold mb-4 text-center text-xl md:text-2xl lg:text-4xl">Scan Attendance</h1>
        <p className="text-muted-foreground mb-6 text-center">Scan the QR code to mark attendance.</p>


        <Card className="p-4 md:p-6 border-[2px] border-foreground shadow-md bg-card max-w-xl mx-auto hover:shadow-lg rounded-xl transition-all">


          <div className="text-center mb-6">
            <div className="text-lg font-bold">Today's Attendance</div>
            <p className="text-sm text-muted-foreground">
              {todayMarked ? "✓ Already Marked" : "Not marked yet"}
            </p>
          </div>

          {!todayMarked ? (
            !scanning ? (
              <>

                <div className="w-40 h-40 sm:w-48 sm:h-48 mx-auto border-[2px] border-foreground bg-muted flex items-center justify-center">

                  <Camera className="h-32 w-32 text-muted-foreground" />
                </div>

                <Button
                  size="lg"
                  onClick={startQRScanner}
                  className="w-full mt-4"
                  disabled={loading}
                >
                  <QrCode className="h-5 w-5 mr-2" />
                  Start QR Scanner
                </Button>
              </>
            ) : (

              <div id="qr-reader" className="w-full mt-4 rounded-md overflow-hidden"></div>

            )
          ) : (
            <div className="text-center py-8">
              <div className="w-24 h-24 mx-auto bg-[#D81B60] border-[2px] border-foreground flex items-center justify-center mb-4">
                <svg
                  className="h-16 w-16 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-xl font-bold text-[#D81B60]">Attendance Marked!</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
