import React, { useEffect, useState } from "react";
import { useNavigate } from 'react-router-dom';

function Questionnaire({ onComplete }) {
    const navigate = useNavigate();

    const [gender, setGender] = useState("m");
    const [weight, setWeight] = useState("");
    const [heightFeet, setHeightFeet] = useState("");
    const [heightInches, setHeightInches] = useState("");
    const [age, setAge] = useState("");
    const [activityLevel, setActivityLevel] = useState("1");
    const [nutritionGoal, setNutritionGoal] = useState("3");
    const [proteinPct, setProteinPct] = useState("30");
    const [carbsPct, setCarbsPct] = useState("50");
    const [fatsPct, setFatsPct] = useState("20");

    const [userData, setUserData] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) return;

        fetch("http://localhost:5000/api/getUserData", {
            headers: { Authorization: `Bearer ${token}` }
        })
        .then(res => res.json())
        .then(data => {
            if (data?.userData) {
                setUserData(data.userData);
                setGender(data.userData.gender || "m");
                setWeight((data.userData.weight * 2.20462).toFixed(0) || ""); // kg -> lbs
                const heightTotalInches = data.userData.height / 2.54;
                setHeightFeet(Math.floor(heightTotalInches / 12).toString());
                setHeightInches(Math.round(heightTotalInches % 12).toString());
                setAge(data.userData.age?.toString() || "");
                setActivityLevel(data.userData.activity_level?.toString() || "1");
                setNutritionGoal(data.userData.nutrition_goal?.toString() || "3");
                setProteinPct(data.userData.protien_percentage?.toString() || "30");
                setCarbsPct(data.userData.carbs_percentage?.toString() || "50");
                setFatsPct(data.userData.fat_percentage?.toString() || "20");
            }
        })
        .catch(err => console.error("Fetch error:", err));
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();

        const weightKg = parseFloat(weight) / 2.20462;
        const heightCm = (parseInt(heightFeet) * 12 + parseInt(heightInches)) * 2.54;
        const ageInt = parseInt(age);
        const activity = parseInt(activityLevel);
        const goal = parseInt(nutritionGoal);

        const baseBMR = gender === 'm'
            ? (10 * weightKg) + (6.25 * heightCm) - (5 * ageInt) + 5
            : (10 * weightKg) + (6.25 * heightCm) - (5 * ageInt) - 161;

        const totalBMR = baseBMR * (((1.9 - 1.2) / 5) * (activity - 1) + 1.2);
        const goalCalories = totalBMR + (200 * (goal - 3));

        const protein_g = (goalCalories * (proteinPct / 100)) / 4;
        const carbs_g = (goalCalories * (carbsPct / 100)) / 4;
        const fats_g = (goalCalories * (fatsPct / 100)) / 9;

        const newUserData = {
            gender,
            weight: weightKg,
            height: heightCm,
            age: ageInt,
            activity_level: activity,
            nutrition_goal: goal,
            calculated_calories: goalCalories.toFixed(2),
            protein: protein_g,
            protien_percentage: proteinPct,
            carbs: carbs_g,
            carbs_percentage: carbsPct,
            fats: fats_g,
            fat_percentage: fatsPct
        };

        if (onComplete) onComplete(newUserData);

        try {
            const token = localStorage.getItem("token");
            const response = await fetch("http://localhost:5000/questionnaire", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(newUserData)
            });

            if (response.ok) {
                navigate("/dashboard");
            } else {
                console.error("Failed to submit questionnaire");
            }
        } catch (error) {
            console.error("Error submitting questionnaire:", error);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <h2>Nutrition Questionnaire</h2>

            <label>Gender:</label>
            <select value={gender} onChange={(e) => setGender(e.target.value)}>
                <option value="m">Male</option>
                <option value="f">Female</option>
            </select>

            <br />
            <label>Weight (lbs):</label>
            <input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} required />

            <br />
            <label>Height:</label>
            <input type="number" placeholder="Feet" value={heightFeet} onChange={(e) => setHeightFeet(e.target.value)} required />
            <input type="number" placeholder="Inches" value={heightInches} onChange={(e) => setHeightInches(e.target.value)} required />

            <br />
            <label>Age:</label>
            <input type="number" value={age} onChange={(e) => setAge(e.target.value)} required />

            <br />
            <label>Activity Level:</label>
            <select value={activityLevel} onChange={(e) => setActivityLevel(e.target.value)}>
                <option value="1">Little to no exercise</option>
                <option value="2">Exercise 1–3 times/week</option>
                <option value="3">Exercise 4–5 times/week</option>
                <option value="4">Daily or intense 3–4 times/week</option>
                <option value="5">Intense 6–7 times/week</option>
                <option value="6">Very intense or physical job</option>
            </select>

            <br />
            <label>Nutrition Goal:</label>
            <select value={nutritionGoal} onChange={(e) => setNutritionGoal(e.target.value)}>
                <option value="1">Lose 1 lb/week</option>
                <option value="2">Lose 0.5 lb/week</option>
                <option value="3">Maintain weight</option>
                <option value="4">Gain 0.5 lb/week</option>
                <option value="5">Gain 1 lb/week</option>
            </select>

            
            {userData?.protein && (
                <div style={{ marginTop: "10px" }}>
                    <div>
                        <label>
                            Protein: {userData.protein.toFixed(0)}g
                            <input
                                type="number"
                                value={proteinPct}
                                onChange={(e) => setProteinPct(Number(e.target.value))}
                                style={{ marginLeft: "10px", width: "60px" }}
                            /> %
                        </label>
                    </div>
                    <div>
                        <label>
                            Carbs: {userData.carbs.toFixed(0)}g
                            <input
                                type="number"
                                value={carbsPct}
                                onChange={(e) => setCarbsPct(Number(e.target.value))}
                                style={{ marginLeft: "10px", width: "60px" }}
                            /> %
                        </label>
                    </div>
                    <div>
                        <label>
                            Fats: {userData.fats.toFixed(0)}g
                            <input
                                type="number"
                                value={fatsPct}
                                onChange={(e) => setFatsPct(Number(e.target.value))}
                                style={{ marginLeft: "10px", width: "60px" }}
                            /> %
                        </label>
                    </div>
                </div>
            )}

            <br /><br />
            <button type="submit">Submit</button>
        </form>
    );
}

export default Questionnaire;
