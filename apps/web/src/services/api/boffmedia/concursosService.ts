import { roomCommand } from "./concursosSocket";
import type {
  ConcursosDeviceRecoveryDto,
  ConcursosRoomDto,
  JoinConcursosRoomDto,
  ConcursosActionDto,
} from "@boffmedia/shared";
import { apiAuthedPOST, apiAuthedGET } from "@/services/boffAPI";
import { ApiError, orThrow } from "@/services/http/core";

/** These are anonymous room capabilities, never a NextAuth/session JWT. */
export const ConcursosService = {
  async recoverDevice(
    code: string,
    nickname: string,
    capability: string,
  ): Promise<{
    room?: ConcursosRoomDto;
    recovery?: ConcursosDeviceRecoveryDto;
  }> {
    try {
      return { room: await ConcursosService.read(code, capability) };
    } catch (failure) {
      if (
        !(failure instanceof ApiError) ||
        failure.statusCode !== 403 ||
        failure.code === "CONCURSOS_REVOKED"
      )
        throw failure;
    }
    return {
      recovery: await orThrow(
        apiAuthedPOST<ConcursosDeviceRecoveryDto>(
          `/concursos/rooms/${encodeURIComponent(code)}/recovery-requests`,
          { nickname },
          capability,
        ),
      ),
    };
  },
  async action(
    code: string,
    capability: string,
    body: ConcursosActionDto,
  ): Promise<ConcursosRoomDto> {
    return roomCommand(code, capability, "action", body);
  },
  async group(
    code: string,
    capability: string,
    entityId: string,
  ): Promise<ConcursosRoomDto> {
    return roomCommand(code, capability, "group", { entityId });
  },
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
    return roomCommand(code, capability, "leave");
  },
};
