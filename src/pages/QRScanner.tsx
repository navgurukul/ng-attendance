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

  const startQRScanner = () => {
    setScanning(true);

    setTimeout(() => {
      const screenWidth = window.innerWidth;
      const qrboxSize =
        screenWidth < 640 ? Math.min(screenWidth - 80, 250) : 250;

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
    <div className="min-h-screen bg-background flex">
      <StudentSidebar />

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-4">Scan Attendance</h1>
        <p className="text-muted-foreground mb-6">Scan the QR code to mark attendance.</p>

        <Card className="p-6 border-[3px] border-foreground shadow-brutal bg-card">

          <div className="text-center mb-6">
            <div className="text-lg font-bold">Today's Attendance</div>
            <p className="text-sm text-muted-foreground">
              {todayMarked ? "✓ Already Marked" : "Not marked yet"}
            </p>
          </div>

          {!todayMarked ? (
            !scanning ? (
              <>
                <div className="w-48 h-48 mx-auto border-[3px] border-foreground bg-muted flex items-center justify-center">
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
              <div id="qr-reader" className="w-full mt-4"></div>
            )
          ) : (
            <div className="text-center py-8">
              <div className="w-24 h-24 mx-auto bg-primary border-[3px] border-foreground flex items-center justify-center mb-4">
                <svg
                  className="h-16 w-16 text-primary-foreground"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-xl font-bold text-primary">Attendance Marked!</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
