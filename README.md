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

## API Endpoints

### Data Export API

The application supports exporting data in different formats:

#### GET `/vote/export`

Parameters:
- `activity_id` (int): ID of the activity to export data from
- `export_type` (string): Type of data to export
  - `vote_records`: Export vote records
  - `statistics`: Export statistical data
  - `candidates`: Export candidate information
- `format` (string): Export file format
  - `excel`: Export as Excel (.xlsx)
  - `csv`: Export as CSV
  - `pdf`: Export as PDF
- `college_id` (string, optional): Filter by college ID
- `start_date` (string, optional): Filter by start date (YYYY-MM-DD)
- `end_date` (string, optional): Filter by end date (YYYY-MM-DD)

Example:
```
GET /vote/export?activity_id=1&export_type=vote_records&format=excel
```

This will download an Excel file with vote records for activity ID 1.