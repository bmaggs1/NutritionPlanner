// components/RecipeDetail.jsx
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "../App.css"

function RecipeDetail() {
    const { id } = useParams();
    const [recipe, setRecipe] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        fetch(`http://localhost:5000/recipe/${id}`)
            .then((res) => res.json())
            .then((data) => setRecipe(data))
            .catch((err) => console.error("Error fetching recipe:", err));
    }, [id]);

    if (!recipe) return <p>Loading recipe...</p>;

    return (
        <div>
            {/* Back button */}
            <button
                onClick={() => navigate("/Likes")}
                style={{
                    position: "absolute",
                    top: "1rem",
                    right: "13rem",
                    padding: "0.5rem 1rem",
                    cursor: "pointer"
                }}
            >
                Back to Likes
            </button>
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
            <h2>{recipe.title}</h2>
            <img src={recipe.image} alt={recipe.title} width="300" />
            <h3>Ingredients:</h3>
            <ul style={{ listStyleType: "none", paddingLeft: 0 }}>
                {recipe.ingredients.map((ing, i) => (
                    <li key={i}>{ing}</li>
                ))}
            </ul>
            <h3>Instructions:</h3>
            <p dangerouslySetInnerHTML={{ __html: recipe.instructions }} />
        </div>
    );
}

export default RecipeDetail;