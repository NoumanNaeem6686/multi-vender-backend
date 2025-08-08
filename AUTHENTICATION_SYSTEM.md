# Role-Based Authentication System

## Overview

This system provides Firebase-based authentication with role-based access control and account linking. All endpoints are role-based, not platform-based.

## User Roles

### 1. USER

- **Access**: Basic user features
- **Authentication**: Firebase (Google sign-in, Phone + OTP)
- **Platform**: Any platform (mobile app, web portal)

### 2. CUSTOMER

- **Access**: Customer features (legacy role)
- **Authentication**: Firebase
- **Platform**: Any platform

### 3. VENDOR_PENDING

- **Access**: No access (awaiting admin approval)
- **Authentication**: Firebase
- **Platform**: No platform access

### 4. VENDOR (Approved)

- **Access**: Vendor features (product management, etc.)
- **Authentication**: Firebase
- **Platform**: Any platform (mobile app, web portal)

### 5. ADMIN

- **Access**: Admin features (vendor approval, category management, etc.)
- **Authentication**: Firebase
- **Platform**: Web portal (role-based UI)

## Authentication Flow

### Login (All Platforms)

```
POST /api/auth/login
- Firebase token in Authorization header
- Automatic account linking by email/phone
- Role-based access validation
```

## Vendor Registration & Approval

### Vendor Registration

```
POST /api/auth/register/vendor
- User must be authenticated with Firebase
- Creates VENDOR_PENDING role
- Requires admin approval
```

### Admin Approval

```
PUT /api/admin/vendors/:id/approve
- Admin-only endpoint
- Changes VENDOR_PENDING → VENDOR
- Changes status PENDING → LIVE
```

## Account Linking Logic

### Email Linking

- When user logs in with Firebase, system checks for existing email
- If found, links Firebase UID to existing account
- Maintains user data and role

### Phone Linking

- When user logs in with phone via Firebase
- System checks for existing mobile number
- Links accounts if phone number matches

## Role-Based Access Control

### User Roles

- `USER`: Mobile app access only
- `CUSTOMER`: Mobile app access (legacy)
- `VENDOR_PENDING`: No platform access (awaiting approval)
- `VENDOR`: Web portal + mobile app access (after approval)
- `ADMIN`: Web portal access only

### Role-Based Access Control

- **USER/CUSTOMER**: Basic user features, any platform
- **VENDOR_PENDING**: No access until approved
- **VENDOR**: Vendor features, any platform (after approval)
- **ADMIN**: Admin features, web portal UI

## API Endpoints

### Authentication

```
POST /api/auth/login
POST /api/auth/guest
POST /api/auth/register/customer
POST /api/auth/register/vendor
GET /api/auth/profile
POST /api/auth/logout
GET /api/auth/status/:id
```

### Vendor Operations

```
POST /api/vendor/products
GET /api/vendor/products
PUT /api/vendor/products/:id
DELETE /api/vendor/products/:id
GET /api/vendor/products/low-stock
POST /api/vendor/update
```

### Admin Operations

```
GET /api/admin/vendors/pending
PUT /api/admin/vendors/:id/approve
POST /api/admin/categories
GET /api/admin/categories
PUT /api/admin/categories/:id
DELETE /api/admin/categories/:id
GET /api/admin/products
PUT /api/admin/products/:id/moderate
```

## Middleware

### Role-Based Authentication

- `requireUser`: Users, customers, and approved vendors
- `requireVendor`: Vendors and admins (approved vendors only)
- `requireAdmin`: Admins only

## Key Features

1. **Firebase Integration**: All authentication handled by Firebase
2. **Account Linking**: Automatic linking by email/phone across platforms
3. **Role-Based Access**: All endpoints are role-based, not platform-based
4. **Approval Workflow**: Admin approval required for vendor access
5. **Flexible Platform Access**: Users can access any platform based on their role
6. **Clean Architecture**: Removed unused code and legacy endpoints

## Security Considerations

- Firebase tokens validated on every request
- Role and status checked in middleware
- Role-based access restrictions
- Account linking prevents duplicate accounts
- Admin approval required for vendor privileges

## Status Flow

```
New User → USER (APPROVED) → Mobile App Access
User → VENDOR_PENDING (PENDING) → Admin Approval → VENDOR (LIVE) → Web Portal + Mobile Access
Admin → ADMIN → Web Portal Access Only
```
