import { Injectable } from '@nestjs/common';

export interface User {     // 👈 make sure it's exported
  username: string;
  password: string;
}

@Injectable()
export class AuthService {
  private users: User[] = [];

  signup(username: string, password: string): User {
    const user: User = { username, password };
    this.users.push(user);
    return user;
  }

  login(username: string, password: string): User | null {
    return this.users.find(
      (u) => u.username === username && u.password === password,
    ) || null;
  }
}
