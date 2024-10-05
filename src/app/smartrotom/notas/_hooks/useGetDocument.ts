import { rotomGET } from "@/services/boffAPI";
import { useEffect, useState } from "react";

export function useGetDocument(id: string) {
  const [data, setData] = useState<Document>();

  useEffect(() => {
    rotomGET(`/documents/${id}`)
    .then((res) => {
      setData(res);
      //rewrite url
    });
    
  }, [id]);

    return { data, setData };
}