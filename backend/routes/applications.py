from datetime import datetime, timezone
from flask import Blueprint, request, jsonify
from database import (
    applications_col,
    workflows_col,
    organizations_col,
    components_col,
)
from routes.helpers import safe_object_id, serialize_doc

applications_bp = Blueprint("applications", __name__)


def serialize_application(app):
    """Serialize an application document for API response."""
    out = serialize_doc(app)
    out["organization_id"] = str(out["organization_id"])
    out["workflow_id"] = str(out["workflow_id"])
    out["history"] = [
        {
            **entry,
            "component_id": str(entry["component_id"]),
            "timestamp": entry["timestamp"].isoformat()
            if isinstance(entry["timestamp"], datetime)
            else entry["timestamp"],
        }
        for entry in out.get("history", [])
    ]
    return out


def get_step_name(workflow, step_order):
    """Return the component name for a given step order in a workflow."""
    for step in workflow.get("steps", []):
        if step["order"] == step_order:
            comp = components_col.find_one({"_id": step["component_id"]})
            return comp["name"] if comp else "Unknown"
    return "Unknown"


@applications_bp.route("/applications", methods=["GET"])
def get_applications():
    """List applications with optional filters."""
    org_id = request.args.get("organization_id")
    workflow_id = request.args.get("workflow_id")
    status = request.args.get("status")

    query = {}
    if org_id:
        query["organization_id"] = safe_object_id(org_id)
    if workflow_id:
        query["workflow_id"] = safe_object_id(workflow_id)
    if status:
        query["status"] = status

    apps = list(applications_col.find(query))
    return jsonify([serialize_application(a) for a in apps]), 200


@applications_bp.route("/applications/<app_id>", methods=["GET"])
def get_application(app_id):
    """Get a single application with enriched step details."""
    oid = safe_object_id(app_id)
    app = applications_col.find_one({"_id": oid})
    if not app:
        return jsonify({"error": "Application not found"}), 404

    result = serialize_application(app)

    wf = workflows_col.find_one({"_id": app["workflow_id"]})
    if wf:
        enriched_steps = []
        for step in wf.get("steps", []):
            comp = components_col.find_one({"_id": step["component_id"]})
            enriched_steps.append({
                "order": step["order"],
                "component_id": str(step["component_id"]),
                "component_name": comp["name"] if comp else "Unknown",
            })
        result["workflow_steps"] = enriched_steps

    return jsonify(result), 200


@applications_bp.route("/applications", methods=["POST"])
def create_application():
    """Create a new application for an organization + workflow."""
    data = request.get_json()
    if not data:
        return jsonify({"error": "Request body is required"}), 400

    required = ["name", "organization_id", "workflow_id"]
    for field in required:
        if field not in data:
            return jsonify({"error": f"'{field}' is required"}), 400

    org_oid = safe_object_id(data["organization_id"])
    wf_oid = safe_object_id(data["workflow_id"])

    org = organizations_col.find_one({"_id": org_oid})
    if not org:
        return jsonify({"error": "Organization not found"}), 404

    wf = workflows_col.find_one({"_id": wf_oid})
    if not wf:
        return jsonify({"error": "Workflow not found"}), 404

    if wf["organization_id"] != org_oid:
        return jsonify({"error": "Workflow does not belong to this organization"}), 400

    now = datetime.now(timezone.utc)
    application = {
        "name": data["name"],
        "organization_id": org_oid,
        "workflow_id": wf_oid,
        "current_step": 1,
        "status": "in_progress",
        "history": [],
        "created_at": now,
        "updated_at": now,
    }

    result = applications_col.insert_one(application)
    application["_id"] = result.inserted_id
    return jsonify(serialize_application(application)), 201


@applications_bp.route("/applications/<app_id>/advance", methods=["POST"])
def advance_application(app_id):
    """Advance an application to the next workflow step."""
    oid = safe_object_id(app_id)
    app = applications_col.find_one({"_id": oid})
    if not app:
        return jsonify({"error": "Application not found"}), 404

    if app["status"] == "completed":
        return jsonify({"error": "Application is already completed"}), 400

    wf = workflows_col.find_one({"_id": app["workflow_id"]})
    if not wf:
        return jsonify({"error": "Associated workflow not found"}), 404

    current_step = app["current_step"]
    total_steps = len(wf.get("steps", []))
    step_name = get_step_name(wf, current_step)

    now = datetime.now(timezone.utc)
    data = request.get_json() or {}

    history_entry = {
        "step": current_step,
        "step_name": step_name,
        "component_id": wf["steps"][current_step - 1]["component_id"],
        "action": "completed",
        "notes": data.get("notes", ""),
        "timestamp": now,
    }

    if current_step >= total_steps:
        applications_col.update_one(
            {"_id": oid},
            {
                "$set": {
                    "status": "completed",
                    "updated_at": now,
                },
                "$push": {"history": history_entry},
            },
        )
    else:
        applications_col.update_one(
            {"_id": oid},
            {
                "$set": {
                    "current_step": current_step + 1,
                    "updated_at": now,
                },
                "$push": {"history": history_entry},
            },
        )

    app = applications_col.find_one({"_id": oid})
    return jsonify(serialize_application(app)), 200


@applications_bp.route("/applications/<app_id>/history", methods=["GET"])
def get_application_history(app_id):
    """Get the history of an application."""
    oid = safe_object_id(app_id)
    app = applications_col.find_one({"_id": oid})
    if not app:
        return jsonify({"error": "Application not found"}), 404

    result = serialize_application(app)
    return jsonify(result.get("history", [])), 200
