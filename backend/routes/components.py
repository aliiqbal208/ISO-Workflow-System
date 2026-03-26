from datetime import datetime, timezone
from flask import Blueprint, request, jsonify
from database import components_col
from routes.helpers import safe_object_id, serialize_doc

components_bp = Blueprint("components", __name__)


def serialize_component(comp):
    """Serialize a component document for API response."""
    return serialize_doc(comp)


@components_bp.route("/components", methods=["GET"])
def get_components():
    """List all baseline workflow components."""
    components = list(components_col.find())
    return jsonify([serialize_component(c) for c in components]), 200


@components_bp.route("/components/<component_id>", methods=["GET"])
def get_component(component_id):
    """Get a single component by ID."""
    oid = safe_object_id(component_id)
    comp = components_col.find_one({"_id": oid})
    if not comp:
        return jsonify({"error": "Component not found"}), 404
    return jsonify(serialize_component(comp)), 200


@components_bp.route("/components", methods=["POST"])
def create_component():
    """Create a new workflow component."""
    data = request.get_json()
    if not data or not data.get("name"):
        return jsonify({"error": "Component name is required"}), 400

    if components_col.find_one({"name": data["name"]}):
        return jsonify({"error": "Component with this name already exists"}), 409

    now = datetime.now(timezone.utc)
    component = {
        "name": data["name"],
        "description": data.get("description", ""),
        "created_at": now,
        "updated_at": now,
    }
    result = components_col.insert_one(component)
    component["_id"] = result.inserted_id
    return jsonify(serialize_component(component)), 201


@components_bp.route("/components/<component_id>", methods=["PUT"])
def update_component(component_id):
    """Update an existing component."""
    oid = safe_object_id(component_id)
    data = request.get_json()
    if not data:
        return jsonify({"error": "Request body is required"}), 400

    update_fields = {"updated_at": datetime.now(timezone.utc)}
    if "name" in data:
        update_fields["name"] = data["name"]
    if "description" in data:
        update_fields["description"] = data["description"]

    result = components_col.update_one({"_id": oid}, {"$set": update_fields})
    if result.matched_count == 0:
        return jsonify({"error": "Component not found"}), 404

    comp = components_col.find_one({"_id": oid})
    return jsonify(serialize_component(comp)), 200


@components_bp.route("/components/<component_id>", methods=["DELETE"])
def delete_component(component_id):
    """Delete a component."""
    oid = safe_object_id(component_id)
    result = components_col.delete_one({"_id": oid})
    if result.deleted_count == 0:
        return jsonify({"error": "Component not found"}), 404
    return jsonify({"message": "Component deleted"}), 200
