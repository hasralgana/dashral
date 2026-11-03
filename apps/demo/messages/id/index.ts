// One file per namespace, the same files as English. `satisfies` makes the typecheck fail when a key English has is
// missing here.

import type en from "../en"

import kit from "./kit.json"
import nav from "./nav.json"
import layout from "./layout.json"
import notifications from "./notifications.json"
import customizer from "./customizer.json"
import overview from "./overview.json"
import settings from "./settings.json"
import pricing from "./pricing.json"
import files from "./files.json"
import pro from "./pro.json"
import auth from "./auth.json"
import errors from "./errors.json"
import inset from "./inset.json"

export default { kit, nav, layout, notifications, customizer, overview, settings, pricing, files, pro, auth, errors, inset } satisfies typeof en
