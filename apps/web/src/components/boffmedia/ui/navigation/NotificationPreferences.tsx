'use client'

import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import { NotificationsService, NotificationPreference } from '@/services/api/boffmedia/notificationsService'
import { Button } from '@/components/ui/primitives/button'
import { Checkbox } from '@/components/ui/primitives/checkbox'
import { Label } from '@/components/ui/primitives/label'

interface NotificationPreferencesProps {
  onClose?: () => void
}

/** Notification preferences editor. Shows all notification types with mute/email opt-out toggles. */
export function NotificationPreferences({ onClose }: NotificationPreferencesProps) {
  const t = useTranslations()
  const [preferences, setPreferences] = useState<NotificationPreference[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)

  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const response = await NotificationsService.getPreferences()
        if (response.success && response.data) {
          setPreferences(response.data.preferences)
        }
      } catch (error) {
        console.error('Failed to load notification preferences:', error)
      } finally {
        setLoading(false)
      }
    }

    loadPreferences()
  }, [])

  const handleToggleMute = async (type: string, isMuted: boolean) => {
    setSaving(type)
    try {
      const response = await NotificationsService.updatePreference(
        type as any,
        !isMuted,
      )
      if (response.success && response.data) {
        setPreferences((prev) =>
          prev.map((p) =>
            p.type === type ? { ...p, isMuted: !isMuted } : p,
          ),
        )
      }
    } catch (error) {
      console.error(`Failed to update preference for ${type}:`, error)
    } finally {
      setSaving(null)
    }
  }

  if (loading) {
    return <div className="p-4 text-sm text-muted-foreground">{t('common.primitives.loading')}</div>
  }

  return (
    <div className="space-y-4 p-4">
      <div className="space-y-1">
        <h3 className="font-semibold text-sm">{t('notifications.preferences')}</h3>
        <p className="text-xs text-muted-foreground">
          {t('notifications.preferences_description')}
        </p>
      </div>

      <div className="space-y-3 border-t pt-3">
        {preferences.map((pref) => (
          <div key={pref.type} className="space-y-2">
            <div className="font-medium text-sm capitalize">
              {t(`notifications.type_${pref.type}`)}
            </div>

            <div className="ml-2 space-y-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  id={`mute-${pref.type}`}
                  checked={pref.isMuted}
                  onCheckedChange={() => handleToggleMute(pref.type, pref.isMuted)}
                  disabled={saving === pref.type}
                />
                <Label
                  htmlFor={`mute-${pref.type}`}
                  className="text-xs font-normal cursor-pointer"
                >
                  {t('notifications.mute_this_type')}
                </Label>
              </div>
            </div>
          </div>
        ))}
      </div>

      {onClose && (
        <Button
          variant="outline"
          size="sm"
          onClick={onClose}
          className="w-full"
        >
          {t('common.primitives.close')}
        </Button>
      )}
    </div>
  )
}
