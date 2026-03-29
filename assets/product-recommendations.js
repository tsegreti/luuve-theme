const { load: loadComponent } = await import(
    window?._importmap?.imports?.["deferred"] || "deferred"
);

const { onReveal: revealAnimation } = await import(
    window?._importmap?.imports?.["reveal-animation"] || "reveal-animation"
);

class ProductRecommendations extends HTMLElement {
    connectedCallback() {
        this.render();
    }

    render() {
        const params = JSON.parse(this.dataset.params);
        const url =
            this.dataset.url + "?" + new URLSearchParams(params).toString();

        if (!params.product_id) return;

        fetch(url)
            .then((response) => response.text())
            .then((html) => {
                const collectionInner = this.querySelector(".collection-inner");
                const newInner = new DOMParser()
                    .parseFromString(html, "text/html")
                    .querySelector(".collection-inner");

                if (
                    newInner &&
                    newInner.querySelectorAll(".grid-item").length > 0
                ) {
                    collectionInner.classList.remove("visually-hidden");
                    collectionInner.innerHTML = newInner.innerHTML;
                    loadComponent("squamaItem");
                    publish(PUB_SUB_EVENTS.fetcherUpdate, {
                        section: params.section_id,
                    });

                    // on-scroll reveal animation
                    if (newInner.closest(".reveal-slide-in")) {
                        const listArr = [];
                        listArr.push(collectionInner);

                        setTimeout(() => {
                            listArr.length && revealAnimation(listArr);
                        });
                    }
                } else {
                    this.classList.add("no-recommendations");
                }
            })
            .catch((e) => {
                console.error(e);
            });
    }
}

export { ProductRecommendations };
