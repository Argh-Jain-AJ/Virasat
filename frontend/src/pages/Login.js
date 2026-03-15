import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/api';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();

    // temporary bypass login
    localStorage.setItem("token", "demo-token");

    navigate("/dashboard");
  }

  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h2>Login</h2>
      {message && <p style={{ color: 'red' }}>{message}</p>}
      <form onSubmit={handleLogin} style={{ display: 'inline-block', textAlign: 'left' }}>
        <div>
          <label>Email: </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div style={{ marginTop: '10px' }}>
          <label>Password: </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <div style={{ marginTop: '15px' }}>
          <button type="submit">Login</button>
        </div>
      </form>
    </div>
  );
};

export default Login;
