// Validation rules and messages copied from the existing system
// (lib/validations/index.ts and lib/user-management/schemas.ts) so the real API can replace the mock without changing the UI.
export type Role = "admin" | "user";
export const ASSIGNABLE_ROLES: Role[] = ["user", "admin"];
export const ROLE_LABEL: Record<Role, string> = { admin: "Admin", user: "User" };

export const DEACTIVATED_MESSAGE = "Your account has been deactivated. Please contact your administrator.";
export const LAST_ADMIN_MESSAGE = "At least one active administrator must remain";
export const INVALID_LOGIN_MESSAGE = "Invalid login credentials";
export const DUPLICATE_EMAIL_MESSAGE = "A user with this email already exists";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export type Errors<T extends string> = Partial<Record<T, string>>;

export const emailError = (v: string) => (EMAIL.test(v.trim()) ? undefined : "Invalid email address");
/** Login, self-registration and password reset: at least 6 characters. */
export const basicPasswordError = (v: string) => (v.length >= 6 ? undefined : "Password must be at least 6 characters");
/** Admin-created accounts: 8-72 characters, a letter and a number. */
export function strongPasswordError(v: string) {
  if (v.length < 8) return "Password must be at least 8 characters";
  if (v.length > 72) return "Password must be at most 72 characters";
  if (!/[A-Za-z]/.test(v)) return "Password must contain a letter";
  if (!/[0-9]/.test(v)) return "Password must contain a number";
  return undefined;
}
export const nameError = (v: string) => (v.trim().length >= 2 ? undefined : "Full name must be at least 2 characters");

export function validateLogin(f: { email: string; password: string }): Errors<"email" | "password"> {
  return { email: emailError(f.email), password: basicPasswordError(f.password) };
}
export function validateRegister(f: { full_name: string; email: string; password: string }): Errors<"full_name" | "email" | "password"> {
  return { full_name: nameError(f.full_name), email: emailError(f.email), password: basicPasswordError(f.password) };
}
export function validateReset(f: { password: string; confirmPassword: string }): Errors<"password" | "confirmPassword"> {
  return { password: basicPasswordError(f.password), confirmPassword: f.password === f.confirmPassword ? undefined : "Passwords don't match" };
}
export function validateCreateUser(f: { full_name: string; email: string; mode: "password" | "invite"; password: string }): Errors<"full_name" | "email" | "password"> {
  return { full_name: nameError(f.full_name), email: emailError(f.email), password: f.mode === "password" ? strongPasswordError(f.password) : undefined };
}
export const hasErrors = (e: Record<string, string | undefined>) => Object.values(e).some(Boolean);
export const firstError = (e: Record<string, string | undefined>) => Object.values(e).find(Boolean);
export const initials = (name: string | null | undefined, email?: string | null) =>
  ((name || email || "?").split(/[\s@.]+/).filter(Boolean).slice(0, 2).map((x) => x[0]).join("") || "?").toUpperCase();
