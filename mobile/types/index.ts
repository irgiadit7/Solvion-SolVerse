// Update Post type untuk menambahkan imageAspectRatio
export interface Post {
  _id: string;
  user: {
    _id: string;
    username: string;
    firstName: string;
    lastName: string;
    profilePicture: string;
  };
  content: string;
  image?: string;
  imageAspectRatio?: number | null; // Tambahkan field ini
  likes: string[];
  comments: Comment[];
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  _id: string;
  user: {
    _id: string;
    username: string;
    firstName: string;
    lastName: string;
    profilePicture: string;
  };
  content: string;
  post: string;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  _id: string;
  clerkId: string;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  profilePicture: string;
  bio?: string;
  followers: string[];
  following: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  _id: string;
  from: User;
  to: string;
  type: "like" | "comment" | "follow";
  post?: string;
  read: boolean;
  createdAt: string;
  updatedAt: string;
}