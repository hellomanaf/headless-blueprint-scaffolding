import { gql } from "@apollo/client";

/**
 * Faust's default seed query requests `contentType` on `ContentNode`.
 * Some WPGraphQL setups only expose `contentTypeName` on that interface,
 * which breaks prerender of `/` and other Faust routes.
 *
 * This seed query uses `contentTypeName` and still requests Page/Post
 * fields Faust needs for template resolution (`isFrontPage`, etc.).
 */
export const COMPAT_SEED_QUERY = gql`
  query GetSeedNode(
    $id: ID! = 0
    $uri: String! = ""
    $asPreview: Boolean = false
  ) {
    ... on RootQuery @skip(if: $asPreview) {
      nodeByUri(uri: $uri) {
        __typename
        ...GetNode
      }
    }
    ... on RootQuery @include(if: $asPreview) {
      contentNode(id: $id, idType: DATABASE_ID, asPreview: true) {
        __typename
        ...GetNode
      }
    }
  }

  fragment GetNode on UniformResourceIdentifiable {
    __typename
    uri
    id
    ...DatabaseIdentifier
    ...ContentType
    ...User
    ...TermNode
    ...ContentNode
    ...MediaItem
    ...Page
  }

  fragment DatabaseIdentifier on DatabaseIdentifier {
    databaseId
  }

  fragment MediaItem on MediaItem {
    id
    mimeType
  }

  fragment ContentType on ContentType {
    name
    isFrontPage
    isPostsPage
  }

  fragment Page on Page {
    isFrontPage
    isPostsPage
  }

  fragment TermNode on TermNode {
    isTermNode
    slug
    taxonomyName
  }

  fragment ContentNode on ContentNode {
    isContentNode
    slug
    contentTypeName
    template {
      templateName
    }
  }

  fragment User on User {
    name
    userId
    databaseId
  }
`;

/**
 * Faust template resolution reads `seedNode.contentType.node.name`.
 * When only `contentTypeName` is available, inject the equivalent templates.
 */
function templatesFromContentTypeName(seedNode) {
  if (!seedNode?.isContentNode) return [];

  const typeName =
    seedNode?.contentType?.node?.name || seedNode?.contentTypeName || null;
  if (!typeName) return [];

  const extras = [];

  if (typeName === "page") {
    if (seedNode.slug) extras.push(`page-${seedNode.slug}`);
    if (seedNode.databaseId) extras.push(`page-${seedNode.databaseId}`);
    extras.push("page");
  } else if (typeName === "post") {
    if (seedNode.slug) extras.push(`single-${typeName}-${seedNode.slug}`);
    extras.push(`single-${typeName}`);
    extras.push("single");
  } else {
    if (seedNode.slug) extras.push(`single-${typeName}-${seedNode.slug}`);
    extras.push(`single-${typeName}`);
  }

  return extras;
}

/**
 * Faust plugin: compatible seed query for WPGraphQL without ContentNode.contentType.
 */
export class CompatibleSeedQueryPlugin {
  apply({ addFilter }) {
    addFilter("seedQueryDocumentNode", "admv-seed-compat", () => COMPAT_SEED_QUERY);

    addFilter(
      "possibleTemplatesList",
      "admv-seed-compat",
      (possibleTemplates, { seedNode }) => {
        const extras = templatesFromContentTypeName(seedNode);
        if (!extras.length) return possibleTemplates;

        const merged = [...possibleTemplates];
        const indexPos = merged.indexOf("index");
        const insertAt = indexPos === -1 ? merged.length : indexPos;

        for (let i = extras.length - 1; i >= 0; i -= 1) {
          const name = extras[i];
          if (!merged.includes(name)) {
            merged.splice(insertAt, 0, name);
          }
        }

        return merged;
      },
    );
  }
}
