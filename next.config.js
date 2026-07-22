const { withFaust } = require("@faustwp/core");

function getWordpressHostname() {
  try {
    return new URL(
      process.env.NEXT_PUBLIC_WORDPRESS_URL || "https://faustexample.wpengine.com",
    ).hostname;
  } catch {
    return "faustexample.wpengine.com";
  }
}

/**
 * @type {import('next').NextConfig}
 **/
module.exports = withFaust({
  images: {
    domains: [getWordpressHostname()],
  },
  trailingSlash: true,
});
