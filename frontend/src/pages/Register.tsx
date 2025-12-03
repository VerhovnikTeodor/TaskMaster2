import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Auth.css';

const Register: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Gesli se ne ujemata');
      return;
    }

    if (password.length < 6) {
      setError('Geslo mora biti dolgo vsaj 6 znakov');
      return;
    }

    setLoading(true);

    try {
      await register(email, password, firstName, lastName);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Napaka pri registraciji');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h1>TaskMaster</h1>
        <h2>Registracija</h2>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="firstName">Ime</label>
            <input
              type="text"
              id="firstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              placeholder="Vaše ime"
            />
          </div>
          <div className="form-group">
            <label htmlFor="lastName">Priimek</label>
            <input
              type="text"
              id="lastName"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              placeholder="Vaš priimek"
            />
          </div>
          <div className="form-group">
            <label htmlFor="email">E-pošta</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="vaš.email@primer.si"
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Geslo</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Najmanj 6 znakov"
            />
          </div>
          <div className="form-group">
            <label htmlFor="confirmPassword">Potrdi geslo</label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              placeholder="Ponovite geslo"
            />
          </div>
          <button type="submit" disabled={loading}>
            {loading ? 'Registracija...' : 'Registriraj se'}
          </button>
        </form>
        <p className="auth-link">
          Že imate račun? <Link to="/login">Prijavite se</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
