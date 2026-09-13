import type {
  CreateReleaseDto,
  ReleaseEntity,
  ReleaseReadinessEntity,
  WithdrawReleaseDto,
} from "@boffmedia/shared";
import {
  apiAuthedAutoGET,
  apiAuthedAutoPOST,
  apiGET,
} from "@/services/http/boff-client";

export type ReleaseLocale = "en" | "es";

export class ReleasesService {
  static list(locale: ReleaseLocale, authenticated = false) {
    const params = new URLSearchParams({ locale, limit: "100" });
    const url = `/releases?${params.toString()}`;
    return authenticated
      ? apiAuthedAutoGET<ReleaseEntity[]>(url)
      : apiGET<ReleaseEntity[]>(url);
  }

  static markSeen(id: number) {
    return apiAuthedAutoPOST<{ success: true }>(`/releases/${id}/seen`, {});
  }

  static listAdmin() {
    return apiAuthedAutoGET<ReleaseEntity[]>("/admin/releases");
  }

  static createManual(input: CreateReleaseDto) {
    return apiAuthedAutoPOST<ReleaseEntity>("/admin/releases", input);
  }

  static approve(id: number) {
    return apiAuthedAutoPOST<ReleaseEntity>(
      `/admin/releases/${id}/approve`,
      {},
    );
  }

  static archive(id: number) {
    return apiAuthedAutoPOST<ReleaseEntity>(
      `/admin/releases/${id}/archive`,
      {},
    );
  }

  static readiness(id: number) {
    return apiAuthedAutoGET<ReleaseReadinessEntity>(
      `/admin/releases/${id}/readiness`,
    );
  }

  static withdraw(id: number, input: WithdrawReleaseDto) {
    return apiAuthedAutoPOST<ReleaseEntity>(
      `/admin/releases/${id}/withdraw`,
      input,
    );
  }
}
