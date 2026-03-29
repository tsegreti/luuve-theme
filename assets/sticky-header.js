class StickyHeader extends HTMLElement {
    connectedCallback() {
        this.header = document.querySelector("sticky-header").parentElement;
        this.currentScrollTop = 0;
        this.scrollUnsubscriber = subscribe(
            PUB_SUB_EVENTS.windowScroll,
            this.onScroll.bind(this)
        );
    }

    disconnectedCallback() {
        this.scrollUnsubscriber?.();
    }

    onScroll() {
        const scrollTop =
            window.pageYOffset || document.documentElement.scrollTop;
        const scrollTrigger = 500;

        if (scrollTop > scrollTrigger && scrollTop < this.currentScrollTop) {
            requestAnimationFrame(this.reveal.bind(this));
        } else {
            this.header.classList.add("sticky-animation");
            requestAnimationFrame(this.reset.bind(this));
        }

        this.currentScrollTop = scrollTop;
    }

    reveal() {
        this.header.classList.add("section-header-sticky");
        this.header.classList.remove("sticky-animation");
    }

    reset() {
        this.header.classList.remove("section-header-sticky");
        this.closeMenuDisclosure();
        // close minicart
        this.querySelector("cart-sidebar")?.close?.();
    }

    closeMenuDisclosure() {
        this.disclosures =
            this.disclosures ||
            this.header.querySelectorAll("details-disclosure");
        this.disclosures.forEach((disclosure) => disclosure?.close?.());
    }
}

export { StickyHeader };
