export class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export const badRequest = (m: string) => new HttpError(400, m);
export const forbidden = (m = 'Insufficient permissions') => new HttpError(403, m);
export const notFound = (m = 'Not found') => new HttpError(404, m);
