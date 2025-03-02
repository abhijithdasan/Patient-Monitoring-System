import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { PatientService } from '../services/patientService';
import { MonitoringService } from '../services/monitoringService';
import Spinner from '../components/common/Spinner';
import PatientStatusBadge from '../components/PatientStatusBadge';
import MovementHistoryTable from '../components/MovementHistoryTable';
import PatientVitals from '../components/PatientVitals';
import AlertHistoryTable from '../components/AlertHistoryTable';
import MovementChart from '../components/MovementChart';

const PatientDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [movements, setMovements] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadPatientData();
  }, [id]);

  const loadPatientData = async () => {
    try {
      setLoading(true);
      // Load patient details
      const patientData = await PatientService.getPatientById(id);
      setPatient(patientData);

      // Load patient movements
      const movementsData = await MonitoringService.getPatientMovements(id);
      setMovements(movementsData);

      // Load patient alerts
      const alertsData = await MonitoringService.getPatientAlerts(id);
      setAlerts(alertsData);
    } catch (error) {
      toast.error('Failed to load patient data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this patient record? This action cannot be undone.')) {
      try {
        await PatientService.deletePatient(id);
        toast.success('Patient record deleted successfully');
        navigate('/patients');
      } catch (error) {
        toast.error('Failed to delete patient record');
        console.error(error);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Spinner size="large" />
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="text-center my-12">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Patient Not Found</h2>
        <p className="text-gray-600 mb-6">The patient record you're looking for doesn't exist or you don't have permission to view it.</p>
        <Link to="/patients" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md">
          Return to Patient List
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{patient.full_name}</h1>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-gray-600">MRN: {patient.medical_record_number}</span>
            <span className="text-gray-600">Room: {patient.room_number}</span>
            <PatientStatusBadge status={patient.status} />
          </div>
        </div>

        <div className="flex gap-2">
          <Link 
            to={`/monitor/${patient.id}`}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md"
          >
            Monitor Patient
          </Link>
          <Link 
            to={`/patients/${patient.id}/edit`}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md"
          >
            Edit Record
          </Link>
          <button 
            onClick={handleDelete}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Patient info cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="font-semibold text-blue-800 mb-2">Demographics</h3>
          <p><strong>Date of Birth:</strong> {new Date(patient.date_of_birth).toLocaleDateString()}</p>
          <p><strong>Age:</strong> {calculateAge(patient.date_of_birth)} years</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="font-semibold text-green-800 mb-2">Admission Details</h3>
          <p><strong>Admission Date:</strong> {new Date(patient.admission_date).toLocaleDateString()}</p>
          <p><strong>Length of Stay:</strong> {calculateDays(patient.admission_date)} days</p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <h3 className="font-semibold text-purple-800 mb-2">Monitoring</h3>
          <p><strong>Camera ID:</strong> {patient.camera_id || 'Not assigned'}</p>
          <p><strong>Sensitivity Level:</strong> {patient.sensitivity_level}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <ul className="flex flex-wrap -mb-px">
          <li className="mr-2">
            <button
              className={`inline-block p-4 ${
                activeTab === 'overview'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('overview')}
            >
              Overview
            </button>
          </li>
          <li className="mr-2">
            <button
              className={`inline-block p-4 ${
                activeTab === 'movements'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('movements')}
            >
              Movement History
            </button>
          </li>
          <li className="mr-2">
            <button
              className={`inline-block p-4 ${
                activeTab === 'alerts'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('alerts')}
            >
              Alerts
            </button>
          </li>
          <li className="mr-2">
            <button
              className={`inline-block p-4 ${
                activeTab === 'medical'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('medical')}
            >
              Medical Details
            </button>
          </li>
        </ul>
      </div>

      {/* Tab content */}
      <div className="mb-6">
        {activeTab === 'overview' && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">Recent Activity</h3>
                <MovementChart movements={movements.slice(0, 20)} />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-3">Patient Vitals</h3>
                <PatientVitals patientId={patient.id} />
              </div>
            </div>
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Diagnosis</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p>{patient.diagnosis || 'No diagnosis information available.'}</p>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-3">Notes</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p>{patient.notes || 'No additional notes available.'}</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'movements' && (
          <div>
            <h3 className="text-lg font-semibold mb-3">Movement History</h3>
            <MovementHistoryTable movements={movements} />
          </div>
        )}

        {activeTab === 'alerts' && (
          <div>
            <h3 className="text-lg font-semibold mb-3">Alert History</h3>
            <AlertHistoryTable alerts={alerts} />
          </div>
        )}

        {activeTab === 'medical' && (
          <div>
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Diagnosis</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p>{patient.diagnosis || 'No diagnosis information available.'}</p>
              </div>
            </div>
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Notes</h3>
              <div className="bg-gray-50 p-4 rounded-lg whitespace-pre-line">
                <p>{patient.notes || 'No additional notes available.'}</p>
              </div>
            </div>
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Treatment Plan</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p>No treatment plan available.</p>
                {/* This would be populated from a treatment plan entity in a full implementation */}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Helper functions
const calculateAge = (birthDate) => {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
};

const calculateDays = (startDate) => {
  const start = new Date(startDate);
  const today = new Date();
  const diffTime = Math.abs(today - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

export default PatientDetail;