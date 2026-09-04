import type { AnyMySqlColumn, MySqlTable } from 'drizzle-orm/mysql-core';

import { boffMediaUsers, boffMediaUserRoles } from '@/_db/schema/BoffMedia';
import {
  boffMediaAudit,
  boffMediaEventInvites,
  boffMediaEventParticipants,
  boffMediaEventSuggestions,
  boffMediaEventTeamMembers,
  boffMediaParticipantProgress,
  boffMediaParticipants,
} from '@/_db/schema/BoffMediaEvents';
import {
  boffMediaForumPosts,
  boffMediaForumThreads,
  boffMediaForumVotes,
} from '@/_db/schema/BoffMediaForum';
import {
  boffMediaContentReports,
  boffMediaModerationSanctions,
} from '@/_db/schema/BoffMediaModeration';
import {
  boffMediaNotifications,
  boffMediaNotificationPreferences,
} from '@/_db/schema/BoffMediaNotifications';
import {
  boffMediaTournamentMatchMessages,
  boffMediaTournamentParticipants,
  boffMediaTournamentRoster,
} from '@/_db/schema/BoffMediaTournaments';
import { boffMediaUploads } from '@/_db/schema/BoffMediaUploads';
import { desktopDeviceCodes } from '@/_db/schema/DesktopAuth';
import { discordQuotes, discordUsers } from '@/_db/schema/Discord';
import { ficusAiMessages } from '@/_db/schema/FicusAI';
import {
  packAcl,
  packAudit,
  packGrants,
  packInvites,
  packVersions,
} from '@/_db/schema/Packs';
import {
  randomizerAssignments,
  randomizerAudit,
  randomizerPresets,
} from '@/_db/schema/Randomizer';
import { sharexImages, sharexTokens } from '@/_db/schema/Sharex';
import {
  rotomArcadeStreaks,
  rotomInventory,
  rotomNotifications,
  rotomUserAchievements,
  rotomUserApps,
  rotomUserReplays,
  rotomUsers,
} from '@/_db/schema/SmartRotom';
import {
  rotomChatMembers,
  rotomChatMessageReactions,
  rotomChatMessageReads,
  rotomChatMessages,
  rotomChats,
} from '@/_db/schema/SmartRotomChat';
import {
  rotomDocuments,
  rotomNewsComments,
  rotomNewsletterSubscribers,
  rotomNoteFolders,
  rotomNoteTagLinks,
  rotomNoteTags,
  rotomNoteVersions,
  rotomUserDocuments,
} from '@/_db/schema/SmartRotomDocuments';
import { dungeonRunPlayers } from '@/_db/schema/SmartRotomDungeons';
import {
  gobiernoAnuncios,
  gobiernoApelaciones,
  gobiernoAuditoria,
  gobiernoBitacora,
  gobiernoBuscados,
  gobiernoCarteles,
  gobiernoDenuncias,
  gobiernoEventoCapturas,
  gobiernoEventoVotos,
  gobiernoEventos,
  gobiernoExpedientes,
  gobiernoMegafonia,
  gobiernoMultas,
  gobiernoParcelaHistorial,
  gobiernoPatrullaOficiales,
  gobiernoPujas,
  gobiernoSubastas,
} from '@/_db/schema/SmartRotomGobierno';
import { kartRacePlayers } from '@/_db/schema/SmartRotomKarts';
import { mineGameRewards, mineGames } from '@/_db/schema/SmartRotomMine';
import { pasaporteProfiles } from '@/_db/schema/SmartRotomPasaporte';
import { rotomPcMarks } from '@/_db/schema/SmartRotomPc';
import { pokedexRegistry } from '@/_db/schema/SmartRotomPokedex';
import {
  rookerBookmarks,
  rookerFollows,
  rookerPosts,
  rookerProfiles,
  rookerReactions,
  rookerRetrinos,
} from '@/_db/schema/SmartRotomRooker';
import {
  starBankAccounts,
  starBankTransactions,
  starBankUserAccounts,
} from '@/_db/schema/SmartRotomStarBank';
import {
  wigglypopBids,
  wigglypopListingItems,
  wigglypopListingMons,
  wigglypopListings,
  wigglypopMonCustody,
  wigglypopOffers,
  wigglypopOrderLines,
  wigglypopOrders,
  wigglypopReviews,
  wigglypopTradeOffers,
  wigglypopWatchlist,
} from '@/_db/schema/SmartRotomWigglypop';
import { tcgUserCardHistory, tcgUserCards } from '@/_db/schema/Tcg';
import {
  vgcMatches,
  vgcSeries,
  vgcSessions,
  vgcTeamPresets,
} from '@/_db/schema/VgcTracker';
import { battlesimReplays, battlesimTeams } from '@/_db/schema/Battlesim';
import { wingullInvites } from '@/_db/schema/Wingull';

/**
 * The answer to "what do you hold on me" (GDPR art. 15 / 20), written down
 * table by table.
 *
 * This file is the feature. An export that quietly skips a table is worse than
 * no export at all — it is a documented, confident lie — so EVERY table in
 * `_db/schema` appears here exactly once, either in {@link EXPORTED_TABLES} with
 * the column that says the row is the user's, or in {@link EXCLUDED_TABLES} with
 * the reason it holds nothing of theirs. `data-export.manifest.spec.ts` globs
 * the Drizzle schema directory the way `drizzle-kit` does and fails when a table
 * appears in neither list, so adding a table forces the decision instead of
 * silently widening the gap.
 *
 * ## The other-people rule
 *
 * A row is exported when the person is its SUBJECT, never merely because they
 * appear in it. A forum thread they wrote is theirs; the replies underneath are
 * their authors'. A chat message they sent is theirs; the answer is not. Where a
 * row is genuinely about them but carries a second person's identifier — the
 * officer who issued a fine, the opponent in a battle, the seller on an order
 * line — the row goes in and that column is stripped (`redact`).
 *
 * `redact` does one other job: credentials. A token hash or a device code is not
 * somebody else's data, but handing back a live credential because it happens to
 * sit in the user's own row is its own accident.
 */

/** Which resolved key a column is compared against. */
export type SubjectKey =
  // Scalars — an `eq`. A null scalar (no linked Minecraft account, no Discord)
  // drops the clause rather than matching NULL rows.
  | 'accountId'
  | 'mcUuid'
  | 'discordId'
  | 'email'
  // Id sets resolved from the rows above — an `inArray`. An empty set drops the
  // clause, so a user with no events does not select the whole table.
  | 'participantIds'
  | 'documentIds'
  | 'sharexTokenIds'
  | 'bankAccountIds'
  | 'orderIds'
  | 'chatIds'
  | 'listingIds'
  | 'mineGameIds';

/** Everything needed to pick one person's rows out of every exported table. */
export interface ExportSubject {
  accountId: number;
  mcUuid: string | null;
  discordId: string | null;
  email: string;
  participantIds: number[];
  documentIds: number[];
  sharexTokenIds: number[];
  bankAccountIds: number[];
  orderIds: number[];
  chatIds: number[];
  listingIds: number[];
  mineGameIds: number[];
}

/** Top-level grouping in the archive, so a reader can find things. */
export type ExportSection =
  | 'account'
  | 'community'
  | 'events'
  | 'tournaments'
  | 'tools'
  | 'launcher'
  | 'minecraft'
  | 'social'
  | 'economy'
  | 'government';

export interface ExportedTable {
  /** Physical table name — the key the completeness test matches on. */
  table: string;
  section: ExportSection;
  drizzle: MySqlTable;
  /** The row is the user's when ANY of these matches (OR). */
  ownedBy: { column: AnyMySqlColumn; key: SubjectKey }[];
  /**
   * Drizzle property names dropped from every row before it is written, because
   * they name someone else or are a live credential.
   */
  redact?: string[];
  /** Plain language, emitted beside the rows: what this data IS. */
  meaning: string;
}

export interface ExcludedTable {
  table: string;
  /** Why nothing here is the user's to receive. */
  reason: string;
}

export const EXPORTED_TABLES: readonly ExportedTable[] = [
  // ── Account ───────────────────────────────────────────────────────────────
  {
    table: 'boffmedia_users',
    section: 'account',
    drizzle: boffMediaUsers,
    ownedBy: [{ column: boffMediaUsers.id, key: 'accountId' }],
    // The bcrypt hash is not information about the person, it is the lock on
    // their door. Returning it turns a mislaid export into an offline cracking
    // target.
    redact: ['password'],
    meaning:
      'Your Boffmedia account: username, email, avatar, bio, linked provider ids, language and the dates it was created and last seen.',
  },
  {
    table: 'boffmedia_user_roles',
    section: 'account',
    drizzle: boffMediaUserRoles,
    ownedBy: [{ column: boffMediaUserRoles.userId, key: 'accountId' }],
    meaning: 'Which roles your account holds on the site.',
  },
  {
    table: 'boffmedia_notifications',
    section: 'account',
    drizzle: boffMediaNotifications,
    ownedBy: [{ column: boffMediaNotifications.userId, key: 'accountId' }],
    meaning: 'Site notifications addressed to you, and whether you read them.',
  },
  {
    table: 'boffmedia_notification_preferences',
    section: 'account',
    drizzle: boffMediaNotificationPreferences,
    ownedBy: [
      { column: boffMediaNotificationPreferences.userId, key: 'accountId' },
    ],
    meaning: 'Which kinds of notification you chose to mute.',
  },
  {
    table: 'boffmedia_uploads',
    section: 'account',
    drizzle: boffMediaUploads,
    ownedBy: [{ column: boffMediaUploads.ownerUserId, key: 'accountId' }],
    meaning:
      'Files you uploaded (avatars, images): name, type, size and date. The file contents are not in this archive.',
  },
  {
    table: 'boffmedia_audit',
    section: 'account',
    drizzle: boffMediaAudit,
    ownedBy: [{ column: boffMediaAudit.actorUserId, key: 'accountId' }],
    meaning:
      'Administrative actions YOU performed on events and tournaments. Actions staff took about you are recorded here too, but each of those rows identifies the staff member who took it, so they are not in this file — ask support for them.',
  },
  {
    table: 'discord_users',
    section: 'account',
    drizzle: discordUsers,
    ownedBy: [{ column: discordUsers.userId, key: 'discordId' }],
    meaning:
      'Your Discord profile as the bot caches it: display name, avatar, colour and text-to-speech voice.',
  },
  {
    table: 'discord_quotes',
    section: 'account',
    drizzle: discordQuotes,
    ownedBy: [{ column: discordQuotes.discordId, key: 'discordId' }],
    meaning: 'Things you said that someone saved with the quote bot.',
  },
  {
    table: 'rotom_newsletter_subscribers',
    section: 'account',
    drizzle: rotomNewsletterSubscribers,
    ownedBy: [{ column: rotomNewsletterSubscribers.email, key: 'email' }],
    meaning: 'Your newsletter subscription, if you have one.',
  },
  {
    table: 'desktop_device_codes',
    section: 'launcher',
    drizzle: desktopDeviceCodes,
    ownedBy: [{ column: desktopDeviceCodes.userId, key: 'accountId' }],
    // These two codes ARE the credential the desktop app trades for a session.
    // Short-lived, but there is no reason to put a live one in a file.
    redact: ['deviceCode', 'userCode'],
    meaning:
      'Desktop-app sign-in attempts: which machine asked, when, and whether you approved it.',
  },

  // ── Community: forum and moderation ───────────────────────────────────────
  {
    table: 'boffmedia_forum_threads',
    section: 'community',
    drizzle: boffMediaForumThreads,
    ownedBy: [{ column: boffMediaForumThreads.userId, key: 'accountId' }],
    // Denormalised pointer at whoever replied last — by definition someone else
    // on any thread that has replies.
    redact: ['lastPostUserId'],
    meaning:
      'Forum threads you started. Replies written by other people are their data, not yours, and are not included.',
  },
  {
    table: 'boffmedia_forum_posts',
    section: 'community',
    drizzle: boffMediaForumPosts,
    ownedBy: [{ column: boffMediaForumPosts.userId, key: 'accountId' }],
    meaning: 'Forum replies you wrote, including ones you later deleted.',
  },
  {
    table: 'boffmedia_forum_votes',
    section: 'community',
    drizzle: boffMediaForumVotes,
    ownedBy: [{ column: boffMediaForumVotes.userId, key: 'accountId' }],
    meaning: 'Threads you upvoted.',
  },
  {
    table: 'boffmedia_content_reports',
    section: 'community',
    drizzle: boffMediaContentReports,
    ownedBy: [
      { column: boffMediaContentReports.reporterUserId, key: 'accountId' },
      { column: boffMediaContentReports.authorUserId, key: 'accountId' },
      { column: boffMediaContentReports.authorUuid, key: 'mcUuid' },
    ],
    // Stripped at BOTH ends: a report you filed must not hand you the author,
    // and a report about your post must not hand you the reporter.
    redact: [
      'reporterUserId',
      'authorUserId',
      'authorUuid',
      'resolvedByUserId',
    ],
    meaning:
      'Reports you filed, and reports filed about something you wrote. Neither the reporter nor the author is named, in either direction.',
  },
  {
    table: 'boffmedia_moderation_sanctions',
    section: 'community',
    drizzle: boffMediaModerationSanctions,
    ownedBy: [
      { column: boffMediaModerationSanctions.subjectUserId, key: 'accountId' },
      { column: boffMediaModerationSanctions.subjectUuid, key: 'mcUuid' },
    ],
    redact: ['issuedByUserId', 'revokedByUserId'],
    meaning:
      'Sanctions applied to your account — kind, reason, when it expires — without naming the moderator who applied it.',
  },

  // ── Events ────────────────────────────────────────────────────────────────
  {
    table: 'boffmedia_participants',
    section: 'events',
    drizzle: boffMediaParticipants,
    ownedBy: [{ column: boffMediaParticipants.userId, key: 'accountId' }],
    meaning:
      'Your event identity: the nickname and avatar shown on leaderboards.',
  },
  {
    table: 'boffmedia_event_participants',
    section: 'events',
    drizzle: boffMediaEventParticipants,
    ownedBy: [
      {
        column: boffMediaEventParticipants.participantId,
        key: 'participantIds',
      },
    ],
    meaning: 'Events you signed up for, and the state of each sign-up.',
  },
  {
    table: 'boffmedia_event_team_members',
    section: 'events',
    drizzle: boffMediaEventTeamMembers,
    ownedBy: [
      {
        column: boffMediaEventTeamMembers.participantId,
        key: 'participantIds',
      },
    ],
    meaning:
      'Event teams you belong to and your role in them. Your team-mates are listed under their own accounts, not yours.',
  },
  {
    table: 'boffmedia_participant_progress',
    section: 'events',
    drizzle: boffMediaParticipantProgress,
    ownedBy: [
      {
        column: boffMediaParticipantProgress.participantId,
        key: 'participantIds',
      },
    ],
    meaning: 'Your progress on each event achievement.',
  },
  {
    table: 'boffmedia_event_suggestions',
    section: 'events',
    drizzle: boffMediaEventSuggestions,
    ownedBy: [
      { column: boffMediaEventSuggestions.proposerUserId, key: 'accountId' },
    ],
    meaning: 'Events you proposed, and how staff reviewed them.',
  },
  {
    table: 'boffmedia_event_invites',
    section: 'events',
    drizzle: boffMediaEventInvites,
    ownedBy: [{ column: boffMediaEventInvites.createdBy, key: 'accountId' }],
    // The code is a bearer credential: anyone holding it can join.
    redact: ['code'],
    meaning:
      'Event invitations you created, and how many times they were used.',
  },

  // ── Tournaments ───────────────────────────────────────────────────────────
  {
    table: 'boffmedia_tournament_participants',
    section: 'tournaments',
    drizzle: boffMediaTournamentParticipants,
    ownedBy: [
      { column: boffMediaTournamentParticipants.userId, key: 'accountId' },
    ],
    meaning:
      'Tournaments you entered: your seed, country, check-in, team sheet and standing.',
  },
  {
    table: 'boffmedia_tournament_roster',
    section: 'tournaments',
    drizzle: boffMediaTournamentRoster,
    ownedBy: [{ column: boffMediaTournamentRoster.userId, key: 'accountId' }],
    meaning: 'Team rosters you appear on, and your role in the team.',
  },
  {
    table: 'boffmedia_tournament_match_messages',
    section: 'tournaments',
    drizzle: boffMediaTournamentMatchMessages,
    ownedBy: [
      {
        column: boffMediaTournamentMatchMessages.authorUserId,
        key: 'accountId',
      },
    ],
    meaning:
      'Messages you posted on a match page. Your opponent’s messages are theirs and are not included.',
  },

  // ── Launcher / packs ──────────────────────────────────────────────────────
  {
    table: 'pack_grants',
    section: 'launcher',
    drizzle: packGrants,
    ownedBy: [{ column: packGrants.userId, key: 'accountId' }],
    redact: ['grantedBy'],
    meaning: 'Modpacks your account is entitled to, and how you got each one.',
  },
  {
    table: 'pack_acl',
    section: 'launcher',
    drizzle: packAcl,
    ownedBy: [{ column: packAcl.uuid, key: 'mcUuid' }],
    redact: ['grantedBy'],
    meaning: 'Modpack access tied to your Minecraft account.',
  },
  {
    table: 'pack_audit',
    section: 'launcher',
    drizzle: packAudit,
    ownedBy: [
      { column: packAudit.userId, key: 'accountId' },
      { column: packAudit.uuid, key: 'mcUuid' },
    ],
    meaning: 'Your modpack downloads, grants and revocations.',
  },
  {
    table: 'pack_invites',
    section: 'launcher',
    drizzle: packInvites,
    ownedBy: [{ column: packInvites.createdBy, key: 'accountId' }],
    redact: ['code'],
    meaning: 'Modpack invitations you created.',
  },
  {
    table: 'pack_versions',
    section: 'launcher',
    drizzle: packVersions,
    ownedBy: [{ column: packVersions.createdBy, key: 'accountId' }],
    meaning: 'Modpack versions you published, if you maintain a pack.',
  },

  // ── Tools ─────────────────────────────────────────────────────────────────
  {
    table: 'tools_battlesim_teams',
    section: 'tools',
    drizzle: battlesimTeams,
    ownedBy: [{ column: battlesimTeams.userId, key: 'accountId' }],
    meaning: 'Teams you built in the battle simulator.',
  },
  {
    table: 'tools_battlesim_replays',
    section: 'tools',
    drizzle: battlesimReplays,
    ownedBy: [{ column: battlesimReplays.userId, key: 'accountId' }],
    // The log names both sides by their in-battle handle — that is what a replay
    // IS. The opponent's ACCOUNT id is a different matter.
    redact: ['opponentUserId'],
    meaning: 'Battle-simulator replays you saved, including the battle log.',
  },
  {
    table: 'tools_vgc_sessions',
    section: 'tools',
    drizzle: vgcSessions,
    ownedBy: [{ column: vgcSessions.userId, key: 'accountId' }],
    meaning:
      'Your VGC tracker sessions: format, regulation, starting Elo and notes.',
  },
  {
    table: 'tools_vgc_matches',
    section: 'tools',
    drizzle: vgcMatches,
    ownedBy: [{ column: vgcMatches.userId, key: 'accountId' }],
    meaning:
      'Matches you logged in the VGC tracker. The opponent name is kept because you typed it: it is your own record of the game, not a link to their account.',
  },
  {
    table: 'tools_vgc_series',
    section: 'tools',
    drizzle: vgcSeries,
    ownedBy: [{ column: vgcSeries.userId, key: 'accountId' }],
    meaning: 'Best-of-three series you logged in the VGC tracker.',
  },
  {
    table: 'tools_vgc_team_presets',
    section: 'tools',
    drizzle: vgcTeamPresets,
    ownedBy: [{ column: vgcTeamPresets.userId, key: 'accountId' }],
    meaning:
      'Team presets you saved in the VGC tracker, with their version history.',
  },
  {
    table: 'tools_tcg_user_cards',
    section: 'tools',
    drizzle: tcgUserCards,
    ownedBy: [{ column: tcgUserCards.userId, key: 'accountId' }],
    meaning: 'Your trading-card collection.',
  },
  {
    table: 'tools_tcg_user_card_history',
    section: 'tools',
    drizzle: tcgUserCardHistory,
    ownedBy: [{ column: tcgUserCardHistory.userId, key: 'accountId' }],
    meaning: 'Every change to your card collection.',
  },
  {
    table: 'tools_randomizer_assignments',
    section: 'tools',
    drizzle: randomizerAssignments,
    ownedBy: [
      { column: randomizerAssignments.boffmediaUserId, key: 'accountId' },
      { column: randomizerAssignments.mcUuid, key: 'mcUuid' },
    ],
    meaning: 'Randomizer seeds assigned to you, and their build state.',
  },
  {
    table: 'tools_randomizer_presets',
    section: 'tools',
    drizzle: randomizerPresets,
    ownedBy: [{ column: randomizerPresets.updatedBy, key: 'accountId' }],
    meaning:
      'Randomizer presets you last edited, if you are a randomizer admin.',
  },
  {
    table: 'tools_randomizer_audit',
    section: 'tools',
    drizzle: randomizerAudit,
    ownedBy: [{ column: randomizerAudit.actor, key: 'mcUuid' }],
    meaning: 'Randomizer actions recorded against your Minecraft account.',
  },
  {
    table: 'boffmedia_sharex_tokens',
    section: 'tools',
    drizzle: sharexTokens,
    ownedBy: [{ column: sharexTokens.createdBy, key: 'accountId' }],
    // The stored half of a live upload credential.
    redact: ['tokenHash'],
    meaning: 'ShareX upload tokens you created, and when each was last used.',
  },
  {
    table: 'boffmedia_sharex_images',
    section: 'tools',
    drizzle: sharexImages,
    ownedBy: [{ column: sharexImages.tokenId, key: 'sharexTokenIds' }],
    meaning:
      'Screenshots uploaded with your ShareX tokens: name and date. The image contents are not in this archive.',
  },

  // ── Minecraft identity ────────────────────────────────────────────────────
  {
    table: 'rotom_users',
    section: 'minecraft',
    drizzle: rotomUsers,
    ownedBy: [{ column: rotomUsers.uuid, key: 'mcUuid' }],
    meaning:
      'Your in-game identity: Minecraft uuid, username, world and energy.',
  },
  {
    table: 'rotom_user_apps',
    section: 'minecraft',
    drizzle: rotomUserApps,
    ownedBy: [{ column: rotomUserApps.uuid, key: 'mcUuid' }],
    meaning: 'Apps installed on your Rotom phone, in your chosen order.',
  },
  {
    table: 'rotom_user_achievements',
    section: 'minecraft',
    drizzle: rotomUserAchievements,
    ownedBy: [{ column: rotomUserAchievements.uuid, key: 'mcUuid' }],
    meaning: 'Your in-game achievement progress.',
  },
  {
    table: 'rotom_user_replays',
    section: 'minecraft',
    drizzle: rotomUserReplays,
    ownedBy: [{ column: rotomUserReplays.uuid, key: 'mcUuid' }],
    meaning:
      'Battles you took part in, and which side you played. The replay log names both trainers, so it stays with the battle rather than coming to you.',
  },
  {
    table: 'rotom_arcade_streaks',
    section: 'minecraft',
    drizzle: rotomArcadeStreaks,
    ownedBy: [{ column: rotomArcadeStreaks.uuid, key: 'mcUuid' }],
    meaning: 'Your daily-reward streak.',
  },
  {
    table: 'rotom_inventory',
    section: 'minecraft',
    drizzle: rotomInventory,
    ownedBy: [{ column: rotomInventory.uuid, key: 'mcUuid' }],
    meaning: 'Items held in your Rotom-phone inventory.',
  },
  {
    table: 'rotom_notifications',
    section: 'minecraft',
    drizzle: rotomNotifications,
    ownedBy: [{ column: rotomNotifications.userUuid, key: 'mcUuid' }],
    meaning: 'In-game notifications addressed to you.',
  },
  {
    table: 'rotom_pokedex',
    section: 'minecraft',
    drizzle: pokedexRegistry,
    ownedBy: [{ column: pokedexRegistry.uuid, key: 'mcUuid' }],
    meaning: 'Your Pokédex: what you have seen and caught.',
  },
  {
    table: 'rotom_pasaporte_profiles',
    section: 'minecraft',
    drizzle: pasaporteProfiles,
    ownedBy: [{ column: pasaporteProfiles.uuid, key: 'mcUuid' }],
    meaning: 'Your trainer passport: trainer id, region and member-since date.',
  },
  {
    table: 'rotom_pc_marks',
    section: 'minecraft',
    drizzle: rotomPcMarks,
    ownedBy: [{ column: rotomPcMarks.userUuid, key: 'mcUuid' }],
    meaning: 'Favourites and tags you put on Pokémon in your PC boxes.',
  },
  {
    table: 'rotom_mine_games',
    section: 'minecraft',
    drizzle: mineGames,
    ownedBy: [{ column: mineGames.uuid, key: 'mcUuid' }],
    meaning: 'Minesweeper games you played.',
  },
  {
    table: 'rotom_mine_game_rewards',
    section: 'minecraft',
    drizzle: mineGameRewards,
    ownedBy: [{ column: mineGameRewards.gameId, key: 'mineGameIds' }],
    meaning: 'What each of your minesweeper games paid out.',
  },
  {
    table: 'rotom_dungeon_run_players',
    section: 'minecraft',
    drizzle: dungeonRunPlayers,
    ownedBy: [{ column: dungeonRunPlayers.uuid, key: 'mcUuid' }],
    meaning:
      'Your line in each dungeon run: deaths and whether you left. The other runners have their own lines.',
  },
  {
    table: 'rotom_kart_race_players',
    section: 'minecraft',
    drizzle: kartRacePlayers,
    ownedBy: [{ column: kartRacePlayers.uuid, key: 'mcUuid' }],
    meaning: 'Your result in each kart race: position, time and best lap.',
  },
  {
    table: 'rotom_wingull_invites',
    section: 'minecraft',
    drizzle: wingullInvites,
    ownedBy: [{ column: wingullInvites.uuid, key: 'mcUuid' }],
    meaning: 'Your whitelist invitation to the game server.',
  },

  // ── Social: chat, notes, AI, Rooker ───────────────────────────────────────
  {
    table: 'rotom_chats',
    section: 'social',
    drizzle: rotomChats,
    ownedBy: [{ column: rotomChats.id, key: 'chatIds' }],
    meaning:
      'The conversations you are in — name, type and picture only. Who else is in them is their data, not yours.',
  },
  {
    table: 'rotom_chat_members',
    section: 'social',
    drizzle: rotomChatMembers,
    ownedBy: [{ column: rotomChatMembers.uuid, key: 'mcUuid' }],
    meaning:
      'Your membership of each conversation, and whether you pinned or muted it.',
  },
  {
    table: 'rotom_chat_messages',
    section: 'social',
    drizzle: rotomChatMessages,
    ownedBy: [{ column: rotomChatMessages.senderUUID, key: 'mcUuid' }],
    meaning:
      'Messages you SENT. What the other person wrote is their personal data and is deliberately not here, even inside your own conversations.',
  },
  {
    table: 'rotom_chat_message_reactions',
    section: 'social',
    drizzle: rotomChatMessageReactions,
    ownedBy: [{ column: rotomChatMessageReactions.uuid, key: 'mcUuid' }],
    meaning: 'Reactions you added to messages.',
  },
  {
    table: 'rotom_chat_message_reads',
    section: 'social',
    drizzle: rotomChatMessageReads,
    ownedBy: [{ column: rotomChatMessageReads.uuid, key: 'mcUuid' }],
    meaning: 'Which messages you have read.',
  },
  {
    table: 'rotom_ficusai_messages',
    section: 'social',
    drizzle: ficusAiMessages,
    ownedBy: [{ column: ficusAiMessages.uuid, key: 'mcUuid' }],
    meaning: 'Your conversations with the FicusAI assistant.',
  },
  {
    table: 'rotom_news_comments',
    section: 'social',
    drizzle: rotomNewsComments,
    ownedBy: [{ column: rotomNewsComments.uuid, key: 'mcUuid' }],
    meaning: 'Comments you left on news posts.',
  },
  {
    table: 'rotom_user_documents',
    section: 'social',
    drizzle: rotomUserDocuments,
    ownedBy: [{ column: rotomUserDocuments.uuid, key: 'mcUuid' }],
    meaning: 'Which notes belong to you.',
  },
  {
    table: 'rotom_documents',
    section: 'social',
    drizzle: rotomDocuments,
    ownedBy: [{ column: rotomDocuments.id, key: 'documentIds' }],
    meaning: 'The full text of your notes.',
  },
  {
    table: 'rotom_note_versions',
    section: 'social',
    drizzle: rotomNoteVersions,
    ownedBy: [{ column: rotomNoteVersions.authorUuid, key: 'mcUuid' }],
    meaning: 'Earlier versions of notes, for the edits you made.',
  },
  {
    table: 'rotom_note_folders',
    section: 'social',
    drizzle: rotomNoteFolders,
    ownedBy: [{ column: rotomNoteFolders.uuid, key: 'mcUuid' }],
    meaning: 'How you organised your notes into folders.',
  },
  {
    table: 'rotom_note_tags',
    section: 'social',
    drizzle: rotomNoteTags,
    ownedBy: [{ column: rotomNoteTags.uuid, key: 'mcUuid' }],
    meaning: 'Tags you created for your notes.',
  },
  {
    table: 'rotom_note_tag_links',
    section: 'social',
    drizzle: rotomNoteTagLinks,
    ownedBy: [{ column: rotomNoteTagLinks.documentId, key: 'documentIds' }],
    meaning: 'Which tags you put on which of your notes.',
  },
  {
    table: 'rotom_rooker_profiles',
    section: 'social',
    drizzle: rookerProfiles,
    ownedBy: [{ column: rookerProfiles.uuid, key: 'mcUuid' }],
    meaning: 'Your Rooker profile: handle, display name, bio and link.',
  },
  {
    table: 'rotom_rooker_posts',
    section: 'social',
    drizzle: rookerPosts,
    ownedBy: [{ column: rookerPosts.uuid, key: 'mcUuid' }],
    meaning:
      'Posts and replies you wrote on Rooker. Replies other people left under your posts are theirs.',
  },
  {
    table: 'rotom_rooker_reactions',
    section: 'social',
    drizzle: rookerReactions,
    ownedBy: [{ column: rookerReactions.uuid, key: 'mcUuid' }],
    meaning: 'Posts you reacted to.',
  },
  {
    table: 'rotom_rooker_retrinos',
    section: 'social',
    drizzle: rookerRetrinos,
    ownedBy: [{ column: rookerRetrinos.uuid, key: 'mcUuid' }],
    meaning: 'Posts you reshared onto your own timeline.',
  },
  {
    table: 'rotom_rooker_bookmarks',
    section: 'social',
    drizzle: rookerBookmarks,
    ownedBy: [{ column: rookerBookmarks.uuid, key: 'mcUuid' }],
    meaning: 'Posts you bookmarked.',
  },
  {
    table: 'rotom_rooker_follows',
    section: 'social',
    drizzle: rookerFollows,
    // Deliberately `follower_uuid` only. Who YOU follow is a choice you made;
    // who follows you is a choice THEY made, and the row names them.
    ownedBy: [{ column: rookerFollows.followerUuid, key: 'mcUuid' }],
    meaning:
      'Accounts you follow. Your followers are not listed: each of those rows records another person’s decision and identifies them.',
  },

  // ── Economy: bank, marketplace ────────────────────────────────────────────
  {
    table: 'rotom_starbank_user_accounts',
    section: 'economy',
    drizzle: starBankUserAccounts,
    ownedBy: [{ column: starBankUserAccounts.uuid, key: 'mcUuid' }],
    meaning: 'Which bank accounts are yours.',
  },
  {
    table: 'rotom_starbank_accounts',
    section: 'economy',
    drizzle: starBankAccounts,
    ownedBy: [{ column: starBankAccounts.id, key: 'bankAccountIds' }],
    meaning: 'Your bank accounts: name, type and balance.',
  },
  {
    table: 'rotom_starbank_transactions',
    section: 'economy',
    drizzle: starBankTransactions,
    ownedBy: [
      { column: starBankTransactions.fromAccountId, key: 'bankAccountIds' },
      { column: starBankTransactions.toAccountId, key: 'bankAccountIds' },
    ],
    meaning:
      'Your bank statement. The other side of each transfer appears as an account number, the way it does on any statement — never as the other person’s name or uuid.',
  },
  {
    table: 'rotom_wigglypop_listings',
    section: 'economy',
    drizzle: wigglypopListings,
    ownedBy: [{ column: wigglypopListings.sellerUuid, key: 'mcUuid' }],
    meaning: 'Things you listed for sale or trade.',
  },
  {
    table: 'rotom_wigglypop_mon_custody',
    section: 'economy',
    drizzle: wigglypopMonCustody,
    ownedBy: [{ column: wigglypopMonCustody.sellerUuid, key: 'mcUuid' }],
    meaning:
      'Pokémon of yours that are locked because they are currently listed.',
  },
  {
    table: 'rotom_wigglypop_listing_items',
    section: 'economy',
    drizzle: wigglypopListingItems,
    ownedBy: [{ column: wigglypopListingItems.listingId, key: 'listingIds' }],
    meaning: 'The items in your listings.',
  },
  {
    table: 'rotom_wigglypop_listing_mons',
    section: 'economy',
    drizzle: wigglypopListingMons,
    ownedBy: [{ column: wigglypopListingMons.listingId, key: 'listingIds' }],
    // `ot` is the ORIGINAL TRAINER — very often another player's in-game name,
    // carried along on a Pokémon that has changed hands.
    redact: ['ot'],
    meaning: 'The Pokémon in your listings, with their stats and moves.',
  },
  {
    table: 'rotom_wigglypop_orders',
    section: 'economy',
    drizzle: wigglypopOrders,
    ownedBy: [{ column: wigglypopOrders.buyerUuid, key: 'mcUuid' }],
    meaning: 'Orders you placed: totals, fees and status.',
  },
  {
    table: 'rotom_wigglypop_order_lines',
    section: 'economy',
    drizzle: wigglypopOrderLines,
    ownedBy: [
      { column: wigglypopOrderLines.sellerUuid, key: 'mcUuid' },
      { column: wigglypopOrderLines.orderId, key: 'orderIds' },
    ],
    // On a line you BOUGHT this names the seller. On a line you SOLD it is you,
    // and your own uuid is already in the account section.
    redact: ['sellerUuid'],
    meaning: 'The individual lines of your orders, as buyer and as seller.',
  },
  {
    table: 'rotom_wigglypop_bids',
    section: 'economy',
    drizzle: wigglypopBids,
    ownedBy: [{ column: wigglypopBids.bidderUuid, key: 'mcUuid' }],
    meaning: 'Bids you placed on auctions. Rival bids belong to their bidders.',
  },
  {
    table: 'rotom_wigglypop_offers',
    section: 'economy',
    drizzle: wigglypopOffers,
    ownedBy: [{ column: wigglypopOffers.buyerUuid, key: 'mcUuid' }],
    meaning: 'Offers you made on listings, and whether they were accepted.',
  },
  {
    table: 'rotom_wigglypop_trade_offers',
    section: 'economy',
    drizzle: wigglypopTradeOffers,
    ownedBy: [{ column: wigglypopTradeOffers.proposerUuid, key: 'mcUuid' }],
    meaning: 'Trades you proposed, and what you offered.',
  },
  {
    table: 'rotom_wigglypop_watchlist',
    section: 'economy',
    drizzle: wigglypopWatchlist,
    ownedBy: [{ column: wigglypopWatchlist.userUuid, key: 'mcUuid' }],
    meaning: 'Listings you are watching.',
  },
  {
    table: 'rotom_wigglypop_reviews',
    section: 'economy',
    drizzle: wigglypopReviews,
    ownedBy: [{ column: wigglypopReviews.reviewerUuid, key: 'mcUuid' }],
    // Reviews written ABOUT you are the reviewer's words, not your data.
    redact: ['sellerUuid'],
    meaning:
      'Reviews you wrote. Reviews other people wrote about you are their words and are not included.',
  },

  // ── Government (the SmartRotom civic module) ──────────────────────────────
  {
    table: 'rotom_gobierno_multas',
    section: 'government',
    drizzle: gobiernoMultas,
    ownedBy: [{ column: gobiernoMultas.playerUuid, key: 'mcUuid' }],
    redact: ['issuedByUuid'],
    meaning: 'Fines issued to you. The officer who issued each one is not named.',
  },
  {
    table: 'rotom_gobierno_apelaciones',
    section: 'government',
    drizzle: gobiernoApelaciones,
    ownedBy: [{ column: gobiernoApelaciones.playerUuid, key: 'mcUuid' }],
    redact: ['reviewerUuid'],
    meaning: 'Appeals you filed against a fine, and how they were decided.',
  },
  {
    table: 'rotom_gobierno_denuncias',
    section: 'government',
    drizzle: gobiernoDenuncias,
    ownedBy: [
      { column: gobiernoDenuncias.reporterUuid, key: 'mcUuid' },
      { column: gobiernoDenuncias.accusedUuid, key: 'mcUuid' },
    ],
    // Both ends stripped, so a report you FILED does not hand you the accused,
    // and a report ABOUT you does not hand you the reporter.
    redact: ['reporterUuid', 'accusedUuid', 'resolvedByUuid'],
    meaning:
      'Reports you filed and reports filed about you. The other party is never named, in either direction.',
  },
  {
    table: 'rotom_gobierno_buscados',
    section: 'government',
    drizzle: gobiernoBuscados,
    ownedBy: [{ column: gobiernoBuscados.playerUuid, key: 'mcUuid' }],
    redact: ['reportedByUuid', 'capturedByUuid'],
    meaning: 'Times you were placed on the wanted list, and the bounty.',
  },
  {
    table: 'rotom_gobierno_expedientes',
    section: 'government',
    drizzle: gobiernoExpedientes,
    ownedBy: [
      { column: gobiernoExpedientes.subjectUuid, key: 'mcUuid' },
      { column: gobiernoExpedientes.leadUuid, key: 'mcUuid' },
    ],
    redact: ['subjectUuid', 'leadUuid'],
    meaning:
      'Case files opened about you, and case files you led. Neither the subject nor the investigator is named.',
  },
  {
    table: 'rotom_gobierno_bitacora',
    section: 'government',
    drizzle: gobiernoBitacora,
    ownedBy: [{ column: gobiernoBitacora.uuid, key: 'mcUuid' }],
    meaning: 'Patrol log entries you wrote.',
  },
  {
    table: 'rotom_gobierno_patrulla_oficiales',
    section: 'government',
    drizzle: gobiernoPatrullaOficiales,
    ownedBy: [{ column: gobiernoPatrullaOficiales.uuid, key: 'mcUuid' }],
    meaning: 'Patrols you were assigned to.',
  },
  {
    table: 'rotom_gobierno_anuncios',
    section: 'government',
    drizzle: gobiernoAnuncios,
    ownedBy: [{ column: gobiernoAnuncios.authorUuid, key: 'mcUuid' }],
    meaning: 'Public announcements you authored.',
  },
  {
    table: 'rotom_gobierno_carteles',
    section: 'government',
    drizzle: gobiernoCarteles,
    ownedBy: [{ column: gobiernoCarteles.createdByUuid, key: 'mcUuid' }],
    meaning: 'Road signs you created.',
  },
  {
    table: 'rotom_gobierno_megafonia',
    section: 'government',
    drizzle: gobiernoMegafonia,
    ownedBy: [{ column: gobiernoMegafonia.byUuid, key: 'mcUuid' }],
    meaning: 'Public-address messages you broadcast.',
  },
  {
    table: 'rotom_gobierno_eventos',
    section: 'government',
    drizzle: gobiernoEventos,
    ownedBy: [{ column: gobiernoEventos.createdByUuid, key: 'mcUuid' }],
    meaning: 'Civic events you organised.',
  },
  {
    table: 'rotom_gobierno_evento_capturas',
    section: 'government',
    drizzle: gobiernoEventoCapturas,
    ownedBy: [{ column: gobiernoEventoCapturas.uuid, key: 'mcUuid' }],
    meaning: 'Pokémon you caught during a civic event, and the points scored.',
  },
  {
    table: 'rotom_gobierno_evento_votos',
    section: 'government',
    drizzle: gobiernoEventoVotos,
    ownedBy: [{ column: gobiernoEventoVotos.voterUuid, key: 'mcUuid' }],
    meaning: 'Scores you gave when judging a build contest.',
  },
  {
    table: 'rotom_gobierno_subastas',
    section: 'government',
    drizzle: gobiernoSubastas,
    ownedBy: [
      { column: gobiernoSubastas.bidderUuid, key: 'mcUuid' },
      { column: gobiernoSubastas.createdByUuid, key: 'mcUuid' },
    ],
    redact: ['bidderUuid', 'createdByUuid'],
    meaning:
      'Land auctions where you are the leading bidder, or that you opened.',
  },
  {
    table: 'rotom_gobierno_pujas',
    section: 'government',
    drizzle: gobiernoPujas,
    ownedBy: [{ column: gobiernoPujas.uuid, key: 'mcUuid' }],
    meaning: 'Bids you placed at a land auction.',
  },
  {
    table: 'rotom_gobierno_parcela_historial',
    section: 'government',
    drizzle: gobiernoParcelaHistorial,
    ownedBy: [
      { column: gobiernoParcelaHistorial.previousOwnerUuid, key: 'mcUuid' },
      { column: gobiernoParcelaHistorial.newOwnerUuid, key: 'mcUuid' },
    ],
    redact: ['previousOwnerUuid', 'newOwnerUuid'],
    meaning:
      'Plots that came to you or left you. The person on the other side of the transfer is not named.',
  },
  {
    table: 'rotom_gobierno_auditoria',
    section: 'government',
    drizzle: gobiernoAuditoria,
    ownedBy: [{ column: gobiernoAuditoria.actorUuid, key: 'mcUuid' }],
    // `target` is a free-text pointer that frequently holds another player's
    // uuid or name — it is the thing the action was done TO.
    redact: ['target'],
    meaning: 'Civic administration actions you performed.',
  },
];

export const EXCLUDED_TABLES: readonly ExcludedTable[] = [
  // Opt-in desktop telemetry. This is the one table whose exclusion protects
  // the user rather than the system: rows are keyed ONLY by a random
  // per-installation id that is deliberately not tied to an account, so there
  // is no column to match a person against. Adding one to satisfy an export
  // would create exactly the account-linked trail the opt-in promises not to
  // keep. A user who wants the events gone deletes the app's data directory,
  // which retires the id.
  {
    table: 'desktop_telemetry_events',
    reason:
      'Anonymous, opt-in app events keyed by a random install id with no account link. Nothing here can be attributed to a person, so nothing here is personal data to export.',
  },
  // Credentials. Every one of these is a hash or an encrypted secret that still
  // opens the account. None carries a fact about the person that is not already
  // in `boffmedia_users`, and putting a working second factor into a
  // downloadable file is a hole, not a right.
  {
    table: 'boffmedia_password_reset_tokens',
    reason:
      'Hashes of single-use password-reset links. No personal fact beyond the account row; a live one is a takeover risk.',
  },
  {
    table: 'boffmedia_email_verifications',
    reason:
      'Hashes of single-use verification links. The only personal field, the email, is exported under boffmedia_users.',
  },
  {
    table: 'boffmedia_refresh_tokens',
    reason:
      'Session ledger of opaque token ids. Holds no device, IP or location data — only expiry and rotation timestamps.',
  },
  {
    table: 'boffmedia_user_totp',
    reason:
      'The encrypted two-factor shared secret. Exporting it hands over the second factor.',
  },
  {
    table: 'boffmedia_user_backup_codes',
    reason: 'Hashes of two-factor backup codes — a live credential.',
  },

  // Catalogues and site configuration: identical for every user, about nobody.
  { table: 'boffmedia_roles', reason: 'Catalogue of role names.' },
  {
    table: 'boffmedia_achievements',
    reason: 'Catalogue of event achievements.',
  },
  {
    table: 'boffmedia_games',
    reason: 'Catalogue of games an event can be about.',
  },
  {
    table: 'boffmedia_forum_categories',
    reason: 'Catalogue of forum categories.',
  },
  { table: 'desktop_releases', reason: 'Catalogue of desktop-app releases.' },
  { table: 'packs', reason: 'Catalogue of modpacks.' },
  {
    table: 'tools_randomizer_configs',
    reason: 'Randomizer configuration owned by staff, not by a player.',
  },
  {
    table: 'tools_randomizer_roms',
    reason: 'Base ROM registry; no person is referenced.',
  },
  { table: 'tools_tcg_cards', reason: 'Trading-card catalogue.' },
  { table: 'tools_tcg_sets', reason: 'Trading-card set catalogue.' },
  { table: 'tools_tcg_series', reason: 'Trading-card series catalogue.' },
  { table: 'tools_vgc_regulations', reason: 'Competitive-format catalogue.' },
  { table: 'rotom_achievements', reason: 'Catalogue of in-game achievements.' },
  { table: 'rotom_apps', reason: 'Catalogue of Rotom-phone apps.' },
  { table: 'rotom_arceuspeak', reason: 'In-game language strings.' },
  { table: 'rotom_mine_rewards', reason: 'Catalogue of minesweeper prizes.' },
  {
    table: 'rotom_pasaporte_seasons',
    reason: 'Catalogue of passport seasons.',
  },
  {
    table: 'rotom_rooker_hashtags',
    reason:
      'Hashtag index over public posts. Your posts are exported; this is a derived index over them.',
  },
  {
    table: 'rotom_wigglypop_catalog_items',
    reason: 'Marketplace item catalogue.',
  },
  {
    table: 'rotom_gobierno_npc_skins',
    reason: 'NPC appearance configuration.',
  },
  { table: 'rotom_gobierno_tasas', reason: 'Tax-rate configuration.' },
  { table: 'rotom_gobierno_zonas', reason: 'Zoning configuration.' },
  {
    table: 'rotom_gobierno_patrullas',
    reason:
      'Patrol shifts. Whether you staffed one is exported under rotom_gobierno_patrulla_oficiales.',
  },
  {
    table: 'rotom_gobierno_parcelas',
    reason:
      'Plot registry keyed by region, not by person; ownership changes are exported under rotom_gobierno_parcela_historial.',
  },
  {
    table: 'rotom_gobierno_evento_especies',
    reason: 'Spawn tables for a civic event.',
  },
  {
    table: 'rotom_gobierno_evento_obras',
    reason:
      'Builds entered in a contest; the builder list is a shared, community-authored credit rather than a link to an account.',
  },
  {
    table: 'rotom_gobierno_expediente_eventos',
    reason:
      'Timeline entries written by staff inside a case file. The case files themselves are exported, with both parties stripped.',
  },

  // Shared community content: the row exists because a group did something. The
  // user's own part of it is exported from the table that records their
  // participation.
  {
    table: 'boffmedia_events',
    reason:
      'An event is community content; your participation is exported under boffmedia_participants and boffmedia_event_participants.',
  },
  {
    table: 'boffmedia_event_teams',
    reason:
      'A team is shared; your membership is exported under boffmedia_event_team_members.',
  },
  {
    table: 'boffmedia_tournaments',
    reason:
      'A tournament is community content; your entry is exported under boffmedia_tournament_participants.',
  },
  {
    table: 'boffmedia_tournament_phases',
    reason: 'Tournament structure, not a person.',
  },
  {
    table: 'boffmedia_tournament_groups',
    reason: 'Tournament structure, not a person.',
  },
  {
    table: 'boffmedia_tournament_phase_entrants',
    reason:
      'Derived seeding of a phase; your entry is exported under boffmedia_tournament_participants.',
  },
  {
    table: 'boffmedia_tournament_matches',
    reason:
      'A match is a fixture between two entrants and identifies your opponent. Your own entry and your match messages are exported instead.',
  },
  {
    table: 'boffmedia_content_moderation',
    reason:
      'Which piece of content a moderator hid, and who hid it. The content is exported from its own table; the moderator is not yours to receive.',
  },
  {
    table: 'rotom_replays',
    reason:
      'A battle log naming both trainers. Your participation is exported under rotom_user_replays.',
  },
  {
    table: 'rotom_dungeon_runs',
    reason:
      'A shared run; your own line is exported under rotom_dungeon_run_players.',
  },
  {
    table: 'rotom_kart_races',
    reason:
      'A shared race; your own result is exported under rotom_kart_race_players.',
  },
  {
    table: 'rotom_news',
    reason:
      'Editorial site content. The author field is a byline string, not a link to an account.',
  },

  // Scraped third-party data, about competitive players who are not our users.
  {
    table: 'tools_vgc_limitless_teams',
    reason: 'Scraped public tournament results for third-party players.',
  },
  {
    table: 'tools_vgc_limitless_tournaments',
    reason: 'Scraped public tournament metadata.',
  },
  {
    table: 'tools_vgc_pastes_repository',
    reason: 'Scraped public team pastes authored elsewhere.',
  },
  {
    table: 'tools_vgc_pokepastes',
    reason:
      'Public team pastes; the author field is a free-text handle from the source site, not a link to an account.',
  },
  {
    table: 'tools_vgc_smogon_pokemon',
    reason: 'Aggregate usage statistics; no individual is identifiable.',
  },
  {
    table: 'tools_vgc_smogon_snapshots',
    reason: 'Aggregate usage statistics; no individual is identifiable.',
  },

  // Machinery.
  {
    table: 'boffmedia_outbox',
    reason:
      'Transient side-effect queue. Rows are deleted 30 days after delivery and only ever hold a copy of data already exported from the table it came from.',
  },
  {
    table: 'boffmedia_data_exports',
    reason:
      'The record of these export requests themselves. Reported to you as the status of your request rather than as rows inside it.',
  },
];
