import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../cssfiles/AdminReport.css';
import jsPDF from 'jspdf';

function AdminReport() {
  const navigate = useNavigate();
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [detailedBookings, setDetailedBookings] = useState([]);
  const [usersReport, setUsersReport] = useState([]);

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      const response = await fetch('https://may-space-backend.onrender.com/admin/report/statistics');
      const data = await response.json();
      
      if (data.success) {
        setStatistics(data.data);
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchDetailedBookings = async () => {
    try {
      const params = new URLSearchParams();
      if (dateRange.startDate) params.append('startDate', dateRange.startDate);
      if (dateRange.endDate) params.append('endDate', dateRange.endDate);
      
      const response = await fetch(`https://may-space-backend.onrender.com/admin/report/bookings?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setDetailedBookings(data.data);
      }
    } catch (err) {
      console.error('Error fetching detailed bookings:', err);
    }
  };

  const fetchUsersReport = async () => {
    try {
      const response = await fetch('https://may-space-backend.onrender.com/admin/report/users');
      const data = await response.json();
      
      if (data.success) {
        setUsersReport(data.data);
      }
    } catch (err) {
      console.error('Error fetching users report:', err);
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

  const handleApplyFilter = () => {
    fetchDetailedBookings();
  };

  const handleResetFilter = () => {
    setDateRange({ startDate: '', endDate: '' });
    fetchDetailedBookings();
  };

  const handleBackToDashboard = () => {
    navigate('/admin-dashboard');
  };

  // Obfuscation functions
  const obfuscateEmail = (email) => {
    if (!email || email === 'N/A') return 'N/A';
    
    const [username, domain] = email.split('@');
    if (!username || !domain) return email;
    
    const firstChar = username.charAt(0);
    const lastChar = username.charAt(username.length - 1);
    const domainParts = domain.split('.');
    const domainName = domainParts[0];
    const domainExt = domainParts.slice(1).join('.');
    
    return `${firstChar}*****${lastChar}@${domainName.charAt(0)}***.${domainExt}`;
  };

  const obfuscatePhone = (phone) => {
    if (!phone || phone === 'N/A') return 'N/A';
    
    const visiblePrefix = phone.substring(0, 2);
    const visibleSuffix = phone.substring(phone.length - 2);
    const hiddenPart = '*'.repeat(Math.max(phone.length - 4, 0));
    
    return `${visiblePrefix}${hiddenPart}${visibleSuffix}`;
  };

  const obfuscateName = (name) => {
    if (!name || name === 'N/A') return 'N/A';
    
    const parts = name.split(' ');
    if (parts.length === 1) {
      return `${parts[0].charAt(0)}***`;
    }
    
    return parts.map(part => `${part.charAt(0)}***`).join(' ');
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

  const formatDateForPDF = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getBookingPercentage = (status) => {
    if (!statistics || !statistics.totalBookings) return 0;
    const count = statistics.bookingStatus[status];
    return ((count / statistics.totalBookings) * 100).toFixed(1);
  };

  const getUnitPercentage = (type) => {
    if (!statistics || !statistics.totalUnits) return 0;
    const count = type === 'available' ? statistics.unitStatus.available : statistics.unitStatus.unavailable;
    return ((count / statistics.totalUnits) * 100).toFixed(1);
  };

  const createLandscapeTable = (doc, headers, data, startY, colWidths, title = '') => {
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 15;
    const tableWidth = pageWidth - (margin * 2);
    
    let y = startY;
    const rowHeight = 10;
    const headerHeight = 15;
    
    // Add title if provided
    if (title) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(44, 62, 80);
      doc.text(title, margin, y);
      y += 10;
    }
    
    // Draw header
    doc.setFillColor(66, 139, 202);
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    
    let x = margin;
    headers.forEach((header, index) => {
      const width = colWidths ? colWidths[index] * tableWidth : tableWidth / headers.length;
      doc.rect(x, y, width, headerHeight, 'F');
      
      // Split long text
      const maxChars = Math.floor(width / 3);
      const text = header.length > maxChars ? header.substring(0, maxChars - 3) + '...' : header;
      
      doc.text(text, x + 2, y + headerHeight - 4);
      x += width;
    });
    
    y += headerHeight;
    
    // Draw rows
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    
    data.forEach((row, rowIndex) => {
      // Check if we need a new page
      if (y > pageHeight - 30) {
        doc.addPage('l');
        y = margin + 20;
        
        // Redraw header on new page
        doc.setFillColor(66, 139, 202);
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        
        x = margin;
        headers.forEach((header, index) => {
          const width = colWidths ? colWidths[index] * tableWidth : tableWidth / headers.length;
          doc.rect(x, y, width, headerHeight, 'F');
          
          const maxChars = Math.floor(width / 3);
          const text = header.length > maxChars ? header.substring(0, maxChars - 3) + '...' : header;
          
          doc.text(text, x + 2, y + headerHeight - 4);
          x += width;
        });
        
        y += headerHeight;
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
      }
      
      // Alternate row colors
      if (rowIndex % 2 === 0) {
        doc.setFillColor(245, 245, 245);
        x = margin;
        headers.forEach((_, index) => {
          const width = colWidths ? colWidths[index] * tableWidth : tableWidth / headers.length;
          doc.rect(x, y, width, rowHeight, 'F');
          x += width;
        });
      }
      
      // Draw row data
      x = margin;
      row.forEach((cell, cellIndex) => {
        const width = colWidths ? colWidths[cellIndex] * tableWidth : tableWidth / headers.length;
        const cellText = cell.toString();
        
        // Truncate long text
        const maxChars = Math.floor(width / 2);
        const displayText = cellText.length > maxChars ? cellText.substring(0, maxChars - 3) + '...' : cellText;
        
        doc.text(displayText, x + 2, y + rowHeight - 3);
        x += width;
      });
      
      y += rowHeight;
    });
    
    return y;
  };

  const handleExportPDF = () => {
    try {
      // Create a new jsPDF instance in LANDSCAPE mode
      const doc = new jsPDF('l', 'mm', 'a4'); // 'l' for landscape
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;
      let yPosition = 20;
      
      // Header - Center in landscape
      doc.setFontSize(24);
      doc.setTextColor(66, 139, 202);
      doc.setFont('helvetica', 'bold');
      doc.text('ADMIN REPORT - FULL DETAILS', pageWidth / 2, yPosition, { align: 'center' });
      
      yPosition += 10;
      doc.setFontSize(12);
      doc.setTextColor(100, 100, 100);
      doc.setFont('helvetica', 'normal');
      doc.text(`Report Period: ${dateRange.startDate || 'All Time'} to ${dateRange.endDate || 'Present'}`, pageWidth / 2, yPosition, { align: 'center' });
      
      yPosition += 6;
      doc.text(`Exported on: ${new Date().toLocaleString()}`, pageWidth / 2, yPosition, { align: 'center' });
      
      yPosition += 15;
      
      // Company/System Info
      doc.setFontSize(10);
      doc.setTextColor(150, 150, 150);
      doc.text('May Space Management System', pageWidth / 2, yPosition, { align: 'center' });
      
      yPosition += 20;
      
      // Overview Section
      if (statistics) {
        doc.setFontSize(18);
        doc.setTextColor(44, 62, 80);
        doc.setFont('helvetica', 'bold');
        doc.text('SYSTEM OVERVIEW', 20, yPosition);
        
        yPosition += 12;
        
        // Create overview table with statistics
        const overviewData = [
          ['Total Users', statistics.totalUsers.toLocaleString(), `+${statistics.recentActivity?.usersLast7Days || 0} last 7 days`],
          ['Total Units', statistics.totalUnits.toLocaleString(), `+${statistics.recentActivity?.unitsLast7Days || 0} last 7 days`],
          ['Total Bookings', statistics.totalBookings.toLocaleString(), 
            `Confirmed: ${statistics.bookingStatus.confirmed}, Pending: ${statistics.bookingStatus.pending}, Denied: ${statistics.bookingStatus.denied}`],
          ['Total Inquiries', statistics.totalInquiries.toLocaleString(), ''],
          ['Available Units', statistics.unitStatus.available, `${getUnitPercentage('available')}% of total`],
          ['Unavailable Units', statistics.unitStatus.unavailable, `${getUnitPercentage('unavailable')}% of total`],
          ['Booking Rate', `${getBookingPercentage('confirmed')}% confirmed`, 'Success rate']
        ];
        
        yPosition = createLandscapeTable(
          doc,
          ['Metric', 'Count', 'Details'],
          overviewData,
          yPosition,
          [0.25, 0.2, 0.55],
          'System Statistics'
        );
        
        yPosition += 20;
      }
      
      // Users Report Section - Full width in landscape
      if (usersReport.length > 0) {
        // Check if we need a new page
        if (yPosition > pageHeight - 100) {
          doc.addPage('l');
          yPosition = 20;
        }
        
        doc.setFontSize(18);
        doc.setTextColor(44, 62, 80);
        doc.setFont('helvetica', 'bold');
        doc.text('USERS REPORT - COMPLETE DETAILS', 20, yPosition);
        
        yPosition += 12;
        
        // Prepare user data for table - Include ALL details
        const userTableData = usersReport.map(user => [
          user.id.toString(),
          user.name || 'N/A',
          user.username || 'N/A',
          user.email || 'N/A',
          user.contact_number || 'N/A',
          (user.units_posted || 0).toString(),
          (user.bookings_made || 0).toString(),
          (user.inquiries_sent || 0).toString(),
          formatDateTime(user.created_at)
        ]);
        
        // Create user table with full details
        yPosition = createLandscapeTable(
          doc,
          ['ID', 'Full Name', 'Username', 'Email', 'Contact No.', 'Units Posted', 'Bookings Made', 'Inquiries Sent', 'Join Date'],
          userTableData,
          yPosition,
          [0.04, 0.1, 0.08, 0.15, 0.1, 0.06, 0.07, 0.07, 0.13]
        );
        
        // Users summary
        yPosition += 15;
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.setFont('helvetica', 'normal');
        doc.text(`Total Users: ${usersReport.length}`, 20, yPosition);
        
        // Calculate averages
        const avgUnits = (usersReport.reduce((sum, user) => sum + (user.units_posted || 0), 0) / usersReport.length).toFixed(1);
        const avgBookings = (usersReport.reduce((sum, user) => sum + (user.bookings_made || 0), 0) / usersReport.length).toFixed(1);
        const avgInquiries = (usersReport.reduce((sum, user) => sum + (user.inquiries_sent || 0), 0) / usersReport.length).toFixed(1);
        
        doc.text(`Average per User - Units: ${avgUnits}, Bookings: ${avgBookings}, Inquiries: ${avgInquiries}`, 100, yPosition);
        
        yPosition += 20;
      }
      
      // Bookings Report Section
      if (detailedBookings.length > 0) {
        // Add new landscape page for bookings
        doc.addPage('l');
        yPosition = 20;
        
        doc.setFontSize(18);
        doc.setTextColor(44, 62, 80);
        doc.setFont('helvetica', 'bold');
        doc.text('BOOKINGS REPORT - COMPLETE DETAILS', 20, yPosition);
        
        yPosition += 12;
        
        // Prepare booking data for table - REMOVED VISIT DATE
        const bookingTableData = detailedBookings.map(booking => [
          booking.id.toString(),
          booking.building_name || 'N/A',
          booking.unit_number || 'N/A',
          booking.location || 'N/A',
          booking.renter_username || 'N/A',
          booking.renter_email || 'N/A',
          booking.owner_username || 'N/A',
          booking.owner_email || 'N/A',
          booking.status || 'N/A',
          (booking.number_of_people || 'N/A').toString(),
          formatDateTime(booking.created_at)
        ]);
        
        // Create booking table in landscape - UPDATED HEADERS AND COLUMN WIDTHS
        yPosition = createLandscapeTable(
          doc,
          ['ID', 'Building', 'Unit', 'Location', 'Renter', 'Renter Email', 'Owner', 'Owner Email', 'Status', 'People', 'Created At'],
          bookingTableData,
          yPosition,
          [0.03, 0.08, 0.05, 0.08, 0.07, 0.10, 0.07, 0.10, 0.06, 0.05, 0.11]
        );
        
        yPosition += 15;
        
        // Booking summary statistics
        const confirmed = detailedBookings.filter(b => b.status === 'confirmed').length;
        const pending = detailedBookings.filter(b => b.status === 'pending').length;
        const denied = detailedBookings.filter(b => b.status === 'denied').length;
        const confirmedRate = detailedBookings.length > 0 ? ((confirmed / detailedBookings.length) * 100).toFixed(1) : 0;
        
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.setFont('helvetica', 'normal');
        doc.text(`Total Bookings: ${detailedBookings.length} | Confirmed: ${confirmed} (${confirmedRate}%) | Pending: ${pending} | Denied: ${denied}`, 20, yPosition);
        
        yPosition += 20;
      }
      
      // Top Users Section
      if (statistics?.topUsers?.length > 0) {
        // Add new landscape page for top users
        doc.addPage('l');
        yPosition = 20;
        
        doc.setFontSize(18);
        doc.setTextColor(44, 62, 80);
        doc.setFont('helvetica', 'bold');
        doc.text('TOP PERFORMING USERS', 20, yPosition);
        
        yPosition += 12;
        
        // Prepare top users data for table
        const topUsersData = statistics.topUsers.map((user, index) => [
          `#${index + 1}`,
          user.username || 'N/A',
          user.email || 'N/A',
          (user.units_count || 0).toString(),
          user.contact_number || 'N/A',
          formatDateTime(user.created_at || new Date())
        ]);
        
        // Create top users table in landscape
        createLandscapeTable(
          doc,
          ['Rank', 'Username', 'Email', 'Units Posted', 'Contact No.', 'Member Since'],
          topUsersData,
          yPosition,
          [0.05, 0.15, 0.25, 0.1, 0.2, 0.15]
        );
        
        yPosition += 20;
        
        // Add performance metrics
        doc.setFontSize(12);
        doc.setTextColor(66, 139, 202);
        doc.setFont('helvetica', 'bold');
        doc.text('Performance Metrics:', 20, yPosition);
        
        yPosition += 10;
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.setFont('helvetica', 'normal');
        
        const totalUnitsPosted = statistics.topUsers.reduce((sum, user) => sum + (user.units_count || 0), 0);
        const topUser = statistics.topUsers[0];
        doc.text(`• Top contributor posted ${topUser?.units_count || 0} units (${topUser?.username || 'N/A'})`, 25, yPosition);
        yPosition += 7;
        doc.text(`• Total units posted by top ${statistics.topUsers.length} users: ${totalUnitsPosted}`, 25, yPosition);
      }
      
      // Add footer to all landscape pages
      const totalPages = doc.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        
        // Footer text
        doc.text('CONFIDENTIAL - Admin Use Only | May Space Management System', pageWidth / 2, pageHeight - 10, { align: 'center' });
        
        // Page numbers
        doc.text(`Page ${i} of ${totalPages}`, pageWidth - 20, pageHeight - 10, { align: 'right' });
      }
      
      // Save the PDF
      const fileName = `Admin_Report_Landscape_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
      
      // Show success message
      alert(`✅ Landscape PDF report exported successfully as: ${fileName}`);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('❌ Error generating PDF. Please try again or use a different browser.');
    }
  };

  if (loading) {
    return (
      <div className="admin-report-container">
        <div className="loading-simple">
          <p>Loading report data...</p>
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
          {/* Summary Cards */}
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

          {/* Booking Status Chart */}
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

          {/* Top Users Section */}
          <div className="top-users-section">
            <h3>Units Posted by Users</h3>
            <div className="top-users-list">
              {statistics.topUsers.map((user, index) => (
                <div key={user.username || index} className="top-user-card">
                  <div className="user-rank">#{index + 1}</div>
                  <div className="user-info">
                    <h4>{obfuscateName(user.username || 'Unknown User')}</h4>
                    <p>{obfuscateEmail(user.email)}</p>
                  </div>
                  <div className="user-stats">
                    <span className="units-count">{user.units_count || 0} Units Posted</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Activity Overview */}
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
                <div className="activity-label">Total Transactions</div>
                <div className="activity-value">
                  {statistics.transactionTypes?.reduce((sum, t) => sum + t.count, 0) || 0}
                </div>
                <div className="activity-subtext">
                  {statistics.transactionTypes?.map(t => `${t.transaction_type}: ${t.count}`).join(', ') || 'No data'}
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
                      <td>{obfuscatePhone(user.contact_number)}</td>
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
              🔒 Personal information is obfuscated for privacy. Full details (including Units Posted, Bookings Made, Inquiries Sent) are available in PDF export.
            </div>
          </div>
        </div>
      )}

      {/* Export Button - Landscape PDF */}
      <div className="export-section">
        <button className="export-btn" onClick={handleExportPDF}>
          📄 Export Landscape Report (PDF)
        </button>
        <div className="export-info">
          <small>💡 PDF will be exported in landscape mode with full details</small>
        </div>
      </div>

      {/* Refresh Button */}
      <div className="refresh-section">
        <button className="refresh-btn" onClick={fetchStatistics}>
          🔄 Refresh Data
        </button>
      </div>
    </div>
  );
}

export default AdminReport;