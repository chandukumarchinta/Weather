# routes/favorites_delete.py
from flask import Blueprint, jsonify
from database import get_db_connection

favorites_delete_bp = Blueprint('favorites_delete', __name__)

@favorites_delete_bp.route('/api/favorites/<int:id>', methods=['DELETE'])
def delete_favorite(id):
    conn = get_db_connection()
    if not conn:
        return jsonify({"error": "Database connection failed"}), 500

    cursor = conn.cursor(dictionary=True)
    try:
        # Check if the record exists before deleting
        cursor.execute("SELECT * FROM favorites WHERE id = %s", (id,))
        if not cursor.fetchone():
            return jsonify({"error": "Favorite record not found"}), 404

        # Delete only the matching record using a parameterized query
        cursor.execute("DELETE FROM favorites WHERE id = %s", (id,))
        conn.commit()
        
        # Return a JSON confirmation when deletion succeeds
        return jsonify({"message": "Favorite deleted successfully", "id": id}), 200
        
    except Exception as e:
        # Handle database errors gracefully
        return jsonify({"error": str(e)}), 500
        
    finally:
        cursor.close()
        conn.close()