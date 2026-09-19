import { useState } from "react";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

const DashboardLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setSidebarOpen((prev) => !prev);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="sn-shell">

      {/* ======================================================
          GLOBAL NAVBAR
      ======================================================= */}

      <Navbar
        onMenuClick={toggleSidebar}
      />


      {/* ======================================================
          GLOBAL SIDEBAR
      ======================================================= */}

      <Sidebar
        isOpen={sidebarOpen}
        onClose={closeSidebar}
      />


      {/* ======================================================
          APPLICATION CONTENT
      ======================================================= */}

      <main
        className={`sn-main ${
          sidebarOpen
            ? "sn-main-sidebar-open"
            : "sn-main-sidebar-closed"
        }`}
      >

        <div className="sn-content">

          {children}

        </div>

      </main>

    </div>
  );
};

export default DashboardLayout;