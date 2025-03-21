# Vote Application

A full-stack web application built with React (Vite) frontend and FastAPI backend.

## Project Structure

- `frontend/` - React application built with Vite
- `backend/` - FastAPI application
- `backend/requirements.txt` - Python dependencies
- `backend/environment.yml` - Conda environment configuration

## Setup Instructions

### Frontend
1. Navigate to frontend directory
2. Install dependencies: `npm install`
3. Start development server: `npm run dev`

### Backend
1. Create conda environment: `conda env create -f environment.yml`
2. Activate environment: `conda activate vote_backend`
3. Start server: `fastapi dev main.py`

### Database
MySQL database configuration:
- Host: localhost
- Port: 3306
- Username: root
- Password: 123456
- Database: vote_db