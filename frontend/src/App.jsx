import { useState } from "react";
import { BrowserRouter } from "react-router-dom";
import AppRoutes from "./route/AppRoutes";
import EmergencyOverlay from "./components/EmergencyOverlay";

function App() {
  const [userRole, setUserRole] = useState(() => {
    const storedUser = JSON.parse(localStorage.getItem("user") || "null");
    if (storedUser && storedUser.role) {
      const roleMap = {
        DRIVER: "driver",
        STAFF: "staff",
        MANAGER: "manager",
        ADMIN: "admin",
        SECURITY: "security",
      };
      return roleMap[storedUser.role] || null;
    }
    return null;
  });

  const handleLogin = (role) => {
    setUserRole(role);
  };

  const handleLogout = () => {
    const user = JSON.parse(localStorage.getItem("user") || "null");
    if (user?.role) localStorage.removeItem(`accessToken_${user.role}`);
    setUserRole(null);
    localStorage.removeItem("user");
    localStorage.removeItem("accessToken");
  };

  return (
    <BrowserRouter>
      <AppRoutes
        userRole={userRole}
        onLogin={handleLogin}
        onLogout={handleLogout}
      />
      <EmergencyOverlay userRole={userRole} />
    </BrowserRouter>
  );
}

export default App;