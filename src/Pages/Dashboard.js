import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { toast } from 'react-toastify';

function Dashboard() {
  const { user, signOut } = useAuth();
  const location = useLocation();

  // Real-time notifications for status changes
  React.useEffect(() => {
    if (!user) return;

    // Listen for complaint status changes
    const complaintChannel = supabase
      .channel('complaint-status-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'complaints',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.old.status !== payload.new.status) {
            toast.info(
              `📝 Your complaint status changed to: ${payload.new.status.replace(
                '_',
                ' '
              )}`,
              { autoClose: 5000 }
            );
          }
        }
      )
      .subscribe();

    // Listen for lost/found status changes
    const lostFoundChannel = supabase
      .channel('lostfound-status-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'lost_found_items',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.old.status !== payload.new.status) {
            toast.success(
              `🔍 Your item status updated to: ${payload.new.status}`,
              { autoClose: 5000 }
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(complaintChannel);
      supabase.removeChannel(lostFoundChannel);
    };
  }, [user]);

  const navItems = [
    {
      path: '/dashboard/lost-found',
      label: 'Lost & Found',
      icon: '🔍',
      description: 'Post lost or found items',
    },
    {
      path: '/dashboard/complaints',
      label: 'Complaints',
      icon: '📝',
      description: 'Submit campus complaints',
    },
    {
      path: '/dashboard/volunteers',
      label: 'Volunteers',
      icon: '🤝',
      description: 'Register for events',
    },
  ];

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Logged out successfully!');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Failed to logout');
    }
  };

  return (
    <div className="min-vh-100 d-flex flex-column">
      {/* Navbar */}
      <nav className="navbar navbar-expand-lg navbar-dark">
        <div className="container">
          <Link className="navbar-brand fw-bold d-flex align-items-center" to="/dashboard">
            <div
              className="bg-white text-success rounded-circle d-inline-flex align-items-center justify-content-center me-2"
              style={{ width: '36px', height: '36px' }}
            >
              <span className="fw-bold" style={{ color: '#66b032' }}>
                S
              </span>
            </div>
            <span>Saylani Mass IT Hub</span>
          </Link>

          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarNav"
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav ms-auto align-items-center">
              <li className="nav-item">
                <span className="text-white me-3 d-flex align-items-center">
                  <i className="bi bi-person-circle me-1"></i>
                  <span>{user?.email?.split('@')[0]}</span>
                </span>
              </li>
              <li className="nav-item">
                <button
                  className="btn btn-outline-light"
                  onClick={handleSignOut}
                >
                  <i className="bi bi-box-arrow-right me-1"></i>
                  Logout
                </button>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container-fluid py-4 flex-grow-1">
        <div className="row">
          {/* Sidebar Navigation */}
          <div className="col-md-3 col-lg-2 mb-4">
            <div className="card h-100">
              <div className="card-body">
                <h5
                  className="card-title fw-bold mb-4"
                  style={{ color: '#0057a8' }}
                >
                  Main Menu
                </h5>
                <ul className="nav flex-column">
                  {navItems.map((item) => (
                    <li key={item.path} className="nav-item mb-2">
                      <Link
                        to={item.path}
                        className={`nav-link d-flex align-items-center py-2 px-3 rounded ${
                          location.pathname === item.path
                            ? 'active'
                            : ''
                        }`}
                        style={{
                          backgroundColor:
                            location.pathname === item.path
                              ? '#66b032'
                              : 'transparent',
                          color:
                            location.pathname === item.path
                              ? 'white'
                              : '#333',
                          borderLeft:
                            location.pathname === item.path
                              ? '3px solid white'
                              : 'none',
                          fontWeight:
                            location.pathname === item.path
                              ? '600'
                              : 'normal',
                        }}
                      >
                        <span
                          className="me-2"
                          style={{ fontSize: '1.2rem' }}
                        >
                          {item.icon}
                        </span>
                        <div>
                          <div>{item.label}</div>
                          <small
                            className="d-block"
                            style={{
                              fontSize: '0.7rem',
                              opacity: 0.8,
                            }}
                          >
                            {item.description}
                          </small>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="col-md-9 col-lg-10">
            <div className="card h-100">
              <div className="card-body">
                <Outlet />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-dark text-white py-3 mt-auto">
        <div className="container text-center">
          <p className="mb-0">
            <i className="bi bi-building me-2"></i>
            Saylani Mass IT Training Program © {new Date().getFullYear()}
          </p>
          <small className="text-muted d-block mt-1">
            Campus Portal - Built with ❤️ using React & Supabase
          </small>
        </div>
      </footer>
    </div>
  );
}

export default Dashboard;