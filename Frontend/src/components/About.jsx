import React, { useState } from 'react';
import AuthModal from './AuthModal';

const About = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('register'); // 'register' or 'login'
  const [initialUserType, setInitialUserType] = useState('volunteer'); // 'volunteer' or 'ngo'

  const openModal = (userType) => {
    setInitialUserType(userType);
    setModalType('register');
    setIsModalOpen(true);
  };

  const switchModalType = (newType) => {
    setModalType(newType);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  return (
    <div className="bg-white min-h-screen">
      {/* Hero Section */}
      <section className="bg-gray-100 py-16 px-4 text-center max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-4">About SkillBridge</h1>
        <p className="text-gray-700 max-w-3xl mx-auto">
          We're on a mission to democratize social impact by connecting skilled professionals with NGOs that need their expertise to create lasting change.
        </p>
      </section>

      {/* Our Mission */}
      <section className="max-w-7xl mx-auto px-4 py-16 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        <div>
          <h2 className="text-2xl font-bold mb-4">Our Mission</h2>
          <p className="mb-4 text-gray-700">
            To bridge the gap between skilled professionals who want to make a difference and NGOs that need expertise to amplify their impact. We believe that everyone has skills that can contribute to solving the world's most pressing challenges.
          </p>
          <p className="text-gray-700">
            Through technology and community, we're making it easier than ever for people to volunteer their professional skills and for organizations to access the talent they need to thrive.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-red-600 text-white rounded-lg p-6 text-center">
            <div className="text-3xl font-bold mb-1">2.5M+</div>
            <div className="text-sm">Volunteer Hours</div>
          </div>
          <div className="bg-red-600 text-white rounded-lg p-6 text-center">
            <div className="text-3xl font-bold mb-1">850+</div>
            <div className="text-sm">NGO Partners</div>
          </div>
          <div className="bg-red-600 text-white rounded-lg p-6 text-center">
            <div className="text-3xl font-bold mb-1">120+</div>
            <div className="text-sm">Countries</div>
          </div>
          <div className="bg-red-600 text-white rounded-lg p-6 text-center">
            <div className="text-3xl font-bold mb-1">95%</div>
            <div className="text-sm">Success Rate</div>
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section className="bg-gray-50 py-16 px-4 max-w-7xl mx-auto text-center">
        <h2 className="text-2xl font-bold mb-2">Our Story</h2>
        <p className="text-gray-700 mb-12">From a simple idea to a global movement connecting skills with purpose</p>
        <div className="relative max-w-4xl mx-auto">
         

          {/* Timeline items */}
          <div className="space-y-8">
            {[
              {
                year: '2019',
                title: 'The Beginning',
                description: 'Founded by a team of social entrepreneurs who saw the disconnect between skilled professionals wanting to help and NGOs needing expertise.'
              },
              {
                year: '2020',
                title: 'First 100 Matches',
                description: 'Successfully connected our first 100 volunteers with NGOs, proving the concept and refining our matching algorithm based on real-world feedback.'
              },
              {
                year: '2021',
                title: 'Global Expansion',
                description: 'Expanded to 50+ countries and launched our integrated communication platform, making remote collaboration seamless for global teams.'
              },
              {
                year: '2022',
                title: 'AI-Powered Matching',
                description: 'Introduced machine learning algorithms to improve volunteer-NGO matching, resulting in 95% project success rate and higher satisfaction scores.'
              },
              {
                year: '2024',
                title: 'Community of Impact',
                description: "Today, we're a thriving community of 2,500+ volunteers and 850+ NGOs across 120+ countries, having facilitated over 2.5 million hours of skilled volunteering."
              }
            ].map(({ year, title, description }, index) => (
              <div key={year} className="relative flex items-start space-x-6">
                {/* Dot */}
                <div className="flex flex-col items-center">
                  <div className="w-4 h-4 bg-red-600 rounded-full z-10"></div>
                </div>
                {/* Content */}
                <div className="bg-white rounded-lg shadow p-6 text-left w-full max-w-3xl">
                  <div className="inline-block bg-red-100 text-red-700 text-xs font-semibold px-3 py-1 rounded-full mb-2">{year}</div>
                  <h3 className="font-bold text-lg mb-1">{title}</h3>
                  <p className="text-gray-700">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Values */}
      <section className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold mb-2">Our Values</h2>
        <p className="text-gray-700 mb-12">The principles that guide everything we do</p>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-8 max-w-5xl mx-auto">
          {[
            {
              icon: '🤝',
              title: 'Collaboration',
              description: 'We believe the best solutions come from bringing diverse skills and perspectives together.'
            },
            {
              icon: '🎯',
              title: 'Impact',
              description: 'Every connection we make should create measurable, positive change in the world.'
            },
            {
              icon: '🌍',
              title: 'Accessibility',
              description: 'Making volunteering accessible to everyone, regardless of location, schedule, or background.'
            },
            {
              icon: '💡',
              title: 'Innovation',
              description: 'Continuously improving our platform to better serve volunteers and NGOs worldwide.'
            }
          ].map(({ icon, title, description }) => (
            <div key={title} className="flex flex-col items-center space-y-4">
              <div className="text-4xl rounded-full bg-gray-200 w-16 h-16 flex items-center justify-center">{icon}</div>
              <h3 className="font-bold">{title}</h3>
              <p className="text-gray-700 max-w-xs">{description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Meet Our Team */}
      <section className="bg-gray-50 py-16 px-4 max-w-7xl mx-auto text-center">
        <h2 className="text-2xl font-bold mb-2">Meet Our Team</h2>
        <p className="text-gray-700 mb-12">Passionate individuals working to make social impact more accessible</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {[
            {
              initials: 'AK',
              name: 'Ananya Kumar',
              role: 'Co-Founder & CEO',
              roleColor: 'text-red-600',
              description: 'Former McKinsey consultant passionate about scaling social impact through technology and community building.'
            },
            {
              initials: 'JC',
              name: 'James Chen',
              role: 'Co-Founder & CTO',
              roleColor: 'text-blue-600',
              description: 'Tech entrepreneur with 15+ years building platforms that connect people and create positive social change.'
            },
            {
              initials: 'MR',
              name: 'Maria Rodriguez',
              role: 'Head of Community',
              roleColor: 'text-green-600',
              description: 'NGO veteran with deep experience in volunteer management and building sustainable partnerships globally.'
            }
          ].map(({ initials, name, role, roleColor, description }) => (
            <div key={name} className="bg-white rounded-lg shadow p-6 text-left">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-lg mb-4 ${roleColor} bg-opacity-90`}>
                {initials}
              </div>
              <h3 className="font-bold text-lg">{name}</h3>
              <p className={`${roleColor} font-semibold mb-2`}>{role}</p>
              <p className="text-gray-700 text-sm">{description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Call to Action */}
      <section className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold mb-2">Ready to Make an Impact?</h2>
        <p className="text-gray-700 mb-8">
          Join thousands of professionals and organizations already creating positive change through SkillBridge.
        </p>
        <div className="flex justify-center space-x-4">
          <button
            onClick={() => openModal('volunteer')}
            className="bg-red-600 text-white px-6 py-3 rounded-md font-semibold hover:bg-red-700 transition"
          >
            Start Volunteering
          </button>
          <button
            onClick={() => openModal('ngo')}
            className="bg-blue-600 text-white px-6 py-3 rounded-md font-semibold hover:bg-blue-700 transition"
          >
            Partner with Us
          </button>
        </div>
      </section>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isModalOpen}
        onClose={closeModal}
        type={modalType}
        onSwitchType={switchModalType}
        initialUserType={initialUserType}
      />
    </div>
  );
};

export default About;
