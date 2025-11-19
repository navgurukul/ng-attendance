import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectItem,
  SelectContent,
} from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type StudentStatus = "Dropout" | "New Admission" | "Placement" | "";
type Department = "SOP" | "SOB" | "SOE" | "SOSC" | "";

export default function StudentTrackingForm() {
  const [studentStatus, setStudentStatus] = useState<StudentStatus>("");
  const [department, setDepartment] = useState<Department>("");

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    date: "",
    companyName: "",
    jobType: "",
    reason: "",
  });

  const [documentFile, setDocumentFile] = useState<File | null>(null);

  // ======= Handle Input Change =======
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // ========= Submit Handler =========
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!studentStatus || !department) {
      toast.error("Please select Status and Department");
      return;
    }

    let document_url = null;

    if (documentFile) {
      const fileName = `tracking_docs/${Date.now()}_${documentFile.name}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("tracking_documents")
        .upload(fileName, documentFile);

      if (uploadError) {
        toast.error("Document upload failed");
        return;
      }

      const { data: urlData } = supabase.storage
        .from("tracking_documents")
        .getPublicUrl(uploadData.path);

      document_url = urlData.publicUrl;
    }

    const { error } = await supabase.from("life_cycle_tracking").insert({
      first_name: form.firstName,
      last_name: form.lastName,
      email: form.email,
      date: form.date,
      status: studentStatus,
      department: department,

      company_name: studentStatus === "Placement" ? form.companyName : null,
      job_type: studentStatus === "Placement" ? form.jobType : null,

      reason: studentStatus === "Dropout" ? form.reason : null,

      document_url:
        studentStatus === "New Admission" || studentStatus === "Placement"
          ? document_url
          : null,
    });

    if (error) {
      toast.error("Failed to submit");
      console.log(error);
      return;
    }

    toast.success("Student Tracking Submitted!");

    // Reset form
    setForm({
      firstName: "",
      lastName: "",
      email: "",
      date: "",
      companyName: "",
      jobType: "",
      reason: "",
    });
    setStudentStatus("");
    setDepartment("");
    setDocumentFile(null);
  };

  return (
    <div className="container mx-auto py-10 max-w-2xl">
      <Card className="p-6 shadow-lg">
        <h2 className="text-3xl font-bold mb-6 text-center">
          Student Tracking Form
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* First Name */}
          <div>
            <Label>First Name</Label>
            <Input
              name="firstName"
              value={form.firstName}
              onChange={handleChange}
              required
            />
          </div>

          {/* Last Name */}
          <div>
            <Label>Last Name</Label>
            <Input
              name="lastName"
              value={form.lastName}
              onChange={handleChange}
              required
            />
          </div>

          {/* Email */}
          <div>
            <Label>Email ID</Label>
            <Input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          {/* Date */}
          <div>
            <Label>Date</Label>
            <Input
              type="date"
              name="date"
              value={form.date}
              onChange={handleChange}
              required
            />
          </div>

          {/* Student Status */}
          <div>
            <Label>Student Status</Label>
            <Select
              onValueChange={(val: StudentStatus) => setStudentStatus(val)}
              value={studentStatus}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Dropout">Dropout</SelectItem>
                <SelectItem value="New Admission">New Admission</SelectItem>
                <SelectItem value="Placement">Placement</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Department */}
          <div>
            <Label>Department</Label>
            <Select
              onValueChange={(val: Department) => setDepartment(val)}
              value={department}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SOP">SOP</SelectItem>
                <SelectItem value="SOB">SOB</SelectItem>
                <SelectItem value="SOE">SOE</SelectItem>
                <SelectItem value="SOS">SOS</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Placement Section */}
          {studentStatus === "Placement" && (
            <div className="space-y-6">
              <div>
                <Label>Company Name</Label>
                <Input
                  name="companyName"
                  value={form.companyName}
                  onChange={handleChange}
                />
              </div>

              <div>
                <Label>Job Type (Tech / Non-Tech)</Label>
                <Select
                  onValueChange={(value) =>
                    setForm({ ...form, jobType: value })
                  }
                  value={form.jobType}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Job Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Tech">Tech</SelectItem>
                    <SelectItem value="Non-Tech">Non-Tech</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Document Upload for New Admission + Placement */}
          {(studentStatus === "New Admission" ||
            studentStatus === "Placement") && (
            <div>
              <Label>Upload Document</Label>
              <Input
                type="file"
                onChange={(e) =>
                  setDocumentFile(e.target.files?.[0] || null)
                }
              />
            </div>
          )}

          {/* Dropout Reason */}
          {studentStatus === "Dropout" && (
            <div>
              <Label>Reason for Dropout</Label>
              <Textarea
                rows={3}
                value={form.reason}
                onChange={(e) =>
                  setForm({ ...form, reason: e.target.value })
                }
              />
            </div>
          )}

          <Button type="submit" className="w-full text-lg py-6">
            Submit
          </Button>
        </form>
      </Card>
    </div>
  );
}
