import React, { useState, useEffect } from 'react';
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
    role: 'Passenger' // Default role
  });

  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);

  // Check if current user is admin
  useEffect(() => {
    if (user && user.role === 'Admin') {
      setIsAdmin(true);
    } else {
      // Lock role to Passenger for non-admin users
      setForm(prev => ({ ...prev, role: 'Passenger' }));
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // For mobile field, only allow numbers and limit to 10 digits
    if (name === 'mobile') {
      const mobileRegex = /^[0-9]*$/;
      if (mobileRegex.test(value) && value.length <= 10) {
        setForm({ ...form, [name]: value });
      }
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validate mobile number length
    if (form.mobile && form.mobile.length !== 10) {
      setError('Mobile number must be exactly 10 digits');
      return;
    }
    
    try {
      console.log('Sending registration data:', form);
      const API_URL = process.env.REACT_APP_API_BASE_URL;
      const registerRes = await axios.post(`${API_URL}/api/users/register`, form);
      console.log('Registration response:', registerRes.data);

      // If admin is creating another user, just show success and don't log in as that user
      if (isAdmin) {
        setError(`Successfully registered new ${form.role} user: ${form.username}`);
        
        // Clear form for next registration
        setForm({
          first_name: '',
          last_name: '',
          username: '',
          email: '',
          password: '',
          gender: '',
          dob: '',
          mobile: '',
          role: 'Passenger'
        });
        
        return;
      }

      // For non-admin registrations, continue with normal flow
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
        <h2>{isAdmin ? 'Create New User' : 'Create an Account'}</h2>
        
        {error && <div className={error.includes('Successfully') ? "success-message" : "error-message"}>
          {error}
        </div>}
        
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
          placeholder="Mobile Number (10 digits)" 
          value={form.mobile}
          onChange={handleChange}
          pattern="[0-9]{10}"
          title="Mobile number must be exactly 10 digits"
        />

        {/* Role selector - only visible to admin users */}
        {isAdmin && (
          <select
            name="role"
            value={form.role}
            onChange={handleChange}
            className="role-select"
            required
          >
            <option value="Passenger">Passenger</option>
            <option value="Staff">Staff</option>
            <option value="Admin">Admin</option>
          </select>
        )}
        
        <button type="submit" className="register-btn">
          {isAdmin ? 'Create User' : 'Register'}
        </button>
      </form>
    </div>
  );
};

export default Register;
