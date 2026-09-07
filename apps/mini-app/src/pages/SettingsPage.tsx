import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AvatarPicker,
  Button,
  Card,
  Field,
  GroupedList,
  GroupedRow,
  Input,
  Switch,
  ThemeToggle,
  initialsOf,
  IconLogout,
} from '@prioritizz/ui';
import { LanguageToggle, useT } from '@prioritizz/i18n';
import { api } from '../lib/api';
import { useAuthStore } from '../lib/auth-store';
import { compressImage } from '../lib/image';
import { haptic, notify } from '../lib/telegram';

type Prefs = { orderUpdates?: boolean; chatMessages?: boolean; marketing?: boolean };

export default function SettingsPage() {
  const t = useT();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const storeUser = useAuthStore((s) => s.user);
  const setSession = useAuthStore((s) => s.setSession);
  const clear = useAuthStore((s) => s.clear);

  const profile = useQuery({ queryKey: ['me'], queryFn: () => api.me.get() });
  const me = profile.data;

  const [firstName, setFirstName] = useState<string | null>(null);
  const [lastName, setLastName] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [avatarBusy, setAvatarBusy] = useState(false);

  const fName = firstName ?? me?.firstName ?? '';
  const lName = lastName ?? me?.lastName ?? '';
  const mail = email ?? me?.contactEmail ?? '';
  const prefs = (me?.notificationPrefs ?? {}) as Prefs;

  const save = useMutation({
    mutationFn: (patch: Parameters<typeof api.me.update>[0]) => api.me.update(patch),
    onSuccess: (updated) => {
      notify('success');
      qc.setQueryData(['me'], updated);
      // Keep the auth-store user (drives avatar/name across the app) in sync.
      if (storeUser) {
        setSession(
          {
            ...storeUser,
            firstName: updated.firstName,
            lastName: updated.lastName,
            photoUrl: updated.photoUrl,
          },
          useAuthStore.getState().tokens!,
        );
      }
    },
  });

  const syncTgAvatar = useMutation({
    mutationFn: () => api.me.syncAvatarFromTelegram(),
    onSuccess: (updated) => {
      haptic('medium');
      qc.setQueryData(['me'], updated);
      if (storeUser)
        setSession({ ...storeUser, photoUrl: updated.photoUrl }, useAuthStore.getState().tokens!);
    },
  });

  async function pickAvatar(file: File) {
    setAvatarBusy(true);
    try {
      const blob = await compressImage(file, { maxEdge: 512 });
      const att = await api.media.upload(blob, 'USER', file.name);
      await save.mutateAsync({ avatarAttachmentId: att.id });
    } finally {
      setAvatarBusy(false);
    }
  }

  const togglePref = (key: keyof Prefs) => (value: boolean) =>
    save.mutate({ notificationPrefs: { ...prefs, [key]: value } });

  const dirtyAccount =
    fName !== (me?.firstName ?? '') ||
    lName !== (me?.lastName ?? '') ||
    mail !== (me?.contactEmail ?? '');

  return (
    <div className="space-y-4">
      <h1 className="title-large">{t('settings.title')}</h1>

      <Card className="flex flex-col items-center gap-3 py-6">
        <AvatarPicker
          src={me?.photoUrl}
          initials={initialsOf(fName, lName)}
          onPick={(f) => void pickAvatar(f)}
          busy={avatarBusy || save.isPending}
          label={t('settings.changePhoto')}
        />
        <Button
          size="sm"
          variant="plain"
          loading={syncTgAvatar.isPending}
          onClick={() => syncTgAvatar.mutate()}
        >
          {t('settings.fromTelegram')}
        </Button>
      </Card>

      <Card flush className="overflow-hidden">
        <p className="px-4 pb-2 pt-4 text-footnote font-semibold text-muted">
          {t('settings.account')}
        </p>
        <div className="space-y-3 px-4 pb-4">
          <Field label={t('settings.firstName')}>
            <Input value={fName} onChange={(e) => setFirstName(e.target.value)} />
          </Field>
          <Field label={t('settings.lastName')}>
            <Input value={lName} onChange={(e) => setLastName(e.target.value)} />
          </Field>
          <Field label={t('settings.email')} hint={t('settings.emailHint')}>
            <Input
              type="email"
              inputMode="email"
              value={mail}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>
          <Button
            size="block"
            disabled={!dirtyAccount}
            loading={save.isPending}
            onClick={() =>
              save.mutate({
                firstName: fName || undefined,
                lastName: lName || null,
                contactEmail: mail || null,
              })
            }
          >
            {t('common.save')}
          </Button>
        </div>
      </Card>

      <Card flush className="overflow-hidden">
        <p className="px-4 pb-2 pt-4 text-footnote font-semibold text-muted">
          {t('settings.appearance')}
        </p>
        <GroupedList className="rounded-none bg-transparent">
          <GroupedRow>
            <span className="text-subhead">{t('common.language')}</span>
            <LanguageToggle />
          </GroupedRow>
          <GroupedRow>
            <span className="text-subhead">{t('common.theme')}</span>
            <ThemeToggle labels={{ light: t('common.themeLight'), dark: t('common.themeDark') }} />
          </GroupedRow>
        </GroupedList>
      </Card>

      <Card flush className="overflow-hidden">
        <p className="px-4 pb-2 pt-4 text-footnote font-semibold text-muted">
          {t('settings.notifications')}
        </p>
        <GroupedList className="rounded-none bg-transparent">
          <GroupedRow>
            <span className="text-subhead">{t('settings.notifyOrderUpdates')}</span>
            <Switch
              checked={prefs.orderUpdates !== false}
              onChange={togglePref('orderUpdates')}
              label={t('settings.notifyOrderUpdates')}
            />
          </GroupedRow>
          <GroupedRow>
            <span className="text-subhead">{t('settings.notifyChat')}</span>
            <Switch
              checked={prefs.chatMessages !== false}
              onChange={togglePref('chatMessages')}
              label={t('settings.notifyChat')}
            />
          </GroupedRow>
          <GroupedRow>
            <span className="text-subhead">{t('settings.notifyMarketing')}</span>
            <Switch
              checked={prefs.marketing === true}
              onChange={togglePref('marketing')}
              label={t('settings.notifyMarketing')}
            />
          </GroupedRow>
        </GroupedList>
      </Card>

      <Button
        variant="grouped"
        size="block"
        className="text-tint-red"
        onClick={() => {
          api.auth.logout().catch(() => undefined);
          clear();
          navigate('/catalog', { replace: true });
        }}
      >
        <IconLogout size={16} />
        {t('settings.signOut')}
      </Button>
    </div>
  );
}
