import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Register.css';

const Register = () => {
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    username: '',
    email: '',
    password: '',
    gender: '',
    dob: '',
    mobile: '',
    role: 'Passenger' // Always set the default role to Passenger
  });

  const { setUser } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      console.log('Sending registration data:', form);
      const API_URL = process.env.REACT_APP_API_BASE_URL || 'https://tech-solutions-production-e796.up.railway.app';
      const registerRes = await axios.post(`${API_URL}/api/users/register`, form);
      console.log('Registration response:', registerRes.data);

      // If the registration includes the user object, use it directly
      if (registerRes.data.user) {
        setUser(registerRes.data.user);
        navigate('/dashboard');
        return;
      }

      // Otherwise, log in after registration
      const loginRes = await axios.post(`${API_URL}/api/users/login`, {
        username: form.username,
        password: form.password
      });

      console.log('Login response:', loginRes.data);
      setUser(loginRes.data.user);
      navigate('/dashboard');
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    }
  };

  return (
    <div className="register-container">
      <form className="register-form" onSubmit={handleSubmit}>
        <h2>Create an Account</h2>
        
        {error && <div className="error-message">{error}</div>}
        
        <div className="input-group">
          <input 
            name="first_name" 
            placeholder="First Name" 
            value={form.first_name}
            onChange={handleChange} 
            required 
          />
          <input 
            name="last_name" 
            placeholder="Last Name" 
            value={form.last_name}
            onChange={handleChange} 
            required 
          />
        </div>
        
        <input 
          name="username" 
          placeholder="Username" 
          value={form.username}
          onChange={handleChange} 
          required 
        />
        
        <input 
          name="email" 
          placeholder="Email" 
          type="email" 
          value={form.email}
          onChange={handleChange} 
          required 
        />
        
        <input 
          name="password" 
          placeholder="Password" 
          type="password" 
          value={form.password}
          onChange={handleChange} 
          required 
        />
        
        <div className="input-group">
          <select 
            name="gender" 
            value={form.gender}
            onChange={handleChange} 
            required
          >
            <option value="">Select Gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>

          <input
            type="text"
            name="dob"
            placeholder="YYYY-MM-DD"
            pattern="\d{4}-\d{2}-\d{2}"
            title="Date format: YYYY-MM-DD"
            value={form.dob}
            onChange={handleChange}
            required
          />
        </div>

        <input 
          name="mobile" 
          placeholder="Mobile Number" 
          value={form.mobile}
          onChange={handleChange} 
        />

        {/* The role is hard-coded to 'Passenger' in the form state */}
        
        <button type="submit" className="register-btn">Register</button>
      </form>
    </div>
  );
};

export default Register;
