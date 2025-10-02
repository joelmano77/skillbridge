import { useState, useEffect } from 'react'
import OpportunityManagement from './OpportunityManagement'
import authService from '../services/authService'

const NGOProfile = ({ user, onLoginClick, onSignUpClick, onHomeClick, onLogout, onUserUpdate }) => {
  const [currentView, setCurrentView] = useState('profile') // 'profile' or 'opportunities'
  const [profile, setProfile] = useState({
    organizationName: '',
    contactPerson: '',
    email: '',
    phone: '',
    website: '',
    location: '',
    description: '',
    mission: '',
    focusAreas: [],
    size: '',
    foundedYear: '',
    registrationNumber: ''
  })

  const [newFocusArea, setNewFocusArea] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Load user data when component mounts or user changes
  useEffect(() => {
    if (user && user.profile) {
      setProfile({
        organizationName: user.organizationName || '',
        contactPerson: user.contactPerson || '',
        email: user.email || '',
        phone: user.profile.phone || '',
        website: user.profile.website || '',
        location: user.profile.location || '',
        description: user.profile.description || '',
        mission: user.profile.mission || '',
        focusAreas: user.profile.focusAreas || [],
        size: user.profile.size || '',
        foundedYear: user.profile.foundedYear || '',
        registrationNumber: user.profile.registrationNumber || ''
      })
    }
  }, [user])

  const handleInputChange = (e) => {
    setProfile({
      ...profile,
      [e.target.name]: e.target.value
    })
  }

  const addFocusArea = () => {
    if (newFocusArea.trim() && !profile.focusAreas.includes(newFocusArea.trim())) {
      setProfile({
        ...profile,
        focusAreas: [...profile.focusAreas, newFocusArea.trim()]
      })
      setNewFocusArea('')
    }
  }

  const removeFocusArea = (areaToRemove) => {
    setProfile({
      ...profile,
      focusAreas: profile.focusAreas.filter(area => area !== areaToRemove)
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const profileData = {
        organizationName: profile.organizationName,
        contactPerson: profile.contactPerson,
        profile: {
          phone: profile.phone,
          website: profile.website,
          location: profile.location,
          description: profile.description,
          mission: profile.mission,
          focusAreas: profile.focusAreas,
          size: profile.size,
          foundedYear: profile.foundedYear,
          registrationNumber: profile.registrationNumber
        }
      }

      const result = await authService.updateProfile(profileData)

      if (result.success) {
        alert('Profile updated successfully!')
        if (onUserUpdate) {
          onUserUpdate(result.user)
        }
      }
    } catch (error) {
      alert('Failed to update profile: ' + (error.message || 'Unknown error'))
    } finally {
      setSubmitting(false)
    }
  }

  if (currentView === 'opportunities') {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Navigation Tabs */}
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex space-x-8">
              <button
                onClick={() => setCurrentView('profile')}
                className="py-4 px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              >
                My Profile
              </button>
              <button
                onClick={() => setCurrentView('opportunities')}
                className="py-4 px-1 border-b-2 border-red-500 text-red-600 font-medium"
              >
                Manage Opportunities
              </button>
            </nav>
          </div>
        </div>

        <OpportunityManagement user={user} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            <button
              onClick={() => setCurrentView('profile')}
              className="py-4 px-1 border-b-2 border-red-500 text-red-600 font-medium"
            >
              My Profile
            </button>
            <button
              onClick={() => setCurrentView('opportunities')}
              className="py-4 px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            >
              Manage Opportunities
            </button>
          </nav>
        </div>
      </div>

      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">NGO Profile</h1>
            <p className="text-gray-600">Tell us about your organization and find the right volunteers</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Organization Information */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Organization Name</label>
              <input
                type="text"
                name="organizationName"
                value={profile.organizationName}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                required
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Contact Person</label>
                <input
                  type="text"
                  name="contactPerson"
                  value={profile.contactPerson}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  name="email"
                  value={profile.email}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  required
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={profile.phone}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
                <input
                  type="url"
                  name="website"
                  value={profile.website}
                  onChange={handleInputChange}
                  placeholder="https://..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
              <input
                type="text"
                name="location"
                value={profile.location}
                onChange={handleInputChange}
                placeholder="City, Country"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            {/* Organization Details */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Organization Size</label>
                <select
                  name="size"
                  value={profile.size}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="">Select size</option>
                  <option value="small">Small (1-10 employees)</option>
                  <option value="medium">Medium (11-50 employees)</option>
                  <option value="large">Large (51-200 employees)</option>
                  <option value="enterprise">Enterprise (200+ employees)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Founded Year</label>
                <input
                  type="number"
                  name="foundedYear"
                  value={profile.foundedYear}
                  onChange={handleInputChange}
                  min="1900"
                  max={new Date().getFullYear()}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Registration Number</label>
              <input
                type="text"
                name="registrationNumber"
                value={profile.registrationNumber}
                onChange={handleInputChange}
                placeholder="Official registration number"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Organization Description</label>
              <textarea
                name="description"
                value={profile.description}
                onChange={handleInputChange}
                rows={4}
                placeholder="Tell us about your organization, its history, and current activities..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            {/* Mission */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Mission Statement</label>
              <textarea
                name="mission"
                value={profile.mission}
                onChange={handleInputChange}
                rows={3}
                placeholder="What is your organization's mission and vision?"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            {/* Focus Areas */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Focus Areas</label>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={newFocusArea}
                  onChange={(e) => setNewFocusArea(e.target.value)}
                  placeholder="Add a focus area (e.g., Education, Health, Environment)"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFocusArea())}
                />
                <button
                  type="button"
                  onClick={addFocusArea}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {profile.focusAreas.map((area, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800"
                  >
                    {area}
                    <button
                      type="button"
                      onClick={() => removeFocusArea(area)}
                      className="ml-2 text-green-600 hover:text-green-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-6">
              <button
                type="submit"
                disabled={submitting}
                className="w-full md:w-auto px-8 py-3 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {submitting ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default NGOProfile
