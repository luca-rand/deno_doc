// Copyright 2020 the Deno authors. All rights reserved. MIT license.

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import Head from "next/head";
import { getData, DocsData } from "../util/data";
import { SinglePage } from "./SinglePage";

export const Documentation = ({
  initialData,
  entrypoint,
  name,
}: {
  initialData: DocsData | null;
  entrypoint: string;
  name: string;
}) => {
  const [shouldForceReload, setForceReload] = useState<boolean>(false);
  const forceReload = useMemo(() => () => setForceReload(true), [
    setForceReload,
  ]);
  const [data, setData] = useState<DocsData | null>(initialData);
  const [error, setError] = useState<string | null>();

  useEffect(() => {
    if (shouldForceReload || data === null) {
      setData(null);
      setError(null);
      getData(entrypoint, "", shouldForceReload ? "fresh" : undefined)
        .then((d) => setData(d))
        .catch((err) => setError(err?.message ?? err.toString()))
        .finally(() => setForceReload(false));
    }
  }, [shouldForceReload]);

  useEffect(() => {
    let { hash } = location;
    hash = hash && hash.substring(1);
    if (!hash) return;

    const el = document.getElementById(hash);
    if (!el) return;

    setTimeout(() => el.scrollIntoView(), 0);
  }, [data]);

  if (error) {
    let title =
      "A internal server error occured while generating the documentation.";
    let details = error;

    if (error && (error.includes("404") || error.includes("dns"))) {
      const file = (error.match(/Import '(.*)' failed/) ?? [])[1] ?? "";
      title = "404 - A source file could not be found.";
      details = `Please check that the ${
        file ? `file '${file}'` : "entrypoint and its dependents are"
      }  available on the public internet.`;
    }

    return (
      <div className="flex flex-col items-center justify-center h-full p-4 text-center">
        <div className="text-3xl text-gray-800">{title}</div>
        <div className="mt-2 text-lg">{details}</div>
        <Link href="/">
          <a className="mt-4 text-xl link">Go back home</a>
        </Link>
        <a
          href="https://github.com/bartlomieju/deno_doc/issues"
          className="mt-5 text-sm link"
        >
          Report Issue
        </a>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>{name} - deno doc</title>
        <meta
          name="description"
          content={`Automatically generated documentation for ${name}.`}
        />
      </Head>
      <SinglePage
        forceReload={forceReload}
        entrypoint={entrypoint}
        data={data}
      />
    </>
  );
};
