const { fetchConfig } = await import(
    window._resolveImport?.("helper") || "helper"
);
const { load: loadComponent } = await import(
    window._resolveImport?.("deferred") || "deferred"
);

class ProductForm extends HTMLElement {
    constructor() {
        super();

        this.form = this.querySelector("form");
        this.form.querySelector("[name=id]")?.removeAttribute?.("disabled");
        this.handleSubmit = this.onSubmitHandler.bind(this);
    }

    connectedCallback() {
        this.form.addEventListener("submit", this.handleSubmit);
    }

    getSubmitButton() {
        return [...this.form.elements].find(
            (element) => element.type === "submit"
        );
    }

    getParentListItem() {
        return this.closest(".products .grid-item");
    }

    resolveMessageWrapper() {
        const useCache = true;

        this.messageWrapper = this.querySelector(".message-wrapper");

        if (this.messageWrapper) {
            return new Promise((resolve, reject) => {
                resolve(this.messageWrapper);
            });
        }

        return fetchSectionHTML(
            "template__message-wrapper",
            useCache,
            Shopify.routes.root
        ).then((html) => {
            const item = this.getParentListItem();

            if (item) {
                let itemLink = item.querySelector(".item-link");

                if (itemLink) {
                    // when product form in listing then add message wrapper into item card
                    itemLink.insertAdjacentHTML?.("beforeend", html);
                    this.messageWrapper =
                        itemLink.children[itemLink.children.length - 1];
                }
            } else {
                let submit = this.getSubmitButton();

                if (submit) {
                    submit.insertAdjacentHTML("afterend", html);
                    this.messageWrapper = submit.nextSibling;
                }
            }

            return this.messageWrapper;
        });
    }

    setLoading(isLoading = true) {
        const submit = this.getSubmitButton();

        if (!this.loader) {
            let html = document.getElementById(
                "template__loading-overlay"
            )?.innerHTML;

            submit.insertAdjacentHTML(
                "afterbegin",
                html?.replace?.(" hidden", "")
            );
            this.loader = submit.children[0];
        }

        submit?.setAttribute("aria-disabled", isLoading);
        submit?.classList?.toggle("loading", isLoading);
        this.loader?.classList?.toggle?.("hidden", !isLoading);
    }

    getCartJson() {
        return fetch(window.Shopify.routes.root + "cart.js", {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        }).then((response) => response.json());
    }

    async handleSubmitError(response) {
        const cart = document.querySelector("cart-sidebar");
        const itemCount = +cart?.querySelector?.(".cart-sidebar__total")
            ?.dataset?.itemCount;
        const newCartJson = await this.getCartJson();

        if (itemCount === newCartJson.item_count) {
            this.handleErrorMessage(response.description);

            return;
        }

        await cart.reload();
        let line = 1;
        let variantId = [...this.form.elements].find(
            (el) => el.name === "id"
        )?.value;
        if (variantId) {
            newCartJson.items?.forEach?.((item, index) => {
                if (item.variant_id === +variantId) line = index + 1;
            });
        }

        cart.showError(line, response.description);
        cart.revealStickyHeaderAndOpen() || cart.open();
    }

    onSubmitHandler(evt) {
        const cart = document.querySelector("cart-sidebar");

        if (!cart) {
            return;
        }

        evt?.preventDefault?.();
        if (cart.getSectionsToRender) {
            this.submitForm();
        } else {
            customElements
                .whenDefined("cart-sidebar")
                .then(this.submitForm.bind(this));
            loadComponent("cartSidebar");
        }
    }

    submitForm() {
        const cart = document.querySelector("cart-sidebar");
        const config = fetchConfig("javascript");
        const formData = new FormData(this.form);

        if (this.getSubmitButton().classList.contains("loading")) {
            return;
        }

        this.handleErrorMessage();
        this.setLoading(true);

        config.headers["X-Requested-With"] = "XMLHttpRequest";
        delete config.headers["Content-Type"];

        cart.setActiveElement && cart.setActiveElement(document.activeElement);
        formData.append(
            "sections",
            cart.getSectionsToRender().map((section) => section.id)
        );

        formData.append("sections_url", window.location.pathname);
        config.body = formData;

        fetch(`${routes.cart_add_url}`, config)
            .then((response) => response.json())
            .then((response) => {
                if (response.status) {
                    this.handleSubmitError(response);
                    return;
                }

                cart.renderContents(response);

                // hide gift card recipient form on submit
                let recipientForm = this.querySelector("recipient-form");
                if (recipientForm?.checkboxInput) {
                    recipientForm.hide();
                    recipientForm.checkboxInput.checked = false;
                }
            })
            .catch((e) => {
                console.error(e);
            })
            .finally(() => {
                this.setLoading(false);
            });
    }

    async handleErrorMessage(errorMessage = false) {
        let wrapper = this.messageWrapper;

        if (errorMessage === false && !wrapper) {
            // when no messsage to show and no message wrapper
            // then do nothing to prevent redundent request
            return;
        } else if (!wrapper) {
            wrapper = await this.resolveMessageWrapper();
        }

        let message = wrapper?.querySelector?.(".error-message");

        if (!message) {
            return;
        }

        // gift-card recipient form error messages
        if (
            errorMessage.email ||
            errorMessage.send_on ||
            errorMessage.message
        ) {
            errorMessage =
                errorMessage.email ||
                errorMessage.send_on ||
                errorMessage.message;
        }

        message.textContent = errorMessage || "";
        wrapper.hidden = !errorMessage;
    }

    disconnectedCallback() {
        this.form.removeEventListener("submit", this.handleSubmit);
    }
}

export { ProductForm };
