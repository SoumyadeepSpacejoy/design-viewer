export interface DesignImage {
  _id: string;
  path: string;
  cdn: string;
}

export interface DesignIntent {
  primary: string;
  secondary: string | null;
}

export interface UserProfile {
  firstName: string;
  lastName: string;
  name: string;
}

export interface User {
  _id: string;
  profile: UserProfile;
}

export interface Project {
  _id: string;
  user: User;
}

export interface Design {
  _id: string;
  intent: DesignIntent;
  roomType: string;
  designImages: DesignImage[];
  title?: string;
  project?: Project | string;
}

export interface Dimension {
  height: number;
  width: number;
  depth: number;
}

export interface Retailer {
  _id: string;
  name: string;
  whiteLabelName?: string;
}

export interface ProductImage {
  _id: string;
  fileUrl: string;
  cdn: string;
}

export interface Asset {
  _id: string;
  name: string;
  price: number;
  msrp: number;
  retailer: Retailer;
  retailLink: string;
  productImages: ProductImage[];
  dimension: Dimension;
}

export interface DesignDetail extends Design {
  assets: Asset[];
  beforeImage: string;
  cleanRoomImage: string;
  title: string;
  style: string;
  project: string;
}

export interface Notification {
  _id: string;
  topic: string;
  title: string;
  body: string;
  type: string;
  route: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectOrderItem {
  _id: string;
  name: string;
  turnAroundTime: number;
}

export interface ProjectOrder {
  _id: string;
  paymentStatus: string;
  items: ProjectOrderItem[];
}

export interface ProjectPhase {
  name: {
    internalName: string;
    customerName: string;
  };
  _id: string;
  startTime: string;
  owner: string | null;
  endTime: string | null;
}

export interface ProjectDelay {
  isDelayed: boolean;
  minDurationInMs: number;
  maxDurationInMs: number;
  title: string | null;
  message: string | null;
}

export interface ProjectQuizStatus {
  currentState: string;
}

export interface ProjectMeta {
  count: {
    total: number;
  };
}

export interface ProjectRevisionMeta {
  maxRevisionTat: number;
}

export interface Project {
  _id: string;
  quizStatus: ProjectQuizStatus;
  delay: ProjectDelay;
  customerName: string;
  status: string;
  order: ProjectOrder;
  startedAt: string;
  endedAt: string;
  pause: boolean;
  projectSelectionType: string;
  country: string;
  name: string;
  customer: string;
  currentPhase: ProjectPhase;
  createdAt: string;
  revisionMeta: ProjectRevisionMeta;
  currentRevisionDesign: string | null;
  currentRevisionType: string | null;
  meta: ProjectMeta;
}

export interface ProjectSearchResponse {
  projects: Project[];
  count: number;
}

export interface TimeTrackerProject {
  _id: string;
  customerName: string;
  name: string;
}

export interface TimeTrackerOverTime {
  isOverTime: boolean;
  reason: string | null;
}

export interface TimeTracker {
  _id: string;
  overTime: TimeTrackerOverTime;
  totalTimeSpend: number;
  project: TimeTrackerProject;
  maximumTimeSeconds: number;
}

export interface TimeTrackerState {
  _id: string;
  startTime: string;
  endTime: string | null;
  duration: number;
  tag: string;
  note?: string;
}
export interface AdminTimeTracker {
  _id: string;
  overTime: TimeTrackerOverTime;
  hourlyRate: number;
  budget: number;
  earnings: number;
  totalTimeSpend: number;
  project: TimeTrackerProject;
  designer: {
    _id: string;
    profile: UserProfile;
  };
  maximumTimeSeconds: number;
}
