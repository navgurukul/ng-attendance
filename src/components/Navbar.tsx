import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useState } from "react";

interface NavbarProps {
  isAuthenticated: boolean;
  userRole?: "student" | "admin";
  onLogout?: () => void;
}

export const Navbar = ({ isAuthenticated, userRole, onLogout }: NavbarProps) => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="border-b-[4px] border-foreground bg-background">
      <div className="container mx-auto px-4">
        <div className="flex h-20 items-center justify-between">
          {/* LEFT SIDE LOGO */}
          <Link to="/" className="flex items-center gap-3">
            <img src="/Anish.png" alt="Logo" className="h-16 w-17" />
            <span className="text-2xl font-bold">Smart Attendance</span>
          </Link>

          {/* DESKTOP NAV LINKS */}
          <div className="hidden md:flex items-center gap-4">
            {!isAuthenticated ? (
              <>
                <Link to="/">
                  <Button variant={isActive("/") ? "default" : "ghost"} size="sm">
                    Home
                  </Button>
                </Link>
                <Link to="/login">
                  <Button variant={isActive("/login") ? "default" : "outline"} size="sm">
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
                  <Button variant={isActive("/") ? "default" : "ghost"} size="sm">
                    Home
                  </Button>
                </Link>
                <Link to={userRole === "admin" ? "/admin" : "/dashboard"}>
                  <Button
                    variant={
                      isActive("/dashboard") || isActive("/admin") ? "default" : "ghost"
                    }
                    size="sm"
                  >
                    Dashboard
                  </Button>
                </Link>
                <Button variant="outline" size="sm" onClick={onLogout}>
                  Logout
                </Button>
              </>
            )}
          </div>

          {/* MOBILE MENU ICON */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 rounded focus:outline-none"
          >
            {isOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>

        {/* MOBILE MENU DROPDOWN */}
        {isOpen && (
          <div className="md:hidden flex flex-col gap-3 pb-4 animate-slide-down">
            {!isAuthenticated ? (
              <>
                <Link to="/" onClick={() => setIsOpen(false)}>
                  <Button className="w-full" variant={isActive("/") ? "default" : "ghost"}>
                    Home
                  </Button>
                </Link>
                <Link to="/login" onClick={() => setIsOpen(false)}>
                  <Button
                    className="w-full"
                    variant={isActive("/login") ? "default" : "outline"}
                  >
                    Login
                  </Button>
                </Link>
                <Link to="/signup" onClick={() => setIsOpen(false)}>
                  <Button className="w-full" variant="default">
                    Sign Up
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link to="/" onClick={() => setIsOpen(false)}>
                  <Button className="w-full" variant={isActive("/") ? "default" : "ghost"}>
                    Home
                  </Button>
                </Link>
                <Link
                  to={userRole === "admin" ? "/admin" : "/dashboard"}
                  onClick={() => setIsOpen(false)}
                >
                  <Button
                    className="w-full"
                    variant={
                      isActive("/dashboard") || isActive("/admin") ? "default" : "ghost"
                    }
                  >
                    Dashboard
                  </Button>
                </Link>
                <Button className="w-full" variant="outline" onClick={onLogout}>
                  Logout
                </Button>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};
