# routes/favorites_read.py
from flask import Blueprint, jsonify
from database import get_db_connection

favorites_read_bp = Blueprint('favorites_read', __name__)

@favorites_read_bp.route('/api/favorites', methods=['GET'])
def get_favorites():
    conn = get_db_connection()
    if not conn:
        return jsonify({"error": "Database connection failed"}), 500

    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM favorites ORDER BY created_at DESC")
    records = cursor.fetchall()
    
    cursor.close()
    conn.close()
    
    # Return records as JSON (empty list if none exist)
    return jsonify(records), 200

@favorites_read_bp.route('/api/favorites/<int:id>', methods=['GET'])
def get_favorite_by_id(id):
    conn = get_db_connection()
    if not conn:
        return jsonify({"error": "Database connection failed"}), 500

    cursor = conn.cursor(dictionary=True)
    # Using parameterized SQL queries
    cursor.execute("SELECT * FROM favorites WHERE id = %s", (id,))
    record = cursor.fetchone()
    
    cursor.close()
    conn.close()
    
    # Return HTTP 404 when the requested ID does not exist
    if not record:
        return jsonify({"error": "Favorite city not found"}), 404
        
    return jsonify(record), 200
