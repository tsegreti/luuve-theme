class FacetsSlider extends HTMLElement {
    constructor() {
        super();

        this.inner = this.querySelector(".facets__wrapper");
        this.handle = {
            innerScroll: this.updateButtons.bind(this),
            click: this.onClick.bind(this),
        };
    }

    connectedCallback() {
        this.style.position = "relative";
        this.style.display = "block";
        this.inner.style.overflowX = "hidden";
        this.inner.style.flexWrap = "nowrap";
        this.inner.style.whiteSpace = "nowrap";
        this.insertAdjacentHTML(
            "afterbegin",
            document.getElementById("filters-in-toolbar--prev-button").innerHTML
        );
        this.insertAdjacentHTML(
            "beforeend",
            document.getElementById("filters-in-toolbar--next-button").innerHTML
        );

        this.inner.addEventListener("scroll", this.handle.innerScroll);
        this.addEventListener("click", this.handle.click);
        setTimeout(this.updateButtons.bind(this), 200);
    }

    updateButtons() {
        this.querySelector("[name=prev]").hidden = this.inner.scrollLeft === 0;
        this.querySelector("[name=next]").hidden =
            this.inner.scrollWidth - this.inner.scrollLeft ==
            this.inner.clientWidth;
    }

    onClick(event) {
        function scrollTo(element, direction) {
            element.parentElement.scroll({
                left:
                    direction === "left"
                        ? element.offsetLeft - 20
                        : element.parentElement.scrollLeft +
                          element.clientWidth +
                          10,
                behavior: "smooth",
            });
        }

        function getNextHidden(parent) {
            for (let child of parent.children) {
                if (
                    child.offsetParent && // element not hidden
                    parent.scrollLeft + parent.clientWidth <
                        child.offsetLeft + child.clientWidth
                ) {
                    return child;
                }
            }
        }

        function getPrevHidden(parent) {
            var element;

            for (let child of parent.children) {
                if (
                    child.offsetParent && // element not hidden
                    parent.scrollLeft > child.offsetLeft
                ) {
                    element = child;
                }
            }

            return element;
        }

        const button = event.target.closest("[name=prev],[name=next]");
        const summary = event.target.closest(" summary");
        const slider = this.inner;

        if (button) {
            if (button.name === "next") {
                let element = getNextHidden(slider);

                event.preventDefault();
                if (element) scrollTo(element, "right");
                else
                    slider.scroll({
                        left: slider.scrollLeft + 24,
                        behavior: "smooth",
                    });
            } else if (button.name === "prev") {
                let element = getPrevHidden(slider);

                event.preventDefault();
                if (element) scrollTo(element, "left");
                else slider.scroll({ left: 0, behavior: "smooth" });
            }
        }

        if (summary) {
            if (summary.parentElement === getNextHidden(slider)) {
                scrollTo(summary.parentElement, "right");
            } else if (summary.parentElement === getPrevHidden(slider)) {
                scrollTo(summary.parentElement, "left");
            }
        }
    }

    disconnectedCallback() {
        this.inner.removeEventListener("scroll", this.handle.innerScroll);
        this.removeEventListener("click", this.handle.click);
    }
}

export { FacetsSlider };
