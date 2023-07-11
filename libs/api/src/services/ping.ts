import { Method } from '../types/method';

type GET = Method<{
  '/ping': {
    res: {
        message: 'pong';
    };
    req: undefined;
  };
}>;


export interface PingAPI {
  get: GET;
}