import type {IncomingMessage} from 'node:http';
import process from 'node:process';

interface ChatRequestPayload {
  message?: unknown;
  vehicle_type?: unknown;
}

interface UpstreamChatResponse {
  reply?: unknown;
  error?: unknown;
  message?: unknown;
}

interface VercelRequest extends IncomingMessage {
  body?: unknown;
}

interface VercelResponse {
  status: (statusCode: number) => VercelResponse;
  json: (body: unknown) => VercelResponse;
  setHeader: (name: string, value: string | string[]) => void;
}

async function readRequestBody(req: VercelRequest): Promise<ChatRequestPayload> {
  if (req.body && typeof req.body === 'object') {
    return req.body as ChatRequestPayload;
  }

  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body) as ChatRequestPayload;
    } catch {
      return {};
    }
  }

  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  const raw = Buffer.concat(chunks).toString('utf8').trim();
  if (!raw) {
    return {};
  }
  try {
    return JSON.parse(raw) as ChatRequestPayload;
  } catch {
    return {};
  }
}

function getBearerHeader(req: VercelRequest): string | null {
  const rawAuth = req.headers.authorization ?? req.headers.Authorization;
  const headerValue = Array.isArray(rawAuth) ? rawAuth[0] : rawAuth;
  if (typeof headerValue !== 'string') {
    return null;
  }
  const trimmed = headerValue.trim();
  if (!trimmed.toLowerCase().startsWith('bearer ')) {
    return null;
  }
  const token = trimmed.slice(7).trim();
  if (!token) {
    return null;
  }
  return `Bearer ${token}`;
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({reply: null, error: 'Method not allowed.'});
    return;
  }

  const replitChatUrl = process.env.REPLIT_CHAT_URL?.trim();
  const appApiKey = process.env.APP_API_KEY?.trim();

  if (!replitChatUrl || !appApiKey) {
    res.status(500).json({
      reply: null,
      error: 'Chat service is not configured on the server.',
    });
    return;
  }

  const bearerHeader = getBearerHeader(req);
  if (!bearerHeader) {
    res.status(401).json({
      reply: null,
      error: 'Please sign in to use chat.',
    });
    return;
  }

  const body = await readRequestBody(req);
  const message =
    typeof body.message === 'string' ? body.message.trim() : '';
  const vehicleType = body.vehicle_type;

  if (!message) {
    res.status(400).json({
      reply: null,
      error: 'Please enter a message.',
    });
    return;
  }

  if (vehicleType !== 'car' && vehicleType !== 'motorcycle') {
    res.status(400).json({
      reply: null,
      error: 'Invalid vehicle_type. Expected car or motorcycle.',
    });
    return;
  }

  try {
    const upstreamResponse = await fetch(replitChatUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: bearerHeader,
        'X-App-Key': appApiKey,
      },
      body: JSON.stringify({
        message,
        vehicle_type: vehicleType,
      }),
    });

    let upstreamData: UpstreamChatResponse | null = null;
    try {
      upstreamData = (await upstreamResponse.json()) as UpstreamChatResponse;
    } catch {
      upstreamData = null;
    }

    if (!upstreamResponse.ok) {
      const upstreamError =
        typeof upstreamData?.error === 'string' && upstreamData.error.trim()
          ? upstreamData.error.trim()
          : typeof upstreamData?.message === 'string' &&
              upstreamData.message.trim()
            ? upstreamData.message.trim()
            : `Chat service returned status ${upstreamResponse.status}.`;

      res.status(upstreamResponse.status).json({
        reply: null,
        error: upstreamError,
      });
      return;
    }

    if (upstreamData?.error) {
      const explicitError =
        typeof upstreamData.error === 'string' && upstreamData.error.trim()
          ? upstreamData.error.trim()
          : 'Chat service returned an error.';
      res.status(502).json({
        reply: null,
        error: explicitError,
      });
      return;
    }

    const reply =
      typeof upstreamData?.reply === 'string' && upstreamData.reply.trim()
        ? upstreamData.reply
        : typeof upstreamData?.message === 'string' &&
            upstreamData.message.trim()
          ? upstreamData.message
          : null;

    if (!reply) {
      res.status(502).json({
        reply: null,
        error: 'Chat service did not return a reply.',
      });
      return;
    }

    res.status(200).json({
      reply,
      error: null,
    });
  } catch {
    console.error('Failed to proxy chat request to upstream service.');
    res.status(502).json({
      reply: null,
      error: 'Unable to reach the chat service. Please try again.',
    });
  }
}
