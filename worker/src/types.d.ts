// Copyright 2020 the Deno authors. All rights reserved. MIT license.

import { KVNamespace } from "@cloudflare/workers-types";

declare global {
  const DOCS_CACHE: KVNamespace;
  const API_ORIGIN: string;
}
