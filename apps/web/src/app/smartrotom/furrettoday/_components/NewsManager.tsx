import React, { useState } from "react";
import { Input } from "@/components/ui/primitives/input";
import { DocumentsService } from "@/services/api/smartrotom/documentsService";
import { CreateNewsDto, News } from "@boffmedia/shared";
import { sendToast } from "@/lib/toast";
import { useBoffSession } from "@/services/useBoffSession";

interface NewsManagerProps {
  initialNews?: CreateNewsDto;
  onClose?: () => void;
  onSaved?: (news: News) => void;
}

function Field({ label, full, children }: { label: string; full?: boolean; children: React.ReactNode }) {
  return (
    <label style={{ display: "block", gridColumn: full ? "1 / -1" : "auto" }}>
      <span className="ft-eyebrow" style={{ display: "block", marginBottom: 6, color: "var(--ft-pink)" }}>{label}</span>
      {children}
    </label>
  )
}

const NewsManager: React.FC<NewsManagerProps> = ({ initialNews, onClose, onSaved }) => {
  const { session } = useBoffSession();
  const [isSaving, setIsSaving] = useState(false);
  const [news, setNews] = useState<CreateNewsDto>(
    initialNews || {
      id: Date.now(),
      title: "",
      subtitle: "",
      content: "",
      buttonText: "Leer más",
      imageUrl: "",
      author: "",
      category: "comunidad",
    } as CreateNewsDto & { author?: string; category?: string }
  );

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setNews({ ...news, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const token = session?.user?.accessToken ?? '';
    const saveRequest = initialNews
      ? DocumentsService.updateNews(news.id, news, token)
      : DocumentsService.createNews(news, token);

    saveRequest
      .then((response) => {
        if (!response?.data) {
          throw new Error('No se pudo guardar la noticia');
        }
        sendToast(initialNews ? 'Noticia actualizada' : 'Noticia creada');
        onSaved?.(response.data);
        onClose?.();
      })
      .catch((error) => {
        sendToast(error instanceof Error ? error.message : 'Error al guardar la noticia');
      })
      .finally(() => setIsSaving(false));
  };

  return (
    <form onSubmit={handleSubmit} style={{ padding: 24, position: "relative", overflow: "hidden" }}>
      <div className="ft-eyebrow" style={{ color: "var(--ft-pink)" }}>NUEVA NOTICIA</div>
      <h3 className="ft-display" style={{ margin: "4px 0 6px", fontSize: 38, lineHeight: 0.95 }}>
        {initialNews ? "Editar noticia" : "Empieza un borrador"}
      </h3>
      <p className="ft-body" style={{ margin: "0 0 18px" }}>
        Crea el borrador y rellena el cuerpo después en el editor.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Título" full>
          <Input
            name="title"
            value={news.title}
            onChange={handleChange}
            placeholder="P. ej. La dinastía Furret"
            required
            className="ft-input"
            style={{ borderRadius: 14, width: "100%" }}
          />
        </Field>
        <Field label="Entradilla" full>
          <textarea
            name="subtitle"
            value={news.subtitle}
            onChange={handleChange}
            placeholder="Una frase: qué cuentas."
            rows={2}
            className="ft-input"
            style={{ borderRadius: 14, width: "100%", resize: "vertical", fontFamily: "var(--ft-font-ui)", fontSize: 15, padding: "12px 16px", border: "var(--ft-border)", background: "#fff" }}
          />
        </Field>
        <Field label="Texto del botón">
          <Input
            name="buttonText"
            value={news.buttonText}
            onChange={handleChange}
            placeholder="Leer más"
            className="ft-input"
            style={{ borderRadius: 14, width: "100%" }}
          />
        </Field>
        <Field label="URL imagen">
          <Input
            name="imageUrl"
            value={news.imageUrl}
            onChange={handleChange}
            placeholder="https://…"
            className="ft-input"
            style={{ borderRadius: 14, width: "100%" }}
          />
        </Field>
        <Field label="Autor/a">
          <Input
            name="author"
            value={(news as any).author || ""}
            onChange={handleChange}
            placeholder="Tu nombre o alias"
            className="ft-input"
            style={{ borderRadius: 14, width: "100%" }}
          />
        </Field>
        <Field label="Etiqueta">
          <select
            name="category"
            value={(news as any).category || "comunidad"}
            onChange={(e) => setNews({ ...news, category: e.target.value } as any)}
            className="ft-input"
            style={{ borderRadius: 14, width: "100%", fontFamily: "var(--ft-font-ui)", fontSize: 15, padding: "12px 16px", border: "var(--ft-border)", background: "#fff" }}
          >
            <option value="comunidad">Comunidad</option>
            <option value="meta">Meta · Competitivo</option>
            <option value="torneos">Torneos</option>
            <option value="filtraciones">Filtraciones</option>
            <option value="fanart">Fan Art</option>
            <option value="guias">Guías</option>
            <option value="entrevistas">Entrevistas</option>
          </select>
        </Field>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 18 }}>
        <button type="button" className="ft-btn is-ghost" onClick={onClose}>Cancelar</button>
        <button type="submit" className="ft-btn is-primary is-lg" disabled={isSaving}>
          {isSaving ? 'Guardando...' : initialNews ? 'Guardar cambios' : 'Crear borrador'}
        </button>
      </div>

      {/* Decorative burst */}
      <div aria-hidden="true" style={{ position: "absolute", top: -30, right: -30, transform: "rotate(12deg)", background: "var(--ft-yellow)", width: 120, height: 120, borderRadius: 999, display: "flex", alignItems: "center", justifyContent: "center", border: "var(--ft-border)", opacity: 0.3 }}>
        <span className="ft-display" style={{ fontSize: 22, color: "var(--ft-ink)" }}>NEW!</span>
      </div>
    </form>
  );
};

export default NewsManager;
