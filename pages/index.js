import { getWordPressProps, WordPressTemplate } from "@faustwp/core";
import { REVALIDATE_SECONDS } from "../lib/revalidate";

export default function Page(props) {
  return <WordPressTemplate {...props} />;
}

export function getStaticProps(ctx) {
  return getWordPressProps({ ctx, revalidate: REVALIDATE_SECONDS });
}
