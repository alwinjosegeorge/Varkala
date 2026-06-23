export interface CategoryItem {
  id: string;
  name: string;
  emoji: string;
  color: string;
}

export type SplitMode = "equal" | "selected" | "custom" | "percentage";

export interface Split {
  memberId: string;
  amount: number; // resolved owed amount
}

export interface Attachment {
  id: string;
  name: string;
  url: string; // base64 or object URL
  type: string; // e.g. "image/png"
}

export interface Expense {
  id: string;
  name: string;
  amount: number;
  paidBy: string;
  category: string; // Dynamic category ID or name
  date: string; // ISO
  notes?: string;
  splitMode: SplitMode;
  splits: Split[];
  fromFund?: boolean;
  tags?: string[];
  attachments?: Attachment[];
  locationId?: string; // linked trip location
}

export interface Member {
  id: string;
  name: string;
  emoji: string;
  color: string;
}

export interface Borrowing {
  id: string;
  from: string; // lender
  to: string;   // borrower
  amount: number;
  note?: string;
  date: string;
  settled?: boolean;
}

export interface FundContribution {
  id: string;
  memberId: string;
  amount: number;
  date: string;
}

export interface TripLocation {
  id: string;
  name: string;
  description: string;
  visited: boolean;
  emoji: string;
  coverPhoto?: string; // base64 image data or URL
  notes?: string;
  timeSpent?: string;
  expectedTime?: string;
  locationLink?: string;
}

export interface SettlementDone {
  id: string;
  from: string;
  to: string;
  amount: number;
  date: string;
}

export interface Trip {
  id: string;
  name: string;
  coverImage?: string; // base64 or URL
  themeColor?: string; // hex color code e.g. #D6FF3F
  description?: string;
  startDate?: string;
  endDate?: string;
  members: Member[];
  expenses: Expense[];
  borrowings: Borrowing[];
  fund: FundContribution[];
  fundSpends: Expense[];
  settlements: SettlementDone[];
  locations: TripLocation[];
  categories: CategoryItem[];
}

