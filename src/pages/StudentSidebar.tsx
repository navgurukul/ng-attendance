import { NavLink } from "react-router-dom";
import {
    LayoutDashboard,
    QrCode,
    CalendarIcon,
    Pencil,
    Target,
    History,
    ChefHat,
} from "lucide-react";

const menuItems = [
    { name: "Dashboard", icon: LayoutDashboard, path: "/student/dashboard" },
    { name: "QR Scanner", icon: QrCode, path: "/student/qr-scanner" },
    { name: "Kitchen Duty", icon: ChefHat, path: "/student/kitchen-duty" },
    { name: "Leave Request", icon: CalendarIcon, path: "/student/leave" },
    { name: "Correction Request", icon: Pencil, path: "/student/correction" },
    { name: "Student Tracking", icon: Target, path: "/student/tracking" },
    { name: "View History", icon: History, path: "/student/view-history" },
];

export default function StudentSidebar() {
    return (
        <div className="w-64 h-screen bg-white border-r shadow-sm flex flex-col">
            {/* Header */}
            <div className="text-center py-6 border-b">
                <h1 className="text-2xl font-bold">Student Panel</h1>
            </div>

            {/* Menu */}
            <nav className="flex flex-col mt-4">
                {menuItems.map((item) => {
                    const Icon = item.icon;

                    return (
                        <NavLink
                            key={item.name}
                            to={item.path}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-6 py-3 text-lg font-medium transition-all
                ${isActive
                                    ? "bg-black text-white"
                                    : "text-gray-700 hover:bg-gray-100"
                                }`
                            }
                        >
                            <Icon size={22} />
                            {item.name}
                        </NavLink>
                    );
                })}
            </nav>
        </div>
    );
}
