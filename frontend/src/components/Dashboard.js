import React, { useEffect, useState, useRef} from 'react';
import { useNavigate} from 'react-router-dom';
import "../App.css"


function Dashboard() {
    //Tinder Card stuff
    const SWIPE_X_THRESHOLD = 120;
    const [dragging, setDragging] = useState(false);
    const [dx, setDx] = useState(0);
    const [dy, setDy] = useState(0);
    const startRef = useRef({ x: 0, y: 0 });
    const [isFlipped, setIsFlipped] = useState(false);
    const justSwipedRef = useRef(false);

    function lerpColor(c1, c2, t) {
        // c1, c2 are hex strings like "#rrggbb", t is 0..1
        const r1 = parseInt(c1.slice(1, 3), 16);
        const g1 = parseInt(c1.slice(3, 5), 16);
        const b1 = parseInt(c1.slice(5, 7), 16);

        const r2 = parseInt(c2.slice(1, 3), 16);
        const g2 = parseInt(c2.slice(3, 5), 16);
        const b2 = parseInt(c2.slice(5, 7), 16);

        const r = Math.round(r1 + (r2 - r1) * t);
        const g = Math.round(g1 + (g2 - g1) * t);
        const b = Math.round(b1 + (b2 - b1) * t);

        return `rgb(${r},${g},${b})`;
    }

    const progress = Math.min(Math.abs(dx) / SWIPE_X_THRESHOLD, 1);

    let bgColor = "#ffffff";
    if (dx > 0) {
        bgColor = lerpColor("#ffffff", "#9fffb5ff", progress);
    } else if (dx < 0) {
        bgColor = lerpColor("#ffffff", "#ff969fff", progress);
    }


    const toggleFlip = () => {
        if (dragging || justSwipedRef.current) return;
        setIsFlipped(f => !f);
    };
    const onKeyToggle = (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleFlip();
        }
    };

    const onPointerDown = (e) => {
        // support mouse & touch
        const point = e.touches ? e.touches[0] : e;
        startRef.current = { x: point.clientX, y: point.clientY };
        setDragging(true);
        // prevent image dragging/text selection during drag
        document.body.classList.add('no-select');

        // capture pointer for consistent events (mouse)
        if (e.target.setPointerCapture) {
            e.target.setPointerCapture(e.pointerId || 1);
        }
    };

    const onPointerMove = (e) => {
        if (!dragging) return;
        const point = e.touches ? e.touches[0] : e;
        setDx(point.clientX - startRef.current.x);
        setDy(point.clientY - startRef.current.y);
    };

    const endDragWithSwipe = () => {
        setDragging(false);
        document.body.classList.remove('no-select');

        let didSwipe = false;

        // decide based on horizontal distance
        if (dx > SWIPE_X_THRESHOLD) {
            didSwipe = true;
            handleLike();
        } else if (dx < -SWIPE_X_THRESHOLD) {
            didSwipe = true;
            handleSkip();
        }

        if (didSwipe) {
            justSwipedRef.current = true;
        }

        // snap back to center after alert
        setDx(0);
        setDy(0);
        setTimeout(() => {
            justSwipedRef.current = false;
        }, 0);
        
    };

    const onPointerUp = endDragWithSwipe;
    const onPointerCancel = endDragWithSwipe;


    //END TINDER CARD STUFF





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
        setIsFlipped(false);
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
                <div
                    className={`form-container swipe-card flip-card ${dragging ? 'dragging' : ''} ${isFlipped ? 'flipped' : ''}`}
                    style={{
                        transform: `translate(${dx}px, ${dy}px) rotate(${dx * 0.05}deg)`,
                        backgroundColor: bgColor
                    }}
                    onMouseDown={onPointerDown}
                    onMouseMove={onPointerMove}
                    onMouseUp={onPointerUp}
                    onMouseLeave={dragging ? onPointerUp : undefined}
                    onTouchStart={onPointerDown}
                    onTouchMove={onPointerMove}
                    onTouchEnd={onPointerUp}
                    onTouchCancel={onPointerCancel}

                    // flip on click / keyboard
                    onClick={toggleFlip}
                    tabIndex={0}
                    role="button"
                    aria-pressed={isFlipped}
                    onKeyDown={onKeyToggle}
                >
                    <div className="flip-card-inner">
                        {/* FRONT: title + image only */}
                        <div className="flip-card-front">
                            <h2 className="center">{recipe.title}</h2>
                            <img
                                className="recipe-img"
                                src={recipe.image}
                                alt={recipe.title}
                                draggable={false}
                            />
                        </div>

                        {/* BACK: details (calories/macros + buttons) */}
                        <div className="flip-card-back">
                            <h3 className="center" style={{ marginTop: 0 }}>Nutrition</h3>
                            <p>Calories: {recipe.calories}</p>
                            <p>Protein: {recipe.protein}</p>
                            <p>Carbs: {recipe.carbs}</p>
                            <p>Fat: {recipe.fat}</p>
                        </div>
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