"""Stage 4B browser wiring regressions without production side effects."""
from pathlib import Path
import re
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


class Stage4BFrontendContract(unittest.TestCase):
    def test_static_includes_are_real_app_scoped_source_files(self):
        for filename in ("select_dialog.js", "to_console.js"):
            self.assertIn(f'"/assets/csf_tz/js/{filename}"', HOOKS)
            self.assertTrue((PUBLIC / "js" / filename).is_file())
        for missing in ("select_dialog.min.js", "to_console.min.js", "jobcards.min.js"):
            self.assertNotIn(missing, HOOKS)
        self.assertNotIn("node_modules/vuetify", HOOKS)

    def test_job_card_bundles_use_vue3_without_vue2_globals_or_cdn(self):
        self.assertTrue((PUBLIC / "js/jobcards.bundle.js").is_file())
        self.assertIn("jobcards.bundle.js", PAGE)
        self.assertIn('from "vue"', ENTRY)
        self.assertIn("createApp(", ENTRY)
        self.assertIn("frappe.JobCards.mount", BUNDLE)
        for content in (PAGE, BUNDLE, ENTRY, LIST, CARD):
            for incompatible in ("new Vue(", "new Vuetify(", "evntBus", "$emit(", "$on(", "v-html", "cdn.jsdelivr.net", "fonts.googleapis.com"):
                self.assertNotIn(incompatible, content)

    def test_existing_authorized_server_calls_and_actions_remain(self):
        self.assertIn("csf_tz.csf_tz.page.jobcards.jobcards.get_job_cards", LIST)
        self.assertIn("csf_tz.csf_tz.page.jobcards.jobcards.get_employees", CARD)
        self.assertIn("csf_tz.csf_tz.page.jobcards.jobcards.save_doc", CARD)
        self.assertIn('"frappe.client.get"', CARD)
        for action in ("startJob", "pauseJob", "submitJob", "Completed Qty", "Station Members"):
            self.assertIn(action, CARD)
        self.assertIn("frappe.model.add_child", CARD)
        self.assertIn("JSON.stringify(doc)", CARD)
        self.assertIn("emit(\"saved\")", CARD)
        self.assertNotRegex(CARD + LIST, r"allow_guest\s*=\s*True")


if __name__ == "__main__":
    unittest.main(verbosity=2)
