import { Navigate } from "react-router-dom";
import { useSettings } from "@/contexts/SettingsContext";

const Index = () => {
  const { settings } = useSettings();

  // Redirect first-time users to intro page
  if (!settings.hasSeenIntro) {
    return <Navigate to="/intro" replace />;
  }

  return <Navigate to="/dashboard" replace />;
};

export default Index;
