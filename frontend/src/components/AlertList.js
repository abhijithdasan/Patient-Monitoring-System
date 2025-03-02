import React, { useEffect, useState } from 'react';
import alertService from '../services/alertService';

const AlertList = () => {
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const data = await alertService.getAlerts();
        setAlerts(data);
      } catch (error) {
        console.error("Failed to fetch alerts", error);
      }
    };

    fetchAlerts();
  }, []);

  return (
    <div>
      <h3>Alerts</h3>
      <ul>
        {alerts.map((alert, index) => (
          <li key={index}>{alert.message}</li>
        ))}
      </ul>
    </div>
  );
};

export default AlertList;
