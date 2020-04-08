// Copyright 2020 the Deno authors. All rights reserved. MIT license.

import { createContext, useContext } from "react";
import fetch from "isomorphic-unfetch";
import { DocNode } from "./docs";

const flattendContext = createContext<DocNode[]>([]);

export function useFlattend() {
  return useContext(flattendContext);
}

export const FlattendProvider = flattendContext.Provider;

export interface DocsData {
  timestamp: string;
  nodes: DocNode[];
}

export async function getData(
  entrypoint: string,
  hostname: string,
  quality?: "fresh" | "cache"
): Promise<DocsData | null> {
  const req = await fetch(
    `${hostname}/api/docs?entrypoint=${encodeURIComponent(entrypoint)}${
      quality ? `&quality=${quality}` : ""
    }`
  );
  if (!req.ok) throw new Error((await req.json()).error);
  if (req.status === 204) return null;
  const resp = await req.json();
  return {
    timestamp: resp.timestamp,
    nodes: resp.nodes,
  };
}
