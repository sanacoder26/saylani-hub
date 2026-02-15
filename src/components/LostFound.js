import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

function LostFound() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image: null,
    itemType: 'lost',
  });
  const [uploading, setUploading] = useState(false);

  // Fetch user's items
  useEffect(() => {
    if (!user) return;

    fetchItems();

    // Realtime subscription
    const channel = supabase
      .channel('lost-found-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'lost_found_items',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Change received!', payload);
          fetchItems();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('lost_found_items')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error('Error fetching items:', error);
      toast.error('Failed to load items');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (file) => {
    try {
      setUploading(true);

      // File ka unique name banana
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      // Supabase Storage mein upload karna
      const { error: uploadError } = await supabase.storage
        .from('lost-found-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Public URL get karna
      const { data } = supabase.storage
        .from('lost-found-images')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      let imageUrl = '';

      // Agar image select ki hai to upload karein
      if (formData.image) {
        imageUrl = await handleImageUpload(formData.image);
        if (!imageUrl) return; // Agar upload fail hua to ruk jayein
      }

      // Database mein insert karna
      const { error } = await supabase.from('lost_found_items').insert([
        {
          user_id: user.id,
          title: formData.title,
          description: formData.description,
          image_url: imageUrl,
          item_type: formData.itemType,
          status: 'pending',
        },
      ]);

      if (error) throw error;

      toast.success(
        `Item successfully posted as ${formData.itemType}!`
      );
      
      // Form clear karna
      setShowForm(false);
      setFormData({
        title: '',
        description: '',
        image: null,
        itemType: 'lost',
      });

      // Items refresh karna
      fetchItems();
    } catch (error) {
      console.error('Error submitting item:', error);
      toast.error(error.message || 'Failed to post item');
    }
  };

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      const { error } = await supabase
        .from('lost_found_items')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;

      toast.success('Status updated successfully!');
      fetchItems();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this item?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('lost_found_items')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Item deleted successfully!');
      fetchItems();
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error('Failed to delete item');
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-success" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3">Loading your items...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold" style={{ color: '#0057a8' }}>
            🔍 Lost & Found
          </h3>
          <p className="text-muted mb-0">
            Post items you've lost or found on campus
          </p>
        </div>
        <button
          className="btn btn-success"
          onClick={() => setShowForm(!showForm)}
        >
          <i className="bi bi-plus-circle me-1"></i>
          {showForm ? 'Cancel' : 'Post Item'}
        </button>
      </div>

      {/* Post Item Form */}
      {showForm && (
        <div className="card mb-4">
          <div className="card-body">
            <h5 className="card-title mb-4">
              {formData.itemType === 'lost' ? '📦 Report Lost Item' : '✅ Report Found Item'}
            </h5>
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label fw-bold">Item Type</label>
                <select
                  className="form-select"
                  value={formData.itemType}
                  onChange={(e) =>
                    setFormData({ ...formData, itemType: e.target.value })
                  }
                >
                  <option value="lost">I Lost an Item</option>
                  <option value="found">I Found an Item</option>
                </select>
              </div>

              <div className="mb-3">
                <label className="form-label fw-bold">Item Title *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder={
                    formData.itemType === 'lost'
                      ? 'e.g., Black Wallet, Student ID Card'
                      : 'e.g., Found Keys, Water Bottle'
                  }
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label fw-bold">
                  Description *
                </label>
                <textarea
                  className="form-control"
                  rows="3"
                  placeholder={
                    formData.itemType === 'lost'
                      ? 'Describe your lost item (color, brand, where you lost it, etc.)'
                      : 'Describe the found item (color, brand, where you found it, etc.)'
                  }
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  required
                ></textarea>
              </div>

              <div className="mb-3">
                <label className="form-label fw-bold">
                  Upload Image (Optional)
                </label>
                <input
                  type="file"
                  className="form-control"
                  accept="image/*"
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      image: e.target.files[0],
                    })
                  }
                />
                {uploading && (
                  <div className="mt-2">
                    <div className="spinner-border spinner-border-sm text-success" role="status">
                      <span className="visually-hidden">Uploading...</span>
                    </div>
                    <span className="ms-2 text-muted">Uploading image...</span>
                  </div>
                )}
              </div>

              <div className="d-flex justify-content-end gap-2">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={uploading}>
                  {uploading ? 'Uploading...' : 'Post Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Items List */}
      <div className="row">
        {items.map((item) => (
          <div key={item.id} className="col-md-6 mb-4">
            <div className="card h-100 hover-shadow">
              {item.image_url && (
                <img
                  src={item.image_url}
                  className="card-img-top"
                  alt={item.title}
                  style={{
                    height: '180px',
                    objectFit: 'cover',
                    borderTopLeftRadius: '10px',
                    borderTopRightRadius: '10px',
                  }}
                />
              )}
              <div className="card-body d-flex flex-column">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <h5 className="card-title fw-bold mb-0">{item.title}</h5>
                  <span
                    className={`badge ${
                      item.status === 'pending'
                        ? 'badge-pending'
                        : item.status === 'found'
                        ? 'badge-found'
                        : 'badge-resolved'
                    }`}
                  >
                    {item.status.toUpperCase()}
                  </span>
                </div>

                <p
                  className="card-text text-muted flex-grow-1"
                  style={{ fontSize: '0.9rem' }}
                >
                  {item.description}
                </p>

                <div className="mt-auto">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <small className="text-muted">
                      <i className="bi bi-clock me-1"></i>
                      {new Date(item.created_at).toLocaleDateString()}
                    </small>
                    <small
                      className={`badge ${
                        item.item_type === 'lost'
                          ? 'bg-warning'
                          : 'bg-info'
                      } text-dark`}
                    >
                      {item.item_type.toUpperCase()}
                    </small>
                  </div>

                  <div className="d-flex gap-2">
                    {item.status === 'pending' && (
                      <button
                        className={`btn btn-sm ${
                          item.item_type === 'lost'
                            ? 'btn-success'
                            : 'btn-primary'
                        }`}
                        onClick={() =>
                          handleStatusUpdate(
                            item.id,
                            item.item_type === 'lost' ? 'found' : 'claimed'
                          )
                        }
                      >
                        {item.item_type === 'lost'
                          ? '✅ Mark as Found'
                          : '🎁 Mark as Claimed'}
                      </button>
                    )}
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => handleDelete(item.id)}
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {items.length === 0 && !showForm && (
        <div className="text-center py-5">
          <div
            className="bg-light border rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
            style={{ width: '80px', height: '80px' }}
          >
            <i
              className="bi bi-search"
              style={{ fontSize: '2.5rem', color: '#66b032' }}
            ></i>
          </div>
          <h4 className="mb-2">No items posted yet</h4>
          <p className="text-muted mb-4">
            Click "Post Item" to share something you lost or found on campus
          </p>
          <button
            className="btn btn-success btn-lg"
            onClick={() => setShowForm(true)}
          >
            <i className="bi bi-plus-circle me-2"></i>Post Your First Item
          </button>
        </div>
      )}
    </div>
  );
}

export default LostFound;