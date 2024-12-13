// Logout.js
import  { useEffect } from "react";
import { useNavigate } from "react-router-dom";  // Use useNavigate for React Router v6

const Logout = () => {
  const navigate = useNavigate(); // useNavigate instead of useHistory

  useEffect(() => {
    // Clear local storage when the component mounts
    localStorage.clear();

    // Optionally, redirect the user to the homepage or login page
    navigate("/"); // Redirect to homepage or login page
  }, [navigate]);

  return (
    <div>
      <h2>You have been logged out. Your session data has been cleared.</h2>
    </div>
  );
};

export default Logout;
