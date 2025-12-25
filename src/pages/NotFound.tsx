import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);

    // Minimum loading duration
    const timer = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen space-y-6 bg-background">
        <div className="relative">
          <div className="absolute inset-0 bg-yellow-500/20 blur-xl rounded-full animate-pulse" />
          <img
            src="/assets/token.png"
            alt="Loading..."
            className="w-24 h-24 animate-[spin_2s_linear_infinite] relative z-10 object-contain"
          />
        </div>
        <p className="text-muted-foreground animate-pulse font-medium">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center space-y-6 max-w-md px-4"
      >
        {/* 404 Icon - Using token image */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/10 blur-2xl rounded-full" />
            <img
              src="/assets/token.png"
              alt="404"
              className="w-32 h-32 relative z-10 object-contain opacity-50"
            />
          </div>
        </div>

        {/* 404 Text */}
        <div className="space-y-2">
          <h1 className="text-6xl font-bold bg-gradient-to-r from-primary to-primary/50 bg-clip-text text-transparent">
            404
          </h1>
          <h2 className="text-2xl font-semibold text-foreground">
            Page Not Found
          </h2>
          <p className="text-muted-foreground">
            Oops! The page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
          <Button
            onClick={() => navigate(-1)}
            variant="outline"
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </Button>
          <Button
            onClick={() => navigate("/dashboard")}
            className="gap-2"
          >
            <Home className="w-4 h-4" />
            Go to Dashboard
          </Button>
        </div>

        {/* Path Info */}
        <div className="pt-8 text-xs text-muted-foreground/60">
          <p>Attempted path: <code className="bg-muted px-1.5 py-0.5 rounded">{location.pathname}</code></p>
        </div>
      </motion.div>
    </div>
  );
};

export default NotFound;
