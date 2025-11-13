"use client";

import { useState } from "react";
import CaregiverHeader from "../components/CaregiverHeader";
import Sidebar from "../tela-cuidador/src/components/Sidebar";
import ChatModal from "../components/ChatModal";

// Simple layout wrapper for caregiver pages: header + sidebar + content + chat
export default function CaregiverLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);

  return (
    <div className="caregiver-layout">
      <CaregiverHeader toggleSidebar={toggleSidebar} />
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
      <main style={{ paddingTop: "var(--header-height)" }}>{children}</main>
      <ChatModal />
    </div>
  );
}
