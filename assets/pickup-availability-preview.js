const { load } = await import(
    window?._importmap?.imports?.["deferred"] || "deferred"
);

class PickupAvailabilityPreview extends HTMLElement {
    constructor() {
        super();

        this.handle = {
            click: this.onClick.bind(this),
        };
    }

    connectedCallback() {
        this.addEventListener("click", this.handle.click);
    }

    onClick(event) {
        const trigger = event.target.closest("[data-popup][data-action]");

        if (trigger) {
            event.preventDefault();
            event.stopPropagation();
            this.process(trigger);
        }
    }

    process(trigger) {
        const popup = document.getElementById(trigger.dataset.popup);
        const action = trigger.dataset.action;
        const tagName = popup?.tagName?.toLowerCase?.();

        if (tagName === "pickup-availability-drawer") {
            (async () => {
                if (!customElements.get(tagName)) {
                    load("pickupAvailabilityDrawer");
                    await customElements.whenDefined(tagName);
                }
                popup && popup[action]?.();
            })();
        }
    }

    disconnectedCallback() {
        this.removeEventListener("click", this.handle.click);
    }
}

export { PickupAvailabilityPreview };
