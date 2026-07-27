import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/primitives/card";
import { Button } from "@/components/ui/primitives/button";
import { Home, AlertCircle } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { BackgroundDecorations } from "@/app/wingull/_components/BackgroundDecorations";

export default async function InvitacionNoEncontrada({ id }: { id: string }) {
  const t = await getTranslations("wingull.inviteNotFound");

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      <BackgroundDecorations />
      <Card className="w-full max-w-2xl shadow-xl bg-secondary-soft bg-opacity-70 text-white rounded-xl overflow-hidden relative z-10">
        <CardHeader className="border-b border-secondary-active">
          <CardTitle className="text-2xl font-bold text-yellow-300">
            {t("title")}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4 text-secondary-hover">
            <p className="text-lg">{t("lead", { id })}</p>
            <p>{t("reasonsIntro")}</p>
            <ul className="list-disc list-inside space-y-2">
              <li>{t("reasonExpired")}</li>
              <li>{t("reasonWrongId")}</li>
              <li>{t("reasonDeleted")}</li>
            </ul>
            <p>{t("outro")}</p>
          </div>
          <div className="flex justify-center space-x-4 mt-8">
            <Link href="/contacto">
              <Button className="bg-yellow-300 text-secondary-active hover:bg-yellow-400 px-6 py-2 rounded-lg text-lg font-semibold transition-all duration-300 transform hover:scale-105">
                <AlertCircle className="mr-2 h-5 w-5" />
                {t("contactSupport")}
              </Button>
            </Link>
            <Link href="/">
              <Button
                variant="ghost"
                className="text-secondary-hover border-secondary-active hover:bg-secondary-active hover:text-yellow-300 px-6 py-2 rounded-lg text-lg font-semibold transition-all duration-300"
              >
                <Home className="mr-2 h-5 w-5" />
                {t("backHome")}
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
