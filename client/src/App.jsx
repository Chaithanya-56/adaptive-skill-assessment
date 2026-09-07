import { Navigate, Route, Routes } from 'react-router-dom';
import NavBar from './components/Layout/NavBar';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import StudentDashboard from './pages/StudentDashboard';
import AdminDashboard from './pages/AdminDashboard';
import StudentSubjectsPage from './pages/StudentSubjectsPage';
import StudentAssessmentsPage from './pages/StudentAssessmentsPage';
import StudentAssessmentPage from './pages/StudentAssessmentPage';
import StudentAssessmentResultsPage from './pages/StudentAssessmentResultsPage';
import StudentRecommendationsPage from './pages/StudentRecommendationsPage';
import AdminSubjectsPage from './pages/AdminSubjectsPage';
import AdminQuestionsPage from './pages/AdminQuestionsPage';

export default function App() {
  const { isAuthenticated, user, isLoading } = useAuth();

  const redirectHome = () => {
    if (!isAuthenticated) {
      return <Navigate to="/login" replace />;
    }

    return <Navigate to={user?.role === 'ADMIN' ? '/admin/dashboard' : '/student/dashboard'} replace />;
  };

  if (isLoading) {
    return (
      <div className="page-shell">
        <div className="card auth-card">
          <h1>Loading your session...</h1>
          <p className="muted">Preparing your adaptive learning dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <NavBar />
      <main className="app-shell">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={isAuthenticated ? redirectHome() : <LoginPage />} />
          <Route path="/register" element={isAuthenticated ? redirectHome() : <RegisterPage />} />

          <Route element={<ProtectedRoute allowedRoles={['STUDENT']} />}>
            <Route path="/student/dashboard" element={<StudentDashboard />} />
            <Route path="/student/subjects" element={<StudentSubjectsPage />} />
            <Route path="/student/assessments" element={<StudentAssessmentsPage />} />
            <Route path="/student/assessment/:assessmentId" element={<StudentAssessmentPage />} />
            <Route path="/student/assessment/:assessmentId/results" element={<StudentAssessmentResultsPage />} />
            <Route path="/student/recommendations" element={<StudentRecommendationsPage />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/subjects" element={<AdminSubjectsPage />} />
            <Route path="/admin/questions" element={<AdminQuestionsPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </>
  );
}
