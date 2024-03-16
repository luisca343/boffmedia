import { Book, Page } from "@/components/ui/book";

export default function Pasaporte(){
  let page  = 0;
    return(
      <section className="bg-yellow-200 flex">
          <Book >
            <Page className="bg-blue-600 flex  flex-col">
              <div className="text-center text-2xl mt-4">PASAPORTE</div>
              <div className="flex flex-col justify-center items-center w-full h-full">
                <img className="h-0 flex-1" src="/smartrotom/img/logo.webp" alt="description" />
              </div>
              <div className="mb-4 text-center text-xl">Región de Teras</div>
            </Page>
            <Page>Page 1</Page>
            <Page>Page 2</Page>
            <Page>Page 3</Page>
            <Page>Page 4</Page>
            <Page>Page 5</Page>
            <Page>Page 6</Page>
            <Page className="bg-blue-600">Page 7</Page>
          </Book>
      </section>
    )
}