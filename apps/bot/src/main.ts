import { Telegraf } from 'telegraf';
import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import { loadDotenv, loadEnv } from '@prioritizz/config';
import { QUEUES } from '@prioritizz/constants';

// Standalone process: no Nest ConfigModule, so pull the monorepo .env in first.
loadDotenv(__dirname);

/**
 * Standalone bot process. Responsibilities:
 *  - Telegram webhook / long-poll (commands, deep links, MainButton flows)
 *  - consume NOTIFICATIONS queue → push messages to users
 *  - consume GIFT_DELIVERY queue → deliver Telegram gifts
 * It talks to the API over internal REST for anything stateful.
 */
async function main() {
  const env = loadEnv();

  // Some hosts (e.g. RU datacenters) block api.telegram.org outright. Point the
  // Bot API at a relay (Cloudflare Worker etc.) via TELEGRAM_API_ROOT when so.
  const apiRoot = env.TELEGRAM_API_ROOT?.replace(/\/+$/, '');
  const bot = new Telegraf(env.TELEGRAM_BOT_TOKEN, apiRoot ? { telegram: { apiRoot } } : undefined);
  if (apiRoot) console.log(`Bot API relay: ${apiRoot}`);

  const connection = new IORedis(env.REDIS_URL, { maxRetriesPerRequest: null });

  // Telegram only accepts https for web_app buttons, so a localhost dev URL
  // falls back to a plain message instead of a broken button.
  const canOpenMiniApp = env.MINI_APP_URL.startsWith('https://');

  bot.start((ctx) => {
    if (!canOpenMiniApp) {
      return ctx.reply(
        `Prioritizz\n\nMini App пока доступен только локально (${env.MINI_APP_URL}).\n` +
          'Telegram открывает Mini App только по https — поднимите туннель и укажите его в MINI_APP_URL.\n\n' +
          'Команда /id покажет ваш числовой Telegram ID.',
      );
    }
    return ctx.reply('Добро пожаловать в Prioritizz. Откройте Mini App, чтобы продолжить.', {
      reply_markup: {
        inline_keyboard: [[{ text: 'Открыть Prioritizz', web_app: { url: env.MINI_APP_URL } }]],
      },
    });
  });

  /** Prints the caller's numeric id — used to pin ADMIN_TELEGRAM_ALLOWLIST. */
  bot.command('id', (ctx) =>
    ctx.reply(
      `Ваш Telegram ID: ${ctx.from.id}\n` +
        `Username: ${ctx.from.username ? '@' + ctx.from.username : '—'}\n\n` +
        'Впишите ID в ADMIN_TELEGRAM_ALLOWLIST — это надёжнее username.',
    ),
  );

  bot.command('help', (ctx) =>
    ctx.reply('/start — открыть Mini App\n/id — показать ваш Telegram ID\n/help — эта справка'),
  );

  // Best-effort: a blocked/slow api.telegram.org must not crash-loop the process
  // (the queue workers below still matter). It retries on the next restart.
  try {
    await bot.telegram.setMyCommands([
      { command: 'start', description: 'Открыть Prioritizz' },
      { command: 'id', description: 'Показать мой Telegram ID' },
      { command: 'help', description: 'Справка' },
    ]);
  } catch (err) {
    console.error(`setMyCommands failed (Telegram unreachable?): ${(err as Error).message}`);
  }

  new Worker(
    QUEUES.NOTIFICATIONS,
    async (job) => {
      const { telegramId, text } = job.data as { telegramId: number; text: string };
      await bot.telegram.sendMessage(telegramId, text);
    },
    { connection, prefix: env.BULLMQ_PREFIX },
  );

  new Worker(
    QUEUES.GIFT_DELIVERY,
    async (job) => {
      // Placeholder: real gift delivery via Telegram gift API lands in M4.
      // eslint-disable-next-line no-console
      console.log('gift-delivery job', job.id, job.data);
    },
    { connection, prefix: env.BULLMQ_PREFIX },
  );

  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));

  // launch() only resolves once polling stops, so announce readiness first.
  try {
    const me = await bot.telegram.getMe();
    // eslint-disable-next-line no-console
    console.log(`Bot @${me.username} polling (mini app: ${env.MINI_APP_URL})`);
  } catch (err) {
    console.error(`getMe failed (Telegram unreachable?): ${(err as Error).message}`);
  }

  // If Telegram is unreachable, launch() rejects immediately. Keep the process
  // (and its queue workers) alive and retry polling on a slow loop rather than
  // exiting into a crash-loop.
  const launchWithRetry = async () => {
    for (;;) {
      try {
        await bot.launch();
        return; // resolves only on a clean stop
      } catch (err) {
        console.error(`bot.launch failed, retrying in 60s: ${(err as Error).message}`);
        await new Promise((r) => setTimeout(r, 60_000));
      }
    }
  };
  void launchWithRetry();
}

void main();
