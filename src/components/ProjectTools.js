import React from "react";
import { useNavigate } from "react-router-dom";
import "../cssfiles/ProjectTools.css";

function ProjectTools() {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div className="project-tools-page">
      <button className="back-button" onClick={handleBack}>
        ⬅ Back
      </button>

      <h1>Project Tools</h1>
      <p>
        This page lists tools and resources used in the development of{" "}
        <strong>May Space - A Web-Based Rental Unit Space Finder</strong>.
      </p>
      <ul>
        <li>React.js for Frontend</li>
        <li>Node.js + Express.js for Backend</li>
        <li>MySQL for Database</li>
        <li>CSS for Styling</li>
      </ul>
    </div>
  );
}

export default ProjectTools;
