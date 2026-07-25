import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { ClubsPage } from './pages/ClubsPage';
import { ClubDetailPage } from './pages/ClubDetailPage';
import { TeamsPage } from './pages/TeamsPage';
import { TeamDetailPage } from './pages/TeamDetailPage';
import { AthletesPage } from './pages/AthletesPage';
import { AthleteDetailPage } from './pages/AthleteDetailPage';
import { SessionsPage } from './pages/SessionsPage';
import { SessionDetailPage } from './pages/SessionDetailPage';
import { UsersPage } from './pages/UsersPage';
import { ClinicsPage } from './pages/ClinicsPage';
import { ExercisesPage } from './pages/ExercisesPage';
import { MuscleGroupsPage } from './pages/MuscleGroupsPage';
import { LigamentGroupsPage } from './pages/LigamentGroupsPage';
import { SettingsLayout } from './components/SettingsLayout';
import { SettingsHomePage } from './pages/SettingsHomePage';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Layout>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
            <Route path="/clubs" element={<ProtectedRoute><ClubsPage /></ProtectedRoute>} />
            <Route path="/clubs/:id" element={<ProtectedRoute><ClubDetailPage /></ProtectedRoute>} />
            <Route path="/teams" element={<ProtectedRoute><TeamsPage /></ProtectedRoute>} />
            <Route path="/teams/:id" element={<ProtectedRoute><TeamDetailPage /></ProtectedRoute>} />
            <Route path="/athletes" element={<ProtectedRoute><AthletesPage /></ProtectedRoute>} />
            <Route path="/athletes/:id" element={<ProtectedRoute><AthleteDetailPage /></ProtectedRoute>} />
            <Route path="/sessions" element={<ProtectedRoute><SessionsPage /></ProtectedRoute>} />
            <Route path="/sessions/:id" element={<ProtectedRoute><SessionDetailPage /></ProtectedRoute>} />
            <Route path="/exercises" element={<ProtectedRoute><ExercisesPage /></ProtectedRoute>} />
            <Route path="/exercises/muscle-groups" element={<ProtectedRoute><MuscleGroupsPage /></ProtectedRoute>} />
            <Route path="/exercises/ligament-groups" element={<ProtectedRoute><LigamentGroupsPage /></ProtectedRoute>} />
            <Route path="/admin/users" element={<ProtectedRoute><UsersPage /></ProtectedRoute>} />
            <Route path="/admin/clinics" element={<ProtectedRoute><ClinicsPage /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><SettingsLayout /></ProtectedRoute>}>
              <Route index element={<SettingsHomePage />} />
              <Route path="clubs" element={<ClubsPage />} />
              <Route path="teams" element={<TeamsPage />} />
              <Route path="exercises" element={<ExercisesPage />} />
              <Route path="muscle-groups" element={<MuscleGroupsPage />} />
              <Route path="ligament-groups" element={<LigamentGroupsPage />} />
              <Route path="clinics" element={<ClinicsPage />} />
              <Route path="users" element={<UsersPage />} />
            </Route>
          </Routes>
        </Layout>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
