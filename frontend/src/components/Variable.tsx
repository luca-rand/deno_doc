import React from "react";
import {
  TsTypeDef,
  DocNodeVariable,
  TsTypeDefKind,
  TsTypeDefTypeLiteral
} from "../util/docs";
import { SimpleLink } from "./SimpleLink";
import { Page } from "./Page";
import { JSDoc } from "./JSDoc";
import { SimpleCard, SimpleSubCard } from "./SinglePage";

export function VariableCard({ node }: { node: DocNodeVariable }) {
  const type = node.variableDef.tsType;
  const isNamespace =
    node.variableDef.kind === "const" &&
    type &&
    type.kind === TsTypeDefKind.TypeLiteral &&
    type.typeLiteral.properties.length > 0 &&
    type.typeLiteral.methods.length === 0 &&
    type.typeLiteral.callSignatures.length === 0;

  return isNamespace ? (
    <VariableNamespaceCard node={node} />
  ) : (
    <SimpleCard node={node} prefix={node.variableDef.kind} returnType={type} />
  );
}

export function VariableNamespaceCard({ node }: { node: DocNodeVariable }) {
  const type = node.variableDef.tsType as TsTypeDefTypeLiteral;
  return (
    <SimpleCard
      node={node}
      prefix={node.variableDef.kind}
      details={
        <div className="mt-2">
          <p className="text-md font-medium">Properties</p>
          {type.typeLiteral.properties.map(node => {
            return (
              <SimpleSubCard
                node={{ name: node.name, snippet: "" }}
                returnType={node.tsType}
              />
            );
          })}
        </div>
      }
    />
  );
}

export const Variable = ({ variable }: { variable: DocNodeVariable }) => {
  return (
    <Page mode="multipage">
      <div className="p-8 pt-4">
        <div className="pb-4">
          <div className="text-gray-900 text-3xl font-medium">
            {variable.name} variable
          </div>
          <div className="py-1">
            {variable.name}
            {variable.variableDef?.tsType?.repr ? (
              <span className="text-gray-600 font-light">
                {" → "}
                {variable.variableDef?.tsType?.repr}
              </span>
            ) : null}
            <p className="text-gray-500 italic font-light">
              {variable.variableDef?.kind === "const"
                ? "read-only"
                : "read / write"}
            </p>
          </div>
          {variable.jsDoc ? <JSDoc jsdoc={variable.jsDoc} /> : null}
        </div>
        <div className="text-sm">
          Defined in {variable.location.filename}:{variable.location.line}:
          {variable.location.col}
        </div>
      </div>
    </Page>
  );
};

export function VariableLink(props: {
  name: string;
  type: string;
  jsDoc?: string;
  returnType?: TsTypeDef;
  accessibility?: "private" | "protected" | "public";
  isAbstract?: boolean;
  readonly: boolean;
}) {
  return (
    <SimpleLink
      name={props.name}
      type={props.type}
      jsDoc={props.jsDoc}
      afterName={
        <>
          {props.returnType?.repr ? (
            <>
              <span className="text-gray-600 font-light">
                {" → "}
                {props.returnType.repr}
              </span>
            </>
          ) : null}
        </>
      }
      afterJsDoc={
        <p className="text-gray-500 italic font-light">
          {([] as string[])
            .concat(...(props.accessibility === "private" ? ["private"] : []))
            .concat(
              ...(props.accessibility === "protected" ? ["protected"] : [])
            )
            .concat(...(props.isAbstract ? ["abstract"] : []))
            .concat(props.readonly ? "read-only" : "read / write")
            .join(", ")}
        </p>
      }
    />
  );
}
