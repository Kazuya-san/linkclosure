import { headers } from "next/headers";
import { URLS } from "@/lib/constants";

export class SecurityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SecurityError";
  }
}

export async function assertSameOriginOrNoOrigin(): Promise<void> {
  const headersList = await headers();
  const origin = headersList.get("origin");
  if (!origin) return;

  const host = headersList.get("host");
  const allowed = new Set<string>([URLS.APP]);
  if (host) {
    allowed.add(`https://${host}`);
    allowed.add(`http://${host}`);
  }

  if (!allowed.has(origin)) {
    throw new SecurityError("Invalid origin");
  }
}
