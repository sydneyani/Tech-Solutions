import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Reports.css';

const Reports = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('sales');
  const [salesData, setSalesData] = useState([]);
  const [demographicsData, setDemographicsData] = useState([]);
  const [occupancyData, setOccupancyData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Redirect if not admin
    if (!user || user.role !== 'Admin') {
      navigate('/dashboard');
      return;
    }

    // Fetch all report data
    const fetchReports = async () => {
      setLoading(true);
      try {
        const salesResponse = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/admin/reports/sales`);
        const demographicsResponse = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/admin/reports/demographics`);
        const occupancyResponse = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/admin/reports/occupancy`);

        setSalesData(salesResponse.data);
        setDemographicsData(demographicsResponse.data);
        setOccupancyData(occupancyResponse.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching reports:', err);
        setError('Failed to load reports. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [user, navigate]);

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const renderSalesReport = () => (
    <div className="report-section">
      <h3>Ticket Sales Report</h3>
      {salesData.length > 0 ? (
        <table className="report-table">
          <thead>
            <tr>
              <th>Train</th>
              <th>Travel Date</th>
              <th>Tickets Sold</th>
              <th>Total Revenue</th>
            </tr>
          </thead>
          <tbody>
            {salesData.map((item, index) => (
              <tr key={index}>
                <td>{item.train_name} ({item.train_number})</td>
                <td>{formatDate(item.travel_date)}</td>
                <td>{item.ticket_count || 0}</td>
                <td>₹{item.total_sales || 0}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan="3"><strong>Grand Total</strong></td>
              <td>
                <strong>
                  ₹{salesData.reduce((total, item) => total + (parseFloat(item.total_sales) || 0), 0).toFixed(2)}
                </strong>
              </td>
            </tr>
          </tfoot>
        </table>
      ) : (
        <p>No sales data available.</p>
      )}
    </div>
  );

  const renderDemographicsReport = () => (
    <div className="report-section">
      <h3>Passenger Demographics Report</h3>
      {demographicsData.length > 0 ? (
        <>
          <table className="report-table">
            <thead>
              <tr>
                <th>Gender</th>
                <th>Count</th>
                <th>Percentage</th>
              </tr>
            </thead>
            <tbody>
              {demographicsData.map((item, index) => (
                <tr key={index}>
                  <td>{item.gender || 'Not Specified'}</td>
                  <td>{item.passenger_count}</td>
                  <td>{item.percentage}%</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="demographics-chart">
            {demographicsData.map((item, index) => (
              <div key={index} className="chart-bar">
                <div 
                  className="bar" 
                  style={{ 
                    width: `${item.percentage}%`,
                    backgroundColor: item.gender === 'Male' ? '#4285f4' : 
                                    item.gender === 'Female' ? '#ea4335' : '#fbbc05'
                  }}
                ></div>
                <span>{item.gender || 'Not Specified'}: {item.percentage}%</span>
              </div>
            ))}
          </div>
        </>
      ) : (
        <p>No demographics data available.</p>
      )}
    </div>
  );

  const renderOccupancyReport = () => (
    <div className="report-section">
      <h3>Train Occupancy Report</h3>
      {occupancyData.length > 0 ? (
        <table className="report-table">
          <thead>
            <tr>
              <th>Train</th>
              <th>Travel Date</th>
              <th>Booked Seats</th>
              <th>Total Seats</th>
              <th>Occupancy Rate</th>
            </tr>
          </thead>
          <tbody>
            {occupancyData.map((item, index) => (
              <tr key={index}>
                <td>{item.train_name} ({item.train_number})</td>
                <td>{formatDate(item.travel_date)}</td>
                <td>{item.booked_seats}</td>
                <td>{item.total_seats}</td>
                <td>
                  <div className="occupancy-bar">
                    <div 
                      className="bar" 
                      style={{ 
                        width: `${item.occupancy_rate}%`,
                        backgroundColor: 
                          item.occupancy_rate > 80 ? '#ea4335' : 
                          item.occupancy_rate > 50 ? '#fbbc05' : '#34a853'
                      }}
                    ></div>
                    <span>{item.occupancy_rate}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No occupancy data available.</p>
      )}
    </div>
  );

  if (loading) return <div className="loading">Loading reports...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="reports-container">
      <h2>Railway System Reports</h2>
      
      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'sales' ? 'active' : ''}`}
          onClick={() => setActiveTab('sales')}
        >
          Ticket Sales
        </button>
        <button 
          className={`tab ${activeTab === 'demographics' ? 'active' : ''}`}
          onClick={() => setActiveTab('demographics')}
        >
          Demographics
        </button>
        <button 
          className={`tab ${activeTab === 'occupancy' ? 'active' : ''}`}
          onClick={() => setActiveTab('occupancy')}
        >
          Train Occupancy
        </button>
      </div>
      
      <div className="report-content">
        {activeTab === 'sales' && renderSalesReport()}
        {activeTab === 'demographics' && renderDemographicsReport()}
        {activeTab === 'occupancy' && renderOccupancyReport()}
      </div>
    </div>
  );
};

export default Reports;
