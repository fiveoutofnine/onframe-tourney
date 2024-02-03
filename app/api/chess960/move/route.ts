import { type NextRequest, NextResponse } from 'next/server';

import { type FrameRequest, getFrameMessage } from '@coinbase/onchainkit';
import { Redis } from '@upstash/redis';

import { getFrameMetaHTML } from '@/lib/utils';

const redis = new Redis({ url: process.env.UPSTASH_URL, token: process.env.UPSTASH_TOKEN });

// eslint-disable-next-line @typescript-eslint/no-var-requires
const engine = require('js-chess-engine');

export async function POST(req: NextRequest) {
  // ---------------------------------------------------------------------------
  // Read and verify Frame `POST` request
  // ---------------------------------------------------------------------------

  const body: FrameRequest = await req.json();
  const { isValid, message } = await getFrameMessage(body, { neynarApiKey: 'NEYNAR_API_DOCS' });

  // Return an error if the request is invalid.
  if (!isValid || !message || !message.raw.action) {
    return NextResponse.json({ message: 'Bad request.' }, { status: 400 });
  }

  try {
    const urlString = (message?.raw.action as unknown as { url: string })?.url ?? '';
    const url = new URL(urlString);
    // Return a 400 if the origin of the URL is not the same as the origin of
    // the request.
    const baseUrl = new URL(process.env.BASE_URL);
    if (url.host !== req.nextUrl.host && url.host !== baseUrl.host) {
      return NextResponse.json({ message: 'Bad request.' }, { status: 400 });
    }
  } catch (e) {
    // This catches any malformed/invalid URLs.
    return NextResponse.json({ message: 'Bad request.' }, { status: 400 });
  }

  const fid = message.interactor.fid;
  /* const address =
    message.interactor.verified_accounts.length > 0
      ? message.interactor.verified_accounts[0]
      : message.interactor.custody_address; */
  const button = message.raw.action.tapped_button.index;
  const text = (message.raw.action as unknown as { input: { text: string } }).input.text;

  // ---------------------------------------------------------------------------
  // Read search parameters
  // ---------------------------------------------------------------------------

  const [prevFrom, prevTo] = req.nextUrl.searchParams.get('user')?.split('-') ?? ['', ''];
  const [prevCpuFrom, prevCpuTo] = req.nextUrl.searchParams.get('cpu')?.split('-') ?? ['', ''];
  const init = Boolean(req.nextUrl.searchParams.get('init') ?? false);

  // ---------------------------------------------------------------------------
  // Fetch state from Redis
  // ---------------------------------------------------------------------------

  const gameId = Number((await redis.get('chess960_games_completed')) ?? 0);

  // eslint-disable-next-line prefer-const
  let [state, gamesWon] = await Promise.all([
    redis.get(`chess960_game_states:${gameId}:${fid}`) as Promise<string | null>,
    Number(redis.get(`chess960_games_won:${fid}`) ?? 0),
  ]);
  if (state === null) {
    // Fetch game's starting position from Redis.
    const gameState: string | null = await redis.get(`chess960_game_states:${gameId}`);
    if (gameState === null) {
      // Return error if the game does not exist. TODO: show end screen.
      return NextResponse.json({ message: 'Game not found.' }, { status: 404 });
    }
    state = gameState;
  }

  if (gamesWon > 0) {
    // Return error if the user has already minted an NFT. TODO: can maybe
    // display the starting position here.
    return NextResponse.json({ message: 'You already minted an NFT.' }, { status: 400 });
  }

  // ---------------------------------------------------------------------------
  // Chess engine
  // ---------------------------------------------------------------------------

  const game = new engine.Game(state);

  let winner: 'white' | 'black' | undefined = undefined;
  let [from, to]: (string | undefined)[] = [undefined, undefined];
  let [cpuFrom, cpuTo]: (string | undefined)[] = [undefined, undefined];
  // If it wasn't the first move, and the page wasn't changed, it was a move.
  if (!init) {
    if (button === 1) {
      // Reset the user's board if the user clicked the first button.
      await redis.del(`chess960_game_states:${gameId}:${fid}`);
    } else if (button === 2) {
      // We first check if the user's move is valid by checking if it's in the
      // list of valid moves.
      const validMoves = Object.entries(game.moves())
        // @ts-expect-error `js-chess-engine` does not have defined types.
        .map((move: [string, string[]]) => move[1].map((to) => `${move[0]} to ${to}`))
        .flat();
      // Normalize user's move.
      const move = text
        .toLowerCase()
        .split('to')
        .map((e) => e.trim().toUpperCase())
        .join(' to ');
      if (!validMoves.includes(move)) {
        // Return an error if the user's move is invalid.
        return NextResponse.json({ message: 'Invalid move.' }, { status: 400 });
      }

      // Play the user's move.
      [from, to] = move.split(' to ');
      game.move(from, to);
      // Commit move to Redis.
      if (game.exportJson().isFinished) {
        winner = 'white';
      } else {
        // Play the engine's move at depth 3.
        [cpuFrom, cpuTo] = Object.entries(game.aiMove(3))[0] as string[];
        if (game.exportJson().isFinished) {
          winner = 'black';
        }
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Compute Frame metadata and commit data.
  // ---------------------------------------------------------------------------

  const fen = game.exportFEN();
  // Commit game state to Redis.
  await redis.set(`chess960_game_states:${gameId}:${fid}`, fen);

  const userMove =
    from && to ? `&user=${from}-${to}` : prevFrom && prevTo ? `&user=${prevFrom}-${prevTo}` : '';
  const cpuMove =
    cpuFrom && cpuTo
      ? `&cpu=${cpuFrom}-${cpuTo}`
      : prevCpuFrom && prevCpuTo
        ? `&cpu=${prevCpuFrom}-${prevCpuTo}`
        : '';
  const gg = winner ? `&gg=${winner === 'white' ? 1 : 0}` : '';
  const postUrl = !winner
    ? `${process.env.BASE_URL}/api/chess960/move`
    : `${process.env.BASE_URL}/play`;
  const imageUrl = `https://onframe-chess.vercel.app/api/board-image?state=${encodeURIComponent(fen)}${userMove}${cpuMove}${gg}`;

  // ---------------------------------------------------------------------------
  // Response
  // ---------------------------------------------------------------------------

  console.log(
    getFrameMetaHTML({
      title: `Game ${gameId} - Chess960 | Onframe Tourney`,
      postUrl,
      imageUrl,
      buttons: ['Submit move'],
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'text/html' },
    },
  );
  return new NextResponse(
    getFrameMetaHTML({
      title: `Game ${gameId} - Chess960 | Onframe Tourney`,
      postUrl,
      imageUrl,
      buttons: winner !== 'black' ? ['Reset board', 'Submit move'] : ['Reset board'],
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'text/html' },
    },
  );
}

export const GET = POST;

// -----------------------------------------------------------------------------
// Next.js config
// -----------------------------------------------------------------------------

export const dynamic = 'force-dynamic';
