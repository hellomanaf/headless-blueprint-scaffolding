import { setConfig } from "@faustwp/core";
import templates from "./wp-templates";
import possibleTypes from "./possibleTypes.json";
import { WooSessionPlugin } from "./plugins/WooSessionPlugin";
import { CompatibleSeedQueryPlugin } from "./plugins/CompatibleSeedQueryPlugin";

/**
 * @type {import('@faustwp/core').FaustConfig}
 **/
export default setConfig({
  templates,
  plugins: [new CompatibleSeedQueryPlugin(), new WooSessionPlugin()],
  possibleTypes,
});
