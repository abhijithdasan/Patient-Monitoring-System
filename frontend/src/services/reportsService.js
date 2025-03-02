import api from './api';

const reportsService = {
  // Get daily patient report
  getDailyReport: async (patientId, date) => {
    const formattedDate = date ? date.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
    const response = await api.get(`/api/v1/reports/daily/${patientId}?date=${formattedDate}`);
    return response.data;
  },
  
  // Get weekly patient report
  getWeeklyReport: async (patientId, startDate) => {
    let formattedDate;
    if (startDate) {
      formattedDate = startDate.toISOString().split('T')[0];
    } else {
      const today = new Date();
      const weekStart = new Date(today.setDate(today.getDate() - today.getDay()));
      formattedDate = weekStart.toISOString().split('T')[0];
    }
    
    const response = await api.get(`/api/v1/reports/weekly/${patientId}?start_date=${formattedDate}`);
    return response.data;
  },
  
  // Get monthly patient report
  getMonthlyReport: async (patientId, year, month) => {
    const currentDate = new Date();
    const reportYear = year || currentDate.getFullYear();
    const reportMonth = month || currentDate.getMonth() + 1;
    
    const response = await api.get(`/api/v1/reports/monthly/${patientId}?year=${reportYear}&month=${reportMonth}`);
    return response.data;
  },
  
  // Generate PDF report for a patient
  generatePdfReport: async (patientId, reportType, startDate, endDate) => {
    const params = new URLSearchParams();
    
    if (startDate) params.append('start_date', startDate.toISOString().split('T')[0]);
    if (endDate) params.append('end_date', endDate.toISOString().split('T')[0]);
    
    const response = await api.get(
      `/api/v1/reports/export/${reportType}/${patientId}?${params.toString()}`,
      { responseType: 'blob' }
    );
    
    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${reportType}_report_${patientId}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    
    return true;
  },
  
  // Get movement statistics for dashboard
  getMovementStatistics: async (timeRange = 'day') => {
    const response = await api.get(`/api/v1/reports/statistics?time_range=${timeRange}`);
    return response.data;
  },
  
  // Get alert statistics for dashboard
  getAlertStatistics: async (timeRange = 'day') => {
    const response = await api.get(`/api/v1/reports/alert-statistics?time_range=${timeRange}`);
    return response.data;
  }
};

export default reportsService;