import React from "react";
import { useNavigate } from "react-router-dom";
import "../cssfiles/PrivacyPolicy.css";

const PrivacyPolicy = () => {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div className="privacy-policy-container">
      <div className="privacy-policy-header">
        <h1>Privacy Policy & Terms and Conditions</h1>
      </div>

      <div className="privacy-policy-content-wrapper">
        <div className="privacy-policy-content">
          <div className="policy-section">
            <h2>1. Data Collection</h2>
            <p>
              May Space collects personal information such as name, email, and contact number during the registration process. 
              We may also collect information about your interactions with our platform, including unit views, inquiries, and bookings.
            </p>
          </div>

          <div className="policy-section">
            <h2>2. Data Usage</h2>
            <p>
              Your data is used to manage accounts, display listings, facilitate communication between landlords and tenants, 
              process bookings, and improve our system's functionality. We may use aggregated, anonymized data for analytical purposes 
              to enhance user experience.
            </p>
          </div>

          <div className="policy-section">
            <h2>3. Data Protection</h2>
            <p>
              Personal data is protected in compliance with the Data Privacy Act of 2012 (RA 10173) of the Philippines. 
              We implement appropriate technical and organizational security measures to protect your personal information 
              against unauthorized access, alteration, disclosure, or destruction.
            </p>
          </div>

          <div className="policy-section">
            <h2>4. Data Sharing</h2>
            <p>
              Personal data will not be shared with third parties without your explicit consent, except when required by law 
              or necessary for the provision of our services (e.g., sharing contact information between landlords and tenants 
              for legitimate rental purposes).
            </p>
          </div>

          <div className="policy-section">
            <h2>5. User Rights</h2>
            <p>
              Users have the right to access, correct, update, or request deletion of their personal data. You may also 
              request information about how your data is being processed. To exercise these rights, please contact our 
              system administrator.
            </p>
          </div>

          <div className="policy-section">
            <h2>6. Contact</h2>
            <p>
              For any privacy concerns, questions, or to exercise your data protection rights, please contact:
            </p>
            <div className="contact-info">
              <p><strong>System Administrator:</strong> May Space Admin Team</p>
              <p><strong>Email:</strong> mayspaceunitfinder@gmail.com</p>
              <p><strong>Office Address:</strong> Taguig City, Metro Manila, Philippines</p>
            </div>
          </div>

          <div className="policy-section">
            <h2>Terms and Conditions</h2>
            <div className="terms-section">
              <h3>1. Acceptance of Terms</h3>
              <p>By accessing or using May Space, you agree to these Terms and Conditions.</p>
            </div>

            <div className="terms-section">
              <h3>2. Purpose of the Platform</h3>
              <p>
                May Space is an online platform that helps landlords and tenants view and manage rental listings. 
                May Space does not own or manage rental units.
              </p>
            </div>

            <div className="terms-section">
              <h3>3. User Responsibilities</h3>
              <p>
                Users must provide accurate information and use the platform lawfully. Landlords are responsible for 
                the accuracy of their listings. Tenants are responsible for verifying unit details before making commitments.
              </p>
            </div>

            <div className="terms-section">
              <h3>4. Transactions and Liability</h3>
              <p>
                All rental agreements are between landlords and tenants only. May Space is not responsible for payments, 
                disputes, or damages arising from rental transactions. Users are advised to exercise due diligence in all transactions.
              </p>
            </div>

            <div className="terms-section">
              <h3>5. Account Termination</h3>
              <p>
                Accounts may be suspended or terminated for violations of these terms, fraudulent activities, or misuse of the platform.
              </p>
            </div>

            <div className="terms-section">
              <h3>6. Governing Law</h3>
              <p>
                These terms are governed by the laws of the Republic of the Philippines. Any disputes shall be resolved 
                in the appropriate courts of Taguig City.
              </p>
            </div>
          </div>

          <div className="policy-footer">
            <p className="notice">
              By using May Space, you acknowledge that you have read, understood, and agreed to both the Privacy Policy and Terms & Conditions.
            </p>
          </div>

          <div className="back-to-unitfinder">
            <button className="back-btn" onClick={handleBack}>
              ← Back
            </button>
          </div>
        </div>
      </div>

      <footer className="privacy-policy-footer">
        <p className="footer-copyright">
          © 2025 May Space - A Web-Based Rental Unit Space Finder. Student Project BSIT-PTC
        </p>
      </footer>
    </div>
  );
};

export default PrivacyPolicy;