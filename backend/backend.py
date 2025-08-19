from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os, json, bcrypt, requests
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity

app = Flask(
    __name__,
    static_folder='../frontend/build',
    static_url_path='/'
)

app.config["JWT_SECRET_KEY"] = "super-secret-key"
jwt = JWTManager(app)

CORS(app)

USERS_FILE = 'users.json'
API_KEY = os.getenv("API_KEY")

def load_users():
    if not os.path.exists(USERS_FILE):
        return {}
    with open(USERS_FILE, 'r') as f:
        return json.load(f)

def save_users(users):
    with open(USERS_FILE, 'w') as f:
        json.dump(users, f)

# === API ENDPOINTS ===
@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get("username")
    password = data.get("password")
    users = load_users()

    user_data = users.get(username)
    if not user_data:
        return jsonify({"success": False, "message": "Invalid credentials"}), 401

    hashed_pw = user_data.get("password", "")

    if bcrypt.checkpw(password.encode(), hashed_pw.encode()):
        access_token = create_access_token(identity=username)
        return jsonify({"success": True, "token": access_token}), 200
    else:
        return jsonify({"success": False, "message": "Invalid credentials"}), 401
    
@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get("username")
    password = data.get("password")
    users = load_users()
    if username in users:
        return jsonify({"success": False, "message": "Username already exists"}), 400
    hashed_pw = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
    users[username] = {
        "username": username,
        "password": hashed_pw,
        "userData": {}  # prepare space for future questionnaire data
    }

    save_users(users)
    access_token = create_access_token(identity=username)
    return jsonify({"success": True, "token": access_token}), 200

@app.route('/questionnaire', methods=['POST'])
@jwt_required()
def submit_questions():
    username = get_jwt_identity()
    data = request.get_json()

    users = load_users()
    if not username in users:
        return jsonify({"error": "User not found"}), 404
    
    data = request.get_json()
    users[username]["userData"] = data
    save_users(users)
    
    return jsonify({"message": "Questionnaire received"}), 200

@app.route('/api/likeRecipe', methods=['POST'])
@jwt_required()
def like_recipe():
    username = get_jwt_identity()
    data = request.get_json()
    recipe_id = data.get("id")
    recipe_title = data.get("title")
    recipe_image = data.get("image")
    
    users = load_users()
    if not username in users:
        return jsonify({"error": "User not found"}), 404
    
    users[username]["userData"]["liked_recipes"].append({
        "id": recipe_id,
        "title": recipe_title,
        "image": recipe_image
    })
    save_users(users)

    return jsonify({"message": "Recipe Liked"}), 200

@app.route('/api/unlike', methods=['POST'])
@jwt_required() 
def unlike_recipe():
    username = get_jwt_identity()
    data = request.get_json()
    recipe_id = int(data.get('recipeId'))
    users = load_users()
    if not username in users:
        return jsonify({"error": "User not found"}), 404
    
    current_likes = users[username]["userData"]["liked_recipes"]
    new_likes = [r for r in current_likes if r["id"] != recipe_id]
    if len(new_likes) < len(current_likes):
        users[username]["userData"]["liked_recipes"] = new_likes
        save_users(users)
        return jsonify({"message": "Recipe unliked successfully"}), 200
    else:
        return jsonify({"error": "Recipe not found"}), 404
    
@app.route('/api/getUserData', methods=['GET'])
@jwt_required()
def get_dashboard_data():
    username = get_jwt_identity()
    
    users = load_users()
    if not username in users:
        return jsonify({"error": "User not found"}), 404
    
    user_data = users[username]
    return jsonify(user_data), 200

@app.route('/api/generateRecipe', methods=['GET'])
@jwt_required()
def generate_recipe():
    username = get_jwt_identity()
    
    users = load_users()
    if not username in users:
        return jsonify({"error": "User not found"}), 404
    
    user_data = users[username]

    protein_per_day = int(float(user_data['userData']['protein']))
    carbs_per_day = int(float(user_data['userData']['carbs']))
    fats_per_day = int(float(user_data['userData']['fats']))
    daily_cals = int(float(user_data['userData']['calculated_calories']))
    if daily_cals > 2800:
        num_meals = 4
    else: 
        num_meals = 3
    protein_per_meal = protein_per_day / num_meals
    carbs_per_meal = carbs_per_day / num_meals
    fats_per_meal = fats_per_day / num_meals
    base_url = "https://api.spoonacular.com/recipes/findByNutrients?"
    params = (
        f"minCarbs={carbs_per_meal - 30}&"
        f"maxCarbs={carbs_per_meal + 30}&"
        f"minProtein={protein_per_meal - 30}&"
        f"maxProtein={protein_per_meal + 30}&"
        f"minFat={fats_per_meal - 15}&"
        f"maxFat={fats_per_meal + 15}&"
        f"number={1}&"
        f"random=true&"
        f"apiKey={API_KEY}"
    )
    
    URL = base_url + params
    response = requests.get(URL)
    #uncomment if testing
    #data = [{'id': 1697677, 'title': 'Super Easy Oven Baked Cod', 'image': 'https://img.spoonacular.com/recipes/1697677-312x231.jpg', 'imageType': 'jpg', 'calories': 718, 'protein': '47g', 'fat': '17g', 'carbs': '87g'}]
    #return jsonify(data), 200
    if response.status_code == 200:
        return jsonify(response.json()), 200
    
    return jsonify({"Failure": "no recipes"}), 200

@app.route('/recipe/<int:recipe_id>', methods=['GET'])
def get_recipe(recipe_id):
    url = f'https://api.spoonacular.com/recipes/{recipe_id}/information'
    params = {
        'includeNutrition': True,
        'apiKey': API_KEY
    }
    response = requests.get(url, params=params)

    if response.status_code != 200:
        return jsonify({"error": "Failed to fetch recipe"}), response.status_code

    data = response.json()
    return jsonify({
        "title": data["title"],
        "image": data["image"],
        "ingredients": [i["original"] for i in data["extendedIngredients"]],
        "instructions": data["instructions"] or "No instructions provided."
    })

# === SERVE REACT FRONTEND ===
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_react(path):
    if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, 'index.html')


if __name__ == '__main__':
    app.run(debug=True)