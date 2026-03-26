"""
Seed script to populate the database with baseline components,
sample organizations, and sample workflows.
"""
from bson import ObjectId
from database import components_col, organizations_col, workflows_col, init_db


BASELINE_COMPONENTS = [
    {"name": "Application Review", "description": "Review the initial application submitted by the client."},
    {"name": "Document Review", "description": "Review all required documentation for compliance."},
    {"name": "Pre-Audit", "description": "Preliminary audit to assess readiness for the main audit."},
    {"name": "Stage 1 Audit", "description": "Stage 1 audit to review the management system documentation."},
    {"name": "Stage 2 Audit", "description": "Stage 2 audit to evaluate implementation and effectiveness."},
    {"name": "Audit", "description": "Conduct the full certification audit on-site."},
    {"name": "Technical Review", "description": "Technical committee reviews audit findings and evidence."},
    {"name": "Certification Decision", "description": "Final decision on granting or denying certification."},
    {"name": "Surveillance Audit", "description": "Periodic audit to ensure continued compliance."},
    {"name": "Recertification Audit", "description": "Full audit for renewing an existing certification."},
]

SAMPLE_ORGANIZATIONS = [
    {"name": "Org A - SimpleCert", "description": "A certification body with a simple 3-step workflow."},
    {"name": "Org B - ThoroughCert", "description": "A certification body with a detailed 5-step workflow."},
]


def seed():
    """Seed the database with baseline data."""
    init_db()

    # Clear existing data
    components_col.delete_many({})
    organizations_col.delete_many({})
    workflows_col.delete_many({})

    print("Seeding baseline components...")
    comp_ids = {}
    for comp in BASELINE_COMPONENTS:
        result = components_col.insert_one(comp)
        comp_ids[comp["name"]] = result.inserted_id
        print(f"  ✓ {comp['name']}")

    print("\nSeeding sample organizations...")
    org_ids = {}
    for org in SAMPLE_ORGANIZATIONS:
        result = organizations_col.insert_one(org)
        org_ids[org["name"]] = result.inserted_id
        print(f"  ✓ {org['name']}")

    print("\nSeeding sample workflows...")

    # Org A: Application Review → Audit → Certification Decision
    workflow_a = {
        "name": "Simple ISO Certification",
        "organization_id": org_ids["Org A - SimpleCert"],
        "steps": [
            {"component_id": comp_ids["Application Review"], "order": 1},
            {"component_id": comp_ids["Audit"], "order": 2},
            {"component_id": comp_ids["Certification Decision"], "order": 3},
        ],
    }
    workflows_col.insert_one(workflow_a)
    print("  ✓ Org A: Application Review → Audit → Certification Decision")

    # Org B: Application Review → Pre-Audit → Audit → Technical Review → Decision
    workflow_b = {
        "name": "Detailed ISO Certification",
        "organization_id": org_ids["Org B - ThoroughCert"],
        "steps": [
            {"component_id": comp_ids["Application Review"], "order": 1},
            {"component_id": comp_ids["Pre-Audit"], "order": 2},
            {"component_id": comp_ids["Audit"], "order": 3},
            {"component_id": comp_ids["Technical Review"], "order": 4},
            {"component_id": comp_ids["Certification Decision"], "order": 5},
        ],
    }
    workflows_col.insert_one(workflow_b)
    print("  ✓ Org B: Application Review → Pre-Audit → Audit → Technical Review → Decision")

    print("\n✅ Seeding complete!")


if __name__ == "__main__":
    seed()
