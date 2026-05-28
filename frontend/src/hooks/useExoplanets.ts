import { useState, useEffect } from "react";
import { exoplanetService } from "../services/api";
import type { Exoplanet, PaginatedResponse } from "../types";

interface UseExoplanetsOptions {
  page?: number;
  filter?: string;
}

interface UseExoplanetsReturn {
  data: PaginatedResponse<Exoplanet> | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useExoplanets = ({
  page = 1,
  filter,
}: UseExoplanetsOptions = {}): UseExoplanetsReturn => {
  const [data, setData] = useState<PaginatedResponse<Exoplanet> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await exoplanetService.getAll(page, filter);
      setData(result);
    } catch (e) {
      setError("Error cargando exoplanetas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch();
  }, [page, filter]);

  return { data, loading, error, refetch: fetch };
};
