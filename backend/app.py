import os
import time
import logging
from flask import Flask, jsonify
from flask_cors import CORS
from pymongo.errors import ConnectionFailure
from bson.errors import InvalidId
from config import Config
from database import init_db, db
from routes.components import components_bp
from routes.organizations import organizations_bp
from routes.workflows import workflows_bp
from routes.applications import applications_bp


# ── Logging ──
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)


def wait_for_mongo(max_retries=10, delay=2):
    """Wait for MongoDB to be ready (important in Docker)."""
    for attempt in range(1, max_retries + 1):
        try:
            db.command("ping")
            logger.info("✅ MongoDB is ready!")
            return True
        except ConnectionFailure:
            logger.info(f"⏳ Waiting for MongoDB... (attempt {attempt}/{max_retries})")
            time.sleep(delay)
    raise Exception("❌ Could not connect to MongoDB after multiple retries")


def create_app():
    app = Flask(__name__)

    # ── CORS — restrict to known origins ──
    allowed_origins = os.getenv(
        "CORS_ORIGINS",
        "http://localhost:3007",
    ).split(",")
    CORS(app, origins=allowed_origins)

    # ── Register Blueprints ──
    app.register_blueprint(components_bp, url_prefix="/api")
    app.register_blueprint(organizations_bp, url_prefix="/api")
    app.register_blueprint(workflows_bp, url_prefix="/api")
    app.register_blueprint(applications_bp, url_prefix="/api")

    # ── Centralized Error Handlers ──
    @app.errorhandler(ValueError)
    def handle_value_error(e):
        return jsonify({"error": str(e)}), 400

    @app.errorhandler(InvalidId)
    def handle_invalid_id(e):
        return jsonify({"error": "Invalid ID format"}), 400

    @app.errorhandler(404)
    def handle_not_found(e):
        return jsonify({"error": "Resource not found"}), 404

    @app.errorhandler(500)
    def handle_server_error(e):
        logger.error(f"Internal server error: {e}")
        return jsonify({"error": "Internal server error"}), 500

    # ── Request Logging ──
    @app.after_request
    def log_request(response):
        from flask import request
        logger.info(
            "%s %s %s", request.method, request.path, response.status_code
        )
        return response

    # ── Database Init ──
    wait_for_mongo()
    init_db()

    # Auto-seed if database is empty (first run)
    from database import components_col
    if components_col.count_documents({}) == 0:
        logger.info("📦 Database is empty — running seed...")
        from seed import seed
        seed()

    @app.route("/")
    def health():
        return {"status": "ok", "message": "ISO Workflow System API"}

    return app


if __name__ == "__main__":
    app = create_app()
    debug = os.getenv("FLASK_DEBUG", "false").lower() == "true"
    app.run(debug=debug, host="0.0.0.0", port=Config.PORT)
