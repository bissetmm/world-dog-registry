import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { timingSafeEqual } from "crypto";

type HeaderValue = string | string[] | undefined;

type RequestWithHeaders = {
  headers: Record<string, HeaderValue>;
};

@Injectable()
export class AdminApiKeyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const configuredApiKey = process.env.ADMIN_API_KEY;
    if (!configuredApiKey) {
      throw new UnauthorizedException("Admin API key is not configured");
    }

    const request = context.switchToHttp().getRequest<RequestWithHeaders>();
    const requestApiKey = this.extractApiKey(request.headers);
    if (!requestApiKey || !this.isEqual(requestApiKey, configuredApiKey)) {
      throw new UnauthorizedException("Invalid admin API key");
    }

    return true;
  }

  private extractApiKey(headers: Record<string, HeaderValue>): string | null {
    const explicitHeader = this.firstHeaderValue(headers["x-admin-api-key"]);
    if (explicitHeader) {
      return explicitHeader;
    }

    const authorization = this.firstHeaderValue(headers.authorization);
    const bearerPrefix = "Bearer ";
    if (authorization?.startsWith(bearerPrefix)) {
      return authorization.slice(bearerPrefix.length).trim();
    }

    return null;
  }

  private firstHeaderValue(value: HeaderValue): string | null {
    if (Array.isArray(value)) {
      return value[0] ?? null;
    }

    return value ?? null;
  }

  private isEqual(left: string, right: string): boolean {
    const leftBuffer = Buffer.from(left);
    const rightBuffer = Buffer.from(right);

    if (leftBuffer.length !== rightBuffer.length) {
      return false;
    }

    return timingSafeEqual(leftBuffer, rightBuffer);
  }
}
