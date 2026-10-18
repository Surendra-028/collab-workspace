import React, { useState } from 'react';

export default function Auth({ onLoginSuccess, showNotification }) {
  const [isSignup, setIsSignup] = useState(false);
  const [formData, setFormData] = useState({ username: '', email: '', password: '', name: '' });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const endpoint = isSignup ? 'http://localhost:5000/auth/signup' : 'http://localhost:5000/auth/login';
    const payload = isSignup ? formData : { emailOrUsername: formData.email, password: formData.password };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        showNotification(isSignup ? 'Account created successfully!' : 'Signed in successfully!', 'success');
        onLoginSuccess(data.user);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Server connection error. Ensure backend is running.');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-brand-header">
        <div className="collab-logo-badge">⚡ Colab Workspace</div>
        <span>Collaborative Document & Research IDE</span>
      </div>
      
      <div className="auth-card">
        <div className="auth-card-header">
          <h2>{isSignup ? 'Create Workspace Account' : 'Sign In to Workspace'}</h2>
          <p>{isSignup ? 'Enter your credentials to register a unique username' : 'Access your documents and shared projects'}</p>
        </div>

        {error && <div className="error-banner">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form" autoComplete="off">
          {isSignup && (
            <>
              <div className="input-group">
                <label>Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Surendra Pasagadugula"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  autoComplete="off"
                  required
                />
              </div>
              <div className="input-group">
                <label>Unique Username</label>
                <input
                  type="text"
                  placeholder="e.g. surendra_01"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  autoComplete="off"
                  required
                />
              </div>
            </>
          )}
          <div className="input-group">
            <label>{isSignup ? 'Email Address' : 'Email or Username'}</label>
            <input
              type="text"
              placeholder={isSignup ? "name@example.com" : "Enter email or username"}
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              autoComplete="off"
              required
            />
          </div>
          <div className="input-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              autoComplete="new-password"
              required
            />
          </div>
          <button type="submit" className="collab-primary-btn">
            {isSignup ? 'Create Account & Continue' : 'Sign In'}
          </button>
        </form>

        <button className="switch-auth-btn" onClick={() => setIsSignup(!isSignup)}>
          {isSignup ? 'Already have an account? Sign In' : "Don't have an account? Create one"}
        </button>
      </div>
    </div>
  );
}