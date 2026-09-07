import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ChatBubble,
  ChatDivider,
  MessageList,
  LoadingState,
  ErrorState,
  IconSend,
  IconArrowLeft,
  formatTime,
} from '@prioritizz/ui';
import { useI18n, useT } from '@prioritizz/i18n';
import type { ChatMessage } from '@prioritizz/types';
import { api } from '../lib/api';
import { haptic, useViewportInset } from '../lib/telegram';

const DAY_MS = 86_400_000;

function dayLabel(iso: string, t: ReturnType<typeof useT>, locale: string): string {
  const d = new Date(iso);
  const today = new Date();
  const startOf = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const delta = (startOf(today) - startOf(d)) / DAY_MS;
  if (delta === 0) return t('chat.today');
  if (delta === 1) return t('chat.yesterday');
  return d.toLocaleDateString(locale, { day: 'numeric', month: 'long' });
}

export default function ChatPage() {
  const t = useT();
  const { locale } = useI18n();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { id = '' } = useParams();
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const keyboardInset = useViewportInset();

  // Poll while the chat is open; TanStack pauses it when the tab is hidden.
  const chat = useQuery({
    queryKey: ['chat', id],
    queryFn: () => api.chat.list(id, { limit: 100 }),
    refetchInterval: 3500,
  });

  // Mark the peer's messages read whenever a fresh batch lands.
  useEffect(() => {
    if (chat.data && chat.data.unread > 0) {
      api.chat.markRead(id).then(() => qc.invalidateQueries({ queryKey: ['orders'] }));
    }
  }, [chat.data, id, qc]);

  const send = useMutation({
    mutationFn: (body: string) => api.chat.send(id, { body, attachmentIds: [] }),
    onMutate: () => haptic('light'),
    onSuccess: (msg) => {
      qc.setQueryData?.(['chat', id], (prev: typeof chat.data) =>
        prev ? { ...prev, items: [...prev.items, msg] } : prev,
      );
      setDraft('');
      void chat.refetch();
    },
  });

  const submit = () => {
    const body = draft.trim();
    if (!body || send.isPending) return;
    send.mutate(body);
    inputRef.current?.focus();
  };

  if (chat.isLoading) return <LoadingState label={t('common.loading')} />;
  if (chat.isError)
    return (
      <ErrorState
        title={t('common.somethingWrong')}
        onRetry={() => chat.refetch()}
        retryLabel={t('common.retry')}
      />
    );

  const items = chat.data?.items ?? [];

  return (
    <div className="flex flex-col" style={{ minHeight: 'calc(100vh - 7rem)' }}>
      <header className="mb-3 flex items-center gap-2">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label={t('common.back')}
          className="grid h-9 w-9 place-items-center rounded-full bg-grouped text-foreground active:scale-90"
        >
          <IconArrowLeft size={18} />
        </button>
        <h1 className="title-2 truncate">{t('chat.title')}</h1>
      </header>

      <div className="flex-1 overflow-y-auto pb-3">
        {items.length === 0 ? (
          <p className="py-10 text-center text-subhead text-subtle">{t('chat.empty')}</p>
        ) : (
          <MessageList>
            {items.map((m: ChatMessage, i) => {
              const prev = items[i - 1];
              const showDay =
                !prev ||
                new Date(prev.createdAt).toDateString() !== new Date(m.createdAt).toDateString();
              return (
                <div key={m.id}>
                  {showDay && <ChatDivider label={dayLabel(m.createdAt, t, locale)} />}
                  <ChatBubble
                    mine={m.mine}
                    time={formatTime(m.createdAt, locale)}
                    read={!!m.readAt}
                  >
                    {m.body}
                  </ChatBubble>
                </div>
              );
            })}
          </MessageList>
        )}
      </div>

      {/* Composer sits above the keyboard via the Telegram viewport inset. */}
      <div
        className="material-thick sticky bottom-0 -mx-4 flex items-end gap-2 border-t border-separator px-4 py-2"
        style={{ paddingBottom: `calc(0.5rem + ${keyboardInset}px)` }}
      >
        <textarea
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          rows={1}
          placeholder={t('chat.placeholder')}
          className="field max-h-28 min-h-touch flex-1 resize-none py-2.5"
        />
        <button
          type="button"
          onClick={submit}
          disabled={!draft.trim() || send.isPending}
          aria-label={t('chat.send')}
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground transition-transform active:scale-90 disabled:opacity-40"
        >
          <IconSend size={18} />
        </button>
      </div>
    </div>
  );
}
