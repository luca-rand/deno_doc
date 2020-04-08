// Copyright 2020 the Deno authors. All rights reserved. MIT license.

import { Documentation } from "../../components/Documentation";
import { NextPage } from "next";
import { DocsData, getData } from "../../util/data";

const Page: NextPage<{
  initialData: DocsData | null;
  entrypoint: string;
  name: string;
}> = (props) => <Documentation {...props} />;

Page.getInitialProps = async (ctx) => {
  const name =
    typeof ctx.query.url === "string" ? ctx.query.url : ctx.query.url.join("/");
  const entrypoint = "https://" + name;
  // only get initialData on the server
  const initialData = ctx.req
    ? await getData(entrypoint, "https://denodoc.lcas.dev", "cache").catch(
        () => null
      )
    : null;
  return { initialData, entrypoint, name };
};

export default Page;
