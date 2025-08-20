import React, { useEffect, useState } from 'react';
import { useNavigate} from 'react-router-dom';
import "../App.css"


function Dashboard() {
    const navigate = useNavigate();
    const [userData, setUserData] = useState(null);
    const [recipe, setRecipe] = useState(null);

    useEffect(() => {
        //Get user Data
        const token = localStorage.getItem("token");
        if (!token) {
            navigate("/");
            return;
        }

        fetch("http://localhost:5000/api/getUserData", {
            headers: {
                Authorization: `Bearer ${token}`
            }
        })
            .then((res) => {
                if (res.status !== 200) {
                    localStorage.removeItem("token");
                    navigate("/");
                    throw new Error("Unauthorized");
                }
                return res.json();
            })
            .then((data) => {
                setUserData(data);
            })
            .catch((err) => console.error("Fetch error:", err));

        getOneRecipe();
    }, []);

    const getOneRecipe = async () => {
        const token = localStorage.getItem("token");
        fetch("http://localhost:5000/api/generateRecipe", {
            method: "GET",
            headers: { Authorization: `Bearer ${token}` }
        })
            .then((res) => res.json())
            .then((data) => {
                console.log("Fetched data:", data[0]);
                setRecipe(data[0]);
            })
            .catch((err) => console.error("Error fetching recipe:", err));
    };

    if (!userData || !userData.userData) return <p>Loading user data...</p>;

    const handleLike = async () => {
        const token = localStorage.getItem("token");

        try {
            const res = await fetch("http://localhost:5000/api/likeRecipe", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    id: recipe.id,
                    title: recipe.title,
                    image: recipe.image
                })
            });

            const data = await res.json();
            console.log(data.message); // "Recipe liked!"
        } catch (err) {
            console.error("Error liking recipe:", err);
        }
        getOneRecipe();
    };

    const handleSkip = () => {
        getOneRecipe();
    };

    const {
        calculated_calories,
        nutrition_goal,
        protein,
        protein_percentage,
        carbs,
        carbs_percentage,
        fats,
        fat_percentage
    } = userData.userData;

    return (
        <div>
            <button 
                onClick={() => navigate("/questionnaire")}
                className="settings-btn"
            >
                Change User Settings
            </button>

            <button
                onClick={() => navigate("/likes")}
                className="view-likes-btn"
            >
                View Liked Recipes
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
            <p>
                Your current nutrition is set to <strong>{Number(calculated_calories).toFixed(0)} calories</strong> per day
                to reach your goal of <strong>{getGoalText(nutrition_goal)}</strong>.
            </p>
            <p>
                This consists of:
                <strong>
                {" "}{protein_percentage}% protein ({protein.toFixed(0)}g),
                {" "}{carbs_percentage}% carbs ({carbs.toFixed(0)}g),
                {" and "}{fat_percentage}% fats ({fats.toFixed(0)}g)
                </strong>
            </p>
            
            {recipe && (
                <div className="form-container">
                    <h2>{recipe.title}</h2>
                    <img className="recipe-img" src={recipe.image} alt={recipe.title} />

                    <p>Calories: {recipe.calories}</p>
                    <p>Protein: {recipe.protein}</p>
                    <p>Carbs: {recipe.carbs}</p>
                    <p>Fat: {recipe.fat}</p>

                    <div className="recipe-actions">
                        <button onClick={handleLike}>👍 Like</button>
                        <button onClick={handleSkip}>👎 Skip</button>
                    </div>
                </div>
            )}
        </div>
    );
}

function getGoalText(goalNumber) {
    const goals = {
        1: "losing 1 lb/week",
        2: "losing 0.5 lb/week",
        3: "maintaining weight",
        4: "gaining 0.5 lb/week",
        5: "gaining 1 lb/week"
    };
    return goals[goalNumber] || "an unknown goal";
}

export default Dashboard;