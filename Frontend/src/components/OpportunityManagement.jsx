import { useState, useEffect } from 'react';
import opportunityService from '../services/opportunityService';

const OpportunityManagement = ({ user }) => {
  const [opportunities, setOpportunities] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showApplicationsModal, setShowApplicationsModal] = useState(false);
  const [selectedOpportunity, setSelectedOpportunity] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    required_skills: [],
    duration: '',
    location: '',
    status: 'open',
    skillInput: ''
  });
  const [submitting, setSubmitting] = useState(false);

  // Available options
  const skillOptions = [
    'JavaScript', 'React', 'Node.js', 'Python', 'Java', 'C++', 'HTML', 'CSS',
    'Project Management', 'Marketing', 'Design', 'Teaching', 'Healthcare',
    'Environment', 'Education', 'Technology', 'Community Development'
  ];

  const durationOptions = [
    '1 week', '2 weeks', '1 month', '2 months', '3 months', '6 months', '1 year'
  ];

  useEffect(() => {
    if (user && user.userType === 'ngo') {
      fetchOpportunities();
      fetchApplications();
    }
  }, [user]);

  const fetchOpportunities = async () => {
    try {
      setLoading(true);
      const response = await opportunityService.getOpportunitiesByNGO(user._id);
      setOpportunities(response.data);
    } catch (err) {
      setError('Failed to load opportunities');
      console.error('Error fetching opportunities:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchApplications = async () => {
    try {
      const response = await opportunityService.getApplications();
      const validApplications = response.data.filter(app => app && app._id && app.opportunity_id && app.volunteer_id);
      setApplications(validApplications);
    } catch (err) {
      console.error('Error fetching applications:', err);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      required_skills: [],
      duration: '',
      location: '',
      skillInput: ''
    });
  };

  const handleCreate = () => {
    resetForm();
    setShowCreateModal(true);
  };

  const handleEdit = (opportunity) => {
      setFormData({
        title: opportunity.title,
        description: opportunity.description,
        required_skills: [...opportunity.required_skills],
        duration: opportunity.duration,
        location: opportunity.location,
        status: opportunity.status || 'open',
        skillInput: ''
      });
    setSelectedOpportunity(opportunity);
    setShowEditModal(true);
  };

  const handleDelete = async (opportunityId) => {
    if (!window.confirm('Are you sure you want to delete this opportunity? This action cannot be undone.')) {
      return;
    }

    try {
      await opportunityService.deleteOpportunity(opportunityId);
      setOpportunities(prev => prev.filter(opp => opp._id !== opportunityId));
      alert('Opportunity deleted successfully');
    } catch (err) {
      alert('Failed to delete opportunity. Please try again.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title || !formData.description || !formData.required_skills.length || !formData.duration || !formData.location) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setSubmitting(true);

      if (showCreateModal) {
        const response = await opportunityService.createOpportunity(formData);
        setOpportunities(prev => [response.data, ...prev]);
        setShowCreateModal(false);
        alert('Opportunity created successfully');
      } else if (showEditModal && selectedOpportunity) {
        const response = await opportunityService.updateOpportunity(selectedOpportunity._id, formData);
        setOpportunities(prev => prev.map(opp =>
          opp._id === selectedOpportunity._id ? response.data : opp
        ));
        setShowEditModal(false);
        alert('Opportunity updated successfully');
      }

      resetForm();
    } catch (err) {
      alert(err.error || 'Failed to save opportunity. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkillToggle = (skill) => {
    setFormData(prev => ({
      ...prev,
      required_skills: prev.required_skills.includes(skill)
        ? prev.required_skills.filter(s => s !== skill)
        : [...prev.required_skills, skill]
    }));
  };

  const updateApplicationStatus = async (applicationId, status) => {
    try {
      await opportunityService.updateApplicationStatus(applicationId, status);
      setApplications(prev => prev.map(app =>
        app._id === applicationId ? { ...app, status } : app
      ));
      alert('Application status updated successfully');
    } catch (err) {
      alert('Failed to update application status. Please try again.');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getApplicationsForOpportunity = (opportunityId) => {
    return applications.filter(app => app.opportunity_id._id === opportunityId);
  };

  if (!user || user.userType !== 'ngo') {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <p className="text-gray-500">Only NGOs can access opportunity management.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Manage Opportunities</h1>
          <p className="text-gray-600">Create and manage volunteer opportunities for your organization</p>
        </div>
        <button
          onClick={handleCreate}
          className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 font-semibold"
        >
          Create Opportunity
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="text-2xl font-bold text-gray-900">{opportunities.length}</div>
          <div className="text-gray-600">Total Opportunities</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="text-2xl font-bold text-gray-900">
            {opportunities.filter(opp => opp.status === 'open').length}
          </div>
          <div className="text-gray-600">Open Opportunities</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="text-2xl font-bold text-gray-900">{applications.length}</div>
          <div className="text-gray-600">Total Applications</div>
        </div>
      </div>

      {/* Opportunities List */}
      <div className="space-y-6">
        {opportunities.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm border">
            <p className="text-gray-500 text-lg mb-4">No opportunities created yet.</p>
            <button
              onClick={handleCreate}
              className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700"
            >
              Create Your First Opportunity
            </button>
          </div>
        ) : (
          opportunities.map(opportunity => {
            const opportunityApplications = getApplicationsForOpportunity(opportunity._id);
            return (
              <div key={opportunity._id} className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-gray-900">{opportunity.title}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        opportunity.status === 'open'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {opportunity.status}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-3">{opportunity.description}</p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <span className="text-sm font-medium text-gray-500">Location:</span>
                        <p className="text-sm text-gray-900">{opportunity.location}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Duration:</span>
                        <p className="text-sm text-gray-900">{opportunity.duration}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Applications:</span>
                        <p className="text-sm text-gray-900">{opportunityApplications.length}</p>
                      </div>
                    </div>

                    <div className="mb-4">
                      <span className="text-sm font-medium text-gray-500">Required Skills:</span>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {opportunity.required_skills.map(skill => (
                          <span
                            key={skill}
                            className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 ml-6">
                    <button
                      onClick={() => {
                        setSelectedOpportunity(opportunity);
                        setShowApplicationsModal(true);
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                    >
                      View Applications ({opportunityApplications.length})
                    </button>
                    <button
                      onClick={() => handleEdit(opportunity)}
                      className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(opportunity._id)}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || showEditModal) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">
              {showCreateModal ? 'Create New Opportunity' : 'Edit Opportunity'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  required
                />
              </div>

              <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Required Skills
              </label>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={formData.skillInput || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, skillInput: e.target.value }))}
                  placeholder="e.g. Web Development"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (formData.skillInput && !formData.required_skills.includes(formData.skillInput.trim())) {
                      setFormData(prev => ({
                        ...prev,
                        required_skills: [...prev.required_skills, prev.skillInput.trim()],
                        skillInput: ''
                      }));
                    }
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.required_skills.map(skill => (
                  <span
                    key={skill}
                    className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs flex items-center gap-1"
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({
                          ...prev,
                          required_skills: prev.required_skills.filter(s => s !== skill)
                        }));
                      }}
                      className="ml-1 text-blue-600 hover:text-blue-900 font-bold"
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status *
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                required
              >
                <option value="open">Open</option>
                <option value="closed">Closed</option>
              </select>
            </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duration *
                  </label>
                  <select
                    value={formData.duration}
                    onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    required
                  >
                    <option value="">Select duration</option>
                    {durationOptions.map(duration => (
                      <option key={duration} value={duration}>{duration}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location *
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="e.g., New York, NY"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setShowEditModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : (showCreateModal ? 'Create Opportunity' : 'Update Opportunity')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Applications Modal */}
      {showApplicationsModal && selectedOpportunity && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                Applications for: {selectedOpportunity.title}
              </h3>
              <button
                onClick={() => setShowApplicationsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {getApplicationsForOpportunity(selectedOpportunity._id).length === 0 ? (
                <p className="text-gray-500 text-center py-8">No applications received yet.</p>
              ) : (
                getApplicationsForOpportunity(selectedOpportunity._id).map(application => (
                  <div key={application._id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          {application.volunteer_id.firstName} {application.volunteer_id.lastName}
                        </h4>
                        <p className="text-sm text-gray-600">{application.volunteer_id.profile.location}</p>
                        <p className="text-xs text-gray-500">Applied on {formatDate(application.createdAt)}</p>
                      </div>
                      <select
                        value={application.status}
                        onChange={(e) => updateApplicationStatus(application._id, e.target.value)}
                        className="px-3 py-1 border border-gray-300 rounded-md text-sm"
                      >
                        <option value="pending">Pending</option>
                        <option value="accepted">Accepted</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </div>

                    {application.message && (
                      <div className="mb-3">
                        <p className="text-sm font-medium text-gray-700">Message:</p>
                        <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">{application.message}</p>
                      </div>
                    )}

                    <div>
                      <p className="text-sm font-medium text-gray-700">Skills:</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {application.volunteer_id.profile.skills.map(skill => (
                          <span
                            key={skill}
                            className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-gray-700">Experience Level:</p>
                      <p className="text-sm text-gray-600">{application.volunteer_id.profile.experience || 'Not specified'}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OpportunityManagement;
