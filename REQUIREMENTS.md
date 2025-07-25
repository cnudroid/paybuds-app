# Splitwise-like Expense Splitting App - Requirements

## Project Overview
A web-based expense splitting application similar to Splitwise, featuring Google authentication and advanced debt simplification algorithms.

## Core Features

### 1. User Management
- **Google OAuth 2.0 Authentication**: Sign up/sign in with Google accounts
- **User Profiles**: Name, email, profile picture from Google
- **Account Settings**: User preferences and profile management

### 2. Group Management
- **Create Groups**: Expense groups (e.g., "Roommates", "Trip to Vegas", "Dinner Club")
- **Member Management**: Add/remove members, invite via email
- **Group Settings**: Descriptions, member permissions
- **Leave Group**: Users can leave groups they're part of

### 3. Expense Management
- **Add Expenses**: Description, amount, date, category, receipt upload
- **Split Types**:
  - Equal split among all members
  - Exact amounts per person
  - Percentage-based splits
  - Share-based splits
- **Expense Operations**: Edit/delete with proper permissions
- **Receipt Management**: Image upload and storage

### 4. Balance Tracking
- **Real-time Calculations**: Automatic balance updates
- **Balance Views**:
  - "You owe" summary
  - "You are owed" summary
  - Group balance overview
  - Individual balances with each person

### 5. Settlement System
- **Debt Simplification**: Minimize number of transactions using optimization algorithms
- **Settlement Options**:
  - Optimized payment suggestions
  - Manual payment recording
  - Partial settlements
  - Settlement confirmation system
- **Settlement History**: Track all past payments and settlements

## Technical Requirements

### Frontend Stack
- **Framework**: Next.js 14+ with TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **State Management**: Zustand or React Context
- **Real-time Updates**: WebSocket or Server-Sent Events

### Backend Stack
- **Runtime**: Node.js with Next.js API routes
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js with Google provider
- **File Storage**: AWS S3 or Cloudinary for receipts
- **Real-time**: WebSocket support for live updates

### Database Schema
- **Users**: Profile data, authentication info
- **Groups**: Group details, member relationships
- **Expenses**: Expense records with split information
- **Settlements**: Payment records and confirmations
- **Activity Logs**: Audit trail for all actions

## Settlement Algorithm

### Debt Simplification Logic
```
1. Calculate net balance for each person in group
2. Identify debtors (negative balance) and creditors (positive balance)
3. Match largest debtor with largest creditor
4. Generate minimal transaction set
5. Provide settlement suggestions to users
```

### Settlement Features
- **Optimize Transactions**: Reduce number of payments needed
- **Cross-Group Settlements**: Handle users in multiple groups
- **Payment Reminders**: Automated settlement notifications
- **Confirmation System**: Both parties confirm settlements

## User Interface Requirements

### Responsive Design
- **Mobile-first**: Optimized for mobile devices
- **Progressive Web App**: Offline capabilities
- **Cross-platform**: Desktop, tablet, mobile support

### Key Pages
- **Dashboard**: Overview of groups, recent activity, quick actions
- **Group View**: Expense history, member balances, add expense
- **Settlement Page**: Debt simplification, payment suggestions
- **Profile**: User settings and preferences

## Security & Privacy
- **Data Encryption**: Sensitive data encryption at rest and in transit
- **Input Validation**: Server-side validation for all inputs
- **Session Management**: Secure authentication sessions
- **Privacy Controls**: User data privacy and deletion options

## Additional Features

### Notifications
- **Email Notifications**: New expenses, settlement reminders
- **In-app Notifications**: Real-time activity updates
- **Push Notifications**: Mobile app notifications (future)

### Reporting & Analytics
- **Expense Reports**: By category, date range, group
- **Export Options**: CSV, PDF export functionality
- **Spending Analytics**: Visual charts and insights

### Categories
- **Predefined Categories**: Food, Transport, Entertainment, Utilities, etc.
- **Custom Categories**: User-defined expense categories
- **Category Analytics**: Spending breakdown by category

## MVP Scope (Phase 1)
1. Google authentication and user profiles
2. Create and join groups
3. Add expenses with equal splitting
4. View group and individual balances
5. Basic settlement recording
6. Responsive web interface

## Future Enhancements (Phase 2+)
1. Advanced splitting options (unequal, percentage)
2. Receipt upload and OCR
3. Payment integration (Venmo, PayPal)
4. Mobile app development
5. Advanced analytics and reporting
6. Multi-currency support

## Success Metrics
- User registration and retention rates
- Expense creation and settlement completion rates
- User engagement with debt simplification features
- Mobile vs desktop usage patterns
