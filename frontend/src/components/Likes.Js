import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import "../App.css"


function Likes() {
    const navigate = useNavigate();
    const [userData, setUserData] = useState(null);

    const fetchUserData = () => {
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
            .then((data) => setUserData(data))
            .catch((err) => console.error("Fetch error:", err));
    };

    useEffect(() => {
        fetchUserData();
    }, []);

    const handleUnlike = async (recipeId) => {
        const token = localStorage.getItem("token");
        try {
            const res = await fetch("http://localhost:5000/api/unlike", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ recipeId })
            });

            if (res.ok) {
                fetchUserData();
            } else {
                console.error("Failed to unlike recipe");
            }
        } catch (err) {
            console.error("Error unliking recipe:", err);
        }
    };

    if (!userData || !userData.userData) return <p>Loading user data...</p>;

    const { liked_recipes = [] } = userData.userData


    return (
        <div>
            <button
                onClick={() => navigate("/dashboard")}
                className="back-dashboard-btn"
            >
                Back to Dashboard
            </button>

            <button
                onClick={() => {
                    localStorage.removeItem('token');
                    window.location.href = '/';
                }}
                className="logout-btn"
            >
                Logout
            </button>

            <h1>Welcome, {userData.username}!</h1>
            <p>Here are your liked recipes:</p>

            {liked_recipes.length === 0 ? (
                <p style={{ marginTop: "2rem", fontStyle: "italic", color: "#666" }}>
                    Oh no, you have no liked recipes 😢
                </p>
            ) : (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", marginTop: "1rem", justifyContent: "center" }}>
                    {liked_recipes.map((recipe, index) => (

                        <div key={index} className="liked-recipe">
                        
                        <img
                            src={recipe.image}
                            alt={recipe.title}
                            style={{ width: "100%", borderRadius: "4px", marginBottom: "0.5rem" }}
                        />

                        <Link to={`/recipe/${recipe.id}`} className="custom-link">
                            {recipe.title}
                        </Link>

                        <button
                            onClick={() => handleUnlike(recipe.id)}
                            className="remove-like-btn"
                        >
                            Remove Like
                        </button>
                    </div>
                ))}
            </div>
            )}
        </div>
    );
}

export default Likes;