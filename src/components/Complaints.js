import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

function Complaints() {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    category: '',
    description: '',
  });

  const categories = [
    { value: 'internet', label: '🌐 Internet Issues', icon: 'wifi' },
    { value: 'electricity', label: '💡 Electricity Problems', icon: 'lightbulb' },
    { value: 'water', label: '🚰 Water Supply', icon: 'droplet' },
    { value: 'maintenance', label: '🔧 General Maintenance', icon: 'tools' },
    { value: 'other', label: '📝 Other', icon: 'chat-text' },
  ];

  useEffect(() => {
    if (!user) return;

    fetchComplaints();

    const channel = supabase
      .channel('complaints-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'complaints',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Complaint change received!', payload);
          fetchComplaints();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('complaints')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setComplaints(data || []);
    } catch (error) {
      console.error('Error fetching complaints:', error);
      toast.error('Failed to load complaints');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const { error } = await supabase.from('complaints').insert([
        {
          user_id: user.id,
          category: formData.category,
          description: formData.description,
          status: 'submitted',
        },
      ]);

      if (error) throw error;

      toast.success('Complaint submitted successfully! We will review it soon.');
      
      setShowForm(false);
      setFormData({ category: '', description: '' });
      fetchComplaints();
    } catch (error) {
      console.error('Error submitting complaint:', error);
      toast.error(error.message || 'Failed to submit complaint');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'submitted':
        return 'badge-submitted';
      case 'in_progress':
        return 'badge-in_progress';
      case 'resolved':
        return 'badge-resolved';
      default:
        return 'badge-secondary';
    }
  };

  const getCategoryIcon = (category) => {
    const cat = categories.find((c) => c.value === category);
    return cat ? cat.icon : 'chat-text';
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-success" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3">Loading your complaints...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold" style={{ color: '#0057a8' }}>
            📝 Submit Complaint
          </h3>
          <p className="text-muted mb-0">
            Report issues on campus (internet, electricity, water, etc.)
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setShowForm(!showForm)}
        >
          <i className="bi bi-plus-circle me-1"></i>
          {showForm ? 'Cancel' : 'New Complaint'}
        </button>
      </div>

      {/* Complaint Form */}
      {showForm && (
        <div className="card mb-4">
          <div className="card-body">
            <h5 className="card-title mb-4">📝 Submit New Complaint</h5>
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label fw-bold">Category *</label>
                <select
                  className="form-select"
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  required
                >
                  <option value="">Select an issue category</option>
                  {categories.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-3">
                <label className="form-label fw-bold">
                  Description *
                </label>
                <textarea
                  className="form-control"
                  rows="4"
                  placeholder="Please describe your issue in detail..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  required
                ></textarea>
                <small className="text-muted">
                  Be specific about the location and nature of the problem
                </small>
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
                  Submit Complaint
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Complaints List */}
      <div className="row">
        {complaints.map((complaint) => (
          <div key={complaint.id} className="col-12 mb-3">
            <div className="card border-left-lg" style={{ borderLeft: '5px solid #0057a8' }}>
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <div>
                    <h5 className="card-title fw-bold mb-1">
                      <i className={`bi bi-${getCategoryIcon(complaint.category)} me-2`}></i>
                      {
                        categories.find((c) => c.value === complaint.category)
                          ?.label || 'Issue'
                      }
                    </h5>
                    <span
                      className={`badge ${getStatusColor(complaint.status)}`}
                    >
                      {complaint.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  <small className="text-muted">
                    <i className="bi bi-calendar me-1"></i>
                    {new Date(complaint.created_at).toLocaleDateString()}
                  </small>
                </div>

                <p className="card-text mb-3">{complaint.description}</p>

                {complaint.status === 'resolved' && (
                  <div className="alert alert-success mb-0">
                    <i className="bi bi-check-circle me-2"></i>
                    This complaint has been resolved. Thank you for your patience!
                  </div>
                )}

                {complaint.status === 'in_progress' && (
                  <div className="alert alert-warning mb-0">
                    <i className="bi bi-hourglass-split me-2"></i>
                    Our team is currently working on this issue.
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {complaints.length === 0 && !showForm && (
        <div className="text-center py-5">
          <div
            className="bg-light border rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
            style={{ width: '80px', height: '80px' }}
          >
            <i
              className="bi bi-chat-square-text"
              style={{ fontSize: '2.5rem', color: '#0057a8' }}
            ></i>
          </div>
          <h4 className="mb-2">No complaints submitted yet</h4>
          <p className="text-muted mb-4">
            Click "New Complaint" to report an issue on campus
          </p>
          <button
            className="btn btn-primary btn-lg"
            onClick={() => setShowForm(true)}
          >
            <i className="bi bi-plus-circle me-2"></i>Submit Your First Complaint
          </button>
        </div>
      )}
    </div>
  );
}

export default Complaints;