# Blood Donation Match Web Application

A web application that helps hospitals and blood donors coordinate. Donors register and manage their profiles, authorized hospital staff create emergency (SOS) requests, search for potential donors and manage recorded blood stock, and the system sends reminders and produces reports.

> **Note:** Donor matching in this system is *preliminary*. Final donor eligibility and blood compatibility are always decided by qualified clinical staff.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React |
| Backend | Python, FastAPI |
| API docs | Swagger UI (built into FastAPI) |
| Version control | Git and GitHub |

---

## Project Structure

> Adjust the folder names below if your repository differs.

```
blood-donation-match/
├── backend/                # FastAPI application
│   ├── app/
│   │   ├── main.py         # App entry point
│   │   ├── routers/        # API route modules
│   │   ├── models/         # Database models
│   │   ├── schemas/        # Pydantic schemas
│   │   └── core/           # Config, security, settings
│   ├── requirements.txt
│   └── .env.example
├── frontend/               # React application
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── .env.example
└── README.md
```

---

## Prerequisites

Install these before you start:

| Tool | Version | Check with |
|---|---|---|
| Git | any recent | `git --version` |
| Python | 3.10 or newer | `python --version` |
| Node.js | 18 or newer (includes npm) | `node --version` |

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/Amtavi-Brian/Blood-Donation-Match-Web-Application.git
cd Blood-Donation-Match-Web-Application
```

### 2. Set up and run the backend (FastAPI)

Open a terminal in the project root.

```bash
cd backend
```

**Create a virtual environment**

```bash
python -m venv .venv
```

**Activate it**

- Windows (Command Prompt): `.venv\Scripts\activate`
- Windows (PowerShell): `.venv\Scripts\Activate.ps1`
- macOS / Linux: `source .venv/bin/activate`

You should see `(.venv)` at the start of your terminal line.

**Install dependencies**

```bash
pip install -r requirements.txt
```

**Create your environment file**

Copy the example file and fill in the values (ask the team lead for any secrets):

```bash
# macOS / Linux
cp .env.example .env

# Windows
copy .env.example .env
```

**Start the server**

```bash
uvicorn app.main:app --reload
```

The backend is now running at:

- API: http://127.0.0.1:8000
- Interactive API docs (Swagger): http://127.0.0.1:8000/docs
- Alternative docs (ReDoc): http://127.0.0.1:8000/redoc

> If your entry file is not `app/main.py`, change the command to match, for example `uvicorn main:app --reload`.

### 3. Set up and run the frontend (React)

Open a **second terminal** (keep the backend running) in the project root.

```bash
cd frontend
npm install
```

**Create your environment file**

```bash
# macOS / Linux
cp .env.example .env

# Windows
copy .env.example .env
```

**Start the development server**

```bash
npm start
```

If your project uses Vite, use `npm run dev` instead. Check the `scripts` section of `frontend/package.json` to confirm.

The frontend is now running at:

- Create React App: http://localhost:3000
- Vite: http://localhost:5173

---

## Environment Variables

Never commit your real `.env` files. Only `.env.example` files belong in GitHub.

### Backend (`backend/.env`)

| Variable | Description | Example |
|---|---|---|
| `DATABASE_URL` | Database connection string | `sqlite:///./app.db` |
| `SECRET_KEY` | Key used to sign tokens | *(ask the team lead)* |
| `ALLOWED_ORIGINS` | Frontend URLs allowed by CORS | `http://localhost:3000` |

### Frontend (`frontend/.env`)

| Variable | Description | Example |
|---|---|---|
| `REACT_APP_API_URL` | Backend base URL (Create React App) | `http://127.0.0.1:8000` |
| `VITE_API_URL` | Backend base URL (Vite) | `http://127.0.0.1:8000` |

Use only the variable that matches your setup. After changing a frontend `.env` file, restart the dev server.

---

## Running the Whole App

You need **both** servers running at the same time:

| Terminal | Folder | Command |
|---|---|---|
| 1 | `backend/` | `uvicorn app.main:app --reload` |
| 2 | `frontend/` | `npm start` (or `npm run dev`) |

Then open the frontend URL in your browser. The frontend calls the backend at the URL set in its `.env` file.

---

## Team Git Workflow

1. **Always pull before you start working**
   ```bash
   git checkout main
   git pull origin main
   ```
2. **Create your own branch** for each feature
   ```bash
   git checkout -b feature/short-description
   ```
3. **Commit often** with clear messages
   ```bash
   git add .
   git commit -m "Add donor registration form"
   ```
4. **Push your branch**
   ```bash
   git push origin feature/short-description
   ```
5. **Open a Pull Request** on GitHub and ask a teammate to review it before merging into `main`.

Do not push directly to `main`.

### Adding new packages

- Backend: install the package, then update the requirements file
  ```bash
  pip install <package>
  pip freeze > requirements.txt
  ```
- Frontend: `npm install <package>` (this updates `package.json` automatically)

Commit the updated file so everyone gets the same dependencies.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `python` is not recognized | Try `python3`, or reinstall Python and tick "Add to PATH" |
| PowerShell blocks `Activate.ps1` | Run `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`, or use Command Prompt |
| `ModuleNotFoundError` | Activate the virtual environment, then run `pip install -r requirements.txt` again |
| `uvicorn` is not recognized | Activate the virtual environment first |
| Port already in use | Stop the other process, or run `uvicorn app.main:app --reload --port 8001` |
| CORS error in the browser console | Add the frontend URL to `ALLOWED_ORIGINS` in `backend/.env` and restart the backend |
| Frontend cannot reach the API | Check the API URL in `frontend/.env` and confirm the backend is running |
| `npm install` fails | Delete `node_modules` and `package-lock.json`, then run `npm install` again |

---

## Project Documentation

The Software Requirements Specification (SRS), including requirements validation and the requirements traceability matrix, is maintained by the team alongside this code. Ask the team lead for the latest version.

---

## Team

| Name | Role |
|---|---|
| Brian Amtavi | Backend |
| Fiddel Omondi | Intergration/Frontend |
| Mohamed Hassan | Frontend |
| Lisa Wamuyu |Documentation/Database |
| Mohamed Camara | Backend |

Supervisor: Jennifer Gachukia