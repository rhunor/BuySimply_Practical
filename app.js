// File: app.js
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Import data
const staffsData = require('./data/staffs.json');
const loansData = require('./data/loans.json');

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(morgan('dev'));
app.use(cors());

// Rate limiting middleware
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes'
});
app.use('/api', apiLimiter);

// Global error handler middleware
const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  
  res.status(statusCode).json({
    status: 'error',
    statusCode,
    message
  });
};

// Authentication middleware
const authMiddleware = (req, res, next) => {
  try {
    const token = req.cookies.token || req.headers.authorization?.split(' ')[1];

    if (!token) {
      const error = new Error('Unauthorized - No token provided');
      error.statusCode = 401;
      throw error;
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      error.message = 'Unauthorized - Invalid token';
      error.statusCode = 401;
    }
    next(error);
  }
};

// Role-based authorization middleware
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      const error = new Error('Forbidden - Insufficient permissions');
      error.statusCode = 403;
      return next(error);
    }
    next();
  };
};

// Process loans based on user role (utility function)
const processLoansByRole = (loans, userRole) => {
  return loans.map(loan => {
    const processedLoan = { ...loan };
    
    // Hide totalLoan field for regular staff
    if (userRole === 'staff') {
      processedLoan.applicant = { ...loan.applicant };
      delete processedLoan.applicant.totalLoan;
    }
    
    return processedLoan;
  });
};

// Authentication routes
app.post('/api/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      const error = new Error('Email and password are required');
      error.statusCode = 400;
      throw error;
    }

    const staff = staffsData.find(s => s.email === email);

    if (!staff) {
      const error = new Error('Invalid credentials');
      error.statusCode = 401;
      throw error;
    }

    // password comparison
    const isPasswordValid = password === staff.password;

    if (!isPasswordValid) {
      const error = new Error('Invalid credentials');
      error.statusCode = 401;
      throw error;
    }

    const token = jwt.sign(
      { id: staff.id, name: staff.name, email: staff.email, role: staff.role },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      maxAge: 3600000 // 1 hour
    });

    res.status(200).json({
      status: 'success',
      message: 'Login successful',
      data: {
        user: {
          id: staff.id,
          name: staff.name,
          email: staff.email,
          role: staff.role
        },
        token
      }
    });
  } catch (error) {
    next(error);
  }
});

app.post('/api/logout', (req, res) => {
  res.clearCookie('token');
  res.status(200).json({
    status: 'success',
    message: 'Logout successful'
  });
});

// All loans route with optional status filter
app.get('/api/loans', authMiddleware, (req, res, next) => {
  try {
    const { status } = req.query;
    let filteredLoans = [...loansData];

    // Filter by status if provided
    if (status) {
      filteredLoans = filteredLoans.filter(loan => loan.status === status);
    }

    // Process loans based on user role
    const processedLoans = processLoansByRole(filteredLoans, req.user.role);

    res.status(200).json({
      status: 'success',
      results: processedLoans.length,
      data: {
        loans: processedLoans
      }
    });
  } catch (error) {
    next(error);
  }
});

// Expired loans route
app.get('/api/expired-loans', authMiddleware, (req, res, next) => {
  try {
    const currentDate = new Date();
    
    const expiredLoans = loansData.filter(loan => {
      const maturityDate = new Date(loan.maturityDate);
      return maturityDate < currentDate;
    });

    // Process loans based on user role
    const processedLoans = processLoansByRole(expiredLoans, req.user.role);

    res.status(200).json({
      status: 'success',
      results: processedLoans.length,
      data: {
        loans: processedLoans
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get loans by user email
app.get('/api/user-loans/:userEmail', authMiddleware, (req, res, next) => {
  try {
    const { userEmail } = req.params;
    
    const userLoans = loansData.filter(loan => 
      loan.applicant.email.toLowerCase() === userEmail.toLowerCase()
    );

    // Process loans based on user role
    const processedLoans = processLoansByRole(userLoans, req.user.role);

    res.status(200).json({
      status: 'success',
      results: processedLoans.length,
      data: {
        loans: processedLoans
      }
    });
  } catch (error) {
    next(error);
  }
});

// Delete loan by ID (superAdmin only)
app.delete('/api/loans/:loanId', authMiddleware, authorizeRoles('superAdmin'), (req, res, next) => {
  try {
    const { loanId } = req.params;
    
    
    // check if the loan exists
    const loanExists = loansData.some(loan => loan.id === loanId);
    
    if (!loanExists) {
      const error = new Error('Loan not found');
      error.statusCode = 404;
      throw error;
    }

    res.status(200).json({
      status: 'success',
      message: `Loan with ID ${loanId} has been deleted`
    });
  } catch (error) {
    next(error);
  }
});

// Apply global error handler
app.use(errorHandler);

// 404 route handler
app.use(/(.*)/, (req, res) => {
  res.status(404).json({
    status: 'error',
    message: `Route ${req.originalUrl} not found`
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;