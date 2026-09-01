import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import PublicLayout from './layouts/PublicLayout';
import CitizenLayout from './layouts/CitizenLayout';
import OfficerLayout from './layouts/OfficerLayout';
import AdminLayout from './layouts/AdminLayout';
import WorkerLayout from './layouts/WorkerLayout';

// Public Pages
import LandingPage from './pages/LandingPage';
import AboutPage from './pages/AboutPage';
import LoginPage from './pages/auth/LoginPage';

// Citizen Portal
import CitizenDashboard from './pages/citizen/CitizenDashboard';
import CitizenTwinPage from './pages/citizen/CitizenTwinPage';
import CitizenAssistantPage from './pages/citizen/CitizenAssistantPage';
import CitizenScannerPage from './pages/citizen/CitizenScannerPage';
import CitizenReportAnalyzerPage from './pages/citizen/CitizenReportAnalyzerPage';
import CitizenHospitalsPage from './pages/citizen/CitizenHospitalsPage';
import CitizenSchemesPage from './pages/citizen/CitizenSchemesPage';
import CitizenHistoryPage from './pages/citizen/CitizenHistoryPage';
import CitizenTimelinePage from './pages/citizen/CitizenTimelinePage';
import CitizenProfilePage from './pages/citizen/CitizenProfilePage';
import CitizenHealthExchangePage from './pages/citizen/CitizenHealthExchangePage';
import AppointmentBookingPage from './pages/citizen/AppointmentBookingPage';
import DoctorDashboard from './pages/doctor/DoctorDashboard';
import HospitalDashboard from './pages/hospital/HospitalDashboard';
import PharmacyEmergencyPage from './pages/hospital/PharmacyEmergencyPage';
import CitizenLaboratoryPage from './pages/citizen/CitizenLaboratoryPage';
import CitizenPharmacyPage from './pages/citizen/CitizenPharmacyPage';
import CitizenAlertCenter from './pages/citizen/CitizenAlertCenter';
import MotherChildDashboard from './pages/citizen/MotherChildDashboard';
import EmergencyModePage from './pages/citizen/EmergencyModePage';
import EmergencyDoctorChatPage from './pages/citizen/EmergencyDoctorChatPage';
import EmergencyPharmacyPage from './pages/citizen/EmergencyPharmacyPage';
import EmergencyPassportPage from './pages/citizen/EmergencyPassportPage';
import GovernmentSchemePage from './pages/citizen/GovernmentSchemePage';
import SymptomAssessmentPage from './pages/citizen/SymptomAssessmentPage';
import FamilyDashboard from './pages/citizen/FamilyDashboard';
import TelemedicinePage from './pages/citizen/TelemedicinePage';
import WearableDashboard from './pages/citizen/WearableDashboard';
import NotificationCenter from './pages/citizen/NotificationCenter';
import HealthAnalyticsDashboard from './pages/citizen/HealthAnalyticsDashboard';
import CitizenSchemeDetailsPage from './pages/citizen/CitizenSchemeDetailsPage';

// Officer Portal
import OfficerDashboard from './pages/officer/OfficerDashboard';
import OfficerHeatmapPage from './pages/officer/OfficerHeatmapPage';
import OfficerSimulatorPage from './pages/officer/OfficerSimulatorPage';
import OfficerCampaignPage from './pages/officer/OfficerCampaignPage';
import OfficerKnowledgeGraphPage from './pages/officer/OfficerKnowledgeGraphPage';
import OfficerNewsPage from './pages/officer/OfficerNewsPage';
import OfficerDigitalTwinPage from './pages/officer/OfficerDigitalTwinPage';
import OfficerReportsPage from './pages/officer/OfficerReportsPage';
import NationalHealthDashboard from './pages/officer/NationalHealthDashboard';
import DiseaseSurveillanceDashboard from './pages/officer/DiseaseSurveillanceDashboard';
import HospitalIntelligenceDashboard from './pages/officer/HospitalIntelligenceDashboard';
import MedicineSupplyDashboard from './pages/officer/MedicineSupplyDashboard';
import EmergencyIntelligenceDashboard from './pages/officer/EmergencyIntelligenceDashboard';
import MinistryDashboard from './pages/officer/MinistryDashboard';
import AshaDashboard from './pages/officer/AshaDashboard';

// ASHA / Health Worker Portal
import AshaWorkerDashboard from './pages/worker/AshaDashboard';
import AshaFieldScreeningPage from './pages/worker/AshaFieldScreeningPage';
import AshaPatientsPage from './pages/worker/AshaPatientsPage';
import AshaPatientDetailPage from './pages/worker/AshaPatientDetailPage';

// Offline Health Page
import OfflineHealthPage from './pages/citizen/OfflineHealthPage';

// Admin Portal
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminMonitoringPage from './pages/admin/AdminMonitoringPage';
import AdminLogsPage from './pages/admin/AdminLogsPage';
import AdminSettingsPage from './pages/admin/AdminSettingsPage';
import SuperAdminDashboard from './pages/admin/SuperAdminDashboard';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<LoginPage />} />
        </Route>

        {/* Citizen Portal */}
        <Route path="/citizen" element={<CitizenLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<CitizenDashboard />} />
          <Route path="twin" element={<CitizenTwinPage />} />
          <Route path="assistant" element={<CitizenAssistantPage />} />
          <Route path="scanner" element={<CitizenScannerPage />} />
          <Route path="report-analyzer" element={<CitizenReportAnalyzerPage />} />
          <Route path="hospitals" element={<CitizenHospitalsPage />} />
          <Route path="schemes" element={<CitizenSchemesPage />} />
          <Route path="schemes/:id" element={<CitizenSchemeDetailsPage />} />
          <Route path="history" element={<CitizenHistoryPage />} />
          <Route path="timeline" element={<CitizenTimelinePage />} />
          <Route path="profile" element={<CitizenProfilePage />} />
          <Route path="interoperability" element={<CitizenHealthExchangePage />} />
          <Route path="book-appointment" element={<AppointmentBookingPage />} />
          <Route path="laboratory" element={<CitizenLaboratoryPage />} />
          <Route path="pharmacy" element={<CitizenPharmacyPage />} />
          <Route path="alerts" element={<CitizenAlertCenter />} />
          <Route path="mother-child" element={<MotherChildDashboard />} />
          <Route path="emergency" element={<EmergencyModePage />} />
          <Route path="emergency/:sessionId/doctor-chat" element={<EmergencyDoctorChatPage />} />
          <Route path="emergency/:sessionId/pharmacy" element={<EmergencyPharmacyPage />} />
          <Route path="emergency-pharmacy" element={<EmergencyPharmacyPage />} />
          <Route path="emergency-passport" element={<EmergencyPassportPage />} />
          <Route path="government-schemes" element={<GovernmentSchemePage />} />
          <Route path="symptom-assessment" element={<SymptomAssessmentPage />} />
          <Route path="family" element={<FamilyDashboard />} />
          <Route path="telemedicine" element={<TelemedicinePage />} />
          <Route path="wearables" element={<WearableDashboard />} />
          <Route path="notifications" element={<NotificationCenter />} />
          <Route path="health-analytics" element={<HealthAnalyticsDashboard />} />
          <Route path="offline-health" element={<OfflineHealthPage />} />
        </Route>

        {/* Officer Portal */}
        <Route path="/officer" element={<OfficerLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<OfficerDashboard />} />
          <Route path="surveillance" element={<DiseaseSurveillanceDashboard />} />
          <Route path="surveillance-gis" element={<DiseaseSurveillanceDashboard />} />
          <Route path="disease-surveillance" element={<DiseaseSurveillanceDashboard />} />
          <Route path="heatmaps" element={<OfficerHeatmapPage />} />
          <Route path="heatmap" element={<OfficerHeatmapPage />} />
          <Route path="asha-monitoring" element={<AshaDashboard />} />
          <Route path="asha" element={<AshaDashboard />} />
          <Route path="reports" element={<OfficerReportsPage />} />
          <Route path="campaigns" element={<OfficerCampaignPage />} />
          <Route path="digital-twin" element={<OfficerDigitalTwinPage />} />
          <Route path="simulator" element={<OfficerSimulatorPage />} />
          <Route path="graph" element={<OfficerKnowledgeGraphPage />} />
          <Route path="news" element={<OfficerNewsPage />} />
          <Route path="national-health" element={<NationalHealthDashboard />} />
          <Route path="hospital-occupancy" element={<HospitalIntelligenceDashboard />} />
          <Route path="medicine-supply" element={<MedicineSupplyDashboard />} />
          <Route path="emergency-intel" element={<EmergencyIntelligenceDashboard />} />
          <Route path="ministry" element={<MinistryDashboard />} />
          <Route path="*" element={<Navigate to="/officer/dashboard" replace />} />
        </Route>

        {/* ASHA / Health Worker Portal */}
        <Route path="/worker" element={<WorkerLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AshaWorkerDashboard />} />
          <Route path="patients" element={<AshaPatientsPage />} />
          <Route path="patients/:patientId" element={<AshaPatientDetailPage />} />
          <Route path="screening" element={<AshaFieldScreeningPage />} />
          <Route path="offline-health" element={<OfflineHealthPage />} />
        </Route>

        {/* Admin Portal */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="monitoring" element={<AdminMonitoringPage />} />
          <Route path="audit-logs" element={<AdminLogsPage />} />
          <Route path="settings" element={<AdminSettingsPage />} />
          <Route path="super-admin" element={<SuperAdminDashboard />} />
        </Route>

        {/* Doctor & Hospital Portals */}
        <Route path="/doctor/dashboard" element={<DoctorDashboard />} />
        <Route path="/hospital/dashboard" element={<HospitalDashboard />} />
        <Route path="/pharmacy/emergency" element={<PharmacyEmergencyPage />} />

        {/* Catch-all fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
