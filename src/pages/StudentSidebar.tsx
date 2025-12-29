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
    { name: "QR Scanner", icon: QrCode, path: "/student/qr-scanner" },
    { name: "Kitchen Duty", icon: ChefHat, path: "/student/kitchen-duty" },
    { name: "Leave Request", icon: CalendarIcon, path: "/student/leave" },
    { name: "Correction Request", icon: Pencil, path: "/student/correction" },
    { name: "Student Tracking", icon: Target, path: "/student/tracking" },
    { name: "View History", icon: History, path: "/student/view-history" },
];


export default function StudentSidebar() {
    return (
        <>
            <div className="hidden md:flex w-64 h-screen bg-background shadow-md flex-col fixed left-0 top-0 pt-20">
                <div className="text-center py-6 border-b border-gray-200">
                    <h1 className="text-2xl font-bold">Student Panel</h1>
                </div>

                <nav className="flex flex-col mt-4">
                    {menuItems.map((item) => {
                        const Icon = item.icon;

                        return (
                            <NavLink
                                key={item.name}
                                to={item.path}
                                className={({ isActive }) =>
                                    `flex items-center gap-3 px-6 py-3 text-lg font-medium transition-all
                                    ${isActive ? "bg-[#D81B60] text-white" : "text-gray-700 hover:bg-gray-100"}`
                                }
                            >
                                <Icon size={22} />
                                {item.name}
                            </NavLink>
                        );
                    })}
                </nav>
            </div>

            <div className="md:hidden fixed bottom-0 left-0 w-full bg-white border-t shadow-lg z-50">
                <div className="flex justify-around items-center py-2">

                    {menuItems.map((item) => {
                        const Icon = item.icon;

                        return (
                            <NavLink
                                key={item.name}
                                to={item.path}
                                className={({ isActive }) =>
                                    `flex flex-col items-center text-xs p-2
                                     ${isActive ? "text-black" : "text-gray-600"}`
                                }
                            >
                                <Icon size={22} />
                            </NavLink>
                        );
                    })}

                </div>
            </div>
        </>
    );
}

