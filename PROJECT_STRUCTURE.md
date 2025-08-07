# Multi-Vendor Backend - Project Structure

## 📁 Directory Structure

```
multi-vender-backend/
├── prisma/
│   ├── index.js                    # Prisma client configuration
│   ├── schema.prisma              # Database schema
│   └── migrations/                # Database migration files
├── src/
│   ├── config/
│   │   └── aws.js                 # AWS S3 configuration
│   ├── constants/
│   │   └── validation.js          # Validation patterns and messages
│   ├── controller/
│   │   ├── customerController.js  # Customer registration logic
│   │   ├── guestController.js     # Guest user creation
│   │   ├── sendOtpController.js   # OTP send/verify logic
│   │   └── vendorController.js    # Vendor registration and management
│   ├── middleware/
│   │   └── uploadMiddleware.js    # File upload middleware
│   ├── routes/
│   │   ├── authRoutes.js          # Authentication routes
│   │   ├── customerRoutes.js      # Customer-specific routes
│   │   └── vendorRoutes.js        # Vendor-specific routes
│   ├── services/
│   │   ├── otpService.js          # MSG91 OTP service
│   │   └── s3Service.js           # AWS S3 file upload service
│   └── utils/
│       └── validation.js          # Validation utility functions
├── index.js                       # Main application entry point
├── package.json                   # Dependencies and scripts
└── .env                          # Environment variables
```

## 🎯 Architecture Principles

### **1. Separation of Concerns**

- **Controllers**: Handle HTTP requests/responses and business logic
- **Services**: External API integrations (AWS S3, MSG91)
- **Utils**: Reusable utility functions
- **Middleware**: Request processing and validation
- **Constants**: Centralized configuration values

### **2. File Organization**

- **Config**: Environment-specific configurations
- **Constants**: Static values and patterns
- **Controllers**: Route handlers grouped by feature
- **Routes**: Express route definitions
- **Services**: Third-party service integrations

### **3. Code Quality**

- ✅ Consistent error handling
- ✅ Centralized validation
- ✅ Clean imports/exports
- ✅ Minimal logging
- ✅ No unnecessary comments

## 🔧 Key Features

### **Authentication Flow**

```
Guest → Customer → Vendor Pending → Vendor Live
```

### **File Upload**

- AWS S3 integration for vendor photos
- Multer middleware for file handling
- Automatic cleanup on errors

### **Validation**

- Centralized validation patterns
- Consistent error messages
- Input sanitization

## 🚀 Environment Setup

Required environment variables:

```env
DATABASE_URL="postgresql://..."
MSG91_AUTH_KEY="your_key"
MSG91_TEMPLATE_ID="your_template"
AWS_ACCESS_KEY_ID="your_key"
AWS_SECRET_ACCESS_KEY="your_secret"
AWS_REGION="us-east-1"
AWS_S3_BUCKET_NAME="your_bucket"
PORT=3000
```

## 📋 API Endpoints

### Authentication

- `POST /api/auth/guest` - Create guest user
- `POST /api/auth/register/customer` - Register customer
- `POST /api/auth/register/vendor` - Register vendor
- `POST /api/auth/update-role` - Upgrade customer to vendor
- `POST /api/auth/vendor/update` - Update vendor details (with file upload)

### OTP Management

- `POST /api/auth/send-otp` - Send OTP via SMS
- `POST /api/auth/verify-otp` - Verify OTP

### Status

- `GET /api/auth/status/:id` - Get user status
- `GET /health` - Health check

## 🛠️ Development Commands

```bash
# Install dependencies
npm install

# Run database migration
npx prisma migrate dev

# Start development server
npm start

# Generate Prisma client
npx prisma generate
```
