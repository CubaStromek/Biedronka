import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { electronBridge, isElectron } from "./electronBridge";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";

export const getQueryFn: <TData>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<TData> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // V Electron použít bridge
    if (isElectron()) {
      const key = queryKey[0] as string;

      if (key === '/api/uploads') {
        // Pokud je druhý parametr, je to uploadId pro produkty
        if (queryKey.length > 1 && queryKey[1]) {
          return electronBridge.getProductsByUpload(queryKey[1] as string) as never;
        }
        return electronBridge.getAllUploads() as never;
      }

      if (key === '/api/price-history') {
        return electronBridge.getPriceHistory() as never;
      }

      // Pro produkty konkrétního uploadu
      if (key.startsWith('/api/uploads/') && key.endsWith('/products')) {
        const uploadId = key.split('/')[3];
        return electronBridge.getProductsByUpload(uploadId) as never;
      }
    }

    // Fallback pro web verzi
    const res = await fetch(queryKey.join("/") as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null as never;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
