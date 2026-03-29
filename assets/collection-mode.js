const { FetcherComponent } = await import(
    window?._importmap?.imports?.["fetcher"] || "fetcher"
);

const { onReveal: revealAnimation } = await import(
    window?._importmap?.imports?.["reveal-animation"] || "reveal-animation"
);

class CollectionModes extends FetcherComponent {
    constructor() {
        super();
        this.deferredName = "collectionMode";
        this.fetched = {};
    }

    fetchHTML(url) {
        if (this.fetched[url]) {
            return new Promise((resolve, reject) => {
                resolve(this.fetched[url]);
            });
        }
        return fetch(url)
            .then((result) => {
                if (result.ok) return result.text();
                else throw new Error(result.status);
            })
            .then((html) => {
                const section = new DOMParser()
                    .parseFromString(html, "text/html")
                    .getElementById(this.id)
                    .closest(".shopify-section");

                this.fetched[url] = {
                    section: section.id.replace("shopify-section-", ""),
                    innerHTML: section.innerHTML,
                };

                return this.fetched[url];
            });
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
            this.fetchHTML(url)
                .then(({ section, innerHTML }) => {
                    // replace section in all data-section attributes
                    this.closest(".shopify-section")
                        ?.querySelectorAll?.("[data-section]")
                        ?.forEach?.((element) => {
                            element.dataset.section = section;
                        });

                    return innerHTML;
                })
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
                    // update facets section if reveal animation uses
                    const facetsRevealAnimation = new Set([
                        document.querySelector(
                            ".facets__wrapper.reveal-slide-in"
                        ),
                    ]);
                    facetsRevealAnimation &&
                        revealAnimation(facetsRevealAnimation);

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

        // Check `Shopify.designMode`. It is 'true' in Shopify theme editor.
        if (Shopify.designMode) {
            window.location = url;

            return;
        }

        this.showOverlay();
        update();
    }
}

export { CollectionModes };
