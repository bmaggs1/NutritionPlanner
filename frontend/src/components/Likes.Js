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
                // Refresh the user data after unliking
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
            {/* Back button */}
            <button
                onClick={() => navigate("/dashboard")}
                style={{
                    position: "absolute",
                    top: "1rem",
                    right: "1rem",
                    padding: "0.5rem 1rem",
                    cursor: "pointer"
                }}
            >
                Back to Dashboard
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
                        <div key={index} style={{
                            border: "1px solid #ddd",
                            borderRadius: "8px",
                            padding: "1rem",
                            width: "200px",
                            backgroundColor: "#fff",
                            boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center"
                        }}>
                        <img
                            src={recipe.image}
                            alt={recipe.title}
                            style={{ width: "100%", borderRadius: "4px", marginBottom: "0.5rem" }}
                        />
                        <Link
                            to={`/recipe/${recipe.id}`}
                            className="custom-link"
                            style={{
                                textAlign: "center",
                                color: "#4B0082",
                                textDecoration: "none",
                                marginBottom: "0.5rem"
                            }}
                        >
                            {recipe.title}
                        </Link>
                        <button
                            onClick={() => handleUnlike(recipe.id)}
                            style={{
                                marginTop: "auto",
                                padding: "0.3rem 0.6rem",
                                fontSize: "0.9rem",
                                backgroundColor: "#ff4d4d",
                                color: "white",
                                border: "none",
                                borderRadius: "4px",
                                cursor: "pointer"
                            }}
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