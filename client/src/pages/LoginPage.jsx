import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, user } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isAuthenticated && user) {
    const redirectTo = user.role === 'ADMIN' ? '/admin/dashboard' : '/student/dashboard';
    const from = location.state?.from || redirectTo;
    return <Navigate to={from} replace />;
  }

  const handleChange = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const authUser = await login(form);

      if (!authUser) {
        setError('Unable to sign in. Please check your credentials and try again.');
        return;
      }

      const destination = authUser.role === 'ADMIN' ? '/admin/dashboard' : '/student/dashboard';
      navigate(destination, { replace: true });
    } catch (submitError) {
      const message = submitError?.response?.data?.message || 'Login failed. Please try again.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-shell">
      <div className="card auth-card">
        <h1>Welcome back</h1>
        <p className="muted">Sign in to continue your adaptive learning journey.</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            Email
            <input type="email" name="email" value={form.email} onChange={handleChange} required />
          </label>

          <label>
            Password
            <input type="password" name="password" value={form.password} onChange={handleChange} required />
          </label>

          {error && <div className="error-banner">{error}</div>}

          <button type="submit" className="primary-button" disabled={isSubmitting}>
            {isSubmitting ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p className="helper-text">
          Need an account? <Link to="/register">Register here</Link>
        </p>
      </div>
    </div>
  );
}
