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

  });

  const { setUser } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/users/register', form);

      const loginRes = await axios.post('http://localhost:5000/api/users/login', {
        username: form.username,
        password: form.password
      });

      setUser(loginRes.data.user);
      navigate('/dashboard');
    } catch (err) {
      alert('Registration failed: ' + (err.response?.data?.error || 'Server error'));
    }
  };

  return (
    <div className="register-container">
      <form className="register-form" onSubmit={handleSubmit}>
        <h2>Create an Account</h2>
        <div className="input-group">
          <input name="first_name" placeholder="First Name" onChange={handleChange} required />
          <input name="last_name" placeholder="Last Name" onChange={handleChange} required />
        </div>
        <input name="username" placeholder="Username" onChange={handleChange} required />
        <input name="email" placeholder="Email" type="email" onChange={handleChange} required />
        <input name="password" placeholder="Password" type="password" onChange={handleChange} required />
        
        <div className="input-group">
          <select name="gender" onChange={handleChange} required>
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
  onChange={handleChange}
  required
/>

        </div>

        <input name="mobile" placeholder="Mobile Number" onChange={handleChange} />

        

        <button type="submit" className="register-btn">Register</button>
      </form>
    </div>
  );
};

export default Register;
