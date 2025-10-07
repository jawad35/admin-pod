import { useQuery } from "@tanstack/react-query";

export function useAuth() {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/auth/user"],
    queryFn: async () => {
      const res = await fetch("/api/auth/user", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error("Unauthorized");
      return res.json();
    },
    enabled: !!token, // only run if token exists
    retry: false,
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
  };
}
