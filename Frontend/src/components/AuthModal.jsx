import { useState, useEffect } from 'react'
import authService from '../services/authService'
import ForgotPasswordModal from './ForgotPasswordModal'
import ResetPasswordModal from './ResetPasswordModal'

const AuthModal = ({ isOpen, onClose, type, onSwitchType, onAuthSuccess, initialUserType }) => {
  const [formData, setFormData] = useState({
    // Basic auth fields
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    userType: initialUserType || 'volunteer',
    
    // Common fields
    phone: '',
    location: '',
    
    // Volunteer specific fields
    bio: '',
    skills: [],
    experience: '',
    availability: '',
    interests: [],
    
    // NGO specific fields
    organizationName: '',
    contactPerson: '',
    website: '',
    description: '',
    mission: '',
    focusAreas: [],
    size: '',
    foundedYear: '',
    registrationNumber: ''
  })

  const [newSkill, setNewSkill] = useState('')
  const [newInterest, setNewInterest] = useState('')
  const [newFocusArea, setNewFocusArea] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Forgot password flow state
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [showResetPassword, setShowResetPassword] = useState(false)
  const [resetEmail, setResetEmail] = useState('')

  // Update userType when initialUserType changes
  useEffect(() => {
    if (initialUserType) {
      setFormData(prev => ({ ...prev, userType: initialUserType }))
    }
  }, [initialUserType])

  // Clear form and messages when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setError('')
      setSuccess('')
    } else {
      // Reset form when modal closes
      setFormData({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        userType: initialUserType || 'volunteer',
        phone: '',
        location: '',
        bio: '',
        skills: [],
        experience: '',
        availability: '',
        interests: [],
        organizationName: '',
        contactPerson: '',
        website: '',
        description: '',
        mission: '',
        focusAreas: [],
        size: '',
        foundedYear: '',
        registrationNumber: ''
      })
      setNewSkill('')
      setNewInterest('')
      setNewFocusArea('')
      setIsLoading(false)
      setError('')
      setSuccess('')
    }
  }, [isOpen, initialUserType])

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleUserTypeChange = (userType) => {
    setFormData({
      ...formData,
      userType
    })
  }

  const addSkill = () => {
    if (newSkill.trim() && !formData.skills.includes(newSkill.trim())) {
      setFormData({
        ...formData,
        skills: [...formData.skills, newSkill.trim()]
      })
      setNewSkill('')
    }
  }

  const removeSkill = (skillToRemove) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter(skill => skill !== skillToRemove)
    })
  }

  const addInterest = () => {
    if (newInterest.trim() && !formData.interests.includes(newInterest.trim())) {
      setFormData({
        ...formData,
        interests: [...formData.interests, newInterest.trim()]
      })
      setNewInterest('')
    }
  }

  const removeInterest = (interestToRemove) => {
    setFormData({
      ...formData,
      interests: formData.interests.filter(interest => interest !== interestToRemove)
    })
  }

  const addFocusArea = () => {
    if (newFocusArea.trim() && !formData.focusAreas.includes(newFocusArea.trim())) {
      setFormData({
        ...formData,
        focusAreas: [...formData.focusAreas, newFocusArea.trim()]
      })
      setNewFocusArea('')
    }
  }

  const removeFocusArea = (areaToRemove) => {
    setFormData({
      ...formData,
      focusAreas: formData.focusAreas.filter(area => area !== areaToRemove)
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setSuccess('')

    try {
      let result
      
      if (type === 'login') {
        result = await authService.login(formData.email, formData.password)
      } else {
        result = await authService.register(formData)
      }

      if (result.success) {
        setSuccess(type === 'login' ? 'Login successful!' : 'Account created successfully!')
        
        // Call the success callback with user data
        if (onAuthSuccess) {
          onAuthSuccess(result.user)
        }
        
        // Close modal after a brief delay to show success message
        setTimeout(() => {
          onClose()
        }, 1000)
      } else {
        setError(result.error || 'An error occurred. Please try again.')
      }
    } catch (err) {
      setError('Network error. Please check your connection and try again.')
      console.error('Auth error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 relative max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {type === 'login' ? (
          // Login Form
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Login</h2>
            
            {/* Error/Success Messages */}
            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
                {error}
              </div>
            )}
            {success && (
              <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-md">
                {success}
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  required
                />
              </div>
              
              {/* Forgot Password */}
              <div className="text-right">
                <button
                  type="button"
                  className="text-sm text-red-600 hover:text-red-800"
                  onClick={() => setShowForgotPassword(true)}
                >
                  Forgot Password?
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Logging in...
                  </>
                ) : (
                  'Login'
                )}
              </button>
            </form>
            
            <div className="mt-4 text-center">
              <span className="text-gray-600">Don't have an account? </span>
              <button
                onClick={() => onSwitchType('register')}
                className="text-red-600 hover:text-red-800 font-medium"
              >
                Sign up
              </button>
            </div>
          </div>
        ) : (
          // Registration Form
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Create Account</h2>
            
            {/* Error/Success Messages */}
            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
                {error}
              </div>
            )}
            {success && (
              <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-md">
                {success}
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* User Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">I am a</label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="userType"
                      value="volunteer"
                      checked={formData.userType === 'volunteer'}
                      onChange={() => handleUserTypeChange('volunteer')}
                      className="mr-2 text-red-600 focus:ring-red-500"
                    />
                    <div>
                      <div className="font-medium text-gray-900">Volunteer</div>
                      <div className="text-sm text-gray-500">Offer my skills</div>
                    </div>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="userType"
                      value="ngo"
                      checked={formData.userType === 'ngo'}
                      onChange={() => handleUserTypeChange('ngo')}
                      className="mr-2 text-red-600 focus:ring-red-500"
                    />
                    <div>
                      <div className="font-medium text-gray-900">NGO</div>
                      <div className="text-sm text-gray-500">Find volunteers</div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Basic Information */}
              {formData.userType === 'ngo' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Organization Name</label>
                  <input
                    type="text"
                    name="organizationName"
                    value={formData.organizationName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    required
                  />
                </div>
              )}

              {/* Name Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {formData.userType === 'ngo' ? 'Contact Person' : 'First Name'}
                  </label>
                  <input
                    type="text"
                    name={formData.userType === 'ngo' ? 'contactPerson' : 'firstName'}
                    value={formData.userType === 'ngo' ? formData.contactPerson : formData.firstName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    required
                  />
                </div>
                {formData.userType === 'volunteer' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      required
                    />
                  </div>
                )}
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    placeholder="City, Country"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* NGO Specific Fields */}
              {formData.userType === 'ngo' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                    <input
                      type="url"
                      name="website"
                      value={formData.website}
                      onChange={handleInputChange}
                      placeholder="https://..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Organization Size</label>
                      <select
                        name="size"
                        value={formData.size}
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
                      <label className="block text-sm font-medium text-gray-700 mb-1">Founded Year</label>
                      <input
                        type="number"
                        name="foundedYear"
                        value={formData.foundedYear}
                        onChange={handleInputChange}
                        min="1900"
                        max={new Date().getFullYear()}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Registration Number</label>
                    <input
                      type="text"
                      name="registrationNumber"
                      value={formData.registrationNumber}
                      onChange={handleInputChange}
                      placeholder="Official registration number"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Organization Description</label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={3}
                      placeholder="Tell us about your organization..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mission Statement</label>
                    <textarea
                      name="mission"
                      value={formData.mission}
                      onChange={handleInputChange}
                      rows={2}
                      placeholder="What is your organization's mission?"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>

                  {/* Focus Areas */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Focus Areas</label>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={newFocusArea}
                        onChange={(e) => setNewFocusArea(e.target.value)}
                        placeholder="Add focus area"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFocusArea())}
                      />
                      <button
                        type="button"
                        onClick={addFocusArea}
                        className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
                      >
                        Add
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {formData.focusAreas.map((area, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800"
                        >
                          {area}
                          <button
                            type="button"
                            onClick={() => removeFocusArea(area)}
                            className="ml-1 text-green-600 hover:text-green-800"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Volunteer Specific Fields */}
              {formData.userType === 'volunteer' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                    <textarea
                      name="bio"
                      value={formData.bio}
                      onChange={handleInputChange}
                      rows={3}
                      placeholder="Tell us about yourself and your motivation..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Experience Level</label>
                      <select
                        name="experience"
                        value={formData.experience}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                      >
                        <option value="">Select level</option>
                        <option value="beginner">Beginner (0-2 years)</option>
                        <option value="intermediate">Intermediate (2-5 years)</option>
                        <option value="advanced">Advanced (5+ years)</option>
                        <option value="expert">Expert (10+ years)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Availability</label>
                      <select
                        name="availability"
                        value={formData.availability}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                      >
                        <option value="">Select availability</option>
                        <option value="few-hours-week">Few hours per week</option>
                        <option value="few-hours-month">Few hours per month</option>
                        <option value="part-time">Part-time</option>
                        <option value="full-time">Full-time</option>
                        <option value="project-based">Project-based</option>
                      </select>
                    </div>
                  </div>

                  {/* Skills */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Skills</label>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={newSkill}
                        onChange={(e) => setNewSkill(e.target.value)}
                        placeholder="Add a skill"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                      />
                      <button
                        type="button"
                        onClick={addSkill}
                        className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
                      >
                        Add
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {formData.skills.map((skill, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-red-100 text-red-800"
                        >
                          {skill}
                          <button
                            type="button"
                            onClick={() => removeSkill(skill)}
                            className="ml-1 text-red-600 hover:text-red-800"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Interests */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Areas of Interest</label>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={newInterest}
                        onChange={(e) => setNewInterest(e.target.value)}
                        placeholder="Add interest area"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addInterest())}
                      />
                      <button
                        type="button"
                        onClick={addInterest}
                        className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
                      >
                        Add
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {formData.interests.map((interest, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800"
                        >
                          {interest}
                          <button
                            type="button"
                            onClick={() => removeInterest(interest)}
                            className="ml-1 text-blue-600 hover:text-blue-800"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating Account...
                  </>
                ) : (
                  'Create Account'
                )}
              </button>
            </form>
            
            <div className="mt-4 text-center">
              <span className="text-gray-600">Already have an account? </span>
              <button
                onClick={() => onSwitchType('login')}
                className="text-red-600 hover:text-red-800 font-medium"
              >
                Login
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        isOpen={showForgotPassword}
        onClose={() => setShowForgotPassword(false)}
        onOTPSent={(email) => {
          setResetEmail(email);
          setShowForgotPassword(false);
          setShowResetPassword(true);
        }}
      />

      {/* Reset Password Modal */}
      <ResetPasswordModal
        isOpen={showResetPassword}
        onClose={() => {
          setShowResetPassword(false);
          setResetEmail('');
        }}
        email={resetEmail}
        onPasswordReset={() => {
          setShowResetPassword(false);
          setResetEmail('');
          // Optionally switch back to login form
          onSwitchType('login');
        }}
      />
    </div>
  )
}

export default AuthModal
