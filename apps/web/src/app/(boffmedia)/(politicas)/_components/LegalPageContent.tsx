"use client"

import { useTranslations } from "next-intl"
import { LegalDoc, type LegalSection } from "@/components/boffmedia/ui/legal"
import { useFormat } from "@boffmedia/ui/useFormat"

type LegalPage = "cancelaciones" | "cookies" | "devoluciones" | "privacidad" | "reembolsos" | "terminos"

function useCancelacionesSections(t: ReturnType<typeof useTranslations>): LegalSection[] {
  return [
    {
      id: "proceso-cancelacion",
      title: t("sections.process.title"),
      body: [t("sections.process.body1")],
    },
    {
      id: "condiciones",
      title: t("sections.conditions.title"),
      body: [
        [
          t("sections.conditions.item1"),
          t("sections.conditions.item2"),
          t("sections.conditions.item3"),
          t("sections.conditions.item4"),
        ],
        t("sections.conditions.fee"),
      ],
    },
    {
      id: "mas-informacion",
      title: t("sections.moreInfo.title"),
      body: [t("sections.moreInfo.body1")],
    },
  ]
}

function useCookiesSections(t: ReturnType<typeof useTranslations>): LegalSection[] {
  return [
    {
      id: "introduccion",
      title: t("sections.introduction.title"),
      body: [t("sections.introduction.body1")],
    },
    {
      id: "que-son",
      title: t("sections.whatAre.title"),
      body: [t("sections.whatAre.body1"), t("sections.whatAre.body2")],
    },
    {
      id: "tipos",
      title: t("sections.types.title"),
      body: [
        t("sections.types.intro"),
        [
          t("sections.types.essential"),
          t("sections.types.preference"),
          t("sections.types.analytics"),
          t("sections.types.functionality"),
        ],
      ],
    },
    {
      id: "terceros",
      title: t("sections.thirdParty.title"),
      body: [
        t("sections.thirdParty.intro"),
        [
          t("sections.thirdParty.analytics"),
          t("sections.thirdParty.social"),
          t("sections.thirdParty.payments"),
        ],
        t("sections.thirdParty.disclaimer"),
      ],
    },
    {
      id: "gestion",
      title: t("sections.management.title"),
      body: [
        t("sections.management.intro"),
        [
          t("sections.management.browser"),
          t("sections.management.tools"),
          t("sections.management.optOut"),
        ],
        t("sections.management.warning"),
      ],
    },
    {
      id: "cambios",
      title: t("sections.changes.title"),
      body: [t("sections.changes.body1")],
    },
    {
      id: "contacto",
      title: t("sections.contact.title"),
      body: [t("sections.contact.body1")],
    },
  ]
}

function useDevolucionesSections(t: ReturnType<typeof useTranslations>): LegalSection[] {
  return [
    {
      id: "condiciones",
      title: t("sections.conditions.title"),
      body: [
        [
          t("sections.conditions.item1"),
          t("sections.conditions.item2"),
          t("sections.conditions.item3"),
          t("sections.conditions.item4"),
        ],
      ],
    },
    {
      id: "proceso-solicitud",
      title: t("sections.process.title"),
      body: [t("sections.process.body1")],
    },
    {
      id: "resolucion",
      title: t("sections.resolution.title"),
      body: [t("sections.resolution.body1"), t("sections.resolution.body2")],
    },
    {
      id: "mas-informacion",
      title: t("sections.moreInfo.title"),
      body: [t("sections.moreInfo.body1")],
    },
  ]
}

function usePrivacidadSections(t: ReturnType<typeof useTranslations>): LegalSection[] {
  return [
    {
      id: "info",
      title: t("sections.info.title"),
      body: [
        t("sections.info.intro"),
        [
          t("sections.info.registration"),
          t("sections.info.profile"),
          t("sections.info.gameplay"),
          t("sections.info.payments"),
        ],
      ],
    },
    {
      id: "uso",
      title: t("sections.usage.title"),
      body: [
        t("sections.usage.intro"),
        [
          t("sections.usage.services"),
          t("sections.usage.personalize"),
          t("sections.usage.transactions"),
          t("sections.usage.communicate"),
          t("sections.usage.fraud"),
        ],
      ],
    },
    {
      id: "compartir",
      title: t("sections.sharing.title"),
      body: [
        t("sections.sharing.intro"),
        [
          t("sections.sharing.players"),
          t("sections.sharing.providers"),
          t("sections.sharing.legal"),
        ],
      ],
    },
    {
      id: "seguridad",
      title: t("sections.security.title"),
      body: [t("sections.security.body1")],
    },
    {
      id: "derechos",
      title: t("sections.rights.title"),
      body: [
        t("sections.rights.intro"),
        [
          t("sections.rights.access"),
          t("sections.rights.correct"),
          t("sections.rights.delete"),
          t("sections.rights.object"),
          t("sections.rights.withdraw"),
        ],
      ],
    },
    {
      id: "cookies",
      title: t("sections.cookies.title"),
      body: [t("sections.cookies.body1")],
    },
    {
      id: "cambios",
      title: t("sections.changes.title"),
      body: [t("sections.changes.body1")],
    },
    {
      id: "contacto",
      title: t("sections.contact.title"),
      body: [t("sections.contact.body1")],
    },
  ]
}

function useReembolsosSections(t: ReturnType<typeof useTranslations>): LegalSection[] {
  return [
    {
      id: "proceso-disputa",
      title: t("sections.disputeProcess.title"),
      body: [
        t("sections.disputeProcess.intro"),
        [
          t("sections.disputeProcess.item1"),
          t("sections.disputeProcess.item2"),
          t("sections.disputeProcess.item3"),
        ],
      ],
    },
    {
      id: "politica-reembolsos",
      title: t("sections.refundPolicy.title"),
      body: [
        t("sections.refundPolicy.intro"),
        [
          t("sections.refundPolicy.item1"),
          t("sections.refundPolicy.item2"),
          t("sections.refundPolicy.item3"),
        ],
      ],
    },
    {
      id: "proceso-reembolso",
      title: t("sections.refundProcess.title"),
      body: [
        t("sections.refundProcess.intro"),
        [t("sections.refundProcess.item1"), t("sections.refundProcess.item2")],
        t("sections.refundProcess.disclaimer"),
      ],
    },
    {
      id: "mas-informacion",
      title: t("sections.moreInfo.title"),
      body: [t("sections.moreInfo.body1")],
    },
  ]
}

function useTerminosSections(t: ReturnType<typeof useTranslations>): LegalSection[] {
  return [
    {
      id: "aceptacion",
      title: t("sections.acceptance.title"),
      body: [t("sections.acceptance.body1")],
    },
    {
      id: "cambios",
      title: t("sections.changes.title"),
      body: [t("sections.changes.body1")],
    },
    {
      id: "uso",
      title: t("sections.usage.title"),
      body: [
        t("sections.usage.intro"),
        [
          t("sections.usage.item1"),
          t("sections.usage.item2"),
          t("sections.usage.item3"),
          t("sections.usage.item4"),
        ],
      ],
    },
    {
      id: "cuentas",
      title: t("sections.accounts.title"),
      body: [
        t("sections.accounts.intro"),
        [
          t("sections.accounts.item1"),
          t("sections.accounts.item2"),
          t("sections.accounts.item3"),
        ],
      ],
    },
    {
      id: "contenido",
      title: t("sections.userContent.title"),
      body: [t("sections.userContent.body1")],
    },
    {
      id: "propiedad",
      title: t("sections.intellectualProperty.title"),
      body: [t("sections.intellectualProperty.body1")],
    },
    {
      id: "compras",
      title: t("sections.purchases.title"),
      body: [t("sections.purchases.body1")],
    },
    {
      id: "cancelaciones",
      title: t("sections.cancellations.title"),
      body: [
        t("sections.cancellations.intro"),
        t("sections.cancellations.howTo"),
        [
          t("sections.cancellations.item1"),
          t("sections.cancellations.item2"),
          t("sections.cancellations.item3"),
          t("sections.cancellations.item4"),
        ],
        t("sections.cancellations.fee"),
      ],
    },
    {
      id: "devoluciones",
      title: t("sections.returns.title"),
      body: [
        t("sections.returns.intro"),
        [
          t("sections.returns.item1"),
          t("sections.returns.item2"),
          t("sections.returns.item3"),
          t("sections.returns.item4"),
        ],
        t("sections.returns.process"),
        t("sections.returns.resolution"),
      ],
    },
    {
      id: "reembolsos",
      title: t("sections.refunds.title"),
      body: [
        t("sections.refunds.intro"),
        t("sections.refunds.steps"),
        [
          t("sections.refunds.step1"),
          t("sections.refunds.step2"),
          t("sections.refunds.step3"),
        ],
        t("sections.refunds.conditions"),
        [
          t("sections.refunds.cond1"),
          t("sections.refunds.cond2"),
          t("sections.refunds.cond3"),
        ],
        t("sections.refunds.resolution"),
      ],
    },
    {
      id: "terminacion",
      title: t("sections.termination.title"),
      body: [t("sections.termination.body1")],
    },
    {
      id: "responsabilidad",
      title: t("sections.liability.title"),
      body: [t("sections.liability.body1")],
    },
    {
      id: "ley",
      title: t("sections.law.title"),
      body: [t("sections.law.body1")],
    },
    {
      id: "contacto",
      title: t("sections.contact.title"),
      body: [t("sections.contact.body1")],
    },
  ]
}

const sectionBuilders: Record<LegalPage, (t: ReturnType<typeof useTranslations>) => LegalSection[]> = {
  cancelaciones: useCancelacionesSections,
  cookies: useCookiesSections,
  devoluciones: useDevolucionesSections,
  privacidad: usePrivacidadSections,
  reembolsos: useReembolsosSections,
  terminos: useTerminosSections,
}

export function LegalPageContent({ page }: { page: LegalPage }) {
  const tC = useTranslations("common.legal.cancelaciones")
  const tK = useTranslations("common.legal.cookies")
  const tD = useTranslations("common.legal.devoluciones")
  const tP = useTranslations("common.legal.privacidad")
  const tR = useTranslations("common.legal.reembolsos")
  const tT = useTranslations("common.legal.terminos")
  const translators = { cancelaciones: tC, cookies: tK, devoluciones: tD, privacidad: tP, reembolsos: tR, terminos: tT }
  const t = translators[page]
  const sections = sectionBuilders[page](t)
  const { intlLocale } = useFormat()

  const updated = `${t("updatedPrefix")}${new Date().toLocaleDateString(intlLocale, { year: "numeric", month: "long", day: "numeric" })}`

  return (
    <LegalDoc
      kicker={t("kicker")}
      title={t("title")}
      lead={t("lead")}
      updated={updated}
      tocLabel={t("tocLabel")}
      sections={sections}
    />
  )
}
