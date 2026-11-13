import { Navigate, Route, Routes } from "react-router-dom";
import { Loader, Shell } from "./components/ui";
import { destinationFor, useAuth } from "./lib/auth";
import { ForgotPasswordPage, PhonePage, ResetPasswordPage, RolePage, SignInPage, SignUpPage } from "./pages/AuthPages";
import { BrandCampaignDetail, BrandCampaigns, BrandHome, BrandOnboarding, BrandPayments, BrandProfilePage, CampaignForm, CreatorProfilePage, brandLinks } from "./pages/BrandPages";
import { AgreementPage, CreatorCampaignDetail, CreatorHome, CreatorOnboarding, CreatorPayments, CreatorProfilePage as CreatorProfile, CreatorWork, CreatorWorkDetail, creatorLinks } from "./pages/CreatorPages";
import { LandingPage } from "./pages/Landing";
import { MessagesPage } from "./pages/MessagesPage";
import { AdminDashboardPage } from "./pages/AdminPages";
import { PrivacyPolicyPage, TermsPage, ContactPage } from "./pages/LegalPages";
import type { ReactNode } from "react";

function Gate({ role, children, onboarding = false }: { role?: "BRAND" | "CREATOR" | "ADMIN"; children: ReactNode; onboarding?: boolean }) {
  const { user, loading } = useAuth();
  if (loading) return <Loader variant="screen" />;
  if (!user) return <Navigate to="/sign-in" replace />;
  if (user.role === "ADMIN") {
    if (role && role !== "ADMIN") return <Navigate to="/admin" replace />;
    return children;
  }
  if (!user.role) return <Navigate to="/get-started" replace />;
  if (role && user.role !== role) return <Navigate to={destinationFor(user)} replace />;
  if (!onboarding && !user.onboardingComplete) return <Navigate to={user.role === "BRAND" ? "/brand/onboarding" : "/creator/onboarding"} replace />;
  if (onboarding && user.onboardingComplete) return <Navigate to={destinationFor(user)} replace />;
  return children;
}

export function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/get-started" element={<RolePage />} />
      <Route path="/sign-up" element={<SignUpPage />} />
      <Route path="/sign-in" element={<SignInPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/phone" element={<PhonePage />} />
      <Route path="/brand/onboarding" element={<Gate role="BRAND" onboarding><BrandOnboarding /></Gate>} />
      <Route path="/creator/onboarding" element={<Gate role="CREATOR" onboarding><CreatorOnboarding /></Gate>} />
      <Route path="/brand" element={<Gate role="BRAND"><Shell links={brandLinks}><BrandHome /></Shell></Gate>} />
      <Route path="/brand/creators/:id" element={<Gate role="BRAND"><Shell links={brandLinks}><CreatorProfilePage /></Shell></Gate>} />
      <Route path="/brand/campaigns" element={<Gate role="BRAND"><Shell links={brandLinks}><BrandCampaigns /></Shell></Gate>} />
      <Route path="/brand/campaigns/new" element={<Gate role="BRAND"><Shell links={brandLinks}><CampaignForm /></Shell></Gate>} />
      <Route path="/brand/campaigns/:id" element={<Gate role="BRAND"><Shell links={brandLinks}><BrandCampaignDetail /></Shell></Gate>} />
      <Route path="/brand/messages" element={<Gate role="BRAND"><Shell links={brandLinks}><MessagesPage base="/brand/messages" /></Shell></Gate>} />
      <Route path="/brand/messages/:conversationId" element={<Gate role="BRAND"><Shell links={brandLinks}><MessagesPage base="/brand/messages" /></Shell></Gate>} />
      <Route path="/brand/payments" element={<Gate role="BRAND"><Shell links={brandLinks}><BrandPayments /></Shell></Gate>} />
      <Route path="/brand/profile" element={<Gate role="BRAND"><Shell links={brandLinks}><BrandProfilePage /></Shell></Gate>} />
      <Route path="/creator" element={<Gate role="CREATOR"><Shell links={creatorLinks}><CreatorHome /></Shell></Gate>} />
      <Route path="/creator/campaigns/:id" element={<Gate role="CREATOR"><Shell links={creatorLinks}><CreatorCampaignDetail /></Shell></Gate>} />
      <Route path="/creator/messages" element={<Gate role="CREATOR"><Shell links={creatorLinks}><MessagesPage base="/creator/messages" /></Shell></Gate>} />
      <Route path="/creator/messages/:conversationId" element={<Gate role="CREATOR"><Shell links={creatorLinks}><MessagesPage base="/creator/messages" /></Shell></Gate>} />
      <Route path="/creator/payments" element={<Gate role="CREATOR"><Shell links={creatorLinks}><CreatorPayments /></Shell></Gate>} />
      <Route path="/creator/work" element={<Gate role="CREATOR"><Shell links={creatorLinks}><CreatorWork /></Shell></Gate>} />
      <Route path="/creator/work/:id" element={<Gate role="CREATOR"><Shell links={creatorLinks}><CreatorWorkDetail /></Shell></Gate>} />
      <Route path="/creator/profile" element={<Gate role="CREATOR"><Shell links={creatorLinks}><CreatorProfile /></Shell></Gate>} />
      <Route path="/creator/agreements/:id" element={<Gate role="CREATOR"><Shell links={creatorLinks}><AgreementPage /></Shell></Gate>} />
      <Route path="/admin" element={<Gate role="ADMIN"><AdminDashboardPage /></Gate>} />
      <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
      <Route path="/terms-and-conditions" element={<TermsPage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
