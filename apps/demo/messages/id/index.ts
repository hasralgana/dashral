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
import finance from "./finance.json"
import projects from "./projects.json"
import support from "./support.json"
import inventory from "./inventory.json"
import monitoring from "./monitoring.json"
import assistant from "./assistant.json"
import onboarding from "./onboarding.json"
import verify from "./verify.json"

export default { kit, nav, layout, notifications, customizer, overview, settings, pricing, files, pro, auth, errors, inset, finance, projects, support, inventory, monitoring, assistant, onboarding, verify } satisfies typeof en
