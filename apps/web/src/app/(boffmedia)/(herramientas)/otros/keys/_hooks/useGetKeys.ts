"use client"
import { apiGET } from "@/services/boffAPI";
import { useCallback, useEffect, useState } from "react";

type useGetKeysReturnType = {
  keys: KeyData[];
  loading: boolean;
  refresh: () => void;
  filter: string;
  setFilter: React.Dispatch<React.SetStateAction<string>>;
  filteredKeys: KeyData[];
};

interface KeyData {
  name: string;
  key: string;
  source: string;
  claimed: string;
  steamID: string;
  imageUrl: string;
}

function useGetKeys(): useGetKeysReturnType {
  const [keys, setKeys] = useState<KeyData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filter, setFilter] = useState<string>("");

  const fetchKeys = useCallback(async () => {
    try {
      const res = (await apiGET("/steamkeys")) as any as KeyData[];
      setKeys(res);
    } catch (error) {
      console.error("Failed to fetch keys:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchKeys();
  }, [fetchKeys]);

  function filterKeys() {
    let filteredKeys = keys.filter((key) => key.name !== "");

    const filterSearch = filteredKeys.filter(
      (key) =>
        key.name.toLowerCase().includes(filter.toLowerCase()) ||
        key.source.toLowerCase().includes(filter.toLowerCase()) ||
        key.claimed.toLowerCase().includes(filter.toLowerCase())
    );

    return filterSearch;
  }

  return {
    keys,
    loading,
    refresh: fetchKeys,
    filter,
    setFilter,
    filteredKeys: filterKeys(),
  };
}


export default useGetKeys;