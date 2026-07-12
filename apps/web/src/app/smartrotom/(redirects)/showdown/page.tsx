import WebExterna from "@/components/smartrotom/WebExterna";
import { env } from "@/config/env.public";

export default function Showdown() {
    return <WebExterna url={env.NEXT_PUBLIC_SHOWDOWN_URL} />
}
