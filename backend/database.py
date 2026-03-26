from pymongo import MongoClient
from config import Config

client = MongoClient(Config.MONGO_URI)
db = client[Config.DB_NAME]

# Collections
organizations_col = db["organizations"]
components_col = db["components"]
workflows_col = db["workflows"]
applications_col = db["applications"]


def init_db():
    """Create indexes for better query performance."""
    organizations_col.create_index("name", unique=True)
    components_col.create_index("name", unique=True)
    workflows_col.create_index("organization_id")
    applications_col.create_index("organization_id")
    applications_col.create_index("workflow_id")
