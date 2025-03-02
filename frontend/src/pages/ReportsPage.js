import React, { useState, useEffect } from 'react';
import { FaFilePdf, FaFileExcel, FaChartBar, FaCalendarAlt } from 'react-icons/fa';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell
} from 'recharts';

import { getPatients } from '../services/patientService';
import { getMovements, getMovementStatistics } from '../services/reportService';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const ReportsPage = () => {
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState('');
  const [startDate, setStartDate] = useState(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)); // 7 days ago
  const [endDate, setEndDate] = useState(new Date());
  const [reportType, setReportType] = useState('movement');
  const [reportData, setReportData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [totalMovements, setTotalMovements] = useState(0);
  const [criticalMovements, setCriticalMovements] = useState(0);
  
  // Fetch patients on component mount
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const data = await getPatients();
        setPatients(data);
      } catch (error) {
        console.error('Failed to fetch patients:', error);
      }
    };
    
    fetchPatients();
  }, []);
  
  // Generate report based on selected criteria
  const generateReport = async () => {
    if (!selectedPatient) {
      alert('Please select a patient');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Format dates for API request
      const formattedStartDate = startDate.toISOString();
      const formattedEndDate = endDate.toISOString();
      
      // Fetch movement data for the selected period
      const movementData = await getMovements(
        selectedPatient, 
        formattedStartDate, 
        formattedEndDate
      );
      
      // Get statistics summary
      const stats = await getMovementStatistics(
        selectedPatient, 
        formattedStartDate, 
        formattedEndDate
      );
      
      setTotalMovements(stats.total_movements || 0);
      setCriticalMovements(stats.critical_movements || 0);
      
      // Process data based on report type
      let processedData;
      
      if (reportType === 'movement') {
        // Group movements by day
        const groupedByDay = {};
        
        movementData.forEach(movement => {
          const date = new Date(movement.timestamp).toLocaleDateString();
          if (!groupedByDay[date]) {
            groupedByDay[date] = 0;
          }
          groupedByDay[date]++;
        });
        
        processedData = Object.keys(groupedByDay).map(date => ({
          date,
          count: groupedByDay[date]
        }));
      } else if (reportType === 'bodyPart') {
        // Group movements by body part
        const groupedByBodyPart = {};
        
        movementData.forEach(movement => {
          const bodyPart = movement.body_part;
          if (!groupedByBodyPart[bodyPart]) {
            groupedByBodyPart[bodyPart] = 0;
          }
          groupedByBodyPart[bodyPart]++;
        });
        
        processedData = Object.keys(groupedByBodyPart).map(bodyPart => ({
          name: bodyPart,
          value: groupedByBodyPart[bodyPart]
        }));
      } else if (reportType === 'severity') {
        // Group movements by severity
        const groupedBySeverity = {
          normal: 0,
          attention: 0,
          critical: 0
        };
        
        movementData.forEach(movement => {
          groupedBySeverity[movement.severity]++;
        });
        
        processedData = Object.keys(groupedBySeverity).map(severity => ({
          name: severity,
          value: groupedBySeverity[severity]
        }));
      }
      
      setReportData(processedData);
    } catch (error) {
      console.error('Failed to generate report:', error);
      alert('Failed to generate report. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Export report as PDF
  const exportPDF = () => {
    alert('PDF export functionality would be implemented here');
    // In a real application, you would generate a PDF using a library like jsPDF
  };
  
  // Export report as Excel
  const exportExcel = () => {
    alert('Excel export functionality would be implemented here');
    // In a real application, you would generate an Excel file using a library like xlsx
  };
  
  // Render appropriate chart based on report type
  const renderChart = () => {
    if (!reportData || reportData.length === 0) {
      return (
        <div className="text-center p-8 text-gray-500">
          No data available for the selected criteria
        </div>
      );
    }
    
    if (reportType === 'movement') {
      return (
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={reportData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="count" name="Number of Movements" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      );
    } else if (reportType === 'bodyPart') {
      return (
        <ResponsiveContainer width="100%" height={400}>
          <PieChart>
            <Pie
              data={reportData}
              cx="50%"
              cy="50%"
              labelLine={true}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              outerRadius={150}
              fill="#8884d8"
              dataKey="value"
            >
              {reportData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => [`${value} movements`, 'Count']} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      );
    } else if (reportType === 'severity') {
      return (
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={reportData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar 
              dataKey="value" 
              name="Count" 
              fill="#8884d8"
              barSize={60}
            />
          </BarChart>
        </ResponsiveContainer>
      );
    }
  };
  
  // Find selected patient name
  const getSelectedPatientName = () => {
    if (!selectedPatient) return '';
    const patient = patients.find(p => p.id.toString() === selectedPatient.toString());
    return patient ? patient.full_name : '';
  };
  
  return (
    <div className="container mx-auto p-4">
      <div className="bg-white rounded-lg shadow-md p-4 mb-4">
        <h2 className="text-xl font-semibold mb-4">Patient Movement Reports</h2>
        
        {/* Report generation form */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Patient
            </label>
            <select
              value={selectedPatient}
              onChange={(e) => setSelectedPatient(e.target.value)}
              className="w-full border rounded-md p-2"
            >
              <option value="">Select Patient</option>
              {patients.map(patient => (
                <option key={patient.id} value={patient.id}>
                  {patient.full_name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <div className="relative">
              <DatePicker
                selected={startDate}
                onChange={date => setStartDate(date)}
                className="w-full border rounded-md p-2"
                maxDate={endDate}
              />
              <FaCalendarAlt className="absolute right-3 top-3 text-gray-400" />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <div className="relative">
              <DatePicker
                selected={endDate}
                onChange={date => setEndDate(date)}
                className="w-full border rounded-md p-2"
                minDate={startDate}
                maxDate={new Date()}
              />
              <FaCalendarAlt className="absolute right-3 top-3 text-gray-400" />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Report Type
            </label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full border rounded-md p-2"
            >
              <option value="movement">Movement Over Time</option>
              <option value="bodyPart">Movements by Body Part</option>
              <option value="severity">Movements by Severity</option>
            </select>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={generateReport}
              disabled={isLoading}
              className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 disabled:bg-blue-300"
            >
              {isLoading ? 'Generating...' : 'Generate Report'}
            </button>
          </div>
        </div>
        
        {/* Report display area */}
        {reportData && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">
                Report for {getSelectedPatientName()}
              </h3>
              <div className="flex space-x-2">
                <button
                  onClick={exportPDF}
                  className="flex items-center bg-red-500 text-white py-1 px-3 rounded-md hover:bg-red-600"
                >
                  <FaFilePdf className="mr-1" /> PDF
                </button>
                <button
                  onClick={exportExcel}
                  className="flex items-center bg-green-500 text-white py-1 px-3 rounded-md hover:bg-green-600"
                >
                  <FaFileExcel className="mr-1" /> Excel
                </button>
              </div>
            </div>
            
            {/* Statistics summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                <div className="text-sm text-gray-500">Total Movements</div>
                <div className="text-2xl font-semibold">{totalMovements}</div>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <div className="text-sm text-gray-500">Critical Movements</div>
                <div className="text-2xl font-semibold">{criticalMovements}</div>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-md p-3">
                <div className="text-sm text-gray-500">Period</div>
                <div className="text-lg font-medium">
                  {startDate.toLocaleDateString()} - {endDate.toLocaleDateString()}
                </div>
              </div>
              <div className="bg-purple-50 border border-purple-200 rounded-md p-3">
                <div className="text-sm text-gray-500">Critical Movement %</div>
                <div className="text-2xl font-semibold">
                  {totalMovements > 0 
                    ? ((criticalMovements / totalMovements) * 100).toFixed(1) + '%'
                    : '0%'
                  }
                </div>
              </div>
            </div>
            
            {/* Chart */}
            <div className="border rounded-md p-4 bg-gray-50">
              <div className="flex items-center mb-3">
                <FaChartBar className="text-gray-500 mr-2" />
                <h4 className="font-medium">
                  {reportType === 'movement' && 'Movements Over Time'}
                  {reportType === 'bodyPart' && 'Movements by Body Part'}
                  {reportType === 'severity' && 'Movements by Severity Level'}
                </h4>
              </div>
              
              {renderChart()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportsPage;