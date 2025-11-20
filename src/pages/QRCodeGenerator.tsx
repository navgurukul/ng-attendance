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

  
  useEffect(() => {
    const fetchTodayQR = async () => {
      const today = new Date().toISOString().split('T')[0];
      
      const { data: qrData, error } = await supabase
        .from('qr_codes')
        .select('*')
        .eq('attendance_date', today)
        .eq('is_active', true)
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

    setLoading(true);

    await supabase
      .from('qr_codes')
      .update({ is_active: false })
      .eq('is_active', true);

    const code = `ATT-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); 
    const today = new Date().toISOString().split('T')[0];

    const { error } = await supabase
      .from('qr_codes')
      .insert({
        code,
        generated_by: user.id,
        expires_at: expiresAt.toISOString(),
        attendance_date: today,
      });

    if (error) {
      console.error(error);
      toast.error("Failed to generate QR code");
    } else {
      setQrCode(code);
      setQrExpiry(expiresAt.toISOString());
      toast.success("Daily QR Code generated successfully!");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex">
     
      <AdminSidebar />

      <div className="flex-1 p-8 flex flex-col items-center">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
            <QrCodeIcon className="h-8 w-8 text-primary" />
            QR Code Management
          </h1>
          <p className="text-muted-foreground">Generate and manage daily attendance QR codes.</p>
        </div>

        <Card className="p-6 border-[3px] border-foreground shadow-brutal bg-card max-w-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-primary p-2 border-[3px] border-foreground">
              <QrCodeIcon className="h-6 w-6 text-primary-foreground" />
            </div>
            <h2 className="text-2xl font-bold">Daily QR Code</h2>
          </div>

          <div className="space-y-6">
            <div className="p-6 border-[3px] border-foreground bg-background">
              <div className="text-center mb-4">
                <div className="font-bold text-lg mb-2">Today's QR Code</div>
                <div className="text-sm text-muted-foreground">
                  {qrCode ? "Active QR code for attendance" : "Generate a new QR code for today"}
                </div>
              </div>

              <div className="w-64 h-64 mx-auto border-[3px] border-foreground bg-white flex items-center justify-center mb-4 p-4">
                {qrCode ? (
                  <QRCodeSVG value={qrCode} size={224} level="H" />
                ) : (
                  <QrCodeIcon className="h-48 w-48 text-muted-foreground" />
                )}
              </div>

              {qrCode && qrExpiry && (
                <div className="text-xs text-center text-muted-foreground mb-4">
                  Expires: {new Date(qrExpiry).toLocaleString()}
                </div>
              )}

              <Button
                size="lg"
                onClick={handleGenerateQR}
                className="w-full"
                disabled={loading}
              >
                {qrCode ? "Generate New QR Code" : "Generate QR Code"}
              </Button>
            </div>

            <div className="p-4 border-[3px] border-foreground bg-muted">
              <div className="text-sm font-bold mb-2">Note:</div>
              <div className="text-sm text-muted-foreground">
                Generate one QR code per day. Students scan it once to mark their daily attendance.
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}