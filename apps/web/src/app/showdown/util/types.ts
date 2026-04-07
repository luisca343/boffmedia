import { Args, AvatarIdent } from "@pkmn/protocol";

export type UpdateUserArgs = Args["|updateuser|"];
export type ChallstrArgs = Args["|challstr|"];
export type FormatArgs = Args["|formats|"];

export type UpdateUserResult = {
  fullName: string;
  namedCode: number;
  avatar: AvatarIdent;
  userData: string;
};

export type ChallstrResult = {
  challstr: string;
};

export type FormatResult = {
    formats: string;
}

export type ShowdownMessage = readonly [string, ...any[]];

export type QueryHandlers = {
  updateuser: (args: UpdateUserArgs) => UpdateUserResult;
  challstr: (args: ChallstrArgs) => ChallstrResult;
  formats: (args: FormatArgs) => string;
  updatesearch: (args: Args["|updatesearch|"]) => string;
};

export type QueryType = keyof QueryHandlers;
