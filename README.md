# Loan Management API

A RESTful API built with Express and Node.js that manages loans and staff authentication using JWT role-based access control.

## Features

- **Authentication**
  - JWT-based authentication system
  - Role-based access control (staff, admin, superAdmin)
  - Login and logout endpoints

- **Loan Management**
  - View all loans with role-based data filtering
  - Filter loans by status (active/pending)
  - Retrieve loans by user email
  - Get expired loans (maturity date in the past)
  - Delete loans (superAdmin only)

- **Security**
  - Rate limiting to prevent abuse
  - Global error handling
  - Protected routes
  - Role-based authorization

## Project Structure

```
loan-management-api/
├── app.js                 # Main application file
├── package.json
├── data/
│   ├── loans.json         # Loan data
│   └── staffs.json        # Staff data
└── README.md
```

## Prerequisites

- Node.js (version 12 or higher)
- npm (Node Package Manager)

## Installation

1. Clone the repository or create a new directory:
   ```bash
   mkdir loan-management-api
   cd loan-management-api
   ```

2. Initialize a new Node.js project:
   ```bash
   npm init -y
   ```

3. Install the required dependencies:
   ```bash
   npm install express jsonwebtoken bcryptjs cookie-parser morgan cors express-rate-limit
   ```

4. Create a data directory and add the JSON files:
   ```bash
   mkdir data
   ```

5. Create the data files:
   - Create `data/staffs.json` with the staff data
   - Create `data/loans.json` with the loan data

6. Create the main application file (app.js) with the application code.

## Running the Application

Start the server:

```bash
node app.js
```

The API will be available at `http://localhost:3000`.

## API Endpoints

### Authentication

| Method | Endpoint     | Description           | Access          |
|--------|-------------|-----------------------|-----------------|
| POST   | /api/login  | Authenticate a user   | Public          |
| POST   | /api/logout | Clear user session    | Authenticated   |

### Loans

| Method | Endpoint                  | Description                     | Access                    |
|--------|---------------------------|---------------------------------|---------------------------|
| GET    | /api/loans                | Get all loans                   | Authenticated             |
| GET    | /api/loans?status=active  | Filter loans by status          | Authenticated             |
| GET    | /api/loans/:userEmail/get | Get loans by user email         | Authenticated             |
| GET    | /api/loans/expired        | Get all expired loans           | Authenticated             |
| DELETE | /api/loan/:loanId/delete  | Delete a loan                   | Authenticated (superAdmin)|

## Testing the API

You can test the API using tools like Postman or curl. Here are some example requests:

### Login

```bash
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email": "edwinjohn@example.com", "password": "12345Pass"}'
```

This will return a token that you'll need for subsequent requests.

### Get All Loans (with token)

```bash
curl -X GET http://localhost:3000/api/loans \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

Replace `YOUR_TOKEN_HERE` with the token received from the login request.

### Filter Loans by Status

```bash
curl -X GET http://localhost:3000/api/loans?status=active \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Get User's Loans

```bash
curl -X GET http://localhost:3000/api/loans/michaelbrown@example.com/get \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Get Expired Loans

```bash
curl -X GET http://localhost:3000/api/loans/expired \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Delete a Loan (superAdmin only)

```bash
curl -X DELETE http://localhost:3000/api/loan/900199/delete \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## User Roles

The API has three user roles with different access levels:

1. **staff** - Can view loans but cannot see the `totalLoan` field
2. **admin** - Can view all loan details including `totalLoan`
3. **superAdmin** - Has all admin privileges plus the ability to delete loans

## Sample API Test

![API Test with cURL](https://github.com/rhunor/BuySimply_Practical/blob/main/loantestCURL.png)

