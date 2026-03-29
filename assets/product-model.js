const { DeferredMedia } = await import(
    window?._importmap?.imports?.["deferred-media"] || "deferred-media"
);

class ProductModel extends DeferredMedia {
    connectedCallback() {
        this.updateModelViewer();
        super.connectedCallback();
    }

    loadContent() {
        super.loadContent();
        Shopify.loadFeatures([
            {
                name: "model-viewer-ui",
                version: "1.0",
                onLoad: this.setupModelViewerUI.bind(this),
            },
        ]);
        window?.ProductModel?.loadShopifyXR?.();
    }

    setupModelViewerUI(errors) {
        if (errors) return;

        this.modelViewerUI = new Shopify.ModelViewerUI(
            this.querySelector("model-viewer")
        );
    }

    updateModelViewer() {
        const icon = this.button.querySelector("svg");
        const handleMutation = (mutationList, observer) => {
            mutationList
                .filter((m) => m.type === "childList")
                .map((m) =>
                    m.target.querySelector(
                        ".shopify-model-viewer-ui__poster-control-icon"
                    )
                )
                .filter((viewerButtonIcon) => viewerButtonIcon)
                .forEach((viewerButtonIcon) => {
                    viewerButtonIcon.innerHTML = icon.innerHTML;
                    observer.disconnect();
                });
        };
        const observer = new MutationObserver(handleMutation);

        icon && observer.observe(this, { childList: true, subtree: true });
    }
}

window.ProductModel = {
    loadShopifyXR() {
        Shopify.loadFeatures([
            {
                name: "shopify-xr",
                version: "1.0",
                onLoad: this.setupShopifyXR.bind(this),
            },
        ]);
    },

    setupShopifyXR(errors) {
        if (errors) return;

        if (!window.ShopifyXR) {
            document.addEventListener("shopify_xr_initialized", () =>
                this.setupShopifyXR()
            );
            return;
        }

        document
            .querySelectorAll('[id^="ProductJSON-"]')
            .forEach((modelJSON) => {
                window.ShopifyXR.addModels(JSON.parse(modelJSON.textContent));
                modelJSON.remove();
            });
        window.ShopifyXR.setupXRElements();
    },
};

if (document.readyState === "loading") {
    // Loading hasn't finished yet
    document.addEventListener(
        "DOMContentLoaded",
        window.ProductModel.loadShopifyXR.bind(window.ProductModel)
    );
} else {
    // `DOMContentLoaded` has already fired
    window.ProductModel.loadShopifyXR();
}

export { ProductModel };
