import {
  AdminBookRowSchema,
  AdminBookSchema,
  AdminOrderSchema,
  AdminStatsSchema,
  AdminTemplateSchema,
  type AdminBook,
  type AdminBookRow,
  type AdminLogin,
  type AdminOrder,
  type AdminStats,
  type AdminTemplate,
  type OrderStatus,
  type UpdateTemplate,
} from "@fabulka/shared";
import { request } from "./api";

const json = (method: string, body: unknown): RequestInit => ({ method, body: JSON.stringify(body) });

export const adminLogin = (login: AdminLogin) => request("/api/admin/login", json("POST", login));
export const adminLogout = () => request("/api/admin/logout", { method: "POST" });
export const adminMe = () => request("/api/admin/me");

export async function adminStats(): Promise<AdminStats> {
  return AdminStatsSchema.parse(await request("/api/admin/stats"));
}

export const setPaused = (paused: boolean) => request("/api/admin/pause", json("POST", { paused }));

export async function adminBooks(status?: string): Promise<AdminBookRow[]> {
  const query = status ? `?status=${encodeURIComponent(status)}` : "";
  return AdminBookRowSchema.array().parse(await request(`/api/admin/books${query}`));
}

export async function adminBook(id: string): Promise<AdminBook> {
  return AdminBookSchema.parse(await request(`/api/admin/books/${id}`));
}

export const deleteBook = (id: string) => request(`/api/admin/books/${id}`, { method: "DELETE" });

export async function adminOrders(): Promise<AdminOrder[]> {
  return AdminOrderSchema.array().parse(await request("/api/admin/orders"));
}

export async function setOrderStatus(id: string, status: OrderStatus): Promise<AdminOrder> {
  return AdminOrderSchema.parse(await request(`/api/admin/orders/${id}`, json("PATCH", { status })));
}

export async function adminTemplates(): Promise<AdminTemplate[]> {
  return AdminTemplateSchema.array().parse(await request("/api/admin/templates"));
}

export async function adminTemplate(slug: string): Promise<AdminTemplate> {
  return AdminTemplateSchema.parse(await request(`/api/admin/templates/${slug}`));
}

export async function updateTemplate(slug: string, patch: UpdateTemplate): Promise<AdminTemplate> {
  return AdminTemplateSchema.parse(await request(`/api/admin/templates/${slug}`, json("PATCH", patch)));
}
