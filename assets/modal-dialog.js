class ModalDialog extends HTMLElement {
    constructor() {
        super();
        this.addEventListener("click", (event) => {
            if (event.target.nodeName === "MODAL-DIALOG") this.hide();
            if (event.target.closest('[id^="ModalClose-"]')) this.hide();
        });
        this.addEventListener("keyup", () => {
            if (event.code?.toUpperCase() === "ESCAPE") this.hide();
        });
    }

    show(opener) {
        const trapFocus = async () => {
            (
                await import(
                    window?._importmap?.imports?.["helper"] || "helper"
                )
            ).trapFocus(this, this.querySelector('[role="dialog"]'));
        };
        this.openedBy = opener;
        this.setAttribute("open", "");
        this.querySelectorAll("deferred-media").forEach(async (el) => {
            await customElements.whenDefined(el.tagName.toLowerCase());
            el.loadContent();
        });
        trapFocus();
    }

    hide() {
        this.removeAttribute("open");
        import(window?._importmap?.imports?.["helper"] || "helper").then(
            (helper) => {
                helper.removeTrapFocus(this.openedBy);
                helper.pauseAllMedia();
            }
        );
    }
}

export { ModalDialog };
