import { createApp } from "vue";
import JobCards from "./JobCards.vue";

export function mountJobCards(container) {
    if (!(container instanceof HTMLElement)) {
        throw new TypeError("Job Cards requires a DOM container");
    }

    const root = document.createElement("div");
    root.className = "csf-jobcards-root";
    container.replaceChildren(root);
    const app = createApp(JobCards);
    app.mount(root);

    return function unmountJobCards() {
        app.unmount();
        root.remove();
    };
}
