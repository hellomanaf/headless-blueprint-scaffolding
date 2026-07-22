import { setConfig } from "@faustwp/core";
import templates from "./wp-templates";
import possibleTypes from "./possibleTypes.json";
import { WooSessionPlugin } from "./plugins/WooSessionPlugin";

/**
 * @type {import('@faustwp/core').FaustConfig}
 **/
export default setConfig({
  templates,
  plugins: [new WooSessionPlugin()],
  possibleTypes,
});
