import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error('Passwords do not match!');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters long!');
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await signUp(email, password);

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success(
        'Account created successfully! Please check your email to verify.'
      );
      navigate('/login');
    } catch (error) {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
  <div className="min-vh-100 d-flex align-items-center bg-light">
    <div className="container">
      <div className="row justify-content-center">
        <div className="col-md-6 col-lg-5">
          <div className="card p-4 shadow">
            <div className="text-center mb-4">
              {/* Logo Circle */}
              <div
                className="bg-success rounded-circle d-inline-flex align-items-center justify-content-center"
                style={{ width: '80px', height: '80px', overflow: 'hidden' }}
              >
                <img
                  src="saylani.png" // make sure this is in public folder
                  alt="Saylani"
                  style={{ width: '100px', height: '100px', objectFit: '' }}
                />
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label htmlFor="email" className="form-label">
                  Email Address
                </label>
                <input
                  type="email"
                  className="form-control"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="student@saylani.com"
                />
              </div>

              <div className="mb-3">
                <label htmlFor="password" className="form-label">
                  Password
                </label>
                <input
                  type="password"
                  className="form-control"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="At least 6 characters"
                />
              </div>

              <div className="mb-4">
                <label htmlFor="confirmPassword" className="form-label">
                  Confirm Password
                </label>
                <input
                  type="password"
                  className="form-control"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="Re-enter password"
                />
              </div>

              <button type="submit" className="btn btn-success w-100">
                Sign Up
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
);

}

export default Signup;