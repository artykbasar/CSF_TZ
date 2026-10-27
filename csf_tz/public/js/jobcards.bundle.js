import { mountJobCards } from "./jobcards/jobcards.js";

frappe.provide("frappe.JobCards");
frappe.JobCards.mount = mountJobCards;
