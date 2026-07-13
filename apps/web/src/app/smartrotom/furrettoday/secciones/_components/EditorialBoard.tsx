"use client";

import { useEditorialBoard } from "../../_hooks/queries";
import { Avatar, Meta, SectionHeader, Stat } from "../../_components/ui";

const TONES = ["cyan", "lime", "pink", "yellow"] as const;

/**
 * "El Consejo Editorial" — the masthead the API derives from (author,
 * authorRole) pairs on published news. Every existing row today has a null
 * author, so this renders nothing rather than a cast of invented editors.
 */
export function EditorialBoard() {
  const { data: board } = useEditorialBoard();

  if (!board || board.length === 0) return null;

  return (
    <section className="mx-auto max-w-[1400px] px-6 py-12">
      <div className="mb-6">
        <SectionHeader
          eyebrow="QUIÉNES DIBUJAN ESTO"
          title="El Consejo Editorial"
          number="03"
        />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {board.map((member, i) => (
          <div
            key={`${member.author}-${member.authorRole ?? ""}`}
            className="border-ft rounded-ft border-ft-ink bg-white p-4 flex items-center gap-3.5"
          >
            <Avatar name={member.author} size={64} />
            <div className="min-w-0 flex-1">
              <div className="font-ft-display truncate text-[22px] leading-none">
                {member.author}
              </div>
              {member.authorRole ? (
                <Meta className="mt-1 block">{member.authorRole}</Meta>
              ) : null}
            </div>
            <Stat
              label="Artículos"
              value={member.articles}
              tone={TONES[i % TONES.length]}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
