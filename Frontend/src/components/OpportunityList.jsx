import { useState, useEffect } from 'react';
import opportunityService from '../services/opportunityService';

const OpportunityList = ({ user, onLoginClick }) => {
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    skills: '',
    location: '',
    status: 'open'
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [applyingTo, setApplyingTo] = useState(null);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [selectedOpportunity, setSelectedOpportunity] = useState(null);
  const [applicationMessage, setApplicationMessage] = useState('');

  const statusOptions = [
    'open', 'closed'
  ];

  useEffect(() => {
    fetchOpportunities();
  }, [filters, currentPage]);

  const fetchOpportunities = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await opportunityService.getOpportunities(filters, currentPage, 9);
      setOpportunities(response.data || []);
      setTotalPages(response.pages || 1);
    } catch (err) {
      console.error('Error fetching opportunities:', err);
      
      // Handle structured error responses
      if (err.success === false) {
        if (err.status === 404) {
          setError('No opportunities found. Please try different filters.');
        } else if (err.status === 'NETWORK_ERROR') {
          setError('Unable to connect to server. Please check your internet connection.');
        } else {
          setError(err.error || 'Failed to load opportunities. Please try again.');
        }
      } else {
        setError('Failed to load opportunities. Please try again.');
      }
      
      // Set empty array to prevent further errors
      setOpportunities([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({ ...prev, [filterType]: value }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  const clearFilters = () => {
    setFilters({
      skills: '',
      location: '',
      status: ''
    });
    setCurrentPage(1);
  };

  const handleApply = (opportunity) => {
    if (!user) {
      alert('Please log in to apply for opportunities.');
      return;
    }
    if (user.userType !== 'volunteer') {
      alert('Only volunteers can apply for opportunities.');
      return;
    }
    setSelectedOpportunity(opportunity);
    setShowApplyModal(true);
  };

  const submitApplication = async () => {
    if (!selectedOpportunity) return;

    try {
      setApplyingTo(selectedOpportunity._id);
      await opportunityService.applyForOpportunity(
        selectedOpportunity._id,
        applicationMessage
      );

      alert('Application submitted successfully!');
      setShowApplyModal(false);
      setApplicationMessage('');
      setSelectedOpportunity(null);
    } catch (err) {
      alert(err.error || 'Failed to submit application. Please try again.');
    } finally {
      setApplyingTo(null);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading && opportunities.length === 0) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }



  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Available Opportunities</h1>
        <p className="text-gray-600">Find the perfect match for your skills</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
          <button
            onClick={clearFilters}
            className="text-sm text-red-600 hover:text-red-800"
          >
            Clear all
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Skills Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Skills</label>
            <input
              type="text"
              placeholder="Search by skills..."
              value={filters.skills}
              onChange={(e) => handleFilterChange('skills', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          {/* Location Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
            <input
              type="text"
              placeholder="Search by location..."
              value={filters.location}
              onChange={(e) => handleFilterChange('location', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="">Any status</option>
              {statusOptions.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <p className="text-red-800">{error}</p>
          <button
            onClick={fetchOpportunities}
            className="mt-2 text-red-600 hover:text-red-800 text-sm underline"
          >
            Try again
          </button>
        </div>
      )}

      {/* Opportunities List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 items-stretch">
        {opportunities.length === 0 && !loading ? (
          <div className="text-center py-12 col-span-full">
            <p className="text-gray-500 text-lg">No opportunities found matching your criteria.</p>
            <p className="text-gray-400 mt-2">Try adjusting your filters or check back later.</p>
          </div>
        ) : (
          opportunities.map(opportunity => (
            <div key={opportunity._id} className="bg-white rounded-lg shadow p-6 flex flex-col justify-between h-full">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {opportunity.title}
                </h3>
                <p className="text-gray-600 mb-3">{opportunity.description}</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <span className="text-sm font-medium text-gray-500">NGO:</span>
                    <p className="text-sm text-gray-900">{opportunity.ngo_id.organizationName}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Location:</span>
                    <p className="text-sm text-gray-900">{opportunity.location}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Status:</span>
                    <p className="text-sm text-gray-900">{opportunity.status}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Posted:</span>
                    <p className="text-sm text-gray-900">{formatDate(opportunity.createdAt)}</p>
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

              <div className="mt-auto flex justify-end">
                <button
                  onClick={() => handleApply(opportunity)}
                  disabled={applyingTo === opportunity._id}
                  className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {applyingTo === opportunity._id ? 'Applying...' : 'Apply Now'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-8">
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Previous
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-2 border rounded-md ${
                  currentPage === page
                    ? 'bg-red-600 text-white border-red-600'
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Apply Modal */}
      {showApplyModal && selectedOpportunity && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Apply for: {selectedOpportunity.title}
            </h3>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message (Optional)
              </label>
              <textarea
                value={applicationMessage}
                onChange={(e) => setApplicationMessage(e.target.value)}
                placeholder="Tell the NGO why you're interested in this opportunity..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowApplyModal(false);
                  setApplicationMessage('');
                  setSelectedOpportunity(null);
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={submitApplication}
                disabled={applyingTo === selectedOpportunity._id}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                {applyingTo === selectedOpportunity._id ? 'Submitting...' : 'Submit Application'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OpportunityList;
