// components/Questionnaire.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from 'react-router-dom';
import "../App.css"

function Questionnaire({ onComplete }) {
    const navigate = useNavigate();

    const [gender, setGender] = useState("m");
    const [weight, setWeight] = useState("");           // lbs
    const [heightFeet, setHeightFeet] = useState("");   // 2-8
    const [heightInches, setHeightInches] = useState(""); // 0-11
    const [age, setAge] = useState("");                 // 8-100
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
                    setWeight(
                        data.userData.weight
                          ? (data.userData.weight * 2.20462).toFixed(0)
                            : ""
                    ); // kg -> lbs

                    const heightTotalInches = (data.userData.height || 0) / 2.54;
                    if (heightTotalInches) {
                        setHeightFeet(Math.floor(heightTotalInches / 12).toString());
                        setHeightInches(Math.round(heightTotalInches % 12).toString());
                    }

                    setAge(data.userData.age?.toString() || "");
                    setActivityLevel(data.userData.activity_level?.toString() || "1");
                    setNutritionGoal(data.userData.nutrition_goal?.toString() || "3");

                    setProteinPct(
                        (data.userData.protein_percentage ?? 30).toString()
                    );
                    setCarbsPct(
                        (data.userData.carbs_percentage ?? 50).toString()
                    );
                    setFatsPct(
                        (data.userData.fat_percentage ?? 20).toString()
                    );
                }
            })
            .catch(err => console.error("Fetch error:", err));
    }, []);

    const macrosSumTo100 = () => {
        const p = Number(proteinPct) || 0;
        const c = Number(carbsPct) || 0;
        const f = Number(fatsPct) || 0;
        return p + c + f === 100;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Parse numbers
        const w = Number(weight);
        const hf = Number(heightFeet);
        const hi = Number(heightInches);
        const a = Number(age);
        const activity = parseInt(activityLevel, 10);
        const goal = parseInt(nutritionGoal, 10);

        // Gather validation errors
        const errors = [];
        if (!Number.isFinite(w) || w < 50 || w > 600) {
            errors.push("Weight must be between 50 and 600 lbs.");
        }
        if (!Number.isFinite(hf) || hf < 2 || hf > 8) {
            errors.push("Height (feet) must be between 2 and 8.");
        }
        if (!Number.isFinite(hi) || hi < 0 || hi > 11) {
            errors.push("Height (inches) must be between 0 and 11.");
        }
        if (!Number.isFinite(a) || a < 8 || a > 100) {
            errors.push("Age must be between 8 and 100.");
        }
        if (!macrosSumTo100()) {
            errors.push("Protein% + Carbs% + Fats% must add up to 100.");
        }

        if (errors.length) {
            alert(errors.join("\n"));
            return; // ❌ stop, don't submit
        }

        // Conversions
        const weightKg = w / 2.20462;
        const heightCm = ((hf * 12) + hi) * 2.54;

        // BMR (same formula you used)
        const baseBMR = gender === 'm'
          ? (10 * weightKg) + (6.25 * heightCm) - (5 * a) + 5
          : (10 * weightKg) + (6.25 * heightCm) - (5 * a) - 161;

        // keep your original linear interpolation for activity
        const totalBMR = baseBMR * (((1.9 - 1.2) / 5) * (activity - 1) + 1.2);
        const goalCalories = totalBMR + (200 * (goal - 3));

        // Macro grams
        const pPct = Number(proteinPct) || 0;
        const cPct = Number(carbsPct) || 0;
        const fPct = Number(fatsPct) || 0;

        const protein_g = (goalCalories * (pPct / 100)) / 4;
        const carbs_g = (goalCalories * (cPct / 100)) / 4;
        const fats_g = (goalCalories * (fPct / 100)) / 9;

        // Keep field names exactly as your backend expects
        const newUserData = {
            gender,
            weight: weightKg,
            height: heightCm,
            age: a,
            activity_level: activity,
            nutrition_goal: goal,
            calculated_calories: goalCalories.toFixed(2),
            protein: protein_g,
            protein_percentage: pPct,   // 👈 keep original key
            carbs: carbs_g,
            carbs_percentage: cPct,
            fats: fats_g,
            fat_percentage: fPct,
            liked_recipes: Array.isArray(userData?.liked_recipes) ? userData.liked_recipes : []
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
                alert("Submission failed. Please try again.");
            }
        } catch (error) {
            console.error("Error submitting questionnaire:", error);
            alert("Submission failed due to a network error.");
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
            <input
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                required
                min={50}
                max={600}
            />

            <br />
            <label>Height:</label>
            <input
                type="number"
                placeholder="Feet"
                value={heightFeet}
                onChange={(e) => setHeightFeet(e.target.value)}
                required
                min={2}
                max={8}
            />
            <input
                type="number"
                placeholder="Inches"
                value={heightInches}
                onChange={(e) => setHeightInches(e.target.value)}
                required
                min={0}
                max={11}
            />

            <br />
            <label>Age:</label>
            <input
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                required
                min={8}
                max={100}
            />

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

            {/* Macro percentages with alerts if sum != 100 */}
            {userData?.protein && (
                <div style={{ marginTop: "10px" }}>
                    <div>
                        <label>
                            Protein: {userData.protein.toFixed(0)}g
                            <input
                                type="number"
                                value={proteinPct}
                                onChange={(e) => setProteinPct(e.target.value)}
                                style={{ marginLeft: "10px", width: "60px" }}
                                min={0}
                                max={100}
                            /> %
                        </label>
                    </div>
                    <div>
                        <label>
                            Carbs: {userData.carbs.toFixed(0)}g
                            <input
                                type="number"
                                value={carbsPct}
                                onChange={(e) => setCarbsPct(e.target.value)}
                                style={{ marginLeft: "10px", width: "60px" }}
                                min={0}
                                max={100}
                            /> %
                        </label>
                    </div>
                    <div>
                        <label>
                            Fats: {userData.fats.toFixed(0)}g
                            <input
                                type="number"
                                value={fatsPct}
                                onChange={(e) => setFatsPct(e.target.value)}
                                style={{ marginLeft: "10px", width: "60px" }}
                                min={0}
                                max={100}
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