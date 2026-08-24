export type Role = "user" | "manager" | "admin";

export type User = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  createdAt: string;
};

export type SafeUser = Omit<User, "passwordHash">;

export type Session = {
  tokenHash: string;
  userId: string;
  expiresAt: string;
};

export type PasswordResetToken = {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: string;
};

export type AccountGender = "male" | "female" | "unspecified";

export type Product = {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  stock: number;
  accountGender: AccountGender;
  images: string[];
  featured: boolean;
  createdAt: string;
  updatedAt: string;
};

export type StoreSettings = {
  lineQrImage: string;
  facebookUrl: string;
  youtubePlaylistUrl: string;
  notificationSoundUrl: string;
  updatedAt: string;
  contactChannels: ContactChannel[];
};

export type ContactChannel = {
  id: string;
  name: string;
  description: string;
  url: string;
  iconImage: string;
  qrImage: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type ChatMessage = {
  id: string;
  userId: string;
  userName: string;
  message: string;
  createdAt: string;
};

export type PushSubscriptionRecord = {
  endpoint: string;
  userId: string;
  expirationTime: number | null;
  keys: {
    p256dh: string;
    auth: string;
  };
};

export type GameCategory = {
  id: string;
  name: string;
  icon: string;
  sortOrder: number;
};
