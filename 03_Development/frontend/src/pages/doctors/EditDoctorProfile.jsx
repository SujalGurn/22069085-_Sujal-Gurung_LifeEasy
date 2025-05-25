import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../../components/ui/button';
import Input from '../../components/ui/input';
import '../../style/editDoctor.css';

const EditDoctorProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState({
    fullname: '',
    specialization: '',
    contact: '',
    about: '',
    consultation_fee: 0,
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
  const [selectedFile, setSelectedFile] = useState(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState(null);
  const [imageError, setImageError] = useState(null);

  const backendUrl = 'http://localhost:3002';
  const defaultAvatar = 'https://via.placeholder.com/100'; // Fallback public URL

  const getAuthConfig = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Authentication token missing. Please log in again.');
      navigate('/login');
      return {};
    }
    return {
      headers: {
        Authorization: `Bearer ${token}`,
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
      },
      timeout: 10000
    };
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await axios.get(`/api/doctors/${id}/profile`, getAuthConfig());
        
        console.log('GET /api/doctors/profile response:', data);
        console.log('profile_picture from API:', data?.doctor?.profile_picture);

        if (!data?.doctor) throw new Error('Doctor profile not found');
        
        const profilePicture = data.doctor.profile_picture
            ? `${backendUrl}${data.doctor.profile_picture}?t=${Date.now()}`
            : defaultAvatar;

        console.log('Fetched profile picture:', profilePicture);

        const formattedProfile = {
          fullname: data.doctor.fullname || '',
          specialization: data.doctor.specialization || '',
          contact: data.doctor.contact || '',
          about: data.doctor.about || '',
          consultation_fee: data.doctor.consultationFee != null ? Number(data.doctor.consultationFee) : 250.00,
          profile_picture: profilePicture,
          qualifications: data.doctor.qualifications || [],
          experience: data.doctor.experience || []
        };

        setProfile(formattedProfile);
        setInitialProfile(formattedProfile);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load profile. Ensure the backend server is running on http://localhost:3002.');
        navigate('/not-found', { replace: true });
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchProfile();
  }, [id, navigate, backendUrl]);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (!/image\/(jpeg|jpg|png)/.test(file.type)) {
        setError('Please upload a valid image (JPEG, JPG, or PNG).');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size must be less than 5MB.');
        return;
      }
      setSelectedFile(file);
      setProfilePicturePreview(URL.createObjectURL(file));
      setError('');
      setImageError(null);
    } else {
      setSelectedFile(null);
      setProfilePicturePreview(null);
    }
  };

  const handleClearPicture = () => {
    setSelectedFile(null);
    setProfilePicturePreview(null);
    setProfile(prev => ({ ...prev, profile_picture: defaultAvatar }));
    setImageError(null);
  };

  const handleImageError = () => {
    console.error('Failed to load profile picture:', profile.profile_picture);
    setImageError('Unable to load profile picture. Using default avatar.');
    setProfile(prev => ({ ...prev, profile_picture: defaultAvatar }));
  };

  const handleAdd = async (type, data, endpoint) => {
    if (type === 'qualifications' && (!data.qualification || !data.institution || !data.year || data.year < 1900 || data.year > new Date().getFullYear())) {
      setError('Please provide valid qualification details (year between 1900 and current year).');
      return;
    }
    if (type === 'experience' && (!data.position || !data.institute || !data.duration)) {
      setError('Please provide valid experience details.');
      return;
    }

    setIsModifying(true);
    setError('');
    try {
      const { data: response } = await axios.post(
        `/api/doctors/${id}/${endpoint}`,
        data,
        getAuthConfig()
      );
      
      const newItem = response[type] || { id: response.insertId, ...data };
      setProfile(prev => ({
        ...prev,
        [type]: [...prev[type], newItem]
      }));
      setInitialProfile(prev => ({
        ...prev,
        [type]: [...prev[type], newItem]
      }));

      if (type === 'qualifications') {
        setNewQualification({ qualification: '', institution: '', year: '' });
      } else {
        setNewExperience({ position: '', institute: '', duration: '' });
      }
    } catch (err) {
      setError(err.response?.data?.message || `Failed to add ${type}. Please try again.`);
    } finally {
      setIsModifying(false);
    }
  };

  const handleRemove = async (type, itemId, endpoint) => {
    setIsModifying(true);
    setError('');
    try {
      await axios.delete(
        `/api/doctors/${id}/${endpoint}/${itemId}`,
        getAuthConfig()
      );
      
      setProfile(prev => ({
        ...prev,
        [type]: prev[type].filter(item => item.id !== itemId)
      }));
      setInitialProfile(prev => ({
        ...prev,
        [type]: prev[type].filter(item => item.id !== itemId)
      }));
    } catch (err) {
      setError(err.response?.data?.message || `Failed to remove ${type}. Please try again.`);
    } finally {
      setIsModifying(false);
    }
  };

  const handleSaveProfile = async (retryCount = 0) => {
    const maxRetries = 2;
    if (!hasChanges && !selectedFile && profile.profile_picture === initialProfile.profile_picture) {
      navigate(`/doctors/${id}/profile`);
      return;
    }

    if (profile.contact && !/^\+?\d{7,15}$/.test(profile.contact)) {
      setError('Please enter a valid contact number (7-15 digits).');
      return;
    }

    setIsSaving(true);
    setError('');
    try {
      const formData = new FormData();
      const changedFields = {};
      if (profile.fullname !== initialProfile.fullname) changedFields.fullname = profile.fullname;
      if (profile.specialization !== initialProfile.specialization) changedFields.specialization = profile.specialization;
      if (profile.contact !== initialProfile.contact) changedFields.contact = profile.contact;
      if (profile.about !== initialProfile.about) changedFields.about = profile.about;

      Object.keys(changedFields).forEach(key => formData.append(key, changedFields[key]));
      if (selectedFile) {
        formData.append('profile_picture', selectedFile);
      }

      const formDataEntries = {};
      for (let [key, value] of formData.entries()) {
        formDataEntries[key] = value instanceof File ? `${value.name} (${value.size} bytes)` : value;
      }
      console.log('📤 Sending FormData to /api/doctors/', formDataEntries);

      const { data: responseData } = await axios.put(
        `/api/doctors/${id}/profile`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'multipart/form-data'
          },
          timeout: 10000
        }
      );

      console.log('📥 Response from backend:', responseData);

      if (responseData.doctor) {
        const updatedProfile = {
          ...profile,
          fullname: responseData.doctor.fullname || profile.fullname,
          specialization: responseData.doctor.specialization || profile.specialization,
          contact: responseData.doctor.contact || profile.contact,
          about: responseData.doctor.about || profile.about,
          profile_picture: responseData.doctor.profile_picture
              ? `${backendUrl}${responseData.doctor.profile_picture}?t=${Date.now()}`
              : defaultAvatar
        };
        setProfile(updatedProfile);
        setInitialProfile(updatedProfile);
        setSelectedFile(null);
        setProfilePicturePreview(null);
      }

      navigate(`/doctors/${id}/profile`, {
        state: {
          success: 'Profile updated successfully!',
          timestamp: Date.now()
        }
      });
    } catch (err) {
      console.error('⚠️ Error saving profile:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        axiosCode: err.code,
        retryCount
      });

      if ((err.code === 'ERR_NETWORK' || err.code === 'ERR_CONNECTION_RESET') && retryCount < maxRetries) {
        console.log(`Retrying save profile (attempt ${retryCount + 2}/${maxRetries + 1})...`);
        setTimeout(() => handleSaveProfile(retryCount + 1), 1000);
        return;
      }

      setError(
        err.response?.status === 403 ? 'Access denied: Please log in with the account associated with this doctor profile.' :
        err.response?.data?.message ||
        (err.code === 'ERR_NETWORK' ? 'Network error: Cannot connect to the backend. Ensure the server is running on http://localhost:3002 and the Vite proxy is configured.' :
         err.code === 'ERR_CONNECTION_RESET' ? 'Connection reset: The server may have closed the connection. Check backend logs for errors or file upload issues.' :
         'Failed to save profile. Please try again.')
      );
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges = initialProfile && (
    profile.fullname !== initialProfile.fullname ||
    profile.specialization !== initialProfile.specialization ||
    profile.contact !== initialProfile.contact ||
    profile.about !== initialProfile.about ||
    profile.profile_picture !== initialProfile.profile_picture ||
    JSON.stringify(profile.qualifications) !== JSON.stringify(initialProfile.qualifications) ||
    JSON.stringify(profile.experience) !== JSON.stringify(initialProfile.experience) ||
    selectedFile != null
  );

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error-message">Error: {error}</div>;

  return (
    <div className="edit-profile-container">
      <h1>Edit Profile - Dr. {profile?.fullname}</h1>

      <div>
        <h2>Profile Information</h2>
        {error && <div className="error-message">{error}</div>}
        <div className="existing-info">
          <div>
            <label>Full Name</label>
            <Input
              value={profile.fullname}
              onChange={e => setProfile(prev => ({ ...prev, fullname: e.target.value }))}
              placeholder="Enter full name"
            />
          </div>
          
          <div>
            <label>Specialization</label>
            <Input
              value={profile.specialization}
              onChange={e => setProfile(prev => ({ ...prev, specialization: e.target.value }))}
              placeholder="Enter specialization"
            />
          </div>
          
          <div>
            <label>Contact</label>
            <Input
              value={profile.contact}
              onChange={e => setProfile(prev => ({ ...prev, contact: e.target.value }))}
              placeholder="Enter contact number (e.g., +9771234567890)"
            />
          </div>

          <div>
            <label>Consultation Fee (NPR)</label>
            <Input
              type="number"
              value={profile.consultation_fee}
              onChange={e => setProfile(prev => ({ ...prev, consultation_fee: Number(e.target.value) }))}
              placeholder="Enter consultation fee"
              min="0"
              step="0.01"
              disabled
            />
            <small>Note: Consultation fee updates are currently disabled.</small>
          </div>
        </div>

        <div>
          <label>About</label>
          <textarea
            value={profile.about}
            onChange={e => setProfile(prev => ({ ...prev, about: e.target.value }))}
            rows="5"
            placeholder="Tell us about yourself..."
          ></textarea>
        </div>

        <div className="profile-picture-upload">
          <label>Profile Picture</label>
          {profilePicturePreview ? (
            <img src={profilePicturePreview} alt="New Profile Preview" className="current-profile-pic" />
          ) : (
            <img 
              src={profile.profile_picture} 
              alt="Current Profile" 
              className="current-profile-pic"
              onError={handleImageError}
            />
          )}
          {imageError && <p className="error-text">{imageError}</p>}
          
          <Input
            type="file"
            onChange={handleFileChange}
            accept="image/jpeg,image/jpg,image/png"
          />
          <Button
            variant="outline"
            onClick={handleClearPicture}
            disabled={isSaving || isModifying}
          >
            Clear Picture
          </Button>
          <small>Upload a JPEG, JPG, or PNG image (max 5MB).</small>
        </div>

        <h2>Qualifications</h2>
        <div className="existing-list">
          {profile.qualifications.length > 0 ? (
            profile.qualifications.map(q => (
              <div key={q.id} className="list-item-with-delete">
                <span>{q.qualification} ({q.year}) - {q.institution}</span>
                <Button 
                  variant="destructive" 
                  onClick={() => handleRemove('qualifications', q.id, 'qualifications')}
                  disabled={isModifying}
                >
                  Remove
                </Button>
              </div>
            ))
          ) : (
            <p>No qualifications added yet.</p>
          )}
        </div>
        <div className="add-new-form">
          <h3>Add New Qualification</h3>
          <Input 
            placeholder="Qualification (e.g., MBBS)" 
            value={newQualification.qualification} 
            onChange={e => setNewQualification({...newQualification, qualification: e.target.value})} 
          />
          <Input 
            placeholder="Institution" 
            value={newQualification.institution} 
            onChange={e => setNewQualification({...newQualification, institution: e.target.value})} 
          />
          <Input 
            type="number" 
            placeholder="Year" 
            value={newQualification.year} 
            onChange={e => setNewQualification({...newQualification, year: e.target.value})} 
            min="1900"
            max={new Date().getFullYear()}
          />
          <Button 
            onClick={() => handleAdd('qualifications', newQualification, 'qualifications')}
            disabled={isModifying || !newQualification.qualification || !newQualification.institution || !newQualification.year}
          >
            Add Qualification
          </Button>
        </div>

        <h2>Experience</h2>
        <div className="existing-list">
          {profile.experience.length > 0 ? (
            profile.experience.map(exp => (
              <div key={exp.id} className="list-item-with-delete">
                <span>{exp.position} at {exp.institute} ({exp.duration})</span>
                <Button 
                  variant="destructive" 
                  onClick={() => handleRemove('experience', exp.id, 'experience')}
                  disabled={isModifying}
                >
                  Remove
                </Button>
              </div>
            ))
          ) : (
            <p>No experience added yet.</p>
          )}
        </div>
        <div className="add-new-form">
          <h3>Add New Experience</h3>
          <Input 
            placeholder="Position (e.g., Senior Doctor)" 
            value={newExperience.position} 
            onChange={e => setNewExperience({...newExperience, position: e.target.value})} 
          />
          <Input 
            placeholder="Institute/Hospital" 
            value={newExperience.institute} 
            onChange={e => setNewExperience({...newExperience, institute: e.target.value})} 
          />
          <Input 
            placeholder="Duration (e.g., 5 years)" 
            value={newExperience.duration} 
            onChange={e => setNewExperience({...newExperience, duration: e.target.value})} 
          />
          <Button 
            onClick={() => handleAdd('experience', newExperience, 'experience')}
            disabled={isModifying || !newExperience.position || !newExperience.institute || !newExperience.duration}
          >
            Add Experience
          </Button>
        </div>
      </div>

      <div className="form-actions">
        <Button onClick={() => handleSaveProfile(0)} disabled={isSaving || isModifying || (!hasChanges && !selectedFile)}>
          {isSaving ? 'Saving...' : 'Save Profile'}
        </Button>
        <Button variant="outline" onClick={() => navigate(`/doctors/${id}/profile`)} disabled={isSaving || isModifying}>
          Cancel
        </Button>
      </div>
    </div>
  );
};

export default EditDoctorProfile;