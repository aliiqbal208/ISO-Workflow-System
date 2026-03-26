from datetime import datetime, timezone
from flask import Blueprint, request, jsonify
from database import workflows_col, components_col, organizations_col
from routes.helpers import safe_object_id, serialize_doc

workflows_bp = Blueprint("workflows", __name__)


def serialize_workflow(wf):
    """Serialize a workflow document for API response."""
    out = serialize_doc(wf)
    out["organization_id"] = str(out["organization_id"])
    out["steps"] = [
        {**step, "component_id": str(step["component_id"])}
        for step in out.get("steps", [])
    ]
    return out


@workflows_bp.route("/workflows", methods=["GET"])
def get_workflows():
    """List all workflows, optionally filtered by organization_id."""
    org_id = request.args.get("organization_id")
    query = {}
    if org_id:
        query["organization_id"] = safe_object_id(org_id)
    workflows = list(workflows_col.find(query))
    return jsonify([serialize_workflow(w) for w in workflows]), 200


@workflows_bp.route("/workflows/<workflow_id>", methods=["GET"])
def get_workflow(workflow_id):
    """Get a single workflow by ID."""
    oid = safe_object_id(workflow_id)
    wf = workflows_col.find_one({"_id": oid})
    if not wf:
        return jsonify({"error": "Workflow not found"}), 404
    return jsonify(serialize_workflow(wf)), 200


@workflows_bp.route("/workflows", methods=["POST"])
def create_workflow():
    """Create a workflow for an organization."""
    data = request.get_json()
    if not data:
        return jsonify({"error": "Request body is required"}), 400

    required = ["name", "organization_id", "steps"]
    for field in required:
        if field not in data:
            return jsonify({"error": f"'{field}' is required"}), 400

    org_oid = safe_object_id(data["organization_id"])
    org = organizations_col.find_one({"_id": org_oid})
    if not org:
        return jsonify({"error": "Organization not found"}), 404

    steps = data["steps"]
    if not isinstance(steps, list) or len(steps) == 0:
        return jsonify({"error": "At least one step is required"}), 400

    for step in steps:
        if "component_id" not in step or "order" not in step:
            return jsonify({"error": "Each step must have 'component_id' and 'order'"}), 400
        comp_oid = safe_object_id(step["component_id"])
        comp = components_col.find_one({"_id": comp_oid})
        if not comp:
            return jsonify({"error": f"Component '{step['component_id']}' not found"}), 404

    steps.sort(key=lambda s: s["order"])

    now = datetime.now(timezone.utc)
    workflow = {
        "name": data["name"],
        "organization_id": org_oid,
        "steps": [
            {"component_id": safe_object_id(s["component_id"]), "order": s["order"]}
            for s in steps
        ],
        "created_at": now,
        "updated_at": now,
    }

    result = workflows_col.insert_one(workflow)
    workflow["_id"] = result.inserted_id
    return jsonify(serialize_workflow(workflow)), 201


@workflows_bp.route("/workflows/<workflow_id>", methods=["PUT"])
def update_workflow(workflow_id):
    """Update a workflow's name or steps."""
    oid = safe_object_id(workflow_id)
    data = request.get_json()
    if not data:
        return jsonify({"error": "Request body is required"}), 400

    wf = workflows_col.find_one({"_id": oid})
    if not wf:
        return jsonify({"error": "Workflow not found"}), 404

    update_fields = {"updated_at": datetime.now(timezone.utc)}
    if "name" in data:
        update_fields["name"] = data["name"]

    if "steps" in data:
        steps = data["steps"]
        if not isinstance(steps, list) or len(steps) == 0:
            return jsonify({"error": "At least one step is required"}), 400

        for step in steps:
            if "component_id" not in step or "order" not in step:
                return jsonify({"error": "Each step must have 'component_id' and 'order'"}), 400
            comp_oid = safe_object_id(step["component_id"])
            comp = components_col.find_one({"_id": comp_oid})
            if not comp:
                return jsonify({"error": f"Component '{step['component_id']}' not found"}), 404

        steps.sort(key=lambda s: s["order"])
        update_fields["steps"] = [
            {"component_id": safe_object_id(s["component_id"]), "order": s["order"]}
            for s in steps
        ]

    workflows_col.update_one({"_id": oid}, {"$set": update_fields})
    wf = workflows_col.find_one({"_id": oid})
    return jsonify(serialize_workflow(wf)), 200


@workflows_bp.route("/workflows/<workflow_id>", methods=["DELETE"])
def delete_workflow(workflow_id):
    """Delete a workflow."""
    oid = safe_object_id(workflow_id)
    result = workflows_col.delete_one({"_id": oid})
    if result.deleted_count == 0:
        return jsonify({"error": "Workflow not found"}), 404
    return jsonify({"message": "Workflow deleted"}), 200
