import { AuthService } from "../../auth/services/authService.js";
import type { AuthUserView } from "../../auth/types/authTypes.js";

export class UserService {
  private readonly authService: AuthService;

  public constructor() {
    this.authService = new AuthService();
  }

  public createUser(input: {
    name: string;
    email: string;
    password: string;
    isActive?: boolean;
  }): Promise<AuthUserView> {
    return this.authService.createUser(input);
  }

  public listUsers(): Promise<AuthUserView[]> {
    return this.authService.listUsers();
  }

  public getUserById(id: string): Promise<AuthUserView> {
    return this.authService.getUserById(id);
  }

  public updateUser(
    id: string,
    input: {
      name?: string;
      email?: string;
      password?: string;
      isActive?: boolean;
    },
  ): Promise<AuthUserView> {
    return this.authService.updateUser(id, input);
  }

  public deleteUser(id: string): Promise<void> {
    return this.authService.deleteUser(id);
  }

  public countUsers(): Promise<number> {
    return this.authService.countUsers();
  }
}
