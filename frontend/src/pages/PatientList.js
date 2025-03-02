import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { PatientService } from '../services/patientService';
import Spinner from '../components/common/Spinner';
import PatientStatusBadge from '../components/PatientStatusBadge';
import SearchBar from '../components/common/SearchBar';

const PatientList = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async () => {
    try {
      setLoading(true);
      const data = await PatientService.getPatients();
      setPatients(data);
    } catch (error) {
      toast.error('Failed to load patients');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (term) => {
    setSearchTerm(term);
  };

  const handleStatusFilter = (status) => {
    setStatusFilter(status);
  };

  // Filter patients based on search term and status filter
  const filteredPatients = patients.filter(patient => {
    const matchesSearch = patient.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          patient.medical_record_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          patient.room_number.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || patient.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Patients</h1>
        <Link 
          to="/patients/add" 
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
        >
          Add New Patient
        </Link>
      </div>

      <div className="mb-6 flex flex-col md:flex-row justify-between gap-4">
        <SearchBar onSearch={handleSearch} placeholder="Search patients..." />
        
        <div className="flex gap-2">
          <button 
            className={`px-3 py-1 rounded-md ${statusFilter === 'all' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100'}`}
            onClick={() => handleStatusFilter('all')}
          >
            All
          </button>
          <button 
            className={`px-3 py-1 rounded-md ${statusFilter === 'critical' ? 'bg-red-100 text-red-800' : 'bg-gray-100'}`}
            onClick={() => handleStatusFilter('critical')}
          >
            Critical
          </button>
          <button 
            className={`px-3 py-1 rounded-md ${statusFilter === 'stable' ? 'bg-green-100 text-green-800' : 'bg-gray-100'}`}
            onClick={() => handleStatusFilter('stable')}
          >
            Stable
          </button>
          <button 
            className={`px-3 py-1 rounded-md ${statusFilter === 'recovering' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100'}`}
            onClick={() => handleStatusFilter('recovering')}
          >
            Recovering
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center my-12">
          <Spinner />
        </div>
      ) : (
        <>
          {filteredPatients.length === 0 ? (
            <div className="text-center my-12 text-gray-500">
              No patients found matching your search criteria.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="py-3 px-4 text-left text-gray-600">Name</th>
                    <th className="py-3 px-4 text-left text-gray-600">MRN</th>
                    <th className="py-3 px-4 text-left text-gray-600">Room</th>
                    <th className="py-3 px-4 text-left text-gray-600">Status</th>
                    <th className="py-3 px-4 text-left text-gray-600">Admission Date</th>
                    <th className="py-3 px-4 text-left text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredPatients.map((patient) => (
                    <tr key={patient.id} className="hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <Link 
                          to={`/patients/${patient.id}`}
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          {patient.full_name}
                        </Link>
                      </td>
                      <td className="py-3 px-4">{patient.medical_record_number}</td>
                      <td className="py-3 px-4">{patient.room_number}</td>
                      <td className="py-3 px-4">
                        <PatientStatusBadge status={patient.status} />
                      </td>
                      <td className="py-3 px-4">
                        {new Date(patient.admission_date).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 flex gap-2">
                        <Link 
                          to={`/monitor/${patient.id}`}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded-md text-sm"
                        >
                          Monitor
                        </Link>
                        <Link 
                          to={`/patients/${patient.id}/edit`}
                          className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded-md text-sm"
                        >
                          Edit
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PatientList;