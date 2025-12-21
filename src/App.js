import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { UnitsProvider } from "./components/UnitsContext";
import Home from "./components/Home";
import UnitFinder from "./components/UnitFinder";
import About from "./components/About";
import PostUnits from "./components/PostUnits";
import Bookings from "./components/Bookings";
import Inquiries from "./components/Inquiries";
import ForgotPassword from "./components/ForgotPassword";
import StudentProjects from './components/StudentProjects';
import AdminRegister from "./components/AdminRegister";
import UserRegister from "./components/UserRegister";
import AdminDashboard from "./components/AdminDashboard";
import AdminUnitFinderManager from "./components/AdminUnitFinderManager";
import AdminAccountManage from "./components/AdminAccountManage";
import MyAccount from "./components/MyAccount";
import PrivacyPolicy from "./components/PrivacyPolicy";
import AdminReport from './components/AdminReport';

function App() {
  return (
    <UnitsProvider>
      <Router>
        <Routes>
          {/* Redirect root path to UnitFinder */}
          <Route path="/" element={<Navigate to="/unitfinder" replace />} />
          
          {/* Auth pages */}
          <Route path="/home" element={<Home />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Registration pages */}
          <Route path="/register/user" element={<UserRegister />} />
          <Route path="/register/admin" element={<AdminRegister />} />

          {/* Main pages */}
          <Route path="/unitfinder" element={<UnitFinder />} />
          <Route path="/about" element={<About />} />
          <Route path="/post-unit" element={<PostUnits />} />
          <Route path="/bookings" element={<Bookings />} />
          <Route path="/message-inquiries" element={<Inquiries />} />
          <Route path="/my-account" element={<MyAccount/>} />

          {/* Admin dashboard and management pages */}
          <Route path="/admin-dashboard" element={<AdminDashboard />} />
          <Route path="/admin/unit-finder-manager" element={<AdminUnitFinderManager />} />
          <Route path="/admin/account-manage" element={<AdminAccountManage />} />
          <Route path="/admin/report" element={<AdminReport />} />

          {/* Project-related pages */}
          <Route path="/StudentProjects" element={<StudentProjects />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        </Routes>
      </Router>
    </UnitsProvider>
  );
}

export default App;