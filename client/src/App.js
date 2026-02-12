import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import Register from "./pages/Register";
import Screener from "./pages/screener";
import SectorAnalysis from "./pages/SectorAnalysis";
import Compare from "./pages/Compare";
import News from "./pages/News";
import Advisor from "./pages/Advisor";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route path="/register" element={<Register />} />
        <Route path="/screener" element={<Screener />} />
        <Route path="/sector-analysis" element={<SectorAnalysis />} />
        <Route path="/compare" element={<Compare />} />
        <Route path="/news" element={<News />} />
        <Route
          path="/advisor"
          element={
            <ProtectedRoute>
              <Advisor />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
