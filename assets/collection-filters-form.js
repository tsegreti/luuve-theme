const { load } = await import(
    window?._importmap?.imports?.["deferred"] || "deferred"
);

const { FetcherComponent } = await import(
    window?._importmap?.imports?.["fetcher"] || "fetcher"
);

class CollectionFiltersForm extends FetcherComponent {
    constructor() {
        super();
        this.deferredName = "collectionFilters";
        this.form = this.querySelector("form");

        this.handle = Object.assign(this.handle, {
            input: debounce((event) => {
                this.onSubmitHandler(event);
            }, 500),
            submit: (event) => {
                this.onSubmitHandler(event);
                event.preventDefault();
            },
        });
    }

    connectedCallback() {
        super.connectedCallback();

        this.form.addEventListener("input", this.handle.input);
        this.form.addEventListener("submit", this.handle.submit);
        if (this.classList.contains("facets__type-buttons")) {
            this.addEventListener("click", this.fixFilterButtonNearLeftSide);
        }

        if (this.querySelector("price-range")) load("priceRange");
        if (this.querySelector("facets-slider")) load("facetsSlider");
    }

    onSubmitHandler(event) {
        const formData = new FormData(this.form);
        const params = new URLSearchParams(formData);
        const actionUrl = this.form.action.split("?")[0];

        // clean up search params
        params.delete("price[min]"); // service input of range slider
        params.delete("price[max]"); // service input of range slider

        // remove price filter params when value not set
        params.get("filter.v.price.lte") === "" &&
            params.delete("filter.v.price.lte");
        params.get("filter.v.price.gte") === "" &&
            params.delete("filter.v.price.gte");

        // remove sort params when it is default value
        if (this.form.sort_by?.dataset?.default === params.get("sort_by"))
            params.delete("sort_by");

        this.loadContent(actionUrl + "?" + params.toString());
    }

    fixFilterButtonNearLeftSide(event) {
        const setListStyles = (list) => {
            const details = list.parentElement;
            const getOverflowed = (child) => {
                const parent = child.parentElement;
                const overflowValue =
                    parent && (parent.style.overflow || parent.style.overflowX);

                if (!parent) return;

                if (overflowValue === "hidden") return parent;

                return getOverflowed(parent);
            };
            const getX = (el) => (el ? el.getBoundingClientRect().x : 0);
            const overflowed = getOverflowed(details);

            const dX = details.getBoundingClientRect().x;
            const left1 = -1 * (Math.floor(dX) - getX(overflowed));
            const left2 = -1 * (list.clientWidth - details.clientWidth);

            list.style.left = `calc(max(${left1}px, ${left2}px) + .5rem)`;
            list.style.maxWidth =
                overflowed && `calc(${overflowed.clientWidth}px - 1rem)`;
        };

        const summary = event.target.closest(".facets__type-buttons summary");
        const details = summary && summary.parentElement;
        const list = details && details.querySelector(".facets__display");

        if (details && list) {
            if (!details.open) {
                // details element is now closed. It means element is opening.
                window.requestAnimationFrame(() => {
                    setListStyles(list);
                });
                setTimeout(() => {
                    setListStyles(list);
                }, 200);
            }
        }
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        this.form.removeEventListener("input", this.handle.input);
        this.form.removeEventListener("submit", this.handle.submit);
        if (this.classList.contains("facets__type-buttons")) {
            this.removeEventListener("click", this.fixFilterButtonNearLeftSide);
        }
    }
}

export { CollectionFiltersForm };
