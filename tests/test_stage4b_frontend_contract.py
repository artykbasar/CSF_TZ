"""Stage 4B frontend contracts without live-site side effects."""
from pathlib import Path
import json
import unittest

ROOT = Path(__file__).resolve().parents[1]
APP = ROOT / "csf_tz"
PUBLIC = APP / "public"
HOOKS = (APP / "hooks.py").read_text()
PAGE = (APP / "csf_tz/page/jobcards/jobcards.js").read_text()
BUNDLE = (PUBLIC / "js/jobcards.bundle.js").read_text()
ENTRY = (PUBLIC / "js/jobcards/jobcards.js").read_text()
LIST = (PUBLIC / "js/jobcards/JobCards.vue").read_text()
CARD = (PUBLIC / "js/jobcards/Card.vue").read_text()
MODEL = (PUBLIC / "js/jobcards/useJobCard.js").read_text()


class Stage4BFrontendContract(unittest.TestCase):
    def test_static_includes_are_supported_app_assets(self):
        for name in ("select_dialog.js", "to_console.js"):
            self.assertIn(f'"/assets/csf_tz/js/{name}"', HOOKS)
            self.assertTrue((PUBLIC / "js" / name).is_file())
        for missing in ("select_dialog.min.js", "to_console.min.js", "jobcards.min.js"):
            self.assertNotIn(missing, HOOKS)
        self.assertNotIn("node_modules/vuetify", HOOKS)

    def test_bundle_loads_vue3_and_has_no_legacy_global_loads(self):
        self.assertTrue((PUBLIC / "js/jobcards.bundle.js").is_file())
        self.assertIn("jobcards.bundle.js", PAGE)
        self.assertIn('from "vue"', ENTRY)
        self.assertIn("createApp(", ENTRY)
        self.assertIn("frappe.JobCards.mount", BUNDLE)
        for file in (PAGE, BUNDLE, ENTRY, LIST, CARD, MODEL):
            for old in ("new Vue(", "new Vuetify(", "evntBus", "$emit(", "$on(",
                        "v-html", "cdn.jsdelivr.net", "fonts.googleapis.com"):
                self.assertNotIn(old, file)
        self.assertEqual(json.loads((ROOT / "package.json").read_text())["dependencies"],
                         {"vue": "3.5.43"})

    def test_job_cards_keep_original_permissions_data_and_actions(self):
        self.assertIn("csf_tz.csf_tz.page.jobcards.jobcards.get_job_cards", LIST)
        for api in ("csf_tz.csf_tz.page.jobcards.jobcards.get_employees",
                    "csf_tz.csf_tz.page.jobcards.jobcards.save_doc",
                    "frappe.client.get"):
            self.assertIn(api, MODEL)
        for action in ("startJob", "pauseJob", "submitJob", "Completed Qty",
                       "Station Members", "Team Leader"):
            self.assertIn(action, CARD + MODEL)
        self.assertIn("frappe.model.add_child", MODEL)
        self.assertIn("JSON.stringify(doc)", MODEL)
        self.assertIn('emit("saved")', MODEL)
        self.assertIn("visibleEmployees", CARD + MODEL)
        self.assertNotIn("allow_guest", MODEL + LIST + CARD)

    def test_select_dialog_and_console_listener_still_present(self):
        selector = (PUBLIC / "js/select_dialog.js").read_text()
        listener = (PUBLIC / "js/to_console.js").read_text()
        self.assertIn("frappe.ui.form.SelectDialog", selector)
        self.assertIn("out_to_console", listener)
        self.assertIn("frappe.realtime.on", listener)


if __name__ == "__main__":
    unittest.main(verbosity=2)
