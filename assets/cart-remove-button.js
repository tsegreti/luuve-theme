const { fetchConfig } = await import(
    window?._importmap?.imports?.["helper"] || "helper"
);

class CartRemoveButton extends HTMLElement {
    constructor() {
        super();

        this.handles = {
            onClick: this.onClick.bind(this),
        };
    }

    connectedCallback() {
        this.querySelectorAll("a").forEach((a) =>
            a.addEventListener("click", this.handles.onClick)
        );
    }

    getItemKey() {
        const a = this.querySelector("a");
        const url = new URL(a?.href || "");

        return url.searchParams.get("id");
    }

    onClick(event) {
        event.preventDefault();
        fetch(window.Shopify.routes.root + "cart/change.js", {
            ...fetchConfig(),
            body: JSON.stringify({
                id: this.getItemKey(),
                quantity: 0,
            }),
        })
            .then((response) => response.json())
            .then((json) => {
                publish(PUB_SUB_EVENTS.cartUpdateRequested, { cart: json });
            })
            .catch((error) => {
                publish(PUB_SUB_EVENTS.cartUpdateRequested, { error: error });
                console.error("Error:", error);
            });
    }

    disconnectedCallback() {
        this.querySelectorAll("a").forEach((a) =>
            a.removeEventListener("click", this.handles.onClick)
        );
    }
}

export { CartRemoveButton };
