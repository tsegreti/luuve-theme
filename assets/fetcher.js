const { onReveal: revealAnimation } = await import(
    window?._importmap?.imports?.["reveal-animation"] || "reveal-animation"
);

class FetcherComponent extends HTMLElement {
    constructor() {
        super();
        this.deferredName = "fetcher";
        this.useCache = true;
        this.handle = {
            click: this.onClick.bind(this),
            popstate: this.onPopstate.bind(this),
        };
    }

    connectedCallback() {
        this.addEventListener("click", this.handle.click);
        window.addEventListener("popstate", this.handle.popstate);
        // afterLoadCallback assigned to element in `global.js`
        // when script load triggered by popstate event
        this.afterLoadCallback?.();
    }

    onClick(event) {
        const link = event.target.closest("a[href]");

        if (link?.href) {
            event.preventDefault();
            this.loadContent(link.href);
        }
    }

    onPopstate(event) {
        const pushToHistory = false;

        if (this.id === event.state?.id && event.state.url)
            this.loadContent(event.state.url, pushToHistory);

        if (!event.state?.url)
            this.loadContent(window.location.href, pushToHistory);
    }

    loadContent(
        url,
        pushToHistory = true,
        onSuccess = () => {
            const section = this.dataset.section;

            publish(PUB_SUB_EVENTS.fetcherUpdate, { section });
        }
    ) {
        const loaderTarget = document.getElementById(this.dataset.loaderTarget);
        const update = () => {
            fetchSectionHTML(this.dataset.section, this.useCache, url)
                .then((html) =>
                    new DOMParser().parseFromString(html, "text/html")
                )
                .then((parsed) => {
                    parsed
                        .querySelectorAll('[data-updatable="true"]')
                        .forEach((updated) => {
                            const tagret = document.getElementById(updated.id);

                            if (tagret) tagret.innerHTML = updated.innerHTML;
                        });
                    this.hideOverlay();

                    if (pushToHistory)
                        history.pushState(
                            {
                                deferredName: this.deferredName,
                                id: this.id,
                                url,
                            },
                            "",
                            url
                        );

                    onSuccess?.();
                });
        };

        loaderTarget && this.scrollIntoViewIfNeeded(loaderTarget);
        this.showOverlay();
        update();
    }

    getOverlay() {
        const loaderTarget = document.getElementById(this.dataset.loaderTarget);
        loaderTarget && this.onScrollRevealAnimation(loaderTarget);

        if (!this.overlay) {
            // try to find existing overlay
            this.overlay = loaderTarget?.querySelector?.(".loading-overlay");
        }

        if (!this.overlay && loaderTarget) {
            // overlay still not found; insert it
            let html = document.getElementById(
                "template__loading-overlay"
            )?.innerHTML;

            loaderTarget.insertAdjacentHTML?.("beforeend", html);
            this.overlay =
                loaderTarget.children[loaderTarget.children.length - 1];
        }

        return this.overlay;
    }

    onScrollRevealAnimation(element) {
        // recall onReveal function
        if (typeof revealAnimation == "function") {
            const arrayOfElements = [];
            arrayOfElements.push(element);

            setTimeout(() => {
                revealAnimation(arrayOfElements);
            });
        }
    }

    hideOverlay() {
        const overlay = this.getOverlay();

        if (overlay) {
            overlay.classList.add("hidden");

            // overlay successfully hidden
            return true;
        }

        return false; // overlay not found
    }

    showOverlay() {
        const overlay = this.getOverlay();

        if (overlay) {
            overlay.classList.remove("hidden");

            // overlay successfully shown
            return true;
        }

        return false; // overlay not found
    }

    async scrollIntoViewIfNeeded(element) {
        const top = element.getBoundingClientRect().top;
        const headerOffset =
            document.querySelector("sticky-header")?.clientHeight || 0;

        if (top - headerOffset < 20) {
            let { getGlobalOffsetTop } = await import(
                window?._importmap?.imports?.["helper"] || "helper"
            );

            window.scroll({
                top: getGlobalOffsetTop(element) - headerOffset - 20,
                behavior: "smooth",
            });
        }
    }

    disconnectedCallback() {
        this.removeEventListener("click", this.handle.click);
        window.removeEventListener("popstate", this.handle.popstate);
    }
}

export { FetcherComponent };
