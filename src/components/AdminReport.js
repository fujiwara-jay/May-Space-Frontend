import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import '../cssfiles/AdminReport.css';

function AdminReport() {
  const navigate = useNavigate();
  const ADMIN_PIN = "000000";
  
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [bookingFilter, setBookingFilter] = useState('all');
  const [detailedBookings, setDetailedBookings] = useState([]);
  const [usersReport, setUsersReport] = useState([]);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [pinVerified, setPinVerified] = useState(false);
  const [isVerifyingPin, setIsVerifyingPin] = useState(false);
  const [isGeneratingExcel, setIsGeneratingExcel] = useState(false);

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('https://may-space-backend.onrender.com/admin/report/statistics');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setStatistics(data.data);
      } else {
        throw new Error(data.message || 'Failed to fetch statistics');
      }
    } catch (err) {
      setError(err.message);
      console.error('Error fetching statistics:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDetailedBookings = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (dateRange.startDate) params.append('startDate', dateRange.startDate);
      if (dateRange.endDate) params.append('endDate', dateRange.endDate);
      if (bookingFilter && bookingFilter !== 'all') params.append('status', bookingFilter);
      
      const response = await fetch(`https://may-space-backend.onrender.com/admin/report/bookings?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setDetailedBookings(data.data);
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      console.error('Error fetching detailed bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsersReport = async () => {
    try {
      setLoading(true);
      const response = await fetch('https://may-space-backend.onrender.com/admin/report/users');
      const data = await response.json();
      
      if (data.success) {
        setUsersReport(data.data);
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      console.error('Error fetching users report:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'bookings') {
      fetchDetailedBookings();
    } else if (tab === 'users') {
      fetchUsersReport();
    }
  };

  const handleDateChange = (e) => {
    const { name, value } = e.target;
    setDateRange(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleBookingFilterChange = (e) => {
    setBookingFilter(e.target.value);
  };

  const handleApplyFilter = () => {
    fetchDetailedBookings();
  };

  const handleResetFilter = () => {
    setDateRange({ startDate: '', endDate: '' });
    setBookingFilter('all');
    fetchDetailedBookings();
  };

  const handleBackToDashboard = () => {
    navigate('/admin-dashboard');
  };

  const handleOpenPinModal = () => {
    setShowPinModal(true);
    setPinInput('');
    setPinError('');
    setPinVerified(false);
  };

  const handleClosePinModal = () => {
    setShowPinModal(false);
    setPinInput('');
    setPinError('');
    setIsVerifyingPin(false);
  };

  const handlePinInput = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setPinInput(value);
    setPinError('');
  };

  const handleVerifyPin = () => {
    if (!pinInput) {
      setPinError('Please enter the PIN code');
      return;
    }

    if (pinInput.length !== 6) {
      setPinError('PIN must be 6 digits');
      return;
    }

    setIsVerifyingPin(true);
    
    setTimeout(() => {
      if (pinInput === ADMIN_PIN) {
        setPinVerified(true);
        setPinError('');
        setIsVerifyingPin(false);
        setTimeout(() => {
          handleClosePinModal();
          handleExportExcel();
        }, 500);
      } else {
        setPinError('Invalid PIN code. Please try again.');
        setIsVerifyingPin(false);
      }
    }, 500);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleVerifyPin();
    }
  };

  const obfuscateName = (name) => {
    if (!name || name === 'N/A' || name === 'Unknown User' || name === 'No email') return 'N/A';
    
    const parts = name.trim().split(' ');
    if (parts.length === 1) {
      const firstChar = parts[0].charAt(0);
      const hiddenPart = '*'.repeat(Math.max(parts[0].length - 1, 3));
      return `${firstChar}${hiddenPart}`;
    }
    
    return parts.map(part => {
      if (part.length <= 2) return `${part.charAt(0)}*`;
      const firstChar = part.charAt(0);
      const hiddenPart = '*'.repeat(Math.max(part.length - 1, 2));
      return `${firstChar}${hiddenPart}`;
    }).join(' ');
  };

  const obfuscateEmail = (email) => {
    if (!email || email === 'N/A') return 'N/A';
    
    const [username, domain] = email.split('@');
    if (!username || !domain) return 'N/A';
    
    if (username.length <= 2) {
      return `${username.charAt(0)}***@${domain}`;
    }
    
    const firstChar = username.charAt(0);
    const lastChar = username.charAt(username.length - 1);
    const hiddenPart = '*'.repeat(Math.max(username.length - 2, 3));
    
    return `${firstChar}${hiddenPart}${lastChar}@${domain}`;
  };

  const obfuscateContact = (contact) => {
    if (!contact || contact === 'N/A') return 'N/A';
    
    const digits = contact.replace(/\D/g, '');
    
    if (digits.length <= 4) {
      return '*'.repeat(digits.length);
    }
    
    const firstTwo = digits.substring(0, 2);
    const lastTwo = digits.substring(digits.length - 2);
    const hiddenPart = '*'.repeat(Math.max(digits.length - 4, 4));
    
    return `${firstTwo}${hiddenPart}${lastTwo}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getBookingPercentage = (status) => {
    if (!statistics || !statistics.totalBookings || statistics.totalBookings === 0) return 0;
    const count = statistics.bookingStatus[status];
    return ((count / statistics.totalBookings) * 100).toFixed(1);
  };

  const getUnitPercentage = (type) => {
    if (!statistics || !statistics.totalUnits || statistics.totalUnits === 0) return 0;
    const count = type === 'available' ? statistics.unitStatus.available : statistics.unitStatus.unavailable;
    return ((count / statistics.totalUnits) * 100).toFixed(1);
  };

  const handleExportExcel = () => {
    try {
      setIsGeneratingExcel(true);
      
      const wb = XLSX.utils.book_new();
      
      const overviewData = [
        ['MAY SPACE MANAGEMENT SYSTEM - ADMIN REPORT'],
        ['Report Period:', `${dateRange.startDate || 'All Time'} to ${dateRange.endDate || 'Present'}`],
        ['Exported on:', new Date().toLocaleString()],
        ['CONFIDENTIAL - PIN Verified Export'],
        [],
        ['SYSTEM OVERVIEW'],
        [],
        ['Metric', 'Count', 'Details']
      ];
      
      if (statistics) {
        overviewData.push(
          ['Total Users', statistics.totalUsers, `+${statistics.recentActivity?.usersLast7Days || 0} last 7 days`],
          ['Total Units', statistics.totalUnits, `+${statistics.recentActivity?.unitsLast7Days || 0} last 7 days`],
          ['Total Bookings', statistics.totalBookings, 
            `Confirmed: ${statistics.bookingStatus.confirmed}, Pending: ${statistics.bookingStatus.pending}, 
            Denied: ${statistics.bookingStatus.denied}, Cancelled: ${statistics.bookingStatus.cancelled}`],
          ['Total Inquiries', statistics.totalInquiries, ''],
          ['Available Units', statistics.unitStatus.available, `${getUnitPercentage('available')}% of total`],
          ['Unavailable Units', statistics.unitStatus.unavailable, `${getUnitPercentage('unavailable')}% of total`],
          ['Booking Rate', `${getBookingPercentage('confirmed')}% confirmed`, 'Success rate'],
          ['Recent Cancellations', `${statistics.recentActivity?.cancelledLast7Days || 0}`, 'Last 7 days']
        );
      }
      
      const overviewWs = XLSX.utils.aoa_to_sheet(overviewData);
      XLSX.utils.book_append_sheet(wb, overviewWs, 'System Overview');
      
      if (usersReport.length > 0) {
        const usersData = [
          ['USERS REPORT - COMPLETE DETAILS'],
          ['Total Users:', usersReport.length],
          ['Average per User:', 
            `Units: ${(usersReport.reduce((sum, user) => sum + (user.units_posted || 0), 0) / usersReport.length).toFixed(1)}, 
            Bookings: ${(usersReport.reduce((sum, user) => sum + (user.bookings_made || 0), 0) / usersReport.length).toFixed(1)}, 
            Inquiries: ${(usersReport.reduce((sum, user) => sum + (user.inquiries_sent || 0), 0) / usersReport.length).toFixed(1)}`],
          [],
          ['ID', 'Full Name', 'Username', 'Email', 'Contact No.', 'Units Posted', 'Bookings Made', 'Inquiries Sent', 'Join Date']
        ];
        
        usersReport.forEach(user => {
          usersData.push([
            user.id,
            user.name || 'N/A',
            user.username || 'N/A',
            user.email || 'N/A',
            user.contact_number || 'N/A',
            user.units_posted || 0,
            user.bookings_made || 0,
            user.inquiries_sent || 0,
            formatDateTime(user.created_at)
          ]);
        });
        
        const usersWs = XLSX.utils.aoa_to_sheet(usersData);
        XLSX.utils.book_append_sheet(wb, usersWs, 'Users Report');
      }
      
      if (detailedBookings.length > 0) {
        const confirmed = detailedBookings.filter(b => b.status === 'confirmed').length;
        const pending = detailedBookings.filter(b => b.status === 'pending').length;
        const denied = detailedBookings.filter(b => b.status === 'denied').length;
        const cancelled = detailedBookings.filter(b => b.status === 'cancelled').length;
        const confirmedRate = detailedBookings.length > 0 ? ((confirmed / detailedBookings.length) * 100).toFixed(1) : 0;
        
        const bookingsData = [
          ['BOOKINGS REPORT - COMPLETE DETAILS'],
          ['Total Bookings:', detailedBookings.length],
          ['Status Summary:', `Confirmed: ${confirmed} (${confirmedRate}%), Pending: ${pending}, Denied: ${denied}, Cancelled: ${cancelled}`],
          [],
          ['ID', 'Building', 'Unit', 'Location', 'Renter', 'Renter Email', 'Owner', 'Owner Email', 'Status', 'People', 'Created At']
        ];
        
        detailedBookings.forEach(booking => {
          bookingsData.push([
            booking.id,
            booking.building_name || 'N/A',
            booking.unit_number || 'N/A',
            booking.location || 'N/A',
            booking.renter_username || 'N/A',
            booking.renter_email || 'N/A',
            booking.owner_username || 'N/A',
            booking.owner_email || 'N/A',
            booking.status || 'N/A',
            booking.number_of_people || 'N/A',
            formatDateTime(booking.created_at)
          ]);
        });
        
        const bookingsWs = XLSX.utils.aoa_to_sheet(bookingsData);
        XLSX.utils.book_append_sheet(wb, bookingsWs, 'Bookings Report');
      }
      
      if (statistics?.topUsers?.length > 0) {
        const topUsersData = [
          ['TOP PERFORMING USERS'],
          [],
          ['Rank', 'Username', 'Email', 'Units Posted', 'Contact No.', 'Member Since']
        ];
        
        statistics.topUsers.forEach((user, index) => {
          topUsersData.push([
            `#${index + 1}`,
            user.username || 'N/A',
            user.email || 'N/A',
            user.units_count || 0,
            user.contact_number || 'N/A',
            formatDateTime(user.created_at || new Date())
          ]);
        });
        
        const topUsersWs = XLSX.utils.aoa_to_sheet(topUsersData);
        XLSX.utils.book_append_sheet(wb, topUsersWs, 'Top Users');
      }
      
      const fileName = `Admin_Report_${new Date().toISOString().split('T')[0]}_${Date.now()}.xlsx`;
      
      XLSX.writeFile(wb, fileName);
      
      alert(`✅ Excel report exported successfully as: ${fileName}`);
      
    } catch (error) {
      console.error('Error generating Excel:', error);
      alert('❌ Error generating Excel report. Please try again.');
    } finally {
      setIsGeneratingExcel(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-report-container">
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <p className="loading-text">Loading report data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-report-container">
        <div className="error-simple">
          <h3>Error Loading Report</h3>
          <p>{error}</p>
          <button onClick={fetchStatistics} className="retry-btn">
            Retry
          </button>
          <button onClick={handleBackToDashboard} className="back-to-dashboard-btn">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!statistics) return null;

  return (
    <div className="admin-report-container">
      {showPinModal && (
        <div className="pin-modal-overlay">
          <div className="pin-modal">
            <div className="pin-modal-header">
              <h3>🔒 Admin PIN Verification</h3>
              <button 
                className="pin-modal-close" 
                onClick={handleClosePinModal}
                disabled={isVerifyingPin || pinVerified}
              >
                &times;
              </button>
            </div>
            
            <div className="pin-modal-body">
              <p className="pin-instruction">
                Please enter your 6-digit admin PIN to export the Excel report.
              </p>
              
              <div className="pin-input-container">
                <input
                  type="password"
                  className="pin-input"
                  value={pinInput}
                  onChange={handlePinInput}
                  onKeyPress={handleKeyPress}
                  placeholder="Enter 6-digit PIN"
                  maxLength="6"
                  disabled={isVerifyingPin || pinVerified}
                  autoFocus
                />
              </div>
              
              {pinError && (
                <div className="pin-error">
                  <span className="error-icon">⚠️</span>
                  {pinError}
                </div>
              )}
              
              {pinVerified && (
                <div className="pin-success">
                  <span className="success-icon">✅</span>
                  PIN verified! Generating Excel...
                </div>
              )}
              
              <div className="pin-modal-footer">
                <button 
                  className="pin-cancel-btn"
                  onClick={handleClosePinModal}
                  disabled={isVerifyingPin || pinVerified}
                >
                  Cancel
                </button>
                <button 
                  className="pin-verify-btn"
                  onClick={handleVerifyPin}
                  disabled={isVerifyingPin || pinVerified || !pinInput || pinInput.length !== 6}
                >
                  {isVerifyingPin ? (
                    <>
                      <span className="verifying-spinner"></span>
                      Verifying...
                    </>
                  ) : pinVerified ? (
                    <>
                      <span className="verified-icon">✅</span>
                      Verified
                    </>
                  ) : (
                    'Verify PIN'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="report-header">
        <div className="header-top">
          <button onClick={handleBackToDashboard} className="back-button">
            ← Back to Admin Dashboard
          </button>
        </div>
        <h1 className="report-title">
          Admin Report Dashboard
        </h1>
        <div className="report-period">
          <span>Report Period: All Time</span>
          <span className="last-updated">Last updated: {new Date().toLocaleString()}</span>
        </div>
      </div>

      <div className="report-tabs">
        <button 
          className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => handleTabChange('overview')}
        >
          📊 Overview
        </button>
        <button 
          className={`tab-button ${activeTab === 'bookings' ? 'active' : ''}`}
          onClick={() => handleTabChange('bookings')}
        >
          📋 Bookings Details
        </button>
        <button 
          className={`tab-button ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => handleTabChange('users')}
        >
          👥 Users Report
        </button>
      </div>

      {activeTab === 'overview' && (
        <div className="overview-tab">
          <div className="summary-cards">
            <div className="summary-card total-users">
              <div className="card-icon">👥</div>
              <div className="card-content">
                <h3>Total Users</h3>
                <p className="card-value">{statistics.totalUsers.toLocaleString()}</p>
                <p className="card-trend">+{statistics.recentActivity.usersLast7Days} last 7 days</p>
              </div>
            </div>
            
            <div className="summary-card total-units">
              <div className="card-icon">🏢</div>
              <div className="card-content">
                <h3>Total Units</h3>
                <p className="card-value">{statistics.totalUnits.toLocaleString()}</p>
                <p className="card-trend">+{statistics.recentActivity.unitsLast7Days} last 7 days</p>
              </div>
            </div>
            
            <div className="summary-card total-bookings">
              <div className="card-icon">📋</div>
              <div className="card-content">
                <h3>Total Bookings</h3>
                <p className="card-value">{statistics.totalBookings.toLocaleString()}</p>
                <div className="status-breakdown">
                  <span className="status confirmed">{statistics.bookingStatus.confirmed} Confirmed</span>
                  <span className="status pending">{statistics.bookingStatus.pending} Pending</span>
                  <span className="status denied">{statistics.bookingStatus.denied} Denied</span>
                  <span className="status cancelled">{statistics.bookingStatus.cancelled} Cancelled</span>
                </div>
              </div>
            </div>
            
            <div className="summary-card total-inquiries">
              <div className="card-icon">💬</div>
              <div className="card-content">
                <h3>Total Inquiries</h3>
                <p className="card-value">{statistics.totalInquiries.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="charts-section">
            <div className="chart-container">
              <h3>Booking Status Distribution</h3>
              <div className="chart-wrapper">
                <div className="custom-chart">
                  <div className="chart-bars">
                    <div className="chart-bar-container">
                      <div className="chart-bar-label">Confirmed</div>
                      <div className="chart-bar-bg">
                        <div 
                          className="chart-bar-fill confirmed"
                          style={{ width: `${getBookingPercentage('confirmed')}%` }}
                        >
                          <span className="chart-bar-value">{statistics.bookingStatus.confirmed}</span>
                        </div>
                      </div>
                      <div className="chart-bar-percentage">{getBookingPercentage('confirmed')}%</div>
                    </div>
                    
                    <div className="chart-bar-container">
                      <div className="chart-bar-label">Pending</div>
                      <div className="chart-bar-bg">
                        <div 
                          className="chart-bar-fill pending"
                          style={{ width: `${getBookingPercentage('pending')}%` }}
                        >
                          <span className="chart-bar-value">{statistics.bookingStatus.pending}</span>
                        </div>
                      </div>
                      <div className="chart-bar-percentage">{getBookingPercentage('pending')}%</div>
                    </div>
                    
                    <div className="chart-bar-container">
                      <div className="chart-bar-label">Denied</div>
                      <div className="chart-bar-bg">
                        <div 
                          className="chart-bar-fill denied"
                          style={{ width: `${getBookingPercentage('denied')}%` }}
                        >
                          <span className="chart-bar-value">{statistics.bookingStatus.denied}</span>
                        </div>
                      </div>
                      <div className="chart-bar-percentage">{getBookingPercentage('denied')}%</div>
                    </div>
                    
                    <div className="chart-bar-container">
                      <div className="chart-bar-label">Cancelled</div>
                      <div className="chart-bar-bg">
                        <div 
                          className="chart-bar-fill cancelled"
                          style={{ width: `${getBookingPercentage('cancelled')}%` }}
                        >
                          <span className="chart-bar-value">{statistics.bookingStatus.cancelled}</span>
                        </div>
                      </div>
                      <div className="chart-bar-percentage">{getBookingPercentage('cancelled')}%</div>
                    </div>
                  </div>
                  
                  <div className="chart-legend">
                    <div className="legend-item">
                      <span className="legend-color confirmed"></span>
                      <span>Confirmed</span>
                    </div>
                    <div className="legend-item">
                      <span className="legend-color pending"></span>
                      <span>Pending</span>
                    </div>
                    <div className="legend-item">
                      <span className="legend-color denied"></span>
                      <span>Denied</span>
                    </div>
                    <div className="legend-item">
                      <span className="legend-color cancelled"></span>
                      <span>Cancelled</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="chart-container">
              <h3>Units Availability</h3>
              <div className="chart-wrapper">
                <div className="custom-chart">
                  <div className="chart-bars">
                    <div className="chart-bar-container">
                      <div className="chart-bar-label">Available</div>
                      <div className="chart-bar-bg">
                        <div 
                          className="chart-bar-fill available"
                          style={{ width: `${getUnitPercentage('available')}%` }}
                        >
                          <span className="chart-bar-value">{statistics.unitStatus.available}</span>
                        </div>
                      </div>
                      <div className="chart-bar-percentage">{getUnitPercentage('available')}%</div>
                    </div>
                    
                    <div className="chart-bar-container">
                      <div className="chart-bar-label">Unavailable</div>
                      <div className="chart-bar-bg">
                        <div 
                          className="chart-bar-fill unavailable"
                          style={{ width: `${getUnitPercentage('unavailable')}%` }}
                        >
                          <span className="chart-bar-value">{statistics.unitStatus.unavailable}</span>
                        </div>
                      </div>
                      <div className="chart-bar-percentage">{getUnitPercentage('unavailable')}%</div>
                    </div>
                  </div>
                  
                  <div className="chart-legend">
                    <div className="legend-item">
                      <span className="legend-color available"></span>
                      <span>Available</span>
                    </div>
                    <div className="legend-item">
                      <span className="legend-color unavailable"></span>
                      <span>Unavailable</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="top-users-section">
            <h3>Units Posted by Users</h3>
            <div className="top-users-list">
              {statistics.topUsers.map((user, index) => (
                <div key={user.username || index} className="top-user-card">
                  <div className="user-rank">#{index + 1}</div>
                  <div className="user-info">
                    <h4>{obfuscateName(user.username)}</h4>
                    <p>{obfuscateEmail(user.email)}</p>
                  </div>
                  <div className="user-stats">
                    <span className="units-count">{user.units_count || 0} Units Posted</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="activity-section">
            <h3>📈 System Activity Overview</h3>
            <div className="activity-grid">
              <div className="activity-item">
                <div className="activity-label">Available Units</div>
                <div className="activity-value">{statistics.unitStatus.available}</div>
                <div className="activity-percentage">{getUnitPercentage('available')}% of total</div>
              </div>
              <div className="activity-item">
                <div className="activity-label">Unavailable Units</div>
                <div className="activity-value">{statistics.unitStatus.unavailable}</div>
                <div className="activity-percentage">{getUnitPercentage('unavailable')}% of total</div>
              </div>
              <div className="activity-item">
                <div className="activity-label">Confirmed Bookings</div>
                <div className="activity-value">{statistics.bookingStatus.confirmed}</div>
                <div className="activity-percentage">{getBookingPercentage('confirmed')}% of total</div>
              </div>
              <div className="activity-item">
                <div className="activity-label">Cancelled Bookings</div>
                <div className="activity-value">{statistics.bookingStatus.cancelled}</div>
                <div className="activity-subtext">
                  {statistics.recentActivity?.cancelledLast7Days || 0} in last 7 days
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'bookings' && (
        <div className="bookings-tab">
          <div className="bookings-filter">
            <div className="filter-group">
              <label>Start Date:</label>
              <input
                type="date"
                name="startDate"
                value={dateRange.startDate}
                onChange={handleDateChange}
              />
            </div>
            <div className="filter-group">
              <label>End Date:</label>
              <input
                type="date"
                name="endDate"
                value={dateRange.endDate}
                onChange={handleDateChange}
              />
            </div>
            <div className="filter-group">
              <label>Status:</label>
              <select
                value={bookingFilter}
                onChange={handleBookingFilterChange}
                className="status-filter"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="denied">Denied</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <button onClick={handleApplyFilter} className="apply-filter-btn">
              Apply Filter
            </button>
            <button onClick={handleResetFilter} className="reset-filter-btn">
              Reset
            </button>
          </div>

          <div className="bookings-table-container">
            <div className="table-responsive">
              <table className="bookings-table">
                <thead>
                  <tr>
                    <th>Booking ID</th>
                    <th>Unit</th>
                    <th>Renter</th>
                    <th>Owner</th>
                    <th>Status</th>
                    <th>People</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {detailedBookings.map((booking) => (
                    <tr key={booking.id}>
                      <td>#{booking.id}</td>
                      <td>
                        <strong>{booking.building_name} - {booking.unit_number}</strong>
                        <br />
                        <small>{booking.location}</small>
                      </td>
                      <td>
                        <strong>{obfuscateName(booking.renter_username)}</strong>
                        <br />
                        <small>{obfuscateEmail(booking.renter_email)}</small>
                      </td>
                      <td>
                        <strong>{obfuscateName(booking.owner_username)}</strong>
                        <br />
                        <small>{obfuscateEmail(booking.owner_email)}</small>
                      </td>
                      <td>
                        <span className={`status-badge status-${booking.status}`}>
                          {booking.status}
                        </span>
                      </td>
                      <td>{booking.number_of_people || 'N/A'}</td>
                      <td>{formatDateTime(booking.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {detailedBookings.length === 0 && (
              <div className="no-data-message">
                📭 No bookings found for the selected filter.
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="users-tab">
          <div className="users-table-container">
            <div className="table-responsive">
              <table className="users-table">
                <thead>
                  <tr>
                    <th>User ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Contact</th>
                    <th>Units Posted</th>
                    <th>Bookings Made</th>
                    <th>Inquiries Sent</th>
                    <th>Join Date</th>
                  </tr>
                </thead>
                <tbody>
                  {usersReport.map((user) => (
                    <tr key={user.id}>
                      <td>#{user.id}</td>
                      <td>
                        <strong>{obfuscateName(user.name)}</strong>
                        <br />
                        <small>@{obfuscateName(user.username)}</small>
                      </td>
                      <td>{obfuscateEmail(user.email)}</td>
                      <td>{obfuscateContact(user.contact_number)}</td>
                      <td>
                        <span className={`stat-value ${user.units_posted > 0 ? 'active' : 'inactive'}`}>
                          {user.units_posted || 0}
                        </span>
                      </td>
                      <td>
                        <span className={`stat-value ${user.bookings_made > 0 ? 'active' : 'inactive'}`}>
                          {user.bookings_made || 0}
                        </span>
                      </td>
                      <td>
                        <span className={`stat-value ${user.inquiries_sent > 0 ? 'active' : 'inactive'}`}>
                          {user.inquiries_sent || 0}
                        </span>
                      </td>
                      <td>{formatDateTime(user.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="privacy-note">
              🔒 Personal information is masked for privacy. Full details available in PIN-verified Excel export.
            </div>
          </div>
        </div>
      )}

      <div className="export-section">
        <button 
          className="export-btn" 
          onClick={handleOpenPinModal}
          disabled={isGeneratingExcel}
        >
          {isGeneratingExcel ? '🔄 Generating Excel...' : '🔐 Export Full Report (Excel)'}
        </button>
        <div className="export-info">
          <small>💡 PIN verification required for unmasked Excel export</small>
        </div>
      </div>

      <div className="refresh-section">
        <button className="refresh-btn" onClick={fetchStatistics}>
          🔄 Refresh Data
        </button>
      </div>
    </div>
  );
}

export default AdminReport;