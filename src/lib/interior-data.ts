export interface InteriorPhoto {
  id: string;
  src: string;
}

export const DEFAULT_INTERIOR: Record<"center" | "hippodrome", InteriorPhoto[]> = {
  center: [
    {
      id: "c-i-1",
      src: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=900&h=700&q=80",
    },
    {
      id: "c-i-2",
      src: "https://images.unsplash.com/photo-1493857671505-72967e2e2760?auto=format&fit=crop&w=900&h=700&q=80",
    },
    {
      id: "c-i-3",
      src: "https://images.unsplash.com/photo-1521017432531-fbd92d768814?auto=format&fit=crop&w=900&h=700&q=80",
    },
    {
      id: "c-i-4",
      src: "https://images.unsplash.com/photo-1559305616-3f99cd43e353?auto=format&fit=crop&w=900&h=700&q=80",
    },
  ],
  hippodrome: [
    {
      id: "h-i-1",
      src: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&h=700&q=80",
    },
    {
      id: "h-i-2",
      src: "https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=900&h=700&q=80",
    },
    {
      id: "h-i-3",
      src: "https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?auto=format&fit=crop&w=900&h=700&q=80",
    },
    {
      id: "h-i-4",
      src: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=900&h=700&q=80",
    },
  ],
};
