"use client";

import { useEffect, useState } from "react";

import type { FtCategory } from "../../_utils/article";
import { Button, ComicBurst, Field, Input, Modal, Textarea } from "../../_components/ui";

export interface NewArticleValues {
  title: string;
  subtitle: string;
  author: string;
  authorRole: string;
  category: string;
  subcategory: string;
  buttonText: string;
  imageUrl: string;
}

const EMPTY: NewArticleValues = {
  title: "",
  subtitle: "",
  author: "",
  authorRole: "",
  category: "",
  subcategory: "",
  buttonText: "Leer más",
  imageUrl: "",
};

/** The draft-creation form. The body is filled in afterwards, in the editor. */
export function NewArticleModal({
  open,
  onClose,
  onCreate,
  categories,
  isSubmitting = false,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (values: NewArticleValues) => void;
  categories: FtCategory[];
  isSubmitting?: boolean;
}) {
  const [values, setValues] = useState<NewArticleValues>(EMPTY);

  // The component itself never unmounts (Modal just renders null while
  // closed), so the form has to be reset explicitly on every open.
  useEffect(() => {
    if (open) setValues(EMPTY);
  }, [open]);

  function set<K extends keyof NewArticleValues>(key: K, value: NewArticleValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!values.title.trim()) return;
    onCreate(values);
  }

  return (
    <Modal open={open} onClose={onClose} label="Nueva noticia">
      <form onSubmit={handleSubmit} className="relative overflow-hidden p-6">
        <div className="font-ft-ui text-[11px] font-extrabold uppercase tracking-[0.18em] text-ft-pink">
          NUEVA NOTICIA
        </div>
        <h3 className="font-ft-display mt-1 text-4xl leading-none">Empieza un borrador</h3>
        <p className="mb-4 mt-1.5 text-ft-body">
          Crea el borrador y rellena el cuerpo después en el editor. Puedes despublicarlo cuando
          quieras.
        </p>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Título" full>
            <Input
              required
              value={values.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="P. ej. La dinastía Furret"
            />
          </Field>
          <Field label="Entradilla" full>
            <Textarea
              rows={2}
              value={values.subtitle}
              onChange={(e) => set("subtitle", e.target.value)}
              placeholder="Una frase: qué cuentas."
            />
          </Field>
          <Field label="Autor/a">
            <Input
              value={values.author}
              onChange={(e) => set("author", e.target.value)}
              placeholder="Tu nombre o alias"
            />
          </Field>
          <Field label="Rol">
            <Input
              value={values.authorRole}
              onChange={(e) => set("authorRole", e.target.value)}
              placeholder="Editor/a"
            />
          </Field>
          <Field label="Sección">
            <Input
              list="ft-new-article-categories"
              value={values.category}
              onChange={(e) => set("category", e.target.value)}
              placeholder="Comunidad, Torneos…"
            />
            <datalist id="ft-new-article-categories">
              {categories.map((c) => (
                <option key={c.id} value={c.label} />
              ))}
            </datalist>
          </Field>
          <Field label="Subsección">
            <Input
              value={values.subcategory}
              onChange={(e) => set("subcategory", e.target.value)}
              placeholder="Opcional"
            />
          </Field>
          <Field label="Texto del botón">
            <Input value={values.buttonText} onChange={(e) => set("buttonText", e.target.value)} />
          </Field>
          <Field label="URL imagen">
            <Input
              value={values.imageUrl}
              onChange={(e) => set("imageUrl", e.target.value)}
              placeholder="https://…"
            />
          </Field>
        </div>

        <div className="mt-5 flex justify-end gap-2.5">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="lg"
            disabled={isSubmitting || !values.title.trim()}
          >
            {isSubmitting ? "Creando…" : "Crear borrador"}
          </Button>
        </div>

        <ComicBurst
          size={130}
          text="NEW!"
          className="pointer-events-none absolute -right-8 -top-8 rotate-12"
        />
      </form>
    </Modal>
  );
}
