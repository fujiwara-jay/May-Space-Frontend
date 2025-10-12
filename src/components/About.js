import React from "react";
import { useNavigate } from "react-router-dom";
import "../cssfiles/About.css";

function About() {
  const navigate = useNavigate();

  const handleBackClick = () => {
    navigate(-1); 
  };

  return (
    <div className="about-container">
      <button className="back-button" onClick={handleBackClick}>
         ⬅ Back
      </button>
      <h2>
        Discover <span className="highlight">exclusive apartments</span> today!
      </h2>
      <p>
        Welcome to our <span className="highlight">special rental units</span> finder platform.
      </p>
      <p>
        May Space is a capstone project developed by Group 8. Our goal was to create a seamless, user-friendly platform that allows users to easily find available rental units for their needs. Whether it's an apartment, condo, or house, May Space provides a variety of options to choose from, along with detailed specifications and features of each unit.
      </p>
      <p>
        This project is designed to simplify the process of renting a space, providing users with all the necessary information such as pricing, amenities, location, and contact details of property owners. We aim to help users make more informed decisions when choosing a rental property, and we hope our platform serves as a useful tool for both renters and property owners.
      </p>
    </div>
  );
}

export default About;
