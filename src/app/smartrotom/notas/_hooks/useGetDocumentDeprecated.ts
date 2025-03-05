import { rotomGET } from "@/services/boffAPI";
import { useEffect, useState } from "react";

export function useGetDocument(id: string) {
  const [data, setData] = useState<Document>();

  useEffect(() => {
    rotomGET(`/documents/${id}`)
    .then((res: any) => {
      setData(res.data);
      //rewrite url
    });
    
  }, [id]);

    return { data, setData };
}