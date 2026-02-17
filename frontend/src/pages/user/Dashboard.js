import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { isToday, isFuture } from '../../utils/dateUtils';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [appointments, setAppointments] = useState({
    today: [],
    upcoming: [],
    completed: [],
    cancelled: [],
    all: []
  });
  const [prescriptions, setPrescriptions] = useState([]);
  const [stats, setStats] = useState({
    totalAppointments: 0,
    pendingAppointments: 0,
    completedAppointments: 0,
    cancelledAppointments: 0,
    totalPrescriptions: 0
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [appointmentsRes, prescriptionsRes] = await Promise.all([
          api.get('/patient/appointments'),
          api.get('/patient/prescriptions')
        ]);

        // Update appointments
        setAppointments({
          today: appointmentsRes.data.filter(app => app.date && isToday(new Date(app.date))),
          upcoming: appointmentsRes.data.filter(app => app.date && isFuture(new Date(app.date))),
          completed: appointmentsRes.data.filter(app => app.status === 'completed'),
          cancelled: appointmentsRes.data.filter(app => app.status === 'cancelled'),
          all: appointmentsRes.data
        });

        // Update prescriptions
        setPrescriptions(prescriptionsRes.data);

        // Update stats
        setStats({
          totalAppointments: appointmentsRes.data.length,
          pendingAppointments: appointmentsRes.data.filter(apt => apt.status === 'pending').length,
          completedAppointments: appointmentsRes.data.filter(apt => apt.status === 'completed').length,
          cancelledAppointments: appointmentsRes.data.filter(apt => apt.status === 'cancelled').length,
          totalPrescriptions: prescriptionsRes.data.length
        });

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError('Error loading dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <div>
      {/* Render your component content here */}
    </div>
  );
};

export default Dashboard; 