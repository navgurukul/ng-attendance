// import { Link, useLocation } from "react-router-dom";
// import { Button } from "@/components/ui/button";
// import { Menu, X } from "lucide-react";
// import { useState, useEffect, useRef } from "react";

// interface NavbarProps {
//   isAuthenticated: boolean;
//   userRole?: "student" | "admin";
//   userName?: string;
//   userEmail?: string;
//   onLogout?: () => void;
// }

// export const Navbar = ({
//   isAuthenticated,
//   userRole,
//   userName = "",
//   userEmail = "",
//   onLogout,
// }: NavbarProps) => {
//   const location = useLocation();
//   const [isOpen, setIsOpen] = useState(false);
//   const [profileOpen, setProfileOpen] = useState(false);

//   const dropdownRef = useRef<HTMLDivElement | null>(null);

//   useEffect(() => {
//     setProfileOpen(false);
//   }, [location.pathname]);

//   useEffect(() => {
//     function handleClickOutside(event: MouseEvent) {
//       if (
//         dropdownRef.current &&
//         !dropdownRef.current.contains(event.target as Node)
//       ) {
//         setProfileOpen(false);
//       }
//     }

//     if (profileOpen) {
//       document.addEventListener("mousedown", handleClickOutside);
//     }

//     return () => {
//       document.removeEventListener("mousedown", handleClickOutside);
//     };
//   }, [profileOpen]);

//   const isActive = (path: string) => location.pathname === path;

//   const firstLetter = userName ? userName.charAt(0).toUpperCase() : "U";

//   return (
//     <nav className="bg-background fixed top-0 left-0 w-full z-50 shadow-md">

//       <div className="container mx-auto px-4">
//         <div className="flex h-20 items-center justify-between">

//           <Link to="/" className="flex items-center gap-3">
//             <img src="/Anish.png" alt="Logo" className="h-16 w-16" />
//             <span className="text-2xl font-bold">Smart Attendance</span>
//           </Link>
//           <div className="hidden md:flex items-center gap-4">

//             {!isAuthenticated ? (
//               <>
//                 <Link to="/">
//                   <Button variant={isActive("/") ? "default" : "outline"} size="sm">
//                     Home
//                   </Button>
//                 </Link>

//                 <Link to="/login">
//                   <Button variant={isActive("/login") ? "default" : "outline"} size="sm">
//                     Login
//                   </Button>
//                 </Link>

//                 <Link to="/signup">
//                   <Button variant="default" size="sm">
//                     Sign Up
//                   </Button>
//                 </Link>
//               </>
//             ) : (
//               <>
//                 <Link to={userRole === "admin" ? "/admin" : "/dashboard"}>
//                   <Button
//                     variant={isActive("/dashboard") || isActive("/admin") ? "default" : "ghost"}
//                     size="sm"
//                   >
//                     Dashboard
//                   </Button>
//                 </Link>

//                 <div className="relative" ref={dropdownRef}>
//                   <button
//                     onClick={() => setProfileOpen(!profileOpen)}
//                     className="h-10 w-10 rounded-full bg-blue-700 text-background flex items-center justify-center font-bold text-lg"
//                   >
//                     {firstLetter}
//                   </button>
//                   {profileOpen && (
//                     <div
//                       className="
//                         absolute right-0 mt-3
//                         w-56 max-w-[90vw]
//                         bg-white shadow-xl rounded-xl border
//                         p-4 z-50
//                       "
//                     >
//                       <p className="font-semibold text-lg break-words">
//                         {userName || "User"}
//                       </p>

//                       <p className="text-sm text-gray-600 break-words">
//                         {userEmail || "Email not available"}
//                       </p>

//                       <Button
//                         className="
//                           w-full mt-3
//                           bg-red-500 text-white hover:bg-red-800
//                           rounded-[10px] shadow-md
//                         "
//                         size="sm"
//                         onClick={onLogout}
//                       >
//                         Logout
//                       </Button>
//                     </div>
//                   )}
//                 </div>
//               </>
//             )}
//           </div>
//           <button onClick={() => setIsOpen(!isOpen)} className="md:hidden p-2 rounded">
//             {isOpen ? <X size={28} /> : <Menu size={28} />}
//           </button>
//         </div>

//         {isOpen && (
//           <div className="md:hidden flex flex-col gap-3 pb-4">
//             {!isAuthenticated ? (
//               <>
//                 <Link to="/" onClick={() => setIsOpen(false)}>
//                   <Button className="w-full" variant={isActive("/") ? "default" : "ghost"}>
//                     Home
//                   </Button>
//                 </Link>

//                 <Link to="/login" onClick={() => setIsOpen(false)}>
//                   <Button className="w-full" variant={isActive("/login") ? "default" : "outline"}>
//                     Login
//                   </Button>
//                 </Link>

//                 <Link to="/signup" onClick={() => setIsOpen(false)}>
//                   <Button className="w-full" variant="default">
//                     Sign Up
//                   </Button>
//                 </Link>
//               </>
//             ) : (
//               <>
//                 <Link
//                   to={userRole === "admin" ? "/admin" : "/dashboard"}
//                   onClick={() => setIsOpen(false)}
//                 >
//                   <Button className="w-full" variant="default">
//                     Dashboard
//                   </Button>
//                 </Link>

//                 <div className="w-full bg-white shadow-md rounded-xl border p-4">

//                   <p className="font-semibold text-lg break-words">
//                     {userName || "User"}
//                   </p>

//                   <p className="text-sm text-gray-600 break-words">
//                     {userEmail || "Email not available"}
//                   </p>

//                   <Button
//                     className="w-full mt-3 bg-red-500 text-white hover:bg-red-600 rounded-lg shadow-md"
//                     size="sm"
//                     onClick={onLogout}
//                   >
//                     Logout
//                   </Button>
//                 </div>
//               </>
//             )}
//           </div>
//         )}
//       </div>
//     </nav>
//   );
// };

import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useState, useEffect, useRef } from "react";

interface NavbarProps {
  isAuthenticated: boolean;
  userRole?: "student" | "admin";
  userName?: string;
  userEmail?: string;
  onLogout?: () => void;
}

export const Navbar = ({
  isAuthenticated,
  userRole,
  userName = "",
  userEmail = "",
  onLogout,
}: NavbarProps) => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setProfileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setProfileOpen(false);
      }
    }

    if (profileOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [profileOpen]);

  const isActive = (path: string) => location.pathname === path;

  const firstLetter = userName ? userName.charAt(0).toUpperCase() : "U";

  return (
    <nav className="bg-background fixed top-0 left-0 w-full z-50 shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex h-20 items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <img src="/Anish_logo.png" alt="Logo" className="h-16 w-16" />
            <span className="text-2xl font-bold">Smart Attendance</span>
          </Link>
          <div className="hidden md:flex items-center gap-4">
            {!isAuthenticated ? (
              <>
                <Link to="/">
                  <Button
                    variant={isActive("/") ? "default" : "outline"}
                    size="sm"
                  >
                    Home
                  </Button>
                </Link>

                <Link to="/login">
                  <Button
                    variant={isActive("/login") ? "default" : "outline"}
                    size="sm"
                  >
                    Login
                  </Button>
                </Link>

                <Link to="/signup">
                  <Button
                    variant={isActive("/signup") ? "default" : "outline"}
                    size="sm"
                  >
                    Sign Up
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link to={userRole === "admin" ? "/admin" : "/dashboard"}>
                  <Button
                    variant={
                      isActive("/dashboard") || isActive("/admin")
                        ? "default"
                        : "ghost"
                    }
                    size="sm"
                  >
                    Dashboard
                  </Button>
                </Link>

                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setProfileOpen(!profileOpen)}
                    className="h-10 w-10 rounded-full bg-blue-700 text-background flex items-center justify-center font-bold text-lg"
                  >
                    {firstLetter}
                  </button>
                  {profileOpen && (
                    <div
                      className="
                        absolute right-0 mt-3
                        w-56 max-w-[90vw]
                        bg-white shadow-xl rounded-xl border
                        p-4 z-50
                      "
                    >
                      <p className="font-semibold text-lg break-words">
                        {userName || "User"}
                      </p>

                      <p className="text-sm text-gray-600 break-words">
                        {userEmail || "Email not available"}
                      </p>

                      <Button
                        className="
                          w-full mt-3
                          bg-red-500 text-white hover:bg-red-800
                          rounded-[10px] shadow-md
                        "
                        size="sm"
                        onClick={onLogout}
                      >
                        Logout
                      </Button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 rounded"
          >
            {isOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>

        {isOpen && (
          <div className="md:hidden flex flex-col gap-3 pb-4">
            {!isAuthenticated ? (
              <>
                <Link to="/">
                  <Button
                    variant={isActive("/") ? "outline" : "default"}
                    size="sm"
                  >
                    Home
                  </Button>
                </Link>

                <Link to="/login">
                  <Button
                    variant={isActive("/login") ? "outline" : "default"}
                    size="sm"
                  >
                    Login
                  </Button>
                </Link>

                <Link to="/signup">
                  <Button
                    variant={isActive("/signup") ? "outline" : "default"}
                    size="sm"
                  >
                    Sign Up
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link
                  to={userRole === "admin" ? "/admin" : "/dashboard"}
                  onClick={() => setIsOpen(false)}
                >
                  <Button className="w-full" variant="default">
                    Dashboard
                  </Button>
                </Link>

                <div className="w-full bg-white shadow-md rounded-xl border p-4">
                  <p className="font-semibold text-lg break-words">
                    {userName || "User"}
                  </p>

                  <p className="text-sm text-gray-600 break-words">
                    {userEmail || "Email not available"}
                  </p>

                  <Button
                    className="w-full mt-3 bg-red-500 text-white hover:bg-red-600 rounded-lg shadow-md"
                    size="sm"
                    onClick={onLogout}
                  >
                    Logout
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};
