# StudentWallet

StudentWallet is a comprehensive financial management system designed specifically for university students. It helps students track their spending, manage budgets, and monitor their maintenance loan instalments.

## Features

- **Secure Authentication**
    - OAuth 2.0 integration
    - Google sign-in support
    - Secure password management

- **Bank Integration**
    - Connect bank accounts via Plaid API
    - Automatic transaction tracking
    - Real-time balance updates

- **Budget Management**
    - Create and track multiple budgets
    - Categorise expenses
    - Real-time spending analytics
    - Automated budget alerts

- **Transaction Tracking**
    - Transaction categorisation
    - Manual transaction entry
    - Transaction history
    - Spending pattern analysis

- **Student Loan Management**
    - Track maintenance loan instalments
    - Link transactions to loan spending
    - Visual spending breakdowns
    - Countdown to next instalment

## Project Structure

### Backend
```
backend/
├── src/
│   ├── config/           # Configuration files
│   ├── controllers/      # Request handlers
│   ├── middleware/       # Custom middleware
│   ├── models/          # Database models
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   ├── utils/           # Helper functions
│   └── app.js           # Main application file
└── tests/               # Test files
```

### Frontend
```
frontend/
├── public/
└── src/
    ├── components/      # React components
    ├── styles/         # CSS modules
    ├── utils/          # Helper functions
    └── App.js          # Main React component
```

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Docker and Docker Compose
- Firebase account
- Plaid developer account

## Environment Variables

Create a `.env` file in the project root with the following variables:

```env
# Firebase Configuration
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY=your_private_key
FIREBASE_CLIENT_EMAIL=your_client_email

# Plaid Configuration
PLAID_CLIENT_ID=your_plaid_client_id
PLAID_SECRET=your_plaid_secret
PLAID_ENV=sandbox

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Frontend Environment Variables
REACT_APP_FIREBASE_API_KEY=your_firebase_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_auth_domain
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_storage_bucket
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
```

## Installation

1. Clone the repository:
```bash
git clone https://gitlab-se.eeecs.qub.ac.uk/CSC3032-2425/CSC3032-2425-TEAM15
cd CSC3032-2425-TEAM15
```

2. Install dependencies:
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

3. Start the development environment:
```bash
# From the project root
docker-compose up
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend: http://localhost:3001
- API Documentation: http://localhost:3001/api-docs

## Adding New Features

### Backend
1. Create the Model if needed in `src/models/`
2. Create the Service in `src/services/`
3. Create the Controller in `src/controllers/`
4. Create the Routes in `src/routes/`
5. Update `app.js` to include the new routes

### Frontend
1. Create new React components in `src/components/`
2. Add corresponding styles in `src/styles/`
3. Update routes in `App.js` if needed

## Testing

```bash
# Run backend tests
cd backend
npm test

# Run frontend tests
cd frontend
npm test
```

## API Documentation

The API documentation is available at `/api-docs` when running the development server. It uses Swagger UI for interactive exploration of the API endpoints.

