import { useState, useEffect } from 'react';
import opportunityService from '../services/opportunityService';

const ApplicationManagement = ({ user }) => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [withdrawing, setWithdrawing] = useState(null);

  useEffect(() => {
    if (user && user.userType === 'volunteer') {
      fetchApplications();
    }
  }, [user]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const response = await opportunityService.getMyApplications();
      const validApplications = response.data.filter(app => app && app._id && app.opportunity_id && app.volunteer_id);
      setApplications(validApplications);
    } catch (err) {
      setError('Failed to load applications');
      console.error('Error fetching applications:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async (applicationId) => {
    if (!window.confirm('Are you sure you want to withdraw this application? This action cannot be undone.')) {
      return;
    }

    try {
      setWithdrawing(applicationId);
      // Assuming there's a delete application endpoint, or we can use a general delete
      // For now, since the service might not have it, we'll use the general delete if available
      await opportunityService.deleteApplication(applicationId);
      setApplications(prev => prev.filter(app => app._id !== applicationId));
      alert('Application withdrawn successfully');
    } catch (err) {
      alert('Failed to withdraw application. Please try again.');
    } finally {
      setWithdrawing(null);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!user || user.userType !== 'volunteer') {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <p className="text-gray-500">Only volunteers can access application management.</p>
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

  const totalApplications = applications.length;
  const pendingApplications = applications.filter(app => app.status === 'pending').length;
  const acceptedApplications = applications.filter(app => app.status === 'accepted').length;
  const rejectedApplications = applications.filter(app => app.status === 'rejected').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Manage Applications</h1>
        <p className="text-gray-600">View and manage your volunteer applications</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="text-2xl font-bold text-gray-900">{totalApplications}</div>
          <div className="text-gray-600">Total Applications</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="text-2xl font-bold text-yellow-600">{pendingApplications}</div>
          <div className="text-gray-600">Pending</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="text-2xl font-bold text-green-600">{acceptedApplications}</div>
          <div className="text-gray-600">Accepted</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="text-2xl font-bold text-red-600">{rejectedApplications}</div>
          <div className="text-gray-600">Rejected</div>
        </div>
      </div>

      {/* Applications List */}
      <div className="space-y-6">
        {applications.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm border">
            <p className="text-gray-500 text-lg mb-4">You haven't submitted any applications yet.</p>
            <p className="text-gray-600">Browse opportunities and start applying!</p>
          </div>
        ) : (
          applications.map(application => (
            <div key={application._id} className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-semibold text-gray-900">{application.opportunity_id.title}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(application.status)}`}>
                      {application.status}
                    </span>
                  </div>
                  <p className="text-gray-600 mb-3">{application.opportunity_id.description}</p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <span className="text-sm font-medium text-gray-500">NGO:</span>
                      <p className="text-sm text-gray-900">{application.opportunity_id.ngo_id.organizationName}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Location:</span>
                      <p className="text-sm text-gray-900">{application.opportunity_id.location}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Applied on:</span>
                      <p className="text-sm text-gray-900">{formatDate(application.createdAt)}</p>
                    </div>
                  </div>

                  {application.message && (
                    <div className="mb-4">
                      <span className="text-sm font-medium text-gray-500">Your Message:</span>
                      <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded mt-1">{application.message}</p>
                    </div>
                  )}

                  <div className="mb-4">
                    <span className="text-sm font-medium text-gray-500">Required Skills:</span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {application.opportunity_id.required_skills.map(skill => (
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
                  {application.status === 'pending' && (
                    <button
                      onClick={() => handleWithdraw(application._id)}
                      disabled={withdrawing === application._id}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm disabled:opacity-50"
                    >
                      {withdrawing === application._id ? 'Withdrawing...' : 'Withdraw Application'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ApplicationManagement;
