import { Telegraf } from 'telegraf';
import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import { loadEnv } from '@prioritizz/config';
import { QUEUES } from '@prioritizz/constants';

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

  bot.start((ctx) =>
    ctx.reply('Добро пожаловать в Prioritizz. Откройте Mini App, чтобы продолжить.', {
      reply_markup: {
        inline_keyboard: [[{ text: 'Открыть Prioritizz', web_app: { url: env.MINI_APP_URL } }]],
      },
    }),
  );

  bot.command('help', (ctx) => ctx.reply('Поддержка: откройте раздел «Поддержка» в Mini App.'));

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

  await bot.launch();
  // eslint-disable-next-line no-console
  console.log('Bot started');

  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));
}

void main();
