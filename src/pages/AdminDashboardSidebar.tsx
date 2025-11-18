// import React from "react";
// import { useNavigate } from "react-router-dom";

// import {
//     FaQrcode,
//     FaUserGraduate,
//     FaFileAlt,
//     FaSyncAlt,
//     FaChartLine,
//     FaClipboardList,
//     FaHome,
// } from "react-icons/fa";
// import "./AdminDashboardSidebar.css"; // सुनिश्चित करें कि यह CSS फ़ाइल मौजूद है

// const AdminDashboardSidebar = () => {
//     const navigate = useNavigate();

//     return (
//         <div className="sidebar">
//             <h3 className="sidebar-title">Admin Panel</h3>
//             <ul>
//                 {/* 1. Dashboard (डैशबोर्ड) */}
//                 <li className="admin-black" onClick={() => navigate("/admin")}> 
//                     {/* नोट: रूट को अक्सर '/admin-dashboard' के बजाय '/admin' पर सेट किया जाता है */}
//                     <FaHome /> Dashboard
//                 </li>
                
//                 {/* 2. QR Generator (क्यूआर जेनरेटर) */}
//                 <li onClick={() => navigate("/admin/qr-generator")}>
//                     <FaQrcode /> QR Generator
//                 </li>
                
//                 {/* 3. Leave Requests (छुट्टी के अनुरोध) */}
//                 <li onClick={() => navigate("/admin/leave-requests")}>
//                     <FaClipboardList /> Leave Requests
//                 </li>
                
//                 {/* 4. Correction Requests (सुधार अनुरोध) */}
//                 <li onClick={() => navigate("/admin/correction-requests")}>
//                     <FaSyncAlt /> Correction Requests
//                 </li>

//                 {/* 5. Life Cycle Tracking (लाइफ साइकल ट्रैकिंग) */}
//                 <li onClick={() => navigate("/admin/lifecycle-tracking")}>
//                     <FaChartLine /> Life Cycle Tracking
//                 </li>

//                 {/* 6. Student Records (छात्र रिकॉर्ड) */}
//                 <li onClick={() => navigate("/admin/student-records")}>
//                     <FaUserGraduate /> Student Records
//                 </li>
                
//                 {/* 7. Reports & End Flow (रिपोर्ट्स और एंड फ्लो) */}
//                 <li onClick={() => navigate("/admin/reports-endflow")}>
//                     <FaFileAlt /> Reports & End Flow
//                 </li>
//             </ul>
//         </div>
//     );
// };

// export default AdminDashboardSidebar;