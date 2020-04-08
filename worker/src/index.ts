// Copyright 2020 the Deno authors. All rights reserved. MIT license.

import { handleRequest } from "./handler";

addEventListener("fetch", (event) => {
  event.respondWith(handleRequest(event));
});
