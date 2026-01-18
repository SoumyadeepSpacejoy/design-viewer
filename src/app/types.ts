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
