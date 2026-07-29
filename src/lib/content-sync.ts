export function debounce<T extends (...args: never[]) => void>(
  fn: T,
  ms: number,
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

export async function fetchContent<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(path, { cache: "no-store" });
    const json = (await res.json()) as { ok: boolean; data?: T };
    if (!res.ok || !json.ok || !json.data) return null;
    return json.data;
  } catch {
    return null;
  }
}

export async function saveContent<T>(
  path: string,
  data: T,
): Promise<{ ok: boolean; data?: T }> {
  try {
    const res = await fetch(path, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const json = (await res.json()) as { ok: boolean; data?: T };
    return { ok: res.ok && json.ok, data: json.data };
  } catch {
    return { ok: false };
  }
}
