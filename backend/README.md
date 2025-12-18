# Candidate Tracking & Resume Matcher Web Application

A web application for managing recruitment data stored in Excel files and matching resumes against job descriptions.

## Features

- **Candidate Management**: View, add, edit, and delete records stored in an Excel file
- **Analytics**: Summary statistics and visualizations for candidate data
- **User Management**: Separate admin login and user management page
- **Resume Matcher**: Upload job description and resumes, get similarity scores (separate backend service)

## Requirements

- Python 3.8+  
- Pip
- Recommended packages:
  - `flask`
  - `flask-cors`
  - `openpyxl`
  - `pypdf`

## Installation

1. Clone this repository.
2. (Optional but recommended) Create and activate a virtual environment.
3. Install Python dependencies, for example:
   ```powershell
   pip install flask flask-cors openpyxl pypdf
   ```

## Running the project (development, Windows/PowerShell)

The project has two backend processes:

- Main app (candidate tracking system, UI, APIs) on port `5000`
- Resume matcher backend on port `5001`

### 1. Set required environment variables

In **every** terminal where you run a backend process, set at least:

```powershell
$env:APP_ENV = "development"
$env:SECRET_KEY = "your-dev-secret"
$env:ADMIN_USERNAME = "your-admin-username"
$env:ADMIN_PASSWORD = "your-admin-password"
```

API base URLs for development:

- Main app runs on the same origin as the browser, so leave the dev API base empty:
  ```powershell
  $env:DEV_API_BASE_URL = ""
  ```
- Resume matcher backend is on `http://localhost:5001`:
  ```powershell
  $env:DEV_RESUME_API_BASE_URL = "http://localhost:5001"
  ```

You can also override Excel and database paths if needed:

- `DEV_EXCEL_FILE`
- `DEV_USER_DB`
- `DEV_DATABASE`

If you do not set these, defaults from `backend/config.py` are used.

### 2. Start the main backend (port 5000)

In a first PowerShell terminal, from the project root:

```powershell
cd c:\Users\ashwi\Downloads\Recuriment-Portal--main\Recuriment-Portal--main

$env:APP_ENV = "development"
$env:SECRET_KEY = "your-dev-secret"
$env:ADMIN_USERNAME = "your-admin-username"
$env:ADMIN_PASSWORD = "your-admin-password"
$env:DEV_API_BASE_URL = ""
$env:DEV_RESUME_API_BASE_URL = "http://localhost:5001"

python backend\app.py
```

This will:

- Start the main Flask app on `http://127.0.0.1:5000`
- Create a sample Excel file on first run if it does not exist (path from config)

### 3. Start the resume matcher backend (port 5001)

In a second PowerShell terminal, from the project root:

```powershell
cd c:\Users\ashwi\Downloads\Recuriment-Portal--main\Recuriment-Portal--main

$env:APP_ENV = "development"
$env:SECRET_KEY = "your-dev-secret"
$env:ADMIN_USERNAME = "your-admin-username"
$env:ADMIN_PASSWORD = "your-admin-password"
$env:DEV_PORT = "5001"
$env:DEV_API_BASE_URL = ""
$env:DEV_RESUME_API_BASE_URL = "http://localhost:5001"

python backend\resume-matcher-backend\resume_matcher_api.py
```

This will start the resume matcher Flask app on `http://127.0.0.1:5001`.

### 4. Open the application in the browser

1. Open the main app:
   - `http://127.0.0.1:5000/`
2. Log in with the admin credentials you set in:
   - `ADMIN_USERNAME`
   - `ADMIN_PASSWORD`
3. Access the resume matcher UI from the main app:
   - `http://127.0.0.1:5000/resume-matcher`

## Running in production (overview)

For production, use `APP_ENV=production` and the `ProductionConfig` class from `backend/config.py`.

At minimum, set these environment variables in your production environment:

- `APP_ENV=production`
- `SECRET_KEY` (strong random string)
- `ADMIN_USERNAME`
- `ADMIN_PASSWORD`
- `PROD_API_BASE_URL` (public base URL of the main app, for example `https://your-domain.com`)
- `PROD_RESUME_API_BASE_URL` (public base URL of the resume matcher backend)
- `API_ALLOWED_ORIGINS` (comma-separated list of allowed frontend origins, for example `https://your-domain.com`)
- `RESUME_CORS_ORIGINS` (comma-separated list of allowed origins for the resume matcher backend)

Optional overrides:

- `PROD_EXCEL_FILE`
- `PROD_USER_DB`
- `PROD_DATABASE`
- `PROD_PORT`

Then run the WSGI application with a production server (for example, gunicorn, waitress, or any other WSGI-capable server) pointing at:

- Main app: `backend.app:app`
- Resume matcher backend: `backend.resume-matcher-backend.resume_matcher_api:app`

## Project Structure (simplified)

- `backend/app.py`: Main Flask backend (candidate management, analytics, authentication, HTML rendering)
- `backend/config.py`: Central configuration (env-based) for paths, API URLs, email, and auth
- `backend/resume-matcher-backend/resume_matcher_api.py`: Resume matcher backend
- `frontend/templates/*.html`: HTML templates for main app, analytics, users
- `frontend/static/js/app.js`: Main frontend logic for candidate management and analytics
- `frontend/front_end/index.html`: Resume matcher frontend
- `frontend/front_end/app.js`: Resume matcher frontend logic
