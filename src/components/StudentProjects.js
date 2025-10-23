import React from "react";
import { useNavigate } from "react-router-dom";
import "../cssfiles/StudentProjects.css";
import Jayr from "../images/Jayr.jpg";
import Jeymar from "../images/Jeymar.jpg";
import MJ from "../images/MJ.jpg";
import MA from "../images/MA.jpg";
import Genzel from "../images/Genzel.jpg";

function StudentProjects() {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate(-1);
  };

  const students = [
    {
      id: 1,
      name: "Jeymar Calimposan",
      role: "Leader",
      image: Jeymar,
      description: "“Together, we grow, we learn, and we achieve. Every challenge we face becomes a lesson, and every success we celebrate becomes a reminder of what teamwork can accomplish. We may come from different paths, but our shared passion and dedication unite us toward one goal. Through trust, perseverance, and faith in one another, we turn dreams into reality and ideas into meaningful achievements.",
    },
    {
      id: 2,
      name: "Julian Jr. Gazzingan",
      role: "Member 'Developer' ",
      image: Jayr,
      description: "Builds clean and funtional web projects with React and Nodes.js.",
    },
    {
      id: 3,
      name: "Mary Jane Lagoras",
      role: "Member",
      image: MJ,
      description: "An ambitious college student, balancing challenging coursework with a  highly analytical thinker who thrives to learn more and is dedicated to my studies. The only true wisdom is in knowing you know nothing. — Socrates",
    },
    {
      id: 4,
      name: "Maria Agatha Banda",
      role: "Member",
      image: MA,
      description: "A dependable and hardworking individual who is committed to completing every assigned task with dedication and responsibility. I take my work seriously and always aim to deliver quality results on time. I value teamwork, consistency, and excellence in achieving shared goals. Success consists of going from failure to failure without loss of enthusiasm.” - Winston Churchill",
    },
    {
      id: 5,
      name: "Genzel Khate Soliven",
      role: "Member",
      image: Genzel,
      description: "If I were as foolish as a dromas, perhaps I'd throw myself down and prostrate before their greatness, begging for the gods prophetic wisdom. Well, sorry to disappoint, but I'm no dromas. Alas, I am a human, standing tall on two feet, possessing both intellect and pride — Anaxagoras",
    }
  ];

  return (
    <div className="student-projects-page">
      <button className="back-button" onClick={handleBack}>
        ⬅ Back
      </button>
      
      <div className="page-description">
        <h1>Student Projects Page</h1>
        <p>
          Welcome to our <span className="projects-highlight">Student Projects Page</span>. 
          Here you can explore the amazing work created by our talented students. 
          Each project represents countless hours of dedication, creativity, and technical skill.
        </p>
        <p>
          From web development, our students are pushing the boundaries 
          of what's possible in technology and design.
        </p>
      </div>

      <div className="students-grid">
        {students.map((student) => (
          <div key={student.id} className="student-card">
            <img 
              src={student.image} 
              alt={student.name}
              className="student-image"
              onError={(e) => {
                e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'%3E%3Ccircle cx='60' cy='60' r='60' fill='%232c363f'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='14' fill='%23e0c16d'%3E" + student.name.split(' ')[0] + "%3C/text%3E%3C/svg%3E";
              }}
            />
            <h2 className="student-name">{student.name}</h2>
            <p className="student-role">{student.role}</p>
            <p className="student-description">{student.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default StudentProjects;