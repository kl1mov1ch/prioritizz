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
  const bot = new Telegraf(env.TELEGRAM_BOT_TOKEN);
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

  await bot.telegram.setMyCommands([
    { command: 'start', description: 'Открыть Prioritizz' },
    { command: 'id', description: 'Показать мой Telegram ID' },
    { command: 'help', description: 'Справка' },
  ]);

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
  const me = await bot.telegram.getMe();
  // eslint-disable-next-line no-console
  console.log(`Bot @${me.username} polling (mini app: ${env.MINI_APP_URL})`);
  await bot.launch();
}

void main();
