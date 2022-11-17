require('dotenv').config();
const http = require('http');
const Sentry = require('@sentry/node');

const { provider, contracts } = require('./db/provider');
const Endpoints = require('./api/endpoints');
const Sockets = require('./api/sockets');
const Dungeon = require('./game/dungeon');
const HashBot = require('./workers/hashbot');
const Leaderboard = require('./db/leaderboard');

console.log('starting ethernal-cache', process.env.COMMIT || 'dev');

// Initialize Sentry
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  serverName: process.env.HEROKU_APP_NAME,
  release: process.env.HEROKU_SLUG_COMMIT,
});

// Init Express server
const { PORT = 3399 } = process.env;

async function start() {
  Sentry.addBreadcrumb({ category: 'cache-server', message: 'Loading cache server' });
  const endpoints = new Endpoints();
  console.log("Setting up server...")
  const server = http.createServer(endpoints.app);
  const sockets = new Sockets(server);
  console.log(`Sockets: ${sockets}`)


  // Get latest block
  try {
    console.log("Getting latest block...")
    await provider.getBlockNumber();
  } catch (err) {
    console.log('eth connection failed:', err.message);
    Sentry.captureException(err);
    await Sentry.close();
    process.exit(1);
  }

  // Setup bot
  console.log("Setting up Sentry bot...")
  Sentry.addBreadcrumb({ category: 'bot', message: 'Loading bot components' });

  // Setup leaderboard
  console.log("Setting up leaderboard...")
  const leaderboard = new Leaderboard(process.env.LEADERBOARD || 'ethernal-local-leaderboard');
  await leaderboard.init(skip=true);


  // Setup contracts
  console.log("Setting up contracts...")
  const c = await contracts();

  // Setup dungeon
  console.log("Setting up dungeon...")
  const dungeon = new Dungeon(c, sockets, leaderboard);

  let preListener;
  if (process.env.PRE_SERVER) {
    const { app } = new Endpoints(true).connectDungeon(dungeon);
    preListener = http.createServer(app).listen(PORT, async () => {
      console.log(`cache loading and pre server running on port ${PORT}`);
    });
  }

  console.log("Initializing dungeon...")
  await dungeon.init();
  console.log("Connecting dungeon...")
  endpoints.connectDungeon(dungeon);

  // Start hashbot
  console.log("Starting hashbot...")
  const hashBot = new HashBot(c.BlockHashRegister, provider);
  await hashBot.start();

  Sentry.addBreadcrumb({ category: 'bot', message: 'Bot started' });

  // Start cache server
  if (preListener) {
    preListener.close();
  }
  const listener = server.listen(PORT, async () => {
    const { port } = listener.address();
    const message = `ethernal-cache ready and running on port ${port}`;
    Sentry.addBreadcrumb({ category: 'cache-server', message });
    console.log(message);
    setTimeout(() => sockets.emit('ready'), 5000);
  });
}

start().catch(async err => {
  console.log(err);
  Sentry.captureException(err);
  await Sentry.close();
  process.exit(1);
});
