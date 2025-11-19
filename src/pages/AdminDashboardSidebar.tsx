import { NavLink } from "react-router-dom";
import {
    LayoutDashboard,
    QrCode,
    CalendarIcon,
    Pencil,
    Target,
    History,
    BookAIcon
} from "lucide-react";

const menuItems = [
    { name: "Dashboard", icon: LayoutDashboard, path: "/Admin" },
    { name: "QR Generator", icon: QrCode, path: "/admin/qr-generator" },
    { name: "Leave Requests", icon: CalendarIcon, path: "/admin/leave" },
    { name: "Correction Requests", icon: Pencil, path: "/admin/correction" },
    { name: "Life Cycle Tracking", icon: Target, path: "/admin/tracking" },
    { name: "Students Records", icon: History, path: "/admin/view-history" },
    { name: "Document", icon: BookAIcon, path: "/admin/document" },
];

export default function AdminSidebar() {
    return (
        <div className="w-64 h-screen bg-white border-r shadow-sm flex flex-col">
            {/* Header */}
            <div className="text-center py-6 border-b">
                <h1 className="text-2xl font-bold">Admin Panel</h1>
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
