import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'

import { ToastProvider } from './components/shared/Toast'
import { ModalProvider } from './components/shared/Modal'
import CinematicIntro from './components/shared/CinematicIntro'
import LandingPage from './pages/LandingPage'

import Login from './pages/auth/Login'
import Signup from './pages/auth/Signup'
import Pending from './pages/auth/Pending'
import ForgotPassword from './pages/auth/ForgotPassword'

import ClientDashboard from './pages/client/ClientDashboard'
import ClientDocuments from './pages/client/ClientDocuments'
import ClientQueries from './pages/client/ClientQueries'
import ClientReports from './pages/client/ClientReports'
import ClientActivityLog from './pages/client/ClientActivityLog'
import ClientWorkingTB from './pages/client/ClientWorkingTB'

import TeamDashboard from './pages/team/TeamDashboard'
import TeamFiles from './pages/team/TeamFiles'
import TeamWorkspaceRequirements from './pages/team/workspace/TeamWorkspaceRequirements'
import TeamWorkspaceQueries from './pages/team/workspace/TeamWorkspaceQueries'
import TeamWorkspaceProcedures from './pages/team/workspace/TeamWorkspaceProcedures'
import TeamWorkspaceDeliverables from './pages/team/workspace/TeamWorkspaceDeliverables'
import TeamWorkspaceAuditTrail from './pages/team/workspace/TeamWorkspaceAuditTrail'
import TeamWorkspaceWorkingTB from './pages/team/workspace/TeamWorkspaceWorkingTB'
import TeamTasks from './pages/team/TeamTasks'
import TeamNotifications from './pages/team/TeamNotifications'
import TeamClientDashboard from './pages/team/TeamClientDashboard'
import TeamMeetings from './pages/team/TeamMeetings'
import TeamScheduleMeeting from './pages/team/TeamScheduleMeeting'
import TeamChat from './pages/team/TeamChat'

import ManagerDashboard from './pages/manager/ManagerDashboard'
import ManagerStatusBoard from './pages/manager/ManagerStatusBoard'
import ManagerWorkload from './pages/manager/ManagerWorkload'
import ManagerTeamPlan from './pages/manager/ManagerTeamPlan'
import ManagerEscalation from './pages/manager/ManagerEscalation'
import ManagerPerformance from './pages/manager/ManagerPerformance'
import ManagerMeetings from './pages/manager/ManagerMeetings'
import ManagerNotifications from './pages/manager/ManagerNotifications'

import FODashboard from './pages/frontoffice/FODashboard'
import FORegistration from './pages/frontoffice/FORegistration'
import FOLeads from './pages/frontoffice/FOLeads'
import FOProposals from './pages/frontoffice/FOProposals'
import FOProposalDetail from './pages/frontoffice/FOProposalDetail'
import FOMeetings from './pages/frontoffice/FOMeetings'
import FONotifications from './pages/frontoffice/FONotifications'
import FOClientDocuments from './pages/frontoffice/FOClientDocuments'

import ManagementDashboard from './pages/management/ManagementDashboard'
import ManagementAnalytics from './pages/management/ManagementAnalytics'
import ManagementStaff from './pages/management/ManagementStaff'
import ManagementLog from './pages/management/ManagementLog'
import ManagementNotifications from './pages/management/ManagementNotifications'

import { TBProvider } from './context/TBContext'

function AnimatedRoutes() {
  const location = useLocation()

  return (
    <>
      {location.pathname === '/' && <CinematicIntro />}
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<LandingPage />} />

          {/* Auth */}
          <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/pending" element={<Pending />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* Client */}
        <Route path="/client/dashboard" element={<TBProvider><ClientDashboard /></TBProvider>} />
        <Route path="/client/documents" element={<TBProvider><ClientDocuments /></TBProvider>} />
        <Route path="/client/requirements" element={<Navigate to="/client/documents" replace />} />
        <Route path="/client/queries" element={<TBProvider><ClientQueries /></TBProvider>} />
        <Route path="/client/reports" element={<TBProvider><ClientReports /></TBProvider>} />
        <Route path="/client/draft-review" element={<Navigate to="/client/reports" replace />} />
        <Route path="/client/deliverables" element={<Navigate to="/client/reports" replace />} />
        <Route path="/client/activity" element={<TBProvider><ClientActivityLog /></TBProvider>} />
        <Route path="/client/working-tb" element={<TBProvider><ClientWorkingTB /></TBProvider>} />

        {/* Audit Team (Module 3) */}
        <Route path="/team/dashboard" element={<TeamDashboard />} />
        <Route path="/team/files" element={<TeamFiles />} />
        <Route path="/team/workspace/requirements" element={<TBProvider><TeamWorkspaceRequirements /></TBProvider>} />
        <Route path="/team/workspace/queries" element={<TBProvider><TeamWorkspaceQueries /></TBProvider>} />
        <Route path="/team/workspace/procedures" element={<TBProvider><TeamWorkspaceProcedures /></TBProvider>} />
        <Route path="/team/workspace/working-tb" element={<TBProvider><TeamWorkspaceWorkingTB /></TBProvider>} />
        <Route path="/team/workspace/deliverables" element={<TBProvider><TeamWorkspaceDeliverables /></TBProvider>} />
        <Route path="/team/workspace/audit-trail" element={<TBProvider><TeamWorkspaceAuditTrail /></TBProvider>} />
        <Route path="/team/tasks" element={<TeamTasks />} />
        <Route path="/team/notifications" element={<TeamNotifications />} />
        <Route path="/team/client/al-marai" element={<TeamClientDashboard />} />
        <Route path="/team/meetings" element={<TeamMeetings />} />
        <Route path="/team/schedule-meeting" element={<TeamScheduleMeeting />} />
        <Route path="/team/chat" element={<TeamChat />} />

        {/* Manager (Module 4) */}
        <Route path="/manager/dashboard" element={<ManagerDashboard />} />
        <Route path="/manager/status-board" element={<ManagerStatusBoard />} />
        <Route path="/manager/workload" element={<ManagerWorkload />} />
        <Route path="/manager/team-plan" element={<ManagerTeamPlan />} />
        <Route path="/manager/escalation" element={<ManagerEscalation />} />
        <Route path="/manager/performance" element={<ManagerPerformance />} />
        <Route path="/manager/meetings" element={<ManagerMeetings />} />
        <Route path="/manager/notifications" element={<ManagerNotifications />} />

        {/* Front Office */}
        <Route path="/fo/dashboard" element={<FODashboard />} />
        <Route path="/fo/registration" element={<FORegistration />} />
        <Route path="/fo/leads" element={<FOLeads />} />
        <Route path="/fo/proposals" element={<FOProposals />} />
        <Route path="/fo/proposal/:id" element={<FOProposalDetail />} />
        <Route path="/fo/meetings" element={<FOMeetings />} />
        <Route path="/fo/client-documents" element={<FOClientDocuments />} />
        <Route path="/fo/notifications" element={<FONotifications />} />

        {/* Management */}
        <Route path="/management/dashboard" element={<ManagementDashboard />} />
        <Route path="/management/analytics" element={<ManagementAnalytics />} />
        <Route path="/management/staff" element={<ManagementStaff />} />
        <Route path="/management/log" element={<ManagementLog />} />
        <Route path="/management/notifications" element={<ManagementNotifications />} />

        <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AnimatePresence>
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <ModalProvider>
          <AnimatedRoutes />
        </ModalProvider>
      </ToastProvider>
    </BrowserRouter>
  )
}
