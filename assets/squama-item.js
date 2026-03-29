class SquamaItem extends HTMLElement {
    connectedCallback() {
        this.reinit();
        this.addEventListener("focusin", this.handleFocusIn);
        this.addEventListener("focusout", this.handleFocusOut);
        this.resizeUnsubscriber = subscribe(
            PUB_SUB_EVENTS.windowResizeX,
            this.reinit.bind(this)
        );
    }

    disconnectedCallback() {
        this.removeEventListener("focusin", this.handleFocusIn);
        this.removeEventListener("focusout", this.handleFocusOut);
        this.resizeUnsubscriber?.();
    }

    handleFocusIn() {
        this.setAttribute("data-focused", "");
    }

    handleFocusOut(event) {
        // remove data-focused when focus is out of squama-item
        if (!this.contains(event.relatedTarget)) {
            this.removeAttribute("data-focused");
            this.scrollTop = 0;
        }
    }

    reinit() {
        this.uninit();
        // product info block recommendations & minicart block recommendations
        if (this.closest("product-block-recommendations")) {
            this.uninit();
            return;
        }

        setTimeout(() => {
            // Set height for squama item when hover supported
            // Other wise set heigh 'auto'.
            this.style.height = window.matchMedia("(hover: hover)").matches
                ? this.clientHeight + "px"
                : "auto";
            this.setAttribute("data-status", "ready");
        }, 100);
    }

    uninit() {
        this.removeAttribute("data-status");
        this.style.height = "auto";
    }
}

export { SquamaItem };
