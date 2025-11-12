import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { GraduationCap } from "lucide-react";

interface NavbarProps {
  isAuthenticated: boolean;
  userRole?: 'student' | 'admin';
  onLogout?: () => void;
}

export const Navbar = ({ isAuthenticated, userRole, onLogout }: NavbarProps) => {
  const location = useLocation();
  
  const isActive = (path: string) => location.pathname === path;
  

  return (
    <nav className="border-b-[4px] border-foreground bg-background">
      <div className="container mx-auto px-4">
        <div className="flex h-20 items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
              <img src="/Anish.png" alt="Logo" className="h-16 w-17" />
            <span className="text-2xl font-bold">Smart Attendance</span>
          </Link>
          
          <div className="flex items-center gap-4">
            {!isAuthenticated ? (
              <>
                <Link to="/">
                  <Button variant={isActive('/') ? 'default' : 'ghost'} size="sm">
                    Home
                  </Button>
                </Link>
                <Link to="/login">
                  <Button variant={isActive('/login') ? 'default' : 'outline'} size="sm">
                    Login
                  </Button>
                </Link>
                <Link to="/signup">
                  <Button variant="default" size="sm">
                    Sign Up
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link to="/">
                  <Button variant={isActive('/') ? 'default' : 'ghost'} size="sm">
                    Home
                  </Button>
                </Link>
                <Link to={userRole === 'admin' ? '/admin' : '/dashboard'}>
                  <Button variant={isActive('/dashboard') || isActive('/admin') ? 'default' : 'ghost'} size="sm">
                    Dashboard
                  </Button>
                </Link>
                <Button variant="outline" size="sm" onClick={onLogout}>
                  Logout
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};