# ISO Workflow System (Multi-Organization)

A full-stack system that allows multiple ISO Certification Bodies (CBs) to define, configure, and manage their own certification workflows.

## 🏗️ Architecture & Approach

### Core Design Decisions

#### 1. Baseline Components (Reusable Building Blocks)
The system provides a **global pool of workflow components** — atomic steps that any organization can use:

| Component | Description |
|---|---|
| Application Review | Review the initial application |
| Document Review | Review compliance documentation |
| Pre-Audit | Preliminary readiness assessment |
| Stage 1 Audit | Management system documentation review |
| Stage 2 Audit | Implementation & effectiveness evaluation |
| Audit | Full certification audit |
| Technical Review | Technical committee review of findings |
| Certification Decision | Final certification decision |
| Surveillance Audit | Periodic compliance audit |
| Recertification Audit | Renewal audit |

Organizations can also **create custom components** specific to their process.

#### 2. Configurable Workflows
Each organization builds its workflow by **selecting and ordering components**:

- **Org A:** `Application Review → Audit → Certification Decision` (3 steps)
- **Org B:** `Application Review → Pre-Audit → Audit → Technical Review → Decision` (5 steps)

A workflow is simply an **ordered array of component references**, making it fully flexible.

#### 3. Application Stage Tracking
Each application tracks its position via `current_step` (1-based):
- `current_step = 1` = first step, `2` = second step, etc.
- This works regardless of how many steps the org's workflow has
- A full **history log** records every transition with timestamps
- Applications can only move **forward** (step-by-step enforcement)

#### 4. Scalability Design
- **Multi-tenancy**: All queries are scoped by `organization_id`
- **MongoDB indexes** on `organization_id` and `workflow_id` for fast lookups
- **Shared component pool**: Components are global; orgs compose from them
- **Stateless API**: Flask app is stateless, can scale horizontally
- **Audit trail**: Full history on every application for compliance

### Data Model

```
Organizations ─┐
                ├──→ Workflows (ordered steps referencing Components)
Components ─────┘         │
                          ▼
                    Applications (tracks current_step + history)
```

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python 3.12, Flask 3.1, PyMongo 4.11 |
| Database | MongoDB 7 |
| Frontend | React 19, TypeScript 5.7, Vite 6, Tailwind CSS 4 |
| HTTP Client | Axios |
| Infrastructure | Docker, Docker Compose |

## 📁 Project Structure

```
├── backend/
│   ├── app.py                  # Flask app factory + error handlers + request logging
│   ├── config.py               # Environment configuration
│   ├── database.py             # MongoDB connection, collections & indexes
│   ├── seed.py                 # Seed script for baseline data
│   ├── requirements.txt        # Python dependencies
│   ├── Dockerfile              # Backend container image
│   ├── .env                    # Environment variables
│   └── routes/
│       ├── helpers.py          # Shared utilities (safe_object_id, serialize_doc)
│       ├── components.py       # Component CRUD endpoints
│       ├── organizations.py    # Organization CRUD endpoints
│       ├── workflows.py        # Workflow CRUD endpoints
│       └── applications.py     # Application lifecycle endpoints
│
├── frontend/
│   ├── src/
│   │   ├── App.tsx             # Main app with tab navigation
│   │   ├── main.tsx            # React entry point
│   │   ├── index.css           # Tailwind CSS imports & custom theme
│   │   ├── api/
│   │   │   └── index.ts        # Typed Axios API client
│   │   ├── types/
│   │   │   └── index.ts        # TypeScript interfaces & status constants
│   │   ├── utils/
│   │   │   └── storage.ts      # localStorage helpers
│   │   ├── features/
│   │   │   ├── components/
│   │   │   │   ├── ComponentsPanel.tsx
│   │   │   │   └── componentsReducer.ts
│   │   │   ├── workflows/
│   │   │   │   ├── WorkflowBuilder.tsx
│   │   │   │   └── workflowReducer.ts
│   │   │   └── applications/
│   │   │       ├── ApplicationTracker.tsx
│   │   │       └── applicationReducer.ts
│   │   └── components/ui/
│   │       ├── OrgSelect.tsx
│   │       └── CreateOrgModal.tsx
│   ├── index.html
│   ├── vite.config.js
│   ├── tsconfig.json
│   ├── Dockerfile
│   └── package.json
│
├── docker-compose.yml
├── .gitignore
└── README.md
```

## 🚀 Getting Started

### Option 1: Docker (Recommended — One Command)

**Prerequisites:** Docker & Docker Compose installed.

```bash
docker compose up --build
```

That's it! This will:
1. Start **MongoDB** (port 27017)
2. Start the **Flask backend** (port 5007) — auto-seeds baseline data on first run
3. Start the **React frontend** (port 3007)

Open **http://localhost:3007** in your browser.

To stop everything:
```bash
docker compose down
```

To reset the database:
```bash
docker compose down -v   # removes the mongo volume
docker compose up --build
```

### Option 2: Manual Setup

#### Prerequisites
- Python 3.10+
- Node.js 18+
- MongoDB running locally (default: `mongodb://localhost:27017`)

#### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate    # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Seed the database with baseline data
python seed.py

# Start the server
python app.py
```

The API will be available at `http://localhost:5007`.

#### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

The frontend will be available at `http://localhost:3007` and proxies `/api` calls to the backend.

## 📡 API Endpoints

### Components
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/components` | List all components |
| `GET` | `/api/components/:id` | Get a component |
| `POST` | `/api/components` | Create a component |
| `PUT` | `/api/components/:id` | Update a component |
| `DELETE` | `/api/components/:id` | Delete a component |

### Organizations
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/organizations` | List all organizations |
| `GET` | `/api/organizations/:id` | Get an organization |
| `POST` | `/api/organizations` | Create an organization |
| `PUT` | `/api/organizations/:id` | Update an organization |
| `DELETE` | `/api/organizations/:id` | Delete an organization |

### Workflows
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/workflows?organization_id=<id>` | List workflows (optionally filter by org) |
| `GET` | `/api/workflows/:id` | Get a workflow |
| `POST` | `/api/workflows` | Create a workflow |
| `PUT` | `/api/workflows/:id` | Update a workflow |
| `DELETE` | `/api/workflows/:id` | Delete a workflow |

### Applications
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/applications?organization_id=<id>` | List applications |
| `GET` | `/api/applications/:id` | Get application with enriched step details |
| `POST` | `/api/applications` | Create an application |
| `POST` | `/api/applications/:id/advance` | Advance to next step |
| `GET` | `/api/applications/:id/history` | Get transition history |

## 🔮 Future Enhancements

- **Role-based access control** (Admin, Auditor, Reviewer)
- **Parallel/conditional steps** (branching workflows)
- **Step-level validations** (required documents, approvals)
- **Notifications** on step transitions
- **Dashboard analytics** per organization
- **Workflow versioning** (update workflows without breaking active applications)
