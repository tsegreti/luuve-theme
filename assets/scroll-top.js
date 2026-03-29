class ScrollTop extends HTMLElement {
    constructor() {
        super();

        this.scrollTrigger = 700;
    }

    connectedCallback() {
        this.scrollUnsubscriber = subscribe(
            PUB_SUB_EVENTS.windowScroll,
            this.scrollTop.bind(this)
        );
        this.addEventListener("click", this.handleClick);
    }

    handleClick(event) {
        event.preventDefault();
        window.scroll({
            top: 0,
            behavior: "smooth",
        });
    }

    getQuickAdd() {
        return document.querySelector(".product-quick-add");
    }

    updateBtnPosition() {
        const quickAdd = this.getQuickAdd();

        if (
            quickAdd &&
            quickAdd.offsetTop - this.offsetTop - this.offsetHeight < 20
        ) {
            this.style.top = quickAdd.offsetTop - this.offsetHeight - 20 + "px";
        }
    }

    scrollTop() {
        this.hidden = window.scrollY < this.scrollTrigger;
        /* fix overlapping scroll btn with product-quick-add container */
        //this.updateBtnPosition();
    }

    disconnectedCallback() {
        this.scrollUnsubscriber?.();
        this.removeEventListener("click", this.handleClick);
    }
}

fetchSectionHTML("scroll-top", false, "/").then((html) => {
    document.getElementById("MainContent").insertAdjacentHTML("afterend", html);
});

export { ScrollTop };
