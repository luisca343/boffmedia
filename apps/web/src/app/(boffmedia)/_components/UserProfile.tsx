"use client"

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/primitives/button";
import { Input } from "@/components/ui/primitives/input";
import { Label } from "@/components/ui/primitives/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/primitives/avatar";
import {
  Camera,
  Gamepad2,
  LinkIcon,
  Loader2,
  User,
  Mail,
  Shield,
  Wifi,
} from "lucide-react";
import useSocketStore from "@/stores/useSocketStore";
import { useBoffSession } from "@/services/useBoffSession";
import { UploadService } from "@/services/api/smartrotom/uploadService";
import { UsersService } from "@/services/api/boffmedia/usersService";
import { FloatingBackground } from "./layout/FloatingBackground";
import { BoffContainer } from "@components/boffmedia/tools/BoffContainer";
import { ToolSectionHeader } from "@components/boffmedia/tools/ToolSectionHeader";

// ─── Shared boff token shorthand ─────────────────────────────────────────────

const N = {
  border:       "rgba(249,115,22,0.22)",
  borderStrong: "rgba(249,115,22,0.4)",
  bg:           "rgba(249,115,22,0.07)",
  bgHover:      "rgba(249,115,22,0.12)",
  text:         "rgb(251,146,60)",
  glow:         "drop-shadow(0 0 6px rgba(249,115,22,0.45))",
};

const MC = {
  border: "rgba(132,204,22,0.22)",
  bg:     "rgba(132,204,22,0.07)",
  text:   "rgb(163,230,53)",
  glow:   "drop-shadow(0 0 6px rgba(132,204,22,0.45))",
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function BoffDivider() {
  return (
    <div
      className="h-px"
      style={{ background: "linear-gradient(90deg, transparent, rgba(249,115,22,0.12), transparent)" }}
    />
  );
}

function StatusChip({
  icon,
  label,
  active,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
}) {
  const base = active === undefined;
  return (
    <div
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono"
      style={{
        border: `1px solid ${base ? N.border : active ? "rgba(34,197,94,0.25)" : "rgba(71,85,105,0.35)"}`,
        background: base ? N.bg : active ? "rgba(34,197,94,0.08)" : "rgba(71,85,105,0.08)",
        color: base ? N.text : active ? "rgba(74,222,128,0.9)" : "rgba(100,116,139,0.8)",
      }}
    >
      {active !== undefined && (
        <span
          className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${active ? "bg-success-400 animate-pulse" : "bg-surface-600"}`}
        />
      )}
      {icon}
      {label}
    </div>
  );
}

function IntegrationCard({
  icon,
  title,
  description,
  linked,
  onLink,
  buttonLabel,
  boff,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  linked: boolean;
  onLink?: () => void;
  buttonLabel: string;
  boff: typeof N | typeof MC;}) {
  return (
    <div
      className="flex items-center justify-between gap-4 p-4 rounded-lg border transition-colors duration-200"
      style={{ borderColor: boff.border, background: boff.bg }}
    >
      <div className="flex items-center gap-3.5 min-w-0">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{
            border: `1px solid ${boff.border}`,
            background: "rgba(15,23,42,0.6)",
            boxShadow: `0 0 14px rgba(0,0,0,0.3)`,
          }}
        >
          <span style={{ color: boff.text, filter: boff.glow }}>{icon}</span>
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-surface-100 leading-tight">{title}</p>
          <p className="text-xs text-surface-500 mt-0.5 truncate">{description}</p>
        </div>
      </div>

      {linked ? (
        <div
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono flex-shrink-0"
          style={{
            border: "1px solid rgba(34,197,94,0.25)",
            background: "rgba(34,197,94,0.08)",
            color: "rgba(74,222,128,0.9)",
          }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-success-400" />
          Vinculado
        </div>
      ) : (
        <Button
          onClick={onLink}
          variant="outline"
          size="sm"
          className="flex-shrink-0 font-mono text-xs tracking-wider h-8 px-3 transition-all duration-150"
          style={{
            borderColor: boff.border,
            color: boff.text,
            background: "transparent",
          }}
        >
          <LinkIcon className="w-3 h-3 mr-1.5" />
          {buttonLabel}
        </Button>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function UserProfile() {
  const { session, refreshSession } = useBoffSession();
  const socket = useSocketStore((state) => state.socket);
  const user = session?.user;

  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState(user || {});
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) setEditedUser(user);
  }, [user]);

  const linkDiscord = async () => {
    console.log("Linking Discord account...");
    setTimeout(() => {
      setEditedUser((prev) => ({ ...prev, discordLinked: true }));
    }, 2000);
  };

  const handleSave = () => {
    console.log("Saving user data:", editedUser);
    setIsEditing(false);
  };

  const handleImageClick = () => {
    if (!isUploading) fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    setIsUploading(true);
    try {
      const uploadResponse = await UploadService.uploadProfileImage(file, user?.id || "default");
      if (!uploadResponse.data?.url) {
        setUploadError("Upload failed: No response data");
        return;
      }
      const imageUrl = uploadResponse.data.url;
      await UsersService.updateUser(Number(user?.id), { profilePicture: imageUrl } as any);
      setEditedUser((prev) => ({ ...prev, image: imageUrl }));
      await refreshSession();
    } catch (err) {
      setUploadError("Upload failed: " + (err instanceof Error ? err.message : "Unknown error"));
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // ── Not logged in ──────────────────────────────────────────────────────────

  if (!user) {
    return (
      <div className="relative min-h-screen bg-surface-950 overflow-hidden">
        <FloatingBackground variant="cool" />
        <div className="relative container mx-auto px-4 py-16 z-10 flex items-center justify-center">
          <div className="w-full max-w-sm">
            <BoffContainer variant="primary" contentClassName="p-10 flex flex-col items-center text-center gap-4">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ background: N.bg, border: `1px solid ${N.border}` }}
              >
                <User className="h-8 w-8" style={{ color: N.text, filter: N.glow }} />
              </div>
              <div>
                <h1
                  className="text-xl font-black text-surface-50 mb-1"
                  style={{ fontFamily: "Orbitron, sans-serif" }}
                >
                  Acceso Requerido
                </h1>
                <p className="text-sm text-surface-500">
                  Inicia sesión para ver tu perfil.
                </p>
              </div>
            </BoffContainer>
          </div>
        </div>
      </div>
    );
  }

  // ── Logged in ──────────────────────────────────────────────────────────────

  return (
    <div className="relative min-h-screen bg-surface-950 overflow-hidden">
      <FloatingBackground variant="warm" />

      <div className="relative container mx-auto px-4 py-8 z-10">
        <div className="max-w-3xl mx-auto">
          <BoffContainer variant="primary" contentClassName="p-7 sm:p-9 space-y-8">

            {/* ── Header: avatar + identity ── */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-7">

              {/* Avatar */}
              <div className="flex flex-col items-center gap-3 flex-shrink-0">
                <div
                  className="relative group cursor-pointer"
                  onClick={handleImageClick}
                >
                  {/* Gradient ring */}
                  <div
                    className="p-[2px] rounded-full"
                    style={{
                      background: `linear-gradient(135deg, rgba(249,115,22,0.9), rgba(251,146,60,0.3), rgba(249,115,22,0.9))`,
                    }}
                  >
                    <div className="p-0.5 rounded-full bg-surface-950">
                      <Avatar className="w-28 h-28">
                        <AvatarImage
                          src={editedUser.image || user?.image || "/placeholder.svg?height=112&width=112"}
                          alt={editedUser.name || "User"}
                          className="object-cover"
                        />
                        <AvatarFallback
                          className="text-3xl font-black"
                          style={{ background: N.bg, color: N.text }}
                        >
                          {editedUser.name ? editedUser.name.charAt(0).toUpperCase() : "U"}
                        </AvatarFallback>

                        {/* Hover overlay */}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-full flex items-center justify-center">
                          <Camera className="w-7 h-7 text-white" />
                        </div>

                        {/* Upload overlay */}
                        {isUploading && (
                          <div className="absolute inset-0 bg-black/70 rounded-full flex items-center justify-center">
                            <Loader2 className="w-7 h-7 text-white animate-spin" />
                          </div>
                        )}
                      </Avatar>
                    </div>
                  </div>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileChange}
                />

                {uploadError && (
                  <p className="text-xs text-error-400 bg-error-950/50 px-3 py-1 rounded border border-error-800/50 max-w-[8rem] text-center">
                    {uploadError}
                  </p>
                )}
              </div>

              {/* Identity */}
              <div className="flex-1 text-center sm:text-left">
                <h2
                  className="text-2xl sm:text-3xl font-black text-surface-50 leading-tight mb-1"
                  style={{
                    fontFamily: "Orbitron, sans-serif",
                    filter: "drop-shadow(0 0 14px rgba(249,115,22,0.25))",
                  }}
                >
                  {editedUser.name || "Anonymous"}
                </h2>
                <p className="text-sm text-surface-400 mb-4">
                  {editedUser.email || "No email provided"}
                </p>

                {/* Status chips */}
                <div className="flex flex-wrap justify-center sm:justify-start gap-2">
                  <StatusChip
                    icon={<Shield className="w-3 h-3" />}
                    label={user.roles?.join(", ") || "No roles"}
                  />
                  <StatusChip
                    icon={<Wifi className="w-3 h-3" />}
                    label={socket ? "Online" : "Offline"}
                    active={!!socket}
                  />
                </div>
              </div>
            </div>

            <BoffDivider />

            {/* ── Profile settings ── */}
            <div>
              <ToolSectionHeader label="Datos de perfil" color="primary" />

              <div className="grid sm:grid-cols-2 gap-5">
                {[
                  { id: "name", label: "Nombre", icon: <User className="h-3 w-3" />, field: "name", type: "text" },
                  { id: "email", label: "Email", icon: <Mail className="h-3 w-3" />, field: "email", type: "email" },
                ].map(({ id, label, icon, field, type }) => (
                  <div key={id} className="space-y-1.5">
                    <Label
                      htmlFor={id}
                      className="text-xs font-mono text-surface-500 flex items-center gap-1.5 tracking-widest uppercase"
                    >
                      {icon}
                      {label}
                    </Label>
                    <Input
                      id={id}
                      type={type}
                      value={(editedUser as any)[field] || ""}
                      onChange={(e) =>
                        setEditedUser((prev) => ({ ...prev, [field]: e.target.value }))
                      }
                      disabled={!isEditing}
                      className="bg-surface-900 border-surface-700/60 text-surface-100 placeholder:text-surface-600 disabled:opacity-50 disabled:cursor-default focus:border-primary-500/50 h-9 text-sm"
                    />
                  </div>
                ))}
              </div>
            </div>

            <BoffDivider />

            {/* ── Connections ── */}
            <div>
              <ToolSectionHeader label="Conexiones" color="primary" />

              <div className="space-y-3">
                <IntegrationCard
                  icon={<Gamepad2 className="h-5 w-5" />}
                  title="Discord Account"
                  description="Conecta tu cuenta para funciones adicionales"
                  linked={!!(editedUser as any).discordId}
                  onLink={linkDiscord}
                  buttonLabel="Vincular"
                  boff={N}
                />
                <IntegrationCard
                  icon={<User className="h-5 w-5" />}
                  title="Minecraft Account"
                  description="Vincula tu cuenta para acceder a los servidores"
                  linked={!!(user.mcUuid || user.smartRotomUser?.uuid)}
                  buttonLabel="Vincular"
                  boff={MC}
                />
              </div>
            </div>

            <BoffDivider />

            {/* ── Actions ── */}
            <div>
              {isEditing ? (
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    onClick={handleSave}
                    className="flex-1 h-10 font-mono text-sm tracking-widest uppercase transition-all duration-200"
                    style={{
                      fontFamily: "Orbitron, sans-serif",
                      background: "rgba(249,115,22,0.15)",
                      borderColor: N.borderStrong,
                      color: N.text,
                      boxShadow: "0 0 20px rgba(249,115,22,0.12)",
                    }}
                    variant="outline"
                  >
                    Guardar cambios
                  </Button>
                  <Button
                    onClick={() => setIsEditing(false)}
                    variant="ghost"
                    className="sm:w-36 h-10 font-mono text-sm text-surface-400 hover:text-surface-200 hover:bg-surface-800/50 transition-colors duration-150"
                  >
                    Cancelar
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={() => setIsEditing(true)}
                  className="w-full h-10 font-mono text-sm tracking-widest uppercase transition-all duration-200"
                  style={{
                    fontFamily: "Orbitron, sans-serif",
                    background: N.bg,
                    borderColor: N.border,
                    color: N.text,
                  }}
                  variant="outline"
                >
                  Editar perfil
                </Button>
              )}
            </div>

          </BoffContainer>
        </div>
      </div>
    </div>
  );
}
