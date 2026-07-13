import { Button, Card, ComicBurst, Eyebrow } from "../ui";

export function SubscribeStrip({ onOpen }: { onOpen: () => void }) {
  return (
    <section className="ft-wrap-wide px-6 py-6">
      <Card
        className="flex flex-wrap items-center justify-between gap-6 px-8 py-7"
        style={{ background: "rgb(var(--ft-yellow))" }}
      >
        <div className="flex items-center gap-[18px]">
          <ComicBurst size={86} color="rgb(var(--ft-pink))" textColor="white" text="NEW!" />
          <div>
            <Eyebrow>NEWSLETTER</Eyebrow>
            <h3 className="font-ft-display mb-1.5 mt-0.5 text-4xl leading-none">
              Furret en tu buzón los viernes
            </h3>
            <p className="font-ft max-w-xl text-base text-ft-body">
              Un email, sin spam: titulares, meta, torneos y un meme. Cancelas cuando quieras.
            </p>
          </div>
        </div>
        <Button variant="primary" size="lg" onClick={onOpen}>
          SUSCRIBIRME
        </Button>
      </Card>
    </section>
  );
}
