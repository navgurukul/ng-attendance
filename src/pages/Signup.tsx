
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { GraduationCap, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  // Add this check at the very top
  if (!email.endsWith("@navgurukul.org")) {
    toast.error("Only navgurukul.org emails are allowed");
    return;
  }

  if (password !== confirmPassword) {
    toast.error("Passwords do not match");
    return;
  }

  if (password.length < 6) {
    toast.error("Password must be at least 6 characters");
    return;
  }

  setLoading(true);

  const { error } = await signUp(email, password, name);

  if (error) {
    toast.error(error.message || "Failed to create account");
  } else {
    toast.success("Account created! Check your email to verify.");
    navigate("/login");
  }

  setLoading(false);
};


  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 pt-[100px]">
      <Card className="w-full max-w-sm p-5 border-[2 px] border-[#333] shadow-lg rounded-xl">

        <div className="flex justify-center mb-5">
          <div className="bg-[#D81B60] p-3 border border-[#333] rounded-md shadow">
            <GraduationCap className="h-8 w-8 text-primary-foreground" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-center mb-1">Create Account</h1>
        <p className="text-center text-muted-foreground mb-5 text-sm">
          Join Smart Attendance System today
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Name */}
          <div className="space-y-1">
            <Label className="text-sm font-bold">Full Name</Label>
            <Input
              type="text"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="border-[1.5px] border-[#333] h-11"
            />
          </div>

          {/* Email */}
          <div className="space-y-1">
            <Label className="text-sm font-bold">Email</Label>
            <Input
              type="email"
              placeholder="student@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="border-[1.5px] border-[#333] h-11"
            />
          </div>

          {/* Password */}
          <div className="space-y-1 relative">
            <Label className="text-sm font-bold">Password</Label>
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="border-[1.5px] border-[#333] h-11 pr-10"
            />

            <button
              type="button"
              className="absolute right-3 top-9 text-gray-600 hover:text-black"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {/* Confirm Password */}
          <div className="space-y-1 relative">
            <Label className="text-sm font-bold">Confirm Password</Label>
            <Input
              type={showConfirmPassword ? "text" : "password"}
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="border-[1.5px] border-[#333] h-11 pr-10"
            />

            <button
              type="button"
              className="absolute right-3 top-9 text-gray-600 hover:text-black"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <Button className="w-full h-11" disabled={loading}>
            {loading ? "Creating Account..." : "Sign Up"}
          </Button>
        </form>

        <div className="mt-4 text-center">
          <p className="text-xs text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="text-[#D81B60] font-bold hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </Card>
    </div>
  );
}
