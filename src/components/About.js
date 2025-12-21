import React from "react";
import { useNavigate } from "react-router-dom";
import "../cssfiles/About.css";

function About() {
  const navigate = useNavigate();

  const handleBackClick = () => {
    navigate(-1); 
  };

  return (
    <>
      <div className="back-button-about-container">
        <button className="back-button-about" onClick={handleBackClick}>
          ⬅ Back
        </button>
      </div>

      <div className="about-container">
        <div className="about-content">
          <h2>
            Discover <span className="highlight">exclusive apartments</span> today!
          </h2>
          
          <p>
            Welcome to our <span className="highlight">special rental units</span> finder platform.
          </p>
          
          <p>
            May Space is a Capstone Project Developed by the Students of Pateros Technological College, IICT Department.
            Our mission is to build a seamless and user-friendly platform that helps users easily find available rental units suited to their needs. Whether it's an apartment, condominium, or house, May Space provides a wide range of options — each with detailed specifications and unique features.
          </p>
          
          <p>
            This platform is designed to simplify the process of renting a space by giving users complete information such as pricing, amenities, location, and contact details of property owners.
            By bringing transparency and convenience together, May Space empower users to make informed rental decisions with confidence.
            Ultimately, we hope that May Space serves as a useful tool for both renters and property owners, bridging the gap between finding and offering a home with ease and reliability.
          </p>
        </div>
      </div>
    </>
  );
}

export default About;