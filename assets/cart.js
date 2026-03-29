const { onReveal: revealAnimation } = await import(
    window?._importmap?.imports?.["reveal-animation"] || "reveal-animation"
);
const { fetchConfig } = await import(
    window?._importmap?.imports?.["helper"] || "helper"
);

const customElementName = "cart-items";

class CartItems extends HTMLElement {
    constructor() {
        super();

        this.lineItemStatusElement = document.getElementById(
            "shopping-cart-line-item-status"
        );
        this.removeUploadFileBtns = document.querySelectorAll(
            ".remove-file-button"
        );
        this.currentItemCount = Array.from(
            this.querySelectorAll('[name="updates[]"]')
        ).reduce(
            (total, quantityInput) => total + parseInt(quantityInput.value),
            0
        );

        this.debouncedOnChange = debounce((event) => {
            this.onChange(event);
        }, 300);

        this.addEventListener("change", this.debouncedOnChange.bind(this));
    }

    connectedCallback() {
        // listen request for cart update from outside
        // for example remove item script
        this.unsubscribe = {
            cartUpdateRequest: subscribe(
                PUB_SUB_EVENTS.cartUpdateRequested,
                async ({ cart }) => {
                    if (cart && cart.items?.length < 1) {
                        window.location.reload();
                    } else {
                        let oldItemsNumber =
                            this.querySelectorAll(".cart-item").length;

                        await this.reload();
                        if (cart && cart.items?.length < oldItemsNumber) {
                            showNotificationOnRemoveItem();
                            this.recallRevealAnimation(this);
                        }
                    }
                }
            ),
        };

        this.removeUploadFileBtns.forEach((btn) => {
            btn.addEventListener("click", this.removeUploadedFile.bind(this));
        });
    }

    onChange(event) {
        this.updateQuantity(
            event.target.dataset.index,
            event.target.value,
            document.activeElement.getAttribute("name")
        );
    }

    getSectionsToRender() {
        return [
            {
                id: "main-cart-items",
                section: document.getElementById("main-cart-items").dataset.id,
                selector: "#main-cart-items .js-contents",
            },
            {
                id: "cart-icon-bubble",
                section: "cart-icon-bubble",
                selector: ".shopify-section",
            },
            {
                id: "cart-live-region-text",
                section: "cart-live-region-text",
                selector: ".shopify-section",
            },
            {
                id: "main-cart-footer",
                section: document.getElementById("main-cart-footer").dataset.id,
                selector: "#main-cart-footer .js-contents",
            },
        ];
    }

    reload() {
        if (!this.loader) {
            let html = document.getElementById(
                "template__loading-overlay"
            )?.innerHTML;

            if (html) {
                this.insertAdjacentHTML("beforeend", html);
                this.loader = this.children[this.children.length - 1];
            }
        }

        this.loader?.classList?.remove?.("hidden");

        return fetch(
            window.location.pathname +
                "?sections=" +
                this.getSectionsToRender()
                    .map((section) => section.section)
                    .join(",")
        )
            .then((response) => response.text())
            .then((text) => JSON.parse(text))
            .then((json) => {
                this.updateSections(json);
                this.loader?.classList?.add?.("hidden");

                return json;
            });
    }

    updateSections(source = {}) {
        this.getSectionsToRender().forEach(({ id, section, selector }) => {
            const tagretSection = document.getElementById(id);
            const targetElement =
                tagretSection.querySelector(selector) || tagretSection;

            targetElement.innerHTML = this.getSectionInnerHTML(
                source[section],
                selector
            );
        });
        this.recallRevealAnimation(this);
    }

    async updateQuantity(line, quantity, name) {
        this.enableLoading(line);

        const body = JSON.stringify({
            line,
            quantity,
            sections: this.getSectionsToRender().map(
                (section) => section.section
            ),
            sections_url: window.location.pathname,
        });

        fetch(`${routes.cart_change_url}`, { ...fetchConfig(), ...{ body } })
            .then((response) => response.text())
            .then((text) => JSON.parse(text))
            .then((json) => {
                if (json.errors) {
                    this.showMessage(line, json.errors);
                } else {
                    this.classList.toggle("is-empty", json.item_count === 0);
                    document
                        .querySelector(".cart__container")
                        ?.classList.toggle("is-empty", json.item_count === 0);

                    this.updateSections(json.sections);

                    this.updateLiveRegions(line, json.item_count);
                    document
                        .getElementById(`CartItem-${line}`)
                        ?.querySelector(`[name="${name}"]`)
                        ?.focus();
                }
                this.disableLoading(document.querySelector(".cart__container"));

                // reveal animation
                this.recallRevealAnimation(this);
            })
            .catch(() => {
                this.showMessage(line, window.cartStrings.error);
                this.disableLoading();

                // reveal animation
                this.recallRevealAnimation(this);
            });
    }

    removeUploadedFile(e) {
        const productOption = e.target.closest(".product-option");
        const itemKey = productOption?.dataset?.itemKey;
        const propertyName = productOption?.dataset?.propertyName;
        const body = JSON.stringify({
            id: itemKey,
            quantity: undefined, // will preserve current quantity
            properties: {
                [propertyName]: "",
            },
            sections: this.getSectionsToRender().map(
                (section) => section.section
            ),
            sections_url: window.location.pathname,
        });

        fetch(`${routes.cart_change_url}`, { ...fetchConfig(), ...{ body } })
            .then((response) => response.text())
            .then((text) => JSON.parse(text))
            .then((json) => {
                this.updateSections(json.sections);
            })
            .catch((err) => {
                console.error("Failed to remove file:", err);
            });
    }

    recallRevealAnimation(el) {
        const revealSection = new Set([el.closest(".reveal-slide-in")]);
        revealSection && revealAnimation(revealSection);
    }

    updateLiveRegions(line, itemCount) {
        if (this.currentItemCount === itemCount) {
            this.showMessage(line, window.cartStrings.quantityError);
        }

        this.currentItemCount = itemCount;
        this.lineItemStatusElement.setAttribute("aria-hidden", true);

        const cartStatus = document.getElementById("cart-live-region-text");
        cartStatus.setAttribute("aria-hidden", false);

        setTimeout(() => {
            cartStatus.setAttribute("aria-hidden", true);
        }, 1000);
    }

    showMessage(line, text) {
        if (line === "undefined") return;
        const details = document.querySelector(
            `#CartItem-${line} .cart-item__details`
        );
        const messageWrapper = details?.querySelector(".message-wrapper");
        const show = (messageWrapper) => {
            const qty = document.getElementById(`Quantity-${line}`)?.value;
            if (!messageWrapper) return;
            messageWrapper.removeAttribute("hidden");
            messageWrapper.querySelector(".error-message").innerHTML =
                text.replace("[quantity]", qty);
        };

        if (!messageWrapper) {
            fetchSectionHTML("template__message-wrapper", true, "/")
                .then((html) => {
                    details?.insertAdjacentHTML("beforeend", html);

                    return details?.querySelector(".message-wrapper");
                })
                .then(show);
        } else {
            show(messageWrapper);
        }
    }

    getSectionInnerHTML(html, selector) {
        return new DOMParser()
            .parseFromString(html, "text/html")
            .querySelector(selector).innerHTML;
    }

    enableLoading(line) {
        const itemTotals = this.querySelectorAll(".cart-item__totals").item(
            line - 1
        );

        itemTotals?.insertAdjacentHTML?.(
            "afterbegin",
            document.getElementById("template__loading-overlay")?.innerHTML
        );
        itemTotals?.classList?.add?.("loading");
        document
            .getElementById("main-cart-items")
            ?.classList?.add?.("cart__items--disabled");
        document.activeElement.blur();
        this.lineItemStatusElement.setAttribute("aria-hidden", false);
    }

    disableLoading() {
        this.querySelectorAll(".cart-item__totals").forEach((itemTotals) => {
            itemTotals.classList.remove("loading");
        });
        document
            .getElementById("main-cart-items")
            ?.classList?.remove?.("cart__items--disabled");
    }

    disconnectedCallback() {
        Object.values(this.unsubscribe).forEach((unsubscribe) => unsubscribe());
    }
}

function windowScrollToTop() {
    const scrollTrigger = 300;
    let scrollTop = window.scrollY;

    if (scrollTop > scrollTrigger)
        window.scroll({ top: 20, behavior: "smooth" });
}

function showNotificationOnRemoveItem() {
    var flowNotification = document.getElementById("flow-notification");

    if (flowNotification) {
        windowScrollToTop();

        setTimeout(() => {
            flowNotification.classList.remove("hidden");
        }, 200);

        setTimeout(() => {
            flowNotification.classList.add("hidden");
        }, 5000);
    }
}

export { CartItems, customElementName };
