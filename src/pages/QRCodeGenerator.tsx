




import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { QrCode as QrCodeIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { QRCodeSVG } from "qrcode.react";
import AdminSidebar from "./AdminDashboardSidebar";

export default function QRCodeGenerator() {
  const { user } = useAuth();
  const [qrCode, setQrCode] = useState<string>("");
  const [qrExpiry, setQrExpiry] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [isAllowedTime, setIsAllowedTime] = useState(false);

  const checkTimeWindow = () => {
    const now = new Date();

    const startTime = new Date();
    startTime.setHours(11, 0, 0, 0); // 11:00 AM

    const expiryTime = new Date();
    expiryTime.setHours(14, 0, 0, 0); // 2:00 PM

    if (now >= startTime && now < expiryTime) {
      setIsAllowedTime(true);
    } else {
      setIsAllowedTime(false);
    }
  };

  useEffect(() => {
    checkTimeWindow();
    const interval = setInterval(checkTimeWindow, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchTodayQR = async () => {
      const today = new Date().toISOString().split("T")[0];

      const { data: qrData, error } = await supabase
        .from("qr_codes")
        .select("*")
        .eq("attendance_date", today)
        .eq("is_active", true)
        .maybeSingle();

      if (error) {
        console.error("Error fetching QR:", error);
        return;
      }

      if (qrData) {
        setQrCode(qrData.code);
        setQrExpiry(qrData.expires_at);
      } else {
        setQrCode("");
        setQrExpiry("");
      }
    };

    if (user) {
      fetchTodayQR();
    }
  }, [user]);

  const handleGenerateQR = async () => {
    if (!user) return;

    const now = new Date();
    const startTime = new Date();
    startTime.setHours(11, 0, 0, 0);

    const expiryTime = new Date();
    expiryTime.setHours(14, 0, 0, 0);

    if (now < startTime) {
      toast.error("QR can only be generated after 11:00 AM");
      return;
    }

    if (now >= expiryTime) {
      toast.error("QR generation time expired. Try again tomorrow.");
      return;
    }

    setLoading(true);

    await supabase.from("qr_codes").update({ is_active: false }).eq("is_active", true);

    const code = `ATT-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const today = new Date().toISOString().split("T")[0];

    const { error } = await supabase.from("qr_codes").insert({
      code,
      generated_by: user.id,
      expires_at: expiryTime.toISOString(),
      attendance_date: today,
    });

    if (error) {
      console.error(error);
      toast.error("Failed to generate QR code");
    } else {
      setQrCode(code);
      setQrExpiry(expiryTime.toISOString());
      toast.success("Daily QR Code generated successfully!");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex">
      <AdminSidebar />

      <div className="flex-1 p-8 pt-[100px] md:ml-64 text-center">
        <h1 className="text-3xl font-bold mb-6 flex justify-center gap-3">
          <QrCodeIcon className="h-8 w-8 text-primary" />
          QR Code Panel
        </h1>

        <Card className="p-5 max-w-md mx-auto border-[2px] border-[#111] shadow-xl rounded-xl bg-card">
          <h2 className="font-bold text-lg mb-3">Today's QR Code</h2>

          <div className="w-48 h-48 mx-auto border-[2px] border-[#111] rounded-lg flex justify-center items-center bg-white">
            {qrCode ? (
              <QRCodeSVG value={qrCode} size={160} level="H" />
            ) : (
              <QrCodeIcon className="w-28 h-28 text-muted-foreground" />
            )}
          </div>

          {qrCode && qrExpiry && (
            <p className="text-xs text-muted-foreground mt-2">
              Expires: {new Date(qrExpiry).toLocaleTimeString()}
            </p>
          )}

          <Button
            onClick={handleGenerateQR}
            className="w-full mt-4"
            disabled={loading || !isAllowedTime}
          >
            {loading ? "Generating..." : "Generate QR Code"}
          </Button>

          {!isAllowedTime && (
            <p className="text-xs text-red-600 mt-2">
              QR can only be generated between <b>11AM - 2PM</b>
            </p>
          )}
        </Card>
      </div>
    </div>
  );
}
