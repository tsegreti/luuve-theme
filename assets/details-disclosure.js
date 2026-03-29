class DetailsDisclosure extends HTMLElement {
    constructor() {
        super();
        this.mainDetailsToggle = this.querySelector("details");

        this.handles = {
            onKeyUp: this.onKeyUp.bind(this),
            onFocusOut: this.onFocusOut.bind(this),
        };
    }

    connectedCallback() {
        this.addEventListener("keyup", this.handles.onKeyUp);
        this.mainDetailsToggle.addEventListener(
            "focusout",
            this.handles.onFocusOut
        );
    }

    onKeyUp(event) {
        if (event.code.toUpperCase() !== "ESCAPE") return;

        const openDetailsElement = event.target.closest("details[open]");
        if (!openDetailsElement) return;

        const summaryElement = openDetailsElement.querySelector("summary");
        openDetailsElement.removeAttribute("open");
        summaryElement.focus();
    }

    onFocusOut() {
        setTimeout(() => {
            if (!this.contains(document.activeElement)) this.close();
        });
    }

    close() {
        this.mainDetailsToggle.removeAttribute("open");
    }

    disconnectedCallback() {
        this.removeEventListener("keyup", this.handles.onKeyUp);
        this.mainDetailsToggle.removeEventListener(
            "focusout",
            this.handles.onFocusOut
        );
    }
}

export { DetailsDisclosure };
