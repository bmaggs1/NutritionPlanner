import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Dashboard() {
    const navigate = useNavigate();

    const [userData, setUserData] = useState(null);
    const [response, SetResponse] = useState(null)

    useEffect(() => {
        const token = localStorage.getItem("token");

        if (!token) {
            console.error("No token found");
            return;
        }

        fetch("http://localhost:5000/api/getUserData", {
            headers: {
                Authorization: `Bearer ${token}`
            }
        })
            .then((res) => res.json())
            .then((data) => {
                console.log("Fetched data:", data);
                setUserData(data);
        })
        .catch((err) => console.error("Fetch error:", err));
    }, []);

    if (!userData) return <p>Loading user data...</p>;


    const handleGenerateClick = async () => {
    const token = localStorage.getItem("token");

    try {
        const res = await fetch("http://localhost:5000/api/generate", {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }

        const newData = await res.json();
        SetResponse(newData);
    } catch (err) {
        console.error("Error fetching generated data:", err);
    }
};

    return (
    <div>
        <h1>Welcome, {userData.username}!</h1>
        <p><button onClick={() => navigate("/questionnaire")}>Change User Settings</button></p>
        <button onClick={handleGenerateClick}>Generate Recipes</button>

        {response && (
            <div style={{ marginTop: "20px" }}>
                <h2>{response.test}</h2>
            </div>
        )}
    </div>
);
}

export default Dashboard;