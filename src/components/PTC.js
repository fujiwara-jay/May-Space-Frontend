import React from "react";
import { useNavigate } from "react-router-dom";
import "../cssfiles/PTC.css";

function PTC() {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate(-1);

  };

  return (
    <div className="ptc-page">
      <button className="back-button" onClick={handleBack}>
        ⬅ Back
      </button>
      <h1>PTC Page</h1>
      <p>
        Welcome to the <strong>PTC</strong> section of May Space.  
        You can add your project details, school-related content, or other resources here.
      </p>
    </div>
  );
}

export default PTC;
