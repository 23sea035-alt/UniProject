declare namespace Express {
  interface Request {
    user?: {
      uid: string;
      email: string;
      role: string;
      region?: string;
      district?: string;
    };
    device?: {
      meterId: string;
      deviceId: string;
      userId: string | null;
      calibrationFactor: number;
    };
  }
}
