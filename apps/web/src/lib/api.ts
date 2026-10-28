import { BookSchema, type Book, type ChildProfile } from "@wishbook/shared";

const CLIENT_KEY = "wishbook.clientKey";

/** Anonymous visitor id the free generation limit is counted against. */
function clientKey(): string {
  try {
    let key = localStorage.getItem(CLIENT_KEY);
    if (!key) {
      key = crypto.randomUUID();
      localStorage.setItem(CLIENT_KEY, key);
    }
    return key;
  } catch {
    return "anonymous";
  }
}

async function request(path: string, init?: RequestInit): Promise<unknown> {
  const response = await fetch(path, {
    ...init,
    headers: { "content-type": "application/json", "x-client-key": clientKey(), ...init?.headers },
  });
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const message = (body as { message?: string } | null)?.message ?? response.statusText;
    throw new Error(message);
  }
  return body;
}

export async function createBook(child: ChildProfile): Promise<Book> {
  return BookSchema.parse(await request("/api/books", { method: "POST", body: JSON.stringify({ child }) }));
}

export async function getBook(id: string): Promise<Book> {
  return BookSchema.parse(await request(`/api/books/${id}`));
}
