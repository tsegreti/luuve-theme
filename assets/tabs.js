class TabsComponent extends HTMLElement {
    constructor() {
        super();

        this.radios = this.querySelectorAll('[type="radio"][name^="tabs-"]');
        this.handleTabOpen = (event) => {
            this.activateTab(event.target.id, true);
        };

        if (Shopify?.designMode) {
            this.handleBlockSelect = (event) => {
                const block = JSON.parse(
                    event.target.dataset.shopifyEditorBlock
                );
                this.activateTab(`tab-${block.id}`, true);
            };
        }
    }

    connectedCallback() {
        this.radios.forEach((radio) => {
            radio.addEventListener("input", this.handleTabOpen);
        });
        if (this.handleBlockSelect)
            document.addEventListener(
                "shopify:block:select",
                this.handleBlockSelect
            );
    }

    getContent(tabId) {
        return this.querySelector(`#${tabId}--content`);
    }

    getLabel(tabId) {
        return this.querySelectorAll(`[for="${tabId}"]`);
    }

    activateTab(tabId, scrollToTab = false) {
        const radio = this.querySelector(`#${tabId}`);
        const content = this.getContent(tabId);
        const labels = this.getLabel(tabId);

        if (radio) radio.checked = true;

        if (content) {
            if (content.querySelector("squama-item")) {
                // redraw squama items when tab opened
                publish(PUB_SUB_EVENTS.windowResizeX);
            }

            let slider = content.querySelector("slider-component");
            if (slider) {
                // redraw slider when tab opened
                slider?.disconnectedCallback?.();
                slider?.connectedCallback?.();
            }
        }

        labels?.forEach((label) => {
            if (label) {
                this.scrollIntoTab(label);
                label
                    .closest('[role="tablist"]')
                    ?.querySelectorAll?.("label")
                    ?.forEach?.((label) =>
                        label.classList.remove("tab-label__active")
                    );
                label.classList.add("tab-label__active");
            }
        });
    }

    async scrollIntoTab(label) {
        const top = label.getBoundingClientRect().top;
        const headerOffset =
            document.querySelector("sticky-header")?.clientHeight || 0;
        let { getGlobalOffsetTop } = await import(
            window?._importmap?.imports?.["helper"] || "helper"
        );

        if (top > headerOffset) {
            window.scroll({
                top: getGlobalOffsetTop(label) - headerOffset - 20,
                behavior: "smooth",
            });
        }
    }

    disconnectedCallback() {
        this.radios.forEach((radio) => {
            radio.removeEventListener("input", this.handleTabOpen);
        });
        if (this.handleBlockSelect)
            document.removeEventListener(
                "shopify:block:select",
                this.handleBlockSelect
            );
    }
}

export { TabsComponent };
