"use client"

import { use } from "react"
import { ListingDetail } from "../../_components/detail/ListingDetail"

export default function ListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  return <ListingDetail id={Number(id)} />
}
