from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
import json
import bcrypt

app = Flask(
    __name__,
    static_folder='../frontend/build',
    static_url_path='/'
)

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
        return jsonify({"success": True, "token": username}), 200
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
    return jsonify({"success": True, "token": username}), 200

@app.route('/questionnaire', methods=['POST'])
def submit_questions():
    data = request.get_json()
    auth_header = request.headers.get("Authorization")
    
    if not auth_header or not auth_header.startswith("Bearer "):
        return jsonify({"error": "Missing or invalid token"}), 401
    
    username = auth_header.split(' ')[1]
    users = load_users()
    if not username in users:
        return jsonify({"error": "User not found"}), 404
    
    data = request.get_json()
    users[username]["userData"] = data
    save_users(users)
    
    return jsonify({"message": "Questionnaire received"}), 200

@app.route('/api/getUserData', methods=['GET'])
def get_dashboard_data():
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return jsonify({"error": "Missing or invalid token"}), 401
    username = auth_header.split(' ')[1]
    users = load_users()
    if not username in users:
        return jsonify({"error": "User not found"}), 404
    
    user_data = users[username]
    return jsonify(user_data), 200

@app.route('/api/generate', methods=['GET'])
def generate_recipes():
    return jsonify({"test": "recipe"}), 200



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
