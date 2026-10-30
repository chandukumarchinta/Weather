# routes/favorites_update.py
from flask import Blueprint, request, jsonify
from database import get_db_connection
from mysql.connector import Error

favorites_update_bp = Blueprint('favorites_update', __name__)

@favorites_update_bp.route('/api/favorites/<int:id>', methods=['PUT'])
def update_favorite(id):
    data = request.get_json()
    
    # Validate required fields
    if not data or not data.get('city') or not data.get('country'):
        return jsonify({"error": "Missing required fields: city and country"}), 400

    city = data.get('city').strip()
    country = data.get('country').strip().upper()
    nickname = data.get('nickname', '').strip() if data.get('nickname') else None

    conn = get_db_connection()
    if not conn:
        return jsonify({"error": "Database connection failed"}), 500

    cursor = conn.cursor(dictionary=True)
    try:
        # Check whether the requested record exists
        cursor.execute("SELECT * FROM favorites WHERE id = %s", (id,))
        if not cursor.fetchone():
            return jsonify({"error": "Favorite record not found"}), 404

        # Update the MySQL record using parameterized queries
        query = "UPDATE favorites SET city = %s, country = %s, nickname = %s WHERE id = %s"
        cursor.execute(query, (city, country, nickname, id))
        conn.commit()

        # Retrieve and return the updated record as JSON
        cursor.execute("SELECT * FROM favorites WHERE id = %s", (id,))
        updated_record = cursor.fetchone()
        
        return jsonify(updated_record), 200

    except Error as e:
        # Error code 1062 handles duplicate city/country entries
        if e.errno == 1062:
            return jsonify({"error": "This city and country combination already exists in favorites."}), 409
        return jsonify({"error": str(e)}), 500
        
    finally:
        cursor.close()
        conn.close()