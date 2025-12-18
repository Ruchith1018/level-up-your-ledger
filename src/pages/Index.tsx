import { Navigate } from "react-router-dom";
import { useSettings } from "@/contexts/SettingsContext";

const Index = () => {
  const { settings, isLoading } = useSettings();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Redirect first-time users to intro page
  if (!settings.hasSeenIntro) {
    return <Navigate to="/intro" replace />;
  }

  return <Navigate to="/dashboard" replace />;
};

export default Index;
