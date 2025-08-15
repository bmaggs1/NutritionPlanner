import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import "../App.css"

function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate(); 

    const handleLogin = async () => {
        const response = await fetch("http://localhost:5000/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password }),
        });

        const result = await response.json();
        if (result.success) {
            localStorage.setItem("token", result.token)
            navigate("/dashboard");
        } else {
            alert("Login failed!");
        }
    };

    return (
        <div>
            <h1>Login</h1>
            <input placeholder="Username" onChange={(e) => setUsername(e.target.value)} /><br />
            <input placeholder="Password" type="password" onChange={(e) => setPassword(e.target.value)} /><br />
            <button onClick={handleLogin}>Login</button>
            <p>New user? <button onClick={() => navigate("/register")}>Register</button></p>
        </div>
    );
}

export default Login;
