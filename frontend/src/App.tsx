import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import LandingPage from './pages/LandingPage';
import CoffeeHabit from './pages/CoffeeHabit';
import SleepInformation from './pages/SleepInformation';
import Experience from './pages/Experience';
import Challenge from './pages/Challenge';
import Progress from './pages/Progress';
import About from './pages/About';
import Diagnosis from './pages/Diagnosis';
import InsightsPage from './pages/InsightsPage';
import HistoryPage from './pages/HistoryPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Auth Pages */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Main Dashboard / Diagnosis, Insights & History */}
          <Route path="/diagnosis" element={<Diagnosis />} />
          <Route path="/insights" element={<InsightsPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/result" element={<InsightsPage />} />
          <Route path="/profile" element={<ProfilePage />} />

          {/* Other / Public Routes */}
          <Route
            path="/*"
            element={
              <div className="min-h-screen flex flex-col bg-[#FAF8F5]">
                <main className="flex-grow">
                  <Routes>
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/check/coffee" element={<CoffeeHabit />} />
                    <Route path="/check/sleep" element={<SleepInformation />} />
                    <Route path="/check/experience" element={<Experience />} />
                    <Route path="/challenge" element={<Challenge />} />
                    <Route path="/progress" element={<Progress />} />
                    <Route path="/about" element={<About />} />
                  </Routes>
                </main>
              </div>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
