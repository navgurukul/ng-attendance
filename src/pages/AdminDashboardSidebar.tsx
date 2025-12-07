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
    // { name: "Dashboard", icon: LayoutDashboard, path: "/Admin" },
    { name: "QR Generator", icon: QrCode, path: "/admin/qr-generator" },
    { name: "Leave Requests", icon: CalendarIcon, path: "/admin/leave" },
    { name: "Correction Requests", icon: Pencil, path: "/admin/correction" },
    // { name: "Life Cycle Tracking", icon: Target, path: "/admin/tracking" },
    { name: "Students Records", icon: History, path: "/admin/view-history" },
    { name: "Document", icon: BookAIcon, path: "/admin/document" },
];

export default function AdminSidebar() {
    return (
        <>
            <div className="hidden fixed left-0 top-0 md:flex w-64 h-screen bg-white border-r shadow-sm flex-col pt-[80px]">

                <div className="text-center py-6 border-b">
                    <h1 className="text-3xl font-bold">Admin Panel</h1>
                </div>

                <nav className="flex flex-col mt-4">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        return (
                            <NavLink
                                key={item.name}
                                to={item.path}
                                className={({ isActive }) => {
                                    const isDashboard = item.path === "/Admin";

                                    if (isDashboard) {
                                        return `flex items-center gap-3 px-6 py-3 text-lg font-medium transition-all ${
                                            isActive
                                                ? "bg-gray-200 text-black"
                                                : "text-gray-700 hover:bg-gray-100"
                                        }`;
                                    }

                                    return `flex items-center gap-3 px-6 py-3 text-lg font-medium transition-all ${
                                        isActive
                                            ? "bg-orange-500 text-white"
                                            : "text-gray-700 hover:bg-gray-100"
                                    }`;
                                }}
                            >
                                <Icon size={22} />
                                {item.name}
                            </NavLink>
                        );
                    })}
                </nav>

            </div>

            {/* MOBILE BOTTOM MENU */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t shadow-md flex justify-between px-4 py-2 z-50">
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    return (
                        <NavLink
                            key={item.name}
                            to={item.path}
                            className={({ isActive }) =>
                                `flex flex-col items-center p-2 ${
                                    isActive ? "text-orange" : "text-gray-500"
                                }`
                            }
                        >
                            <Icon size={22} />
                        </NavLink>
                    );
                })}
            </div>
        </>
    );
}
