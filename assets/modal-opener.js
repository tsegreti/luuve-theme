class ModalOpener extends HTMLElement {
    constructor() {
        super();

        this.button = this.querySelector("button");
        this.handleClick = () => {
            const modal = document.querySelector(this.dataset.modal);
            const removeLoader = () => {
                setTimeout(() => {
                    this.button?.querySelector(".loading-overlay")?.remove?.();
                }, 200);
            };

            if (modal.dataset.deferredName) {
                (async () => {
                    const { load } = await import(
                        window?._importmap?.imports?.["deferred"] || "deferred"
                    );
                    const deferredNames = (
                        modal.dataset.deferredName || ""
                    ).split(",");

                    deferredNames.forEach((name) => load(name, this.button));
                    await customElements.whenDefined(
                        modal.tagName.toLowerCase()
                    );
                    modal.show(this.button);
                    removeLoader();
                })();
            } else {
                modal.show(this.button);
            }
        };
    }

    connectedCallback() {
        this.button?.addEventListener?.("click", this.handleClick);
    }

    disconnectedCallback() {
        this.button?.removeEventListener?.("click", this.handleClick);
    }
}

export { ModalOpener };
