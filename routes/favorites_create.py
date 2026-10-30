# routes/favorites_create.py
from flask import Blueprint, request, jsonify
from database import get_db_connection
from mysql.connector import Error

favorites_create_bp = Blueprint('favorites_create', __name__)

@favorites_create_bp.route('/api/favorites', methods=['POST'])
def create_favorite():
    data = request.get_json()
    
    # Validate required fields
    if not data or not data.get('city') or not data.get('country'):
        return jsonify({"error": "Missing required fields: city and country are required."}), 400

    city = data.get('city').strip()
    country = data.get('country').strip().upper()
    nickname = data.get('nickname', '').strip() if data.get('nickname') else None

    conn = get_db_connection()
    if not conn:
        return jsonify({"error": "Database connection failed"}), 500

    cursor = conn.cursor(dictionary=True)
    try:
        # Insert favorite city into MySQL
        query = "INSERT INTO favorites (city, country, nickname) VALUES (%s, %s, %s)"
        cursor.execute(query, (city, country, nickname))
        conn.commit()
        
        # Retrieve the newly created record to return it
        new_id = cursor.lastrowid
        cursor.execute("SELECT * FROM favorites WHERE id = %s", (new_id,))
        new_record = cursor.fetchone()
        
        return jsonify(new_record), 201
        
    except Error as e:
        # Error code 1062 handles unique constraint violations (duplicate city/country)
        if e.errno == 1062:
            return jsonify({"error": "This city and country combination already exists in favorites."}), 409
        return jsonify({"error": str(e)}), 500
        
    finally:
        cursor.close()
        conn.close()