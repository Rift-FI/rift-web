import { useEffect } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";

export default function SuspendedPage() {
  const navigate = useNavigate();

  // If user somehow has valid auth, redirect to app
  useEffect(() => {
    const token = localStorage.getItem("token");
    const address = localStorage.getItem("address");
    
    if (token && address) {
      // Token exists, they should be able to access app
      // If they got here by mistake, redirect back
      navigate("/app", { replace: true });
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-app-background flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full text-center"
      >
        {/* Suspended Icon */}
        <motion.div 
          className="relative mx-auto w-24 h-24 mb-8"
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          {/* Icon Container */}
          <div className="w-full h-full rounded-full bg-danger/10 border-2 border-danger/20 flex items-center justify-center">
            {/* Shield with X */}
            <svg
              className="w-12 h-12 text-danger"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 9l-6 6M9 9l6 6"
              />
            </svg>
          </div>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-3xl font-bold text-text-default mb-4"
        >
          Account Suspended
        </motion.h1>

        {/* Message */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-text-subtle text-lg mb-10 leading-relaxed"
        >
          Your account has been suspended and cannot access this service.
        </motion.p>

        {/* Divider */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="w-full h-px bg-surface-subtle mb-10"
        />

        {/* What you can do section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="space-y-4"
        >
          <p className="text-text-subtle text-sm uppercase tracking-wider font-medium">
            Need Help?
          </p>

          {/* Contact Support Button */}
          <a
            href="mailto:admin@riftfi.xyz"
            className="group relative inline-flex items-center justify-center gap-3 w-full py-4 px-6 rounded-xl bg-gradient-to-r from-accent-primary to-accent-secondary text-white font-semibold text-base overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-accent-primary/25"
          >
            {/* Button Shine Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            <span className="relative">Contact Support</span>
          </a>

          {/* Alternative Login */}
          <button
            onClick={() => {
              localStorage.removeItem("token");
              localStorage.removeItem("address");
              navigate("/auth", { replace: true });
            }}
            className="w-full py-3 px-6 rounded-xl bg-surface-subtle border border-surface text-text-subtle font-medium hover:bg-surface-alt hover:text-text-default transition-all duration-300"
          >
            Try Different Account
          </button>
        </motion.div>

        {/* Footer Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-12 space-y-2"
        >
          <p className="text-text-subtle text-xs">
            If you believe this is a mistake, please contact our support team.
          </p>
          <p className="text-text-subtle/60 text-xs">
            admin@riftfi.xyz
          </p>
        </motion.div>

        {/* Subtle Branding */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-16 flex items-center justify-center gap-2 text-text-subtle"
        >
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-accent-primary to-accent-secondary flex items-center justify-center">
            <span className="text-white text-xs font-bold">R</span>
          </div>
          <span className="text-sm font-medium">RiftFi</span>
        </motion.div>
      </motion.div>
    </div>
  );
}
