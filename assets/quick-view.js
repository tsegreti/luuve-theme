const { HTMLElementExt } = await import(
    window._resolveImport?.("html-element-ext") || "html-element-ext"
);

const { onReveal: revealAnimation } = await import(
    window?._importmap?.imports?.["reveal-animation"] || "reveal-animation"
);

var _popup;

const _getPopup = async function () {
    if (!_popup && this) {
        this.insertAdjacentHTML(
            "beforeend",
            document
                .getElementById("template__loading-overlay")
                ?.innerHTML?.replace?.("hidden", "")
        );
        document.body.insertAdjacentHTML(
            "beforeend",
            await fetchSectionHTML(
                "quick-view__popup",
                true,
                Shopify.routes.root
            )
        );
        _popup = document.getElementById("PopupModal-quickView");
        this.querySelector?.(".loading-overlay")?.remove();
    }

    return _popup;
};

const _closePopupOnSubmit = (e) => {
    const cart = document.querySelector("cart-sidebar");
    const cartItems = document.querySelector("cart-items");

    e.preventDefault();
    setTimeout(async () => {
        cart && (await _getPopup.call(this)).hide?.();
        // reload cart items form
        if (document.body.classList.contains("cart"))
            cartItems && cartItems.reload();
    }, 850);
};

const _updatePopup = async (html) => {
    const content = _popup.querySelector(".popup-modal__content-info");

    [...content.children]
        .filter((el) => !el.matches(".loading-overlay"))
        .forEach((el) => el.remove());

    content.insertAdjacentHTML("afterbegin", html);
    // AFTER UPDATE FIXES
    // disable url update for variant options
    content
        .querySelectorAll("variant-selects, variant-radios")
        .forEach((el) => {
            el.dataset.updateUrl = "false";
        });

    // product form
    const form = _popup.querySelector("form");
    form && form.addEventListener("submit", (e) => _closePopupOnSubmit(e));

    const contentRevealAnimation = new Set([
        content.querySelector(".reveal-slide-in"),
    ]);

    // ugly workaround to fix variant options price update
    (() => {
        let section = content.querySelector("[data-section]")?.dataset?.section;

        if (section) content.id = `shopify-section-${section}`;
        else delete content.id;
    })();
    // init deferred components
    (async () => {
        const { collectDeferred, loadRevealFor } = await import(
            window._resolveImport?.("deferred") || "deferred"
        );

        collectDeferred(content);
        loadRevealFor(content);
        revealAnimation(contentRevealAnimation);
    })();
    // init shopify payment buttons
    Shopify?.PaymentButton?.init?.();
    // init Yotpo reviews widget
    if (typeof yotpoWidgetsContainer !== "undefined")
        yotpoWidgetsContainer?.initWidgets?.();
};

class QuickView extends HTMLElementExt {
    constructor() {
        super();

        this.handles = {
            click: (event) => {
                event.preventDefault();
                event.stopPropagation();

                _popup && _updatePopup("");
                Promise.all([
                    fetch(this.getUrl())
                        .then((result) => {
                            if (result.ok) return result.text();
                            else throw new Error(result.status);
                        })
                        .then((html) =>
                            [
                                ...new DOMParser()
                                    .parseFromString(html, "text/html")
                                    .querySelectorAll(this.getElements()),
                            ]
                                .map((el) => el.innerHTML)
                                .join("")
                        ),
                    this.showPopup(),
                ])
                    .then(([parsedHtml]) => {
                        _updatePopup(parsedHtml);
                    })
                    .finally(() => {
                        // render link View details
                        _popup &&
                            _popup
                                .querySelector(
                                    ".product__info-block--buy_buttons"
                                )
                                .insertAdjacentHTML(
                                    "afterend",
                                    this.renderViewDetailsLink()
                                );
                    });
            },
        };
    }

    renderViewDetailsLink() {
        return (
            `<a href="${this.getUrl()}" class="button button--tertiary button--small product__view-details">` +
            `<span>${this.dataset.viewDetails}</span></a>`
        );
    }

    getUrl() {
        return this.dataset.href || this.closest("a").href;
    }

    getElements() {
        return this.dataset.elements || ".shopify-section.product-section";
    }

    async showPopup() {
        (await _getPopup.call(this)).show();
    }
}

export { QuickView };
