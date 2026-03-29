class VariantSelects extends HTMLElement {
    constructor() {
        super();
        this.addEventListener("change", this.onVariantChange);
    }

    connectedCallback() {
        if (this.dataset.markUnavailable === "true") this.markUnavailable();
    }

    onVariantChange(event) {
        const variants = event.target.closest(".variants");
        if (!variants) return;

        const sectionId = variants.dataset.section;
        const oldProductUrl = variants.dataset.url;
        const optionValueElement = event.target.closest("[data-product-url]");
        const newProductUrl =
            optionValueElement?.dataset.productUrl || this.dataset.url;

        // collect selected radios or selects
        const selectedOptionValues = this.getSelectedOptions();

        const params = selectedOptionValues.length
            ? `&option_values=${selectedOptionValues.join(",")}`
            : "";

        fetch(`${newProductUrl}?section_id=${sectionId}${params}`)
            .then((r) => r.text())
            .then((htmlText) => {
                const html = new DOMParser().parseFromString(
                    htmlText,
                    "text/html"
                );

                // if switching products → replace product section
                if (newProductUrl && oldProductUrl !== newProductUrl) {
                    const newVariants = html.querySelector(".variants");
                    if (newVariants) {
                        variants.replaceWith(newVariants);
                        document.querySelector(`#${event.target.id}`)?.focus();
                    }
                    return;
                }

                // if same product → refresh option picker only
                const group = event.target.closest("[data-option-index]");
                if (group) {
                    const idx = group.dataset.optionIndex;
                    const newGroup = html.querySelector(
                        `[data-option-index="${idx}"]`
                    );

                    if (newGroup) {
                        const oldSelect = group.querySelector("select");
                        const newSelect = newGroup.querySelector("select");

                        if (oldSelect && newSelect) {
                            // it's a <select> group - sync options instead of replacing
                            const selectedValue = oldSelect.value;
                            oldSelect.innerHTML = newSelect.innerHTML;
                            if (selectedValue) {
                                const optionToSelect = oldSelect.querySelector(
                                    `[value="${CSS.escape(selectedValue)}"]`
                                );
                                //re-check the previously selected value
                                if (optionToSelect)
                                    optionToSelect.selected = true;
                            }
                        } else {
                            // it's radios - replace whole group
                            const selectedValue = group.querySelector(
                                "[type=radio]:checked"
                            )?.value;

                            group.innerHTML = newGroup.innerHTML;

                            if (selectedValue) {
                                const matchingInput = group.querySelector(
                                    `[value="${CSS.escape(selectedValue)}"]`
                                );
                                //re-check the previously selected value
                                if (matchingInput) matchingInput.checked = true;
                            }
                        }

                        // focus back on changed element
                        const focusedSelector = `[data-option-value-id="${optionValueElement?.dataset?.optionValueId}"]`;
                        const newFocus =
                            this.querySelector(focusedSelector) ||
                            document.querySelector(focusedSelector);
                        newFocus?.focus();
                    }
                }

                // Continue original variant handling
                this.updateOptions();
                this.updateMasterId();
                this.toggleAddButton(true, "", false);
                this.updatePickupAvailability();
                this.removeErrorMessage();

                if (!this.currentVariant) {
                    this.toggleAddButton(true, "", true);
                    this.setUnavailable();
                } else {
                    this.updateMedia();
                    this.updateURL();
                    this.updateVariantInput();
                    this.renderProductInfo();
                }

                if (this.dataset.markUnavailable === "true")
                    this.markUnavailable();
            })
            .catch(console.error);
    }

    markUnavailable() {
        const selectedOptions = this.getSelectedOptions();
        const variants = this.getVariantData();
        const buildTitle = (title, variant) =>
            variant
                ? title +
                  (variant.available
                      ? ""
                      : ` [${window.variantStrings.soldOut}]`)
                : title + ` [${window.variantStrings.unavailable}]`;
        const findVariant = (options) =>
            variants.find((v) => v.options.join(",") === options.join(","));

        this.querySelectorAll("[data-option-index]").forEach((row) => {
            const select = row.querySelector("select");
            const radios = row.querySelectorAll("[type=radio]");

            if (select) {
                for (let item of select.options) {
                    let options = selectedOptions.slice();
                    let variant;

                    options[row.dataset.optionIndex] = item.value;
                    variant = findVariant(options);
                    item.text = buildTitle(item.value, variant);
                }
            }

            radios.forEach((radio) => {
                let label = radio.labels[0];
                let options = selectedOptions.slice();
                let variant;

                options[row.dataset.optionIndex] = radio.value;
                variant = findVariant(options);
                if (variant)
                    radio.classList[variant.available ? "remove" : "add"](
                        "option-unavailable"
                    );
                else radio.classList.add("option-unavailable");

                if (label) {
                    !label.dataset.title && (label.dataset.title = label.title);
                    label.title = buildTitle(label.dataset.title, variant);
                }
            });
        });

        this.updateLabelValue();
    }

    getSelectedOptions() {
        const options = [];

        this.querySelectorAll("[data-option-index]").forEach((row) => {
            options[row.dataset.optionIndex] = row.querySelector(
                "[type=radio]:checked, select"
            ).value;
        });

        return options;
    }

    reinitReviewWidgets() {
        if (typeof yotpoWidgetsContainer !== "undefined")
            yotpoWidgetsContainer?.initWidgets?.();

        if (typeof window.okeWidgetApi !== "undefined") {
            const widgetElement = document.querySelector(
                "[data-oke-star-rating]"
            );
            window.okeWidgetApi.initWidget(widgetElement);
        }
    }

    updateOptions() {
        const values = Array.from(
            this.querySelectorAll("[type=radio], select"),
            (el) => (el.type === "radio" ? el.checked && el.value : el.value)
        );

        this.options = values.filter((value) => value);

        setTimeout(() => {
            this.reinitReviewWidgets();
        }, 2000);
    }

    updateLabelValue() {
        const options = this.getSelectedOptions();
        this.querySelectorAll(".form__label").forEach((el, index) => {
            el.dataset.value = options[index];
            el.innerHTML =
                el.title +
                ":&nbsp;" +
                '<span class="lighter">' +
                options[index] +
                "</span>";
        });
    }

    updateMasterId() {
        this.currentVariant = this.getVariantData().find((variant) => {
            return !variant.options
                .map((option, index) => {
                    return this.options[index] === option;
                })
                .includes(false);
        });
    }

    updateMedia() {
        if (!this.currentVariant || !this.currentVariant?.featured_media)
            return;
        const gallery = document.getElementById(
            `gallery-${this.dataset.section}`
        );

        if (!gallery) return;
        gallery.sliderItems.forEach((item, index) => {
            if (item.dataset.mediaId == this.currentVariant.featured_media.id) {
                gallery.activateSlide(index);
            }
        });
    }

    updateURL() {
        if (!this.currentVariant || this.dataset.updateUrl === "false") return;
        window.history.replaceState(
            {},
            "",
            `${this.dataset.url}?variant=${this.currentVariant.id}`
        );
    }

    removeErrorMessage() {
        const section = this.closest("section");
        if (!section) return;

        const productForm = section.querySelector("product-form");
        productForm?.handleErrorMessage?.();
    }

    updateVariantInput() {
        const productForms = document.querySelectorAll(
            `#product-form-${this.dataset.section}, #product-form-installment`
        );
        productForms.forEach((productForm) => {
            const input = productForm.querySelector('input[name="id"]');
            input.value = this.currentVariant.id;
            input.dispatchEvent(new Event("change", { bubbles: true }));
        });
    }

    updatePickupAvailability() {
        const pickUpAvailability = document.querySelector(
            "pickup-availability"
        );
        if (!pickUpAvailability) return;

        if (this.currentVariant?.available) {
            pickUpAvailability.fetchAvailability(this.currentVariant.id);
        } else {
            pickUpAvailability.removeAttribute("available");
            pickUpAvailability.innerHTML = "";
        }
    }

    renderProductInfo() {
        const ids = this.getUpdatable();

        fetch(
            `${this.dataset.url}?variant=${this.currentVariant.id}&section_id=${this.dataset.section}`
        )
            .then((response) => response.text())
            .then((responseText) => {
                const html = new DOMParser().parseFromString(
                    responseText,
                    "text/html"
                );

                ids.map((id) => {
                    const destination = document.getElementById(id);
                    const source = html.getElementById(id);

                    if (source && destination)
                        destination.innerHTML = source.innerHTML;
                    this.updatePricesVisibility();
                    this.updateStockVisibility();
                });

                this.toggleAddButton(
                    !this.currentVariant?.available,
                    window.variantStrings.soldOut
                );
            });
    }

    toggleAddButton(disable = true, text, modifyClass = true) {
        const addButton = this.getAddButton();

        if (!addButton) return;

        if (disable) {
            addButton.setAttribute("disabled", true);
            if (text) this.setButtonText(addButton, text);
        } else {
            addButton.removeAttribute("disabled");
            this.setButtonText(addButton, window.variantStrings.addToCart);
        }

        if (!modifyClass) return;
    }

    setButtonText(button, text) {
        button.querySelector(".text").textContent = text;
        button.dataset.toCartAvailable =
            text === window.variantStrings.addToCart;
    }

    setUnavailable() {
        const addButton = this.getAddButton();

        if (!addButton) return;
        this.setButtonText(addButton, window.variantStrings.unavailable);
        this.updatePricesVisibility("hidden");
        this.updateStockVisibility("hidden");
    }

    updatePricesVisibility(value = "") {
        document
            .getElementById(`shopify-section-${this.dataset.section}`)
            .querySelectorAll(".product__price")
            .forEach((price) => {
                price.style.visibility = value;
            });
    }

    updateStockVisibility(value = "") {
        document
            .getElementById(`shopify-section-${this.dataset.section}`)
            .querySelectorAll(".stock-status")
            .forEach((stockStatus) => {
                stockStatus.style.visibility = value;
            });
    }

    getAddButton() {
        return document
            .getElementById(`product-form-${this.dataset.section}`)
            ?.querySelector('[name="add"]');
    }

    getVariantData() {
        this.variantData =
            this.variantData ||
            JSON.parse(
                this.querySelector('[type="application/json"]').textContent
            );
        return this.variantData;
    }

    getUpdatable() {
        var updatable = [];

        document.querySelectorAll('[data-updatable="true"]').forEach((el) => {
            el.id && updatable.push(el.id);
        });

        return updatable;
    }
}

export { VariantSelects };
