import { BrowserRouter, Routes, Route } from "react-router";
import { Toaster } from "@/components/ui/sonner.js";
import HomePage from "@/pages/HomePage.js";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
      </Routes>
      <Toaster position="bottom-center" />
    </BrowserRouter>
  );
}
