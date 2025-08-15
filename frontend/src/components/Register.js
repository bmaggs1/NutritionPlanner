import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import "../App.css"

function Register() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleRegister = async () => {
        const response = await fetch("http://localhost:5000/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password }),
        });

        const result = await response.json();        
        if (result.success) {
            localStorage.setItem("token", result.token)
            navigate("/questionnaire");
        } else {
            alert("Registration failed: " + result.message);
        }
    };

    return (
        <div>
            <h1>Create Account</h1>
            <input placeholder="Choose username" onChange={(e) => setUsername(e.target.value)} /><br />
            <input type="password" placeholder="Choose password" onChange={(e) => setPassword(e.target.value)} /><br />
            <button onClick={handleRegister}>Register</button>
            <p>Already have an account? <button onClick={() => navigate("/")}>Login</button></p>
        </div>
    );
}

export default Register;
