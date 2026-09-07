import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function NavBar() {
  const { user, logout, isAuthenticated } = useAuth();

  const getDashboardLink = () => {
    if (!user?.role) return '/';
    return user.role === 'ADMIN' ? '/admin/dashboard' : '/student/dashboard';
  };

  return (
    <nav className="topbar">
      <div className="brand-block">
        <NavLink to="/" className="brand-link">Adaptive Skill Assessment</NavLink>
      </div>

      <div className="nav-links">
        {!isAuthenticated ? (
          <>
            <NavLink to="/">Home</NavLink>
            <NavLink to="/login">Login</NavLink>
            <NavLink to="/register">Register</NavLink>
          </>
        ) : (
          <>
            <NavLink to={getDashboardLink()}>Dashboard</NavLink>
            {user.role === 'STUDENT' && (
              <>
                <NavLink to="/student/subjects">Subjects</NavLink>
                <NavLink to="/student/assessments">Assessments</NavLink>
                <NavLink to="/student/recommendations">Recommendations</NavLink>
              </>
            )}
            {user.role === 'ADMIN' && (
              <>
                <NavLink to="/admin/subjects">Subjects</NavLink>
                <NavLink to="/admin/questions">Questions</NavLink>
              </>
            )}
            <button type="button" className="logout-button" onClick={logout}>Logout</button>
          </>
        )}
      </div>
    </nav>
  );
}
