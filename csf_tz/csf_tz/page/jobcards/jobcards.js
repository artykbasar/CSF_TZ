frappe.pages["jobcards"].on_page_load = function (wrapper) {
    frappe.ui.make_app_page({
        parent: wrapper,
        title: __("Job Cards"),
        single_column: true,
    });
};

frappe.pages["jobcards"].on_page_show = function (wrapper) {
    const target = $(wrapper).find(".layout-main")[0];
    if (!target || wrapper.__csfJobCardsUnmount) {
        return;
    }
    frappe.require("jobcards.bundle.js", function () {
        if (!target.isConnected || wrapper.__csfJobCardsUnmount) {
            return;
        }
        if (!frappe.JobCards || typeof frappe.JobCards.mount !== "function") {
            frappe.throw(__("Job Cards bundle did not initialize"));
            return;
        }
        wrapper.__csfJobCardsUnmount = frappe.JobCards.mount(target);
    });
};

frappe.pages["jobcards"].on_page_hide = function (wrapper) {
    if (wrapper.__csfJobCardsUnmount) {
        wrapper.__csfJobCardsUnmount();
        wrapper.__csfJobCardsUnmount = null;
    }
};
