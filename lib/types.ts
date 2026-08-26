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
  youtubeQueueEnabled: boolean;
  xoGameEnabled: boolean;
  notificationSoundUrl: string;
  updatedAt: string;
  contactChannels: ContactChannel[];
};

export type XOGameStatus = "waiting" | "playing" | "x_won" | "o_won" | "draw";

export type XOGameRoom = {
  id: string;
  code: string;
  hostUserId: string;
  hostName: string;
  hostMark: "X" | "O";
  boardSize: 3 | 5 | 10;
  roundNumber: number;
  hostWins: number;
  guestWins: number;
  roomDraws: number;
  guestUserId: string | null;
  guestName: string | null;
  board: string;
  turn: "X" | "O";
  status: XOGameStatus;
  rematchHost: boolean;
  rematchGuest: boolean;
  updatedAt: string;
};

export type XOLobbyRoom = {
  id: string;
  code: string;
  hostUserId: string;
  hostName: string;
  guestUserId: string | null;
  guestName: string | null;
  boardSize: 3 | 5 | 10;
  status: XOGameStatus;
  createdAt: string;
};

export type XOPlayerStats = {
  userId: string;
  userName: string;
  wins: number;
  losses: number;
  draws: number;
};

export type YouTubeQueueItem = {
  id: string;
  videoId: string;
  createdAt: string;
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
