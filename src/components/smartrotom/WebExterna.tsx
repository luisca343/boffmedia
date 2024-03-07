export default function WebExterna({url}:{url:string}){
    return (
        <iframe src={url} className="w-full h-full"  loading="lazy"></iframe>
    )
}