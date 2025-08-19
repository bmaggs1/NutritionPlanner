// components/RecipeDetail.jsx
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import DOMPurify from 'dompurify';
import "../App.css"

function RecipeDetail() {
    const { id } = useParams();
    const [recipe, setRecipe] = useState(null);
    const navigate = useNavigate();
    const clean = (html) => ({ __html: DOMPurify.sanitize(html || '') });

    useEffect(() => {
        fetch(`http://localhost:5000/recipe/${id}`)
            .then((res) => res.json())
            .then((data) => setRecipe(data))
            .catch((err) => console.error("Error fetching recipe:", err));
    }, [id]);

    if (!recipe) return <p>Loading recipe...</p>;

    return (
        <div>
            <button
                onClick={() => navigate("/likes")}
                className="view-likes-btn"
            >
                View Liked Recipes
            </button>

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

            <h2>{recipe.title}</h2>
            <img src={recipe.image} alt={recipe.title} width="300" />
            <h3>Ingredients:</h3>
            <ul style={{ listStyleType: "none", paddingLeft: 0 }}>
                {recipe.ingredients.map((ing, i) => (
                    <li key={i}>{ing}</li>
                ))}
            </ul>
            <h3>Instructions:</h3>
            <p dangerouslySetInnerHTML={clean(recipe.instructions)} />
        </div>
    );
}

export default RecipeDetail;