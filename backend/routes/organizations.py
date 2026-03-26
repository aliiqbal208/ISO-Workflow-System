from datetime import datetime, timezone
from flask import Blueprint, request, jsonify
from database import organizations_col
from routes.helpers import safe_object_id, serialize_doc

organizations_bp = Blueprint("organizations", __name__)


def serialize_org(org):
    """Serialize an organization document for API response."""
    return serialize_doc(org)


@organizations_bp.route("/organizations", methods=["GET"])
def get_organizations():
    """List all organizations (Certification Bodies)."""
    orgs = list(organizations_col.find())
    return jsonify([serialize_org(o) for o in orgs]), 200


@organizations_bp.route("/organizations/<org_id>", methods=["GET"])
def get_organization(org_id):
    """Get a single organization by ID."""
    oid = safe_object_id(org_id)
    org = organizations_col.find_one({"_id": oid})
    if not org:
        return jsonify({"error": "Organization not found"}), 404
    return jsonify(serialize_org(org)), 200


@organizations_bp.route("/organizations", methods=["POST"])
def create_organization():
    """Create a new organization."""
    data = request.get_json()
    if not data or not data.get("name"):
        return jsonify({"error": "Organization name is required"}), 400

    if organizations_col.find_one({"name": data["name"]}):
        return jsonify({"error": "Organization with this name already exists"}), 409

    now = datetime.now(timezone.utc)
    org = {
        "name": data["name"],
        "description": data.get("description", ""),
        "created_at": now,
        "updated_at": now,
    }
    result = organizations_col.insert_one(org)
    org["_id"] = result.inserted_id
    return jsonify(serialize_org(org)), 201


@organizations_bp.route("/organizations/<org_id>", methods=["PUT"])
def update_organization(org_id):
    """Update an organization."""
    oid = safe_object_id(org_id)
    data = request.get_json()
    if not data:
        return jsonify({"error": "Request body is required"}), 400

    update_fields = {"updated_at": datetime.now(timezone.utc)}
    if "name" in data:
        update_fields["name"] = data["name"]
    if "description" in data:
        update_fields["description"] = data["description"]

    result = organizations_col.update_one({"_id": oid}, {"$set": update_fields})
    if result.matched_count == 0:
        return jsonify({"error": "Organization not found"}), 404

    org = organizations_col.find_one({"_id": oid})
    return jsonify(serialize_org(org)), 200


@organizations_bp.route("/organizations/<org_id>", methods=["DELETE"])
def delete_organization(org_id):
    """Delete an organization."""
    oid = safe_object_id(org_id)
    result = organizations_col.delete_one({"_id": oid})
    if result.deleted_count == 0:
        return jsonify({"error": "Organization not found"}), 404
    return jsonify({"message": "Organization deleted"}), 200
