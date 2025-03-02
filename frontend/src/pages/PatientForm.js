import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { PatientService } from '../services/patientService';
import Spinner from '../components/common/Spinner';

const PatientForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;
  
  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    medical_record_number: '',
    date_of_birth: '',
    admission_date: new Date().toISOString().split('T')[0],
    diagnosis: '',
    notes: '',
    status: 'stable',
    room_number: '',
    camera_id: '',
    sensitivity_level: 1.0
  });

  useEffect(() => {
    if (isEditMode) {
      loadPatient();
    }
  }, [id]);

  const loadPatient = async () => {
    try {
      setLoading(true);
      const patient = await PatientService.getPatientById(id);
      
      // Format dates for form inputs
      const formattedPatient = {
        ...patient,
        date_of_birth: new Date(patient.date_of_birth).toISOString().split('T')[0],
        admission_date: new Date(patient.admission_date).toISOString().split('T')[0]
      };
      
      setFormData(formattedPatient);
    } catch (error) {
      toast.error('Failed to load patient data');
      console.error(error);
      navigate('/patients');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    
    // Handle numeric inputs
    if (type === 'number') {
      setFormData({
        ...formData,
        [name]: parseFloat(value)
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      
      if (isEditMode) {
        await PatientService.updatePatient(id, formData);
        toast.success('Patient updated successfully');
      } else {
        await PatientService.createPatient(formData);
        toast.success('Patient added successfully');
      }
      
      navigate('/patients');
    } catch (error) {
      toast.error(isEditMode ? 'Failed to update patient' : 'Failed to add patient');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Spinner size="large" />
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">
        {isEditMode ? 'Edit Patient' : 'Add New Patient'}
      </h1>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Personal Information */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-700">Personal Information</h2>
            
            <div>
              <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                id="full_name"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <div>
              <label htmlFor="medical_record_number" className="block text-sm font-medium text-gray-700 mb-1">
                Medical Record Number *
              </label>
              <input
                type="text"
                id="medical_record_number"
                name="medical_record_number"
                value={formData.medical_record_number}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <div>
              <label htmlFor="date_of_birth" className="block text-sm font-medium text-gray-700 mb-1">
                Date of Birth *
              </label>
              <input
                type="date"
                id="date_of_birth"
                name="date_of_birth"
                value={formData.date_of_birth}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>
          
          {/* Admission Details */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-700">Admission Details</h2>
            
            <div>
              <label htmlFor="admission_date" className="block text-sm font-medium text-gray-700 mb-1">
                Admission Date *
              </label>
              <input
                type="date"
                id="admission_date"
                name="admission_date"
                value={formData.admission_date}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                Status *
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="stable">Stable</option>
                <option value="critical">Critical</option>
                <option value="recovering">Recovering</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="room_number" className="block text-sm font-medium text-gray-700 mb-1">
                Room Number *
              </label>
              <input
                type="text"
                id="room_number"
                name="room_number"
                value={formData.room_number}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>
        </div>
        
        {/* Monitoring Configuration */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-700">Monitoring Configuration</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="camera_id" className="block text-sm font-medium text-gray-700 mb-1">
                Camera ID
              </label>
              <input
                type="text"
                id="camera_id"
                name="camera_id"
                value={formData.camera_id}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Optional - Assigned camera identifier"
              />
            </div>
            
            <div>
              <label htmlFor="sensitivity_level" className="block text-sm font-medium text-gray-700 mb-1">
                Monitoring Sensitivity (0.5 - 2.0)
              </label>
              <input
                type="number"
                id="sensitivity_level"
                name="sensitivity_level"
                value={formData.sensitivity_level}
                onChange={handleChange}
                step="0.1"
                min="0.5"
                max="2.0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                Higher values increase sensitivity to detect smaller movements
              </p>
            </div>
          </div>
        </div>
        
        {/* Medical Information */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-700">Medical Information</h2>
          
          <div>
            <label htmlFor="diagnosis" className="block text-sm font-medium text-gray-700 mb-1">
              Diagnosis
            </label>
            <textarea
              id="diagnosis"
              name="diagnosis"
              value={formData.diagnosis}
              onChange={handleChange}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Patient's primary diagnosis"
            />
          </div>
          
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows="5"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Additional information about the patient"
            />
          </div>
        </div>
        
        {/* Form Actions */}
        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md flex items-center justify-center min-w-[120px]"
          >
            {saving ? <Spinner size="small" color="white" /> : isEditMode ? 'Update Patient' : 'Add Patient'}
          </button>
          
          <button
            type="button"
            onClick={() => navigate('/patients')}
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-2 rounded-md"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default PatientForm;