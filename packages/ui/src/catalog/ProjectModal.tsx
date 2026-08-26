"use client";

import { useEffect, useState } from "react";

import type { Translate } from "../i18n";
import { Icon, type IconName } from "../primitives/icon";
import { Modal } from "../primitives/modal";
import { Spinner } from "../primitives/spinner";
import { CatalogIcon } from "./CatalogIcon";
import { ProjectDescription } from "./ProjectDescription";
import { getCatalog } from "./client";
import { toSummaryText } from "./descriptionText";
import { projectUrl } from "./projectUrl";
import type { ModPlatform, ModProject } from "./types";

// The project page, in the launcher. Opened from a content row, so the player
// can read what a mod is and what it needs WITHOUT leaving for a browser — the
// question "why is this jar in my pack" is asked while looking at the pack.
//
// Deliberately read-only: no add, no version list. This is reached from content
// the pack already has, where those actions belong to the row behind it.

function Stat({ icon, children }: { icon: IconName; children: React.ReactNode }) {
  return (
    <span className="flex items-center gap-1 font-mono text-[11px] text-txt-muted">
      <Icon name={icon} size={12} />
      {children}
    </span>
  );
}

export function ProjectModal({
  t,
  platform,
  projectId,
  fallbackName,
  onClose,
}: {
  t: Translate;
  platform: ModPlatform;
  projectId: string;
  /** Shown while the fetch is in flight, so the modal has a title from the
   *  first frame instead of popping one in. The row already knows the name. */
  fallbackName?: string;
  onClose: () => void;
}) {
  const [project, setProject] = useState<ModProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let live = true;
    setLoading(true);
    setFailed(false);
    void getCatalog()
      .project(platform, projectId)
      .then((res) => {
        if (!live) return;
        setProject(res);
        // A null result is a miss, not an error, but it looks identical to the
        // player — both mean "no description to show".
        setFailed(!res);
      })
      .catch(() => {
        if (live) setFailed(true);
      })
      .finally(() => {
        if (live) setLoading(false);
      });
    return () => {
      live = false;
    };
  }, [platform, projectId]);

  const link = projectUrl(platform, projectId);
  const title = project?.name ?? fallbackName ?? projectId;

  return (
    <Modal open onClose={onClose} title={title} size="lg">
      <div className="flex max-h-[70vh] flex-col gap-3 overflow-y-auto bm-scroll">
        <div className="flex items-start gap-3">
          <CatalogIcon src={project?.iconUrl} size={56} />
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            {project?.summary && (
              <p className="font-body text-[12px] text-txt-dim">
                {toSummaryText(project.summary)}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-3">
              {project?.author && <Stat icon="user">{project.author}</Stat>}
              {typeof project?.downloads === "number" && (
                <Stat icon="download">
                  {project.downloads.toLocaleString()}
                </Stat>
              )}
              {link && (
                <a
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 font-mono text-[11px] text-accent-bright underline underline-offset-2 hover:text-txt"
                >
                  <Icon name="external" size={12} />
                  {t("openOnPlatform")}
                </a>
              )}
            </div>
          </div>
        </div>

        {loading && (
          <div className="flex items-center gap-2 py-6 text-txt-muted">
            <Spinner size={14} /> {t("loading")}
          </div>
        )}

        {/* Only after loading: showing "no description" while the fetch is
            still running says something false. */}
        {!loading && (failed || !project?.description?.trim()) && (
          <p className="py-4 font-body text-[12px] text-txt-muted">
            {t("noDescription")}
          </p>
        )}

        {!loading && project?.description && (
          <ProjectDescription markup={project.description} />
        )}
      </div>
    </Modal>
  );
}
