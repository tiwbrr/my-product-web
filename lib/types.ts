export type Role = "user" | "admin";

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
  updatedAt: string;
};

export type GameCategory = {
  id: string;
  name: string;
  icon: string;
  sortOrder: number;
};
