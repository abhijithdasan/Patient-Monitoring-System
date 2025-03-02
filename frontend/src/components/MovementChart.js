import React, { useState, useEffect } from 'react';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const MovementChart = ({ data, chartType = 'line', title = 'Movement Data' }) => {
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [],
  });

  useEffect(() => {
    if (!data || data.length === 0) return;

    // Process data for chart
    const processedData = processDataForChart(data);
    setChartData(processedData);
  }, [data]);

  const processDataForChart = (movementData) => {
    // Group data by date
    const grouped = movementData.reduce((acc, item) => {
      const date = new Date(item.timestamp).toLocaleDateString();
      if (!acc[date]) {
        acc[date] = {
          head: 0,
          left_arm: 0,
          right_arm: 0,
          left_leg: 0,
          right_leg: 0,
          torso: 0,
          total_duration: 0,
          count: 0,
        };
      }
      
      // Increment the appropriate body part
      if (item.body_part) {
        acc[date][item.body_part] += 1;
      }
      
      // Add to total duration
      if (item.duration_seconds) {
        acc[date].total_duration += item.duration_seconds;
      }
      
      // Increment count
      acc[date].count += 1;
      
      return acc;
    }, {});
    
    // Sort dates
    const sortedDates = Object.keys(grouped).sort((a, b) => new Date(a) - new Date(b));
    
    // Create datasets for each body part
    const datasets = [
      {
        label: 'Head',
        data: sortedDates.map(date => grouped[date].head),
        borderColor: 'rgba(255, 99, 132, 1)',
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
      },
      {
        label: 'Left Arm',
        data: sortedDates.map(date => grouped[date].left_arm),
        borderColor: 'rgba(54, 162, 235, 1)',
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
      },
      {
        label: 'Right Arm',
        data: sortedDates.map(date => grouped[date].right_arm),
        borderColor: 'rgba(255, 206, 86, 1)',
        backgroundColor: 'rgba(255, 206, 86, 0.5)',
      },
      {
        label: 'Left Leg',
        data: sortedDates.map(date => grouped[date].left_leg),
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
      },
      {
        label: 'Right Leg',
        data: sortedDates.map(date => grouped[date].right_leg),
        borderColor: 'rgba(153, 102, 255, 1)',
        backgroundColor: 'rgba(153, 102, 255, 0.5)',
      },
      {
        label: 'Torso',
        data: sortedDates.map(date => grouped[date].torso),
        borderColor: 'rgba(255, 159, 64, 1)',
        backgroundColor: 'rgba(255, 159, 64, 0.5)',
      }
    ];
    
    // Create a total movements dataset
    const totalMovements = {
      label: 'Total Movements',
      data: sortedDates.map(date => grouped[date].count),
      borderColor: 'rgba(0, 0, 0, 1)',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      borderWidth: 2,
      borderDash: [5, 5],
    };
    
    return {
      labels: sortedDates,
      datasets: [...datasets, totalMovements],
    };
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
      },
      title: {
        display: true,
        text: title,
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.dataset.label || '';
            const value = context.parsed.y || 0;
            return `${label}: ${value} movements`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Number of Movements'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Date'
        }
      }
    }
  };

  return (
    <div className="h-80">
      {chartType === 'line' ? (
        <Line data={chartData} options={options} />
      ) : (
        <Bar data={chartData} options={options} />
      )}
    </div>
  );
};

export default MovementChart;