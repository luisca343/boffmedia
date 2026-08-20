"use client"

import { Feed } from "./_components/Feed"
import { FilterRail } from "./_components/FilterRail"

/** The market. A thin orchestrator: the rail filters, the feed renders. */
export default function WigglypopPage() {
  return (
    <>
      <FilterRail />
      <Feed />
    </>
  )
}
