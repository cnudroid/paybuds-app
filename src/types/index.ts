// User types
export interface User {
  id: string;
  email: string;
  name: string;
  image?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Group types
export interface Group {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  members: GroupMember[];
  expenses: Expense[];
}

export interface GroupMember {
  id: string;
  userId: string;
  groupId: string;
  role: 'ADMIN' | 'MEMBER';
  joinedAt: Date;
  user: User;
}

// Expense types
export interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: Date;
  groupId: string;
  paidById: string;
  createdAt: Date;
  updatedAt: Date;
  splits: ExpenseSplit[];
  paidBy: User;
  group: Group;
  receiptUrl?: string;
}

export interface ExpenseSplit {
  id: string;
  expenseId: string;
  userId: string;
  amount: number;
  percentage?: number;
  shares?: number;
  user: User;
}

// Settlement types
export interface Settlement {
  id: string;
  fromUserId: string;
  toUserId: string;
  groupId: string;
  amount: number;
  description?: string;
  settledAt: Date;
  confirmedAt?: Date;
  fromUser: User;
  toUser: User;
  group: Group;
}

// Balance types
export interface Balance {
  userId: string;
  groupId: string;
  amount: number; // positive = owed money, negative = owes money
  user: User;
}

export interface UserBalance {
  withUserId: string;
  amount: number;
  withUser: User;
}

// Settlement suggestion types
export interface SettlementSuggestion {
  fromUserId: string;
  toUserId: string;
  amount: number;
  fromUser: User;
  toUser: User;
}

// Split types
export type SplitType = 'EQUAL' | 'EXACT' | 'PERCENTAGE' | 'SHARES';

export interface SplitInput {
  userId: string;
  amount?: number;
  percentage?: number;
  shares?: number;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Form types
export interface CreateGroupForm {
  name: string;
  description?: string;
  memberEmails: string[];
}

export interface CreateExpenseForm {
  description: string;
  amount: number;
  groupId: string;
  splitType: SplitType;
  splits: SplitInput[];
  date: Date;
  category: string;
  receiptUrl?: string;
}

// Navigation types
export type NavItem = {
  title: string;
  href: string;
  disabled?: boolean;
};

export type MainNavItem = NavItem;

export type SidebarNavItem = {
  title: string;
  disabled?: boolean;
  external?: boolean;
  icon?: string; // Using string for now, will map to icons later
} & (
  | {
      href: string;
      items?: never;
    }
  | {
      href?: string;
      items: NavItem[];
    }
);

export type DashboardConfig = {
  mainNav: MainNavItem[];
  sidebarNav: SidebarNavItem[];
};

export interface SettleUpForm {
  amount: number;
  description?: string;
}

// Categories
export const EXPENSE_CATEGORIES = [
  'Food & Dining',
  'Transportation',
  'Entertainment',
  'Utilities',
  'Groceries',
  'Travel',
  'Shopping',
  'Healthcare',
  'Education',
  'Other'
] as const;

export type ExpenseCategory = typeof EXPENSE_CATEGORIES[number];
