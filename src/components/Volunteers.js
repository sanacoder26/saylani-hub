import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

function Volunteers() {
  const { user } = useAuth();
  const [volunteers, setVolunteers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    event_name: '',
    availability: '',
  });
  const [isAdmin, setIsAdmin] = useState(false);

  // For hackathon demo, check if user is admin (you can use specific email)
  useEffect(() => {
    if (user) {
      // Replace with your email for admin access
      setIsAdmin(user.email === 'admin@saylani.com');
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;

    fetchVolunteers();

    const channel = supabase
      .channel('volunteers-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'volunteers',
        },
        (payload) => {
          console.log('Volunteer added!', payload);
          fetchVolunteers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const fetchVolunteers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('volunteers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVolunteers(data || []);
    } catch (error) {
      console.error('Error fetching volunteers:', error);
      toast.error('Failed to load volunteers');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const { error } = await supabase.from('volunteers').insert([
        {
          user_id: user.id,
          name: formData.name,
          event_name: formData.event_name,
          availability: formData.availability,
        },
      ]);

      if (error) throw error;

      toast.success('Thank you for volunteering! We will contact you soon.');
      
      setShowForm(false);
      setFormData({ name: '', event_name: '', availability: '' });
      fetchVolunteers();
    } catch (error) {
      console.error('Error registering volunteer:', error);
      toast.error(error.message || 'Failed to register as volunteer');
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-success" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3">Loading volunteer information...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold" style={{ color: '#0057a8' }}>
            🤝 Volunteer Registration
          </h3>
          <p className="text-muted mb-0">
            Join us in making campus events successful!
          </p>
        </div>
        {!isAdmin && (
          <button
            className="btn btn-primary"
            onClick={() => setShowForm(!showForm)}
          >
            <i className="bi bi-person-plus me-1"></i>
            {showForm ? 'Cancel' : 'Register as Volunteer'}
          </button>
        )}
      </div>

      {/* Volunteer Form */}
      {showForm && (
        <div className="card mb-4">
          <div className="card-body">
            <h5 className="card-title mb-4">🤝 Register as Volunteer</h5>
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label fw-bold">Full Name *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label fw-bold">
                  Event Name *
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g., Career Fair, Tech Workshop, Sports Day"
                  value={formData.event_name}
                  onChange={(e) =>
                    setFormData({ ...formData, event_name: e.target.value })
                  }
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label fw-bold">
                  Availability *
                </label>
                <textarea
                  className="form-control"
                  rows="3"
                  placeholder="When are you available? (dates, times, etc.)"
                  value={formData.availability}
                  onChange={(e) =>
                    setFormData({ ...formData, availability: e.target.value })
                  }
                  required
                ></textarea>
              </div>

              <div className="alert alert-info">
                <i className="bi bi-info-circle me-2"></i>
                By registering, you agree to be contacted by the event
                organizers regarding your volunteer duties.
              </div>

              <div className="d-flex justify-content-end gap-2">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Register Now
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin View - Volunteer List */}
      {isAdmin && (
        <div className="card mb-4">
          <div className="card-header bg-primary text-white">
            <h5 className="mb-0">
              <i className="bi bi-people me-2"></i>Volunteer List (Admin View)
            </h5>
          </div>
          <div className="card-body">
            {volunteers.length === 0 ? (
              <div className="text-center py-4">
                <i
                  className="bi bi-people"
                  style={{ fontSize: '3rem', color: '#ccc' }}
                ></i>
                <p className="mt-2 text-muted">No volunteers registered yet</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Event</th>
                      <th>Availability</th>
                      <th>Registered</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {volunteers.map((volunteer) => (
                      <tr key={volunteer.id}>
                        <td className="fw-bold">{volunteer.name}</td>
                        <td>{volunteer.event_name}</td>
                        <td>
                          <small>{volunteer.availability}</small>
                        </td>
                        <td>
                          <small className="text-muted">
                            {new Date(volunteer.created_at).toLocaleDateString()}
                          </small>
                        </td>
                        <td>
                          <span className="badge badge-volunteer">
                            Active
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* User View - My Registrations */}
      {!isAdmin && volunteers.length > 0 && (
        <div className="card">
          <div className="card-header bg-success text-white">
            <h5 className="mb-0">
              <i className="bi bi-person-check me-2"></i>My Volunteer
              Registrations
            </h5>
          </div>
          <div className="card-body">
            <div className="row">
              {volunteers
                .filter((v) => v.user_id === user.id)
                .map((volunteer) => (
                  <div key={volunteer.id} className="col-md-6 mb-3">
                    <div className="card border-success h-100">
                      <div className="card-body">
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <h6 className="card-title fw-bold mb-0">
                            {volunteer.event_name}
                          </h6>
                          <span className="badge badge-volunteer">
                            Registered
                          </span>
                        </div>
                        <p className="card-text text-muted small mb-2">
                          <i className="bi bi-person me-1"></i>
                          {volunteer.name}
                        </p>
                        <p className="card-text mb-3">
                          <i className="bi bi-calendar-check me-1"></i>
                          <small>{volunteer.availability}</small>
                        </p>
                        <div className="text-end">
                          <small className="text-muted">
                            Registered on:{' '}
                            {new Date(volunteer.created_at).toLocaleDateString()}
                          </small>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Empty State for Users */}
      {!isAdmin && volunteers.filter((v) => v.user_id === user.id).length === 0 && !showForm && (
        <div className="text-center py-5">
          <div
            className="bg-light border rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
            style={{ width: '80px', height: '80px' }}
          >
            <i
              className="bi bi-hand-index-thumb"
              style={{ fontSize: '2.5rem', color: '#0057a8' }}
            ></i>
          </div>
          <h4 className="mb-2">No volunteer registrations yet</h4>
          <p className="text-muted mb-4">
            Be a part of campus events and make a difference!
          </p>
          <button
            className="btn btn-primary btn-lg"
            onClick={() => setShowForm(true)}
          >
            <i className="bi bi-person-plus me-2"></i>Register as Volunteer
          </button>
        </div>
      )}
    </div>
  );
}

export default Volunteers;