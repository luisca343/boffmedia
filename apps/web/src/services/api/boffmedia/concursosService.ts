import type { ConcursosRoomDto, JoinConcursosRoomDto } from "@boffmedia/shared";
import {
  apiAuthedPOST,
  apiAuthedGET,
  apiAuthedDELETE,
} from "@/services/boffAPI";
import { ApiError, orThrow } from "@/services/http/core";

/** These are anonymous room capabilities, never a NextAuth/session JWT. */
export const ConcursosService = {
  async recover(
    code: string,
    nickname: string,
    capability: string,
  ): Promise<ConcursosRoomDto> {
    try {
      return await ConcursosService.read(code, capability);
    } catch (failure) {
      if (failure instanceof ApiError && failure.statusCode === 403)
        return ConcursosService.join(code, nickname, capability);
      throw failure;
    }
  },
  async join(
    code: string,
    nickname: string,
    capability: string,
  ): Promise<ConcursosRoomDto> {
    const body: JoinConcursosRoomDto = { nickname };
    return orThrow(
      apiAuthedPOST<ConcursosRoomDto>(
        `/concursos/rooms/${encodeURIComponent(code)}/players`,
        body,
        capability,
      ),
    );
  },
  async read(code: string, capability: string): Promise<ConcursosRoomDto> {
    return orThrow(
      apiAuthedGET<ConcursosRoomDto>(
        `/concursos/rooms/${encodeURIComponent(code)}`,
        capability,
      ),
    );
  },
  async leave(code: string, capability: string): Promise<ConcursosRoomDto> {
    return orThrow(
      apiAuthedDELETE<ConcursosRoomDto>(
        `/concursos/rooms/${encodeURIComponent(code)}/players/me`,
        capability,
      ),
    );
  },
};
