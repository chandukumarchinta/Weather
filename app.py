from flask import Flask, jsonify, render_template, request
from database import init_db

app = Flask(__name__)

# Initialize database schema if not already created
init_db()

# Import blueprints
from routes.weather_current import weather_current_bp
from routes.weather_forecast import weather_forecast_bp
from routes.favorites_create import favorites_create_bp
from routes.favorites_read import favorites_read_bp
from routes.favorites_update import favorites_update_bp
from routes.favorites_delete import favorites_delete_bp

# Register blueprints
app.register_blueprint(weather_current_bp)
app.register_blueprint(weather_forecast_bp)
app.register_blueprint(favorites_create_bp)
app.register_blueprint(favorites_read_bp)
app.register_blueprint(favorites_update_bp)
app.register_blueprint(favorites_delete_bp)

@app.after_request
def add_cors_headers(response):
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type,Authorization'
    response.headers['Access-Control-Allow-Methods'] = 'GET,PUT,POST,DELETE,OPTIONS'
    return response

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy", "message": "WeatherHub API is running"}), 200

@app.errorhandler(404)
def not_found(e):
    if request.path.startswith('/api/'):
        return jsonify({"error": "Endpoint or resource not found"}), 404
    return "Page not found", 404

@app.errorhandler(500)
def server_error(e):
    if request.path.startswith('/api/'):
        return jsonify({"error": "Internal server error"}), 500
    return "Internal server error", 500

if __name__ == '__main__':
    app.run(debug=True, host='127.0.0.1', port=5000)