import { BrowserRouter, Routes, Route } from "react-router";
import { Toaster } from "@/components/ui/sonner.js";
import { AuthProvider } from "@/contexts/AuthContext.js";
import ProtectedRoute from "@/components/ProtectedRoute.js";
import LandingPage from "@/pages/LandingPage.js";
import HomePage from "@/pages/HomePage.js";
import WeekPage from "@/pages/WeekPage.js";
import MonthPage from "@/pages/MonthPage.js";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route
            path="/home"
            element={
              <ProtectedRoute>
                <HomePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/week"
            element={
              <ProtectedRoute>
                <WeekPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/month"
            element={
              <ProtectedRoute>
                <MonthPage />
              </ProtectedRoute>
            }
          />
        </Routes>
        <Toaster position="bottom-center" />
      </AuthProvider>
    </BrowserRouter>
  );
}
