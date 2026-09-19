import { BrowserRouter, Routes, Route } from "react-router-dom";

// Authentication
import Login from "./pages/Login/Login";

// Dashboard
import RoleDashboard from "./pages/Dashboard/RoleDashboard";

// Main modules
import Audience from "./pages/Audience/Audience";
import Campaign from "./pages/Campaign/Campaign";
import AIStudio from "./pages/AIStudio/AIStudio";
import Templates from "./pages/Templates/Templates";
import Analytics from "./pages/Analytics/Analytics";
import Users from "./pages/Users/Users";
import Settings from "./pages/Settings/Settings";
import Reports from "./pages/Reports/Reports";
import Channels from "./pages/Channels/Channels";

// Delivery / Feedback
import DeliveryTracking from "./pages/DeliveryTracking/DeliveryTracking";
import EngagementFeedback from "./pages/EngagementFeedback/EngagementFeedback";
import Feedback from "./pages/Feedback/Feedback";

// PUBLIC recipient feedback page
import FeedbackResponse from "./pages/FeedbackResponse/FeedbackResponse";
import FeedbackAuth
  from "./pages/FeedbackAuth/FeedbackAuth";
import About from "./pages/About/About";

// Layout / security
import DashboardLayout from "./layouts/DashboardLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import { ROLES } from "./utils/roleConfig";
import ForgotPassword from "./pages/ForgotPassword/ForgotPassword";
import ResetPassword from "./pages/ResetPassword/ResetPassword";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* =====================================================
            LOGIN
        ====================================================== */}
        <Route
          path="/"
          element={<Login />}
        />

  <Route
  path="/forgot-password"
  element={<ForgotPassword />}
/>

<Route
  path="/reset-password"
  element={<ResetPassword />}
/>
        {/* =====================================================
            DASHBOARD
        ====================================================== */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <RoleDashboard />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />


        {/* =====================================================
            AUDIENCE
        ====================================================== */}
        <Route
          path="/audience"
          element={
            <ProtectedRoute
              allowedRoles={[
                ROLES.ADMIN,
                ROLES.CAMPAIGN_MANAGER,
                ROLES.COMMUNICATION_TEAM,
              ]}
            >
              <DashboardLayout>
                <Audience />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />


        {/* =====================================================
            CAMPAIGN
        ====================================================== */}
        <Route
          path="/campaign"
          element={
            <ProtectedRoute
              allowedRoles={[
                ROLES.ADMIN,
                ROLES.CAMPAIGN_MANAGER,
                ROLES.COMMUNICATION_TEAM,
              ]}
            >
              <DashboardLayout>
                <Campaign />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />


        {/* =====================================================
            AI STUDIO
        ====================================================== */}
        <Route
          path="/ai-studio"
          element={
            <ProtectedRoute
              allowedRoles={[
                ROLES.ADMIN,
                ROLES.CAMPAIGN_MANAGER,
              ]}
            >
              <DashboardLayout>
                <AIStudio />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />


        {/* =====================================================
            INTERNAL FEEDBACK
            Communication Team / Admin / Campaign Manager
        ====================================================== */}
        <Route
          path="/feedback"
          element={
            <ProtectedRoute
              allowedRoles={[
                ROLES.ADMIN,
                ROLES.CAMPAIGN_MANAGER,
                ROLES.COMMUNICATION_TEAM,
              ]}
            >
              <DashboardLayout>
                <Feedback />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />


        {/* =====================================================
            PUBLIC RECIPIENT FEEDBACK RESPONSE
           
            IMPORTANT:
            DO NOT put ProtectedRoute here.

            Email link:
            /feedback-response?token=xxxxx

            The recipient must be able to open this page
            without being logged into the internal dashboard.
        ====================================================== */}
        <Route
          path="/feedback-response"
          element={<FeedbackResponse />}
        />
<Route
  path="/feedback-auth"
  element={<FeedbackAuth />}
/>

        {/* =====================================================
            TEMPLATES
        ====================================================== */}
        <Route
          path="/templates"
          element={
            <ProtectedRoute
              allowedRoles={[
                ROLES.ADMIN,
                ROLES.CAMPAIGN_MANAGER,
                ROLES.COMMUNICATION_TEAM,
              ]}
            >
              <DashboardLayout>
                <Templates />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />


        {/* =====================================================
            ANALYTICS
        ====================================================== */}
        <Route
          path="/analytics"
          element={
            <ProtectedRoute
              allowedRoles={[
                ROLES.ADMIN,
                ROLES.CAMPAIGN_MANAGER,
                ROLES.COMMUNICATION_TEAM,
              ]}
            >
              <DashboardLayout>
                <Analytics />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />


        {/* =====================================================
            DELIVERY TRACKING
        ====================================================== */}
        <Route
          path="/delivery-tracking"
          element={
            <ProtectedRoute
              allowedRoles={[
                ROLES.ADMIN,
                ROLES.CAMPAIGN_MANAGER,
                ROLES.COMMUNICATION_TEAM,
              ]}
            >
              <DashboardLayout>
                <DeliveryTracking />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />


        {/* =====================================================
            ENGAGEMENT & FEEDBACK
            Internal Communication Team analytics
        ====================================================== */}
        <Route
          path="/engagement-feedback"
          element={
            <ProtectedRoute
              allowedRoles={[
                ROLES.ADMIN,
                ROLES.CAMPAIGN_MANAGER,
                ROLES.COMMUNICATION_TEAM,
              ]}
            >
              <DashboardLayout>
                <EngagementFeedback />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />


        {/* =====================================================
            USERS
        ====================================================== */}
        <Route
          path="/users"
          element={
            <ProtectedRoute
              allowedRoles={[
                ROLES.ADMIN,
              ]}
            >
              <DashboardLayout>
                <Users />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />


        {/* =====================================================
            SETTINGS
        ====================================================== */}
        <Route
          path="/settings"
          element={
            <ProtectedRoute
              allowedRoles={[
                ROLES.ADMIN,
              ]}
            >
              <DashboardLayout>
                <Settings />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />


        {/* =====================================================
            CHANNELS
        ====================================================== */}
        <Route
          path="/channels"
          element={
            <ProtectedRoute
              allowedRoles={[
                ROLES.ADMIN,
                ROLES.CAMPAIGN_MANAGER,
                ROLES.COMMUNICATION_TEAM,
              ]}
            >
              <DashboardLayout>
                <Channels />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />


        {/* =====================================================
            REPORTS
        ====================================================== */}
        <Route
          path="/reports"
          element={
            <ProtectedRoute
              allowedRoles={[
                ROLES.ADMIN,
                ROLES.CAMPAIGN_MANAGER,
                ROLES.COMMUNICATION_TEAM,
              ]}
            >
              <DashboardLayout>
                <Reports />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />


        {/* =====================================================
            ABOUT
        ====================================================== */}
        <Route
          path="/about"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <About />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />


        {/* =====================================================
            FALLBACK
        ====================================================== */}
        <Route
          path="*"
          element={<Login />}
        />

      </Routes>
    </BrowserRouter>
  );
}


export default App;