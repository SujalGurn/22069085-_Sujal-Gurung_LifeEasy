import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import styled from 'styled-components';
import { Button } from '../../components/ui/button';
import Input from '../../components/ui/input';

const EditProfileContainer = styled.div`
  max-width: 800px;
  margin: 2rem auto;
  padding: 0 1rem;
`;

const DynamicList = styled.div`
  margin: 1rem 0;

  .list-item {
    display: grid;
    grid-template-columns: repeat(3, 1fr) auto;
    gap: 1rem;
    margin-bottom: 1rem;
    align-items: center;

    @media (max-width: 768px) {
      grid-template-columns: 1fr;
    }
  }

  .add-form {
    background: #f8f9fa;
    padding: 1rem;
    border-radius: 8px;
    margin-top: 1rem;
  }
`;

const ActionBar = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid #e5e7eb;
  flex-wrap: wrap;
`;

const EditDoctorProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState({
    fullname: '',
    specialization: '',
    contact: '',
    about: '',
    profile_picture: '',
    qualifications: [],
    experience: []
  });
  const [initialProfile, setInitialProfile] = useState(null);
  const [newQualification, setNewQualification] = useState({ qualification: '', institution: '', year: '' });
  const [newExperience, setNewExperience] = useState({ position: '', institute: '', duration: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isModifying, setIsModifying] = useState(false);

  const getAuthConfig = () => ({
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`,
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    }
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await axios.get(`/api/doctors/${id}/profile`, getAuthConfig());
        
        if (!data?.doctor) throw new Error('Doctor profile not found');
        
        const formattedProfile = {
          fullname: data.doctor.fullname || '',
          specialization: data.doctor.specialization || '',
          contact: data.doctor.contact || '',
          about: data.doctor.about || '',
          profile_picture: data.doctor.profile_picture || '',
          qualifications: data.doctor.qualifications || [],
          experience: data.doctor.experience || []
        };

        setProfile(formattedProfile);
        setInitialProfile(formattedProfile);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load profile');
        navigate('/not-found', { replace: true });
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchProfile();
  }, [id, navigate]);

  const handleAdd = async (type, data, endpoint) => {
    setIsModifying(true);
    try {
      const { data: response } = await axios.post(
        `/api/doctors/${id}/${endpoint}`, 
        data, 
        getAuthConfig()
      );
      
      setProfile(prev => ({
        ...prev,
        [type]: [...prev[type], response]
      }));
      
      if (type === 'qualifications') {
        setNewQualification({ qualification: '', institution: '', year: '' });
      } else {
        setNewExperience({ position: '', institute: '', duration: '' });
      }
    } catch (err) {
      setError(err.response?.data?.message || `Failed to add ${type}`);
    } finally {
      setIsModifying(false);
    }
  };

  const handleRemove = async (type, itemId, endpoint) => {
    setIsModifying(true);
    try {
      await axios.delete(
        `/api/doctors/${id}/${endpoint}/${itemId}`,
        getAuthConfig()
      );
      
      setProfile(prev => ({
        ...prev,
        [type]: prev[type].filter(item => item.id !== itemId)
      }));
    } catch (err) {
      setError(err.response?.data?.message || `Failed to remove ${type}`);
    } finally {
      setIsModifying(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!hasChanges) {
      navigate(`/doctors/${id}`);
      return;
    }

    setIsSaving(true);
    try {
      await axios.put(
        `/api/doctors/${id}/profile`,
        {
          fullname: profile.fullname,
          specialization: profile.specialization,
          contact: profile.contact,
          about: profile.about,
          profile_picture: profile.profile_picture
        },
        getAuthConfig()
      );

      navigate(`/doctors/${id}`, { 
        state: { 
          success: 'Profile updated successfully!',
          timestamp: Date.now()
        } 
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges = initialProfile &&
    (profile.fullname !== initialProfile.fullname ||
     profile.specialization !== initialProfile.specialization ||
     profile.contact !== initialProfile.contact ||
     profile.about !== initialProfile.about ||
     profile.profile_picture !== initialProfile.profile_picture ||
     JSON.stringify(profile.qualifications) !== JSON.stringify(initialProfile.qualifications) ||
     JSON.stringify(profile.experience) !== JSON.stringify(initialProfile.experience));

  if (loading) return <div>Loading...</div>;
  if (error) return <div style={{ color: 'red', padding: '1rem' }}>Error: {error}</div>;

  return (
    <EditProfileContainer>
      <h1>Edit Profile - Dr. {profile?.fullname}</h1>

      <div>
        <h2>Profile Information</h2>
        <div className="existing-info">
          <div>
            <label>Full Name</label>
            <Input
              value={profile.fullname}
              onChange={e => setProfile(prev => ({ 
                ...prev, 
                fullname: e.target.value 
              }))}
            />
          </div>
          
          <div>
            <label>Specialization</label>
            <Input
              value={profile.specialization}
              onChange={e => setProfile(prev => ({ 
                ...prev, 
                specialization: e.target.value 
              }))}
            />
          </div>
          
          <div>
            <label>Contact</label>
            <Input
              value={profile.contact}
              onChange={e => setProfile(prev => ({ 
                ...prev, 
                contact: e.target.value 
              }))}
            />
          </div>
        </div>

        <div>
          <label>Profile Picture URL</label>
          <Input
            value={profile.profile_picture}
            onChange={e => setProfile(prev => ({ 
              ...prev, 
              profile_picture: e.target.value 
            }))}
            placeholder="Enter image URL"
          />
        </div>

        <div>
          <label>About</label>
          <textarea
            value={profile.about}
            onChange={e => setProfile(prev => ({ 
              ...prev, 
              about: e.target.value 
            }))}
            rows={6}
            placeholder="Write about your medical practice"
          />
        </div>
      </div>

      <div>
        <h2>Qualifications</h2>
        <DynamicList>
          {profile.qualifications.map((q) => (
            <div key={q.id} className="list-item">
              <Input value={q.qualification} disabled />
              <Input value={q.institution} disabled />
              <Input value={q.year} disabled />
              <Button
                variant="danger"
                onClick={() => handleRemove('qualifications', q.id, 'qualifications')}
                disabled={isModifying}
              >
                Remove
              </Button>
            </div>
          ))}

          <div className="add-form">
            <div className="list-item">
              <Input
                placeholder="Qualification"
                value={newQualification.qualification}
                onChange={e => setNewQualification(prev => ({ 
                  ...prev, 
                  qualification: e.target.value 
                }))}
                disabled={isModifying}
              />
              <Input
                placeholder="Institution"
                value={newQualification.institution}
                onChange={e => setNewQualification(prev => ({ 
                  ...prev, 
                  institution: e.target.value 
                }))}
                disabled={isModifying}
              />
              <Input
                placeholder="Year"
                value={newQualification.year}
                onChange={e => setNewQualification(prev => ({ 
                  ...prev, 
                  year: e.target.value 
                }))}
                disabled={isModifying}
              />
              <Button
                onClick={() => handleAdd('qualifications', newQualification, 'qualifications')}
                disabled={!newQualification.qualification || !newQualification.institution || !newQualification.year}
              >
                {isModifying ? 'Adding...' : 'Add'}
              </Button>
            </div>
          </div>
        </DynamicList>
      </div>

      <div>
        <h2>Experience</h2>
        <DynamicList>
          {profile.experience.map((exp) => (
            <div key={exp.id} className="list-item">
              <Input value={exp.position} disabled />
              <Input value={exp.institute} disabled />
              <Input value={exp.duration} disabled />
              <Button
                variant="danger"
                onClick={() => handleRemove('experience', exp.id, 'experience')}
                disabled={isModifying}
              >
                Remove
              </Button>
            </div>
          ))}

          <div className="add-form">
            <div className="list-item">
              <Input
                placeholder="Position"
                value={newExperience.position}
                onChange={e => setNewExperience(prev => ({ 
                  ...prev, 
                  position: e.target.value 
                }))}
                disabled={isModifying}
              />
              <Input
                placeholder="Institute"
                value={newExperience.institute}
                onChange={e => setNewExperience(prev => ({ 
                  ...prev, 
                  institute: e.target.value 
                }))}
                disabled={isModifying}
              />
              <Input
                placeholder="Duration (e.g., 2018-2022)"
                value={newExperience.duration}
                onChange={e => setNewExperience(prev => ({ 
                  ...prev, 
                  duration: e.target.value 
                }))}
                disabled={isModifying}
              />
              <Button
                onClick={() => handleAdd('experience', newExperience, 'experience')}
                disabled={!newExperience.position || !newExperience.institute || !newExperience.duration}
              >
                {isModifying ? 'Adding...' : 'Add'}
              </Button>
            </div>
          </div>
        </DynamicList>
      </div>

      <ActionBar>
        <Button 
          onClick={handleSaveProfile} 
          disabled={isSaving || !hasChanges}
          variant="primary"
        >
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
        <Button 
          variant="secondary" 
          onClick={() => navigate(`/doctors/${id}`)}
        >
          Cancel
        </Button>
      </ActionBar>

      {error && (
        <div style={{ color: 'red', marginTop: '1rem' }}>
          Error: {error}
        </div>
      )}
    </EditProfileContainer>
  );
};

export default EditDoctorProfile;