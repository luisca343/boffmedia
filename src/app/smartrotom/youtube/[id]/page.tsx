

export default function Video({params}: {params: {id: string}}){
    return (<iframe width="100%" height="100%" src={`https://www.youtube.com/embed/${params.id}`}  allowFullScreen></iframe>
    )
}