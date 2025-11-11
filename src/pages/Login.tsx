import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { GraduationCap } from "lucide-react";

interface LoginProps {
  onLogin: (role: 'student' | 'admin') => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Mock authentication logic
    setTimeout(() => {
      if (email && password) {
        // Simple check: admin@example.com is admin, others are students
        const role = email === "admin@example.com" ? "admin" : "student";
        onLogin(role);
        toast.success("Login successful!");
        navigate(role === "admin" ? "/admin" : "/dashboard");
      } else {
        toast.error("Please enter valid credentials");
      }
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 border-[4px] border-foreground shadow-brutal-lg">
        <div className="flex justify-center mb-6">
          <div className="bg-primary p-4 border-[3px] border-foreground shadow-brutal">
            <GraduationCap className="h-12 w-12 text-primary-foreground" />
          </div>
        </div>
        
        <h1 className="text-3xl font-bold text-center mb-2">Welcome Back</h1>
        <p className="text-center text-muted-foreground mb-8">
          Sign in to access your dashboard
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-bold">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="student@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="border-[3px] border-foreground h-12 shadow-brutal-sm focus:shadow-brutal"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-bold">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="border-[3px] border-foreground h-12 shadow-brutal-sm focus:shadow-brutal"
            />
          </div>

          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link to="/signup" className="text-primary font-bold hover:underline">
              Sign up
            </Link>
          </p>
        </div>

        <div className="mt-4 p-4 bg-muted border-[3px] border-foreground">
          <p className="text-xs font-bold mb-1">Demo Credentials:</p>
          <p className="text-xs">Student: any email + any password</p>
          <p className="text-xs">Admin: admin@example.com + any password</p>
        </div>
      </Card>
    </div>
  );
}