const { FetcherComponent } = await import(
    window?._importmap?.imports?.["fetcher"] || "fetcher"
);

class SearchResults extends FetcherComponent {
    constructor() {
        super();
        this.deferredName = "searchResults";
    }

    connectedCallback() {
        super.connectedCallback();

        this.querySelectorAll("a").forEach((link) => {
            const tabId = link.closest('[role="tab"]')?.id;

            fetchSectionHTML(this.dataset.section, this.useCache, link.href)
                .then((html) =>
                    new DOMParser().parseFromString(html, "text/html")
                )
                .then((parsed) => {
                    const html = parsed.querySelector(`#${tabId} a`)?.innerHTML;

                    if (html) link.innerHTML = html;
                });
        });
    }

    loadContent(url, pushToHistory = true) {
        const type = new URLSearchParams(url).get("type");

        if (type === "product") {
            super.loadContent(url, pushToHistory, () => {
                const source = document.getElementById(
                    `shopify-section-${this.dataset.section}`
                );

                publish(PUB_SUB_EVENTS.fetchedProducts, {
                    detail: { source },
                });
            });
        } else {
            super.loadContent(url, pushToHistory);
        }

        // update active tab
        this.querySelectorAll("a").forEach((link) => {
            link.closest('[role="tab"]')?.classList?.toggle(
                "search__tab-active",
                link.href.indexOf(`type=${type}`) !== -1
            );
        });
    }

    onPopstate(event) {
        const pushToHistory = false;

        super.onPopstate(event);

        if (
            this.id !== event.state?.id &&
            event.state?.url &&
            !document.getElementById(event.state?.id)
        ) {
            this.loadContent(event.state.url, pushToHistory);
        }
    }
}

export { SearchResults };
