import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { GraduationCap, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Add this check at the very top
    if (!email.endsWith("@navgurukul.org")) {
      toast.error("Only navgurukul.org emails are allowed");
      setLoading(false);
      return;
    }

    const { error } = await signIn(email, password);

    if (error) toast.error(error.message || "Failed to log in");
    else toast.success("Logged in successfully!");

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center pt-[80px]">
      <Card className="w-full max-w-sm p-6 border-[2 px] border-[#333] shadow-lg rounded-xl">
        <div className="flex justify-center mb-5">
          <div className="bg-[#D81B60] p-3 border border-[#333] rounded-md shadow">
            <GraduationCap className="h-8 w-8 text-primary-foreground" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-center mb-1">Welcome Back</h1>
        <p className="text-center text-muted-foreground mb-6 text-sm">
          Sign in to access your dashboard
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-sm font-medium">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="student@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-11 border-[1.5px] border-[#333]"
            />
          </div>

          {/* Password with eye icon */}
          <div className="space-y-1.5 relative">
            <Label htmlFor="password" className="text-sm font-medium">
              Password
            </Label>
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="h-11 border-[1.5px] border-[#333] pr-10"
            />

            {/* Eye / Hide Icon */}
            <button
              type="button"
              className="absolute right-3 top-9 text-gray-600 hover:text-black"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          <Button type="submit" className="w-full h-11" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </Button>
        </form>

        <div className="mt-5 text-center">
          <p className="text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link
              to="/signup"
              className="text-[#D81B60] font-semibold hover:underline"
            >
              Sign up
            </Link>
          </p>
        </div>
      </Card>
    </div>
  );
}


