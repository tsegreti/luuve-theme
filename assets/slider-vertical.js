const _getGapInPx = (element) => {
    const computedStyles = window.getComputedStyle(element);
    const gap = parseFloat(computedStyles.gap);

    return gap === NaN ? 0 : gap;
};

class SliderVertical extends HTMLElement {
    constructor() {
        super();
        this.upButton = this.querySelector('button[name="up"]');
        this.downButton = this.querySelector('button[name="down"]');
        this.panel = this.querySelector(".slider-vertical--panel");
        this.thumbsZoomIcon = this.panel.querySelectorAll("a");
        // this.thumbsZoomIcon = this.panel.querySelectorAll('a .icon-plus');

        this.bindedUpdateButtons = this.updateButtons.bind(this);
        this.handles = {
            onDownButtonClick: (event) => {
                const gap = _getGapInPx(this.panel);

                event.preventDefault();
                this.panel.scrollTop +=
                    this.panel.children[0].offsetHeight + gap;
                setTimeout(this.bindedUpdateButtons, 200);
            },
            onUpButtonClick: (event) => {
                const gap = _getGapInPx(this.panel);

                event.preventDefault();
                this.panel.scrollTop -=
                    this.panel.children[0].offsetHeight + gap;
                setTimeout(this.bindedUpdateButtons, 200);
            },
            onThumbIconClick: (event) => {
                event.preventDefault();

                const target = event.target;
                const mainGallery = target.closest(
                    ".product__info-block--gallery"
                );
                const thumbsMode =
                    target.closest("slider-vertical")?.dataset.thumbsMode;
                const productModal = document.querySelector("product-modal");
                const thumbId = target.closest("a").dataset.id;

                if (thumbsMode === "grid_theme" && productModal && thumbId) {
                    const modalOpenerButton = document.querySelector(
                        `modal-opener[data-media-id="${thumbId}"] button`
                    );
                    productModal?.show?.(modalOpenerButton);
                    productModal?.showMedia?.(thumbId);
                }

                // scroll to the main gallery
                if (thumbsMode !== "grid_theme") {
                    setTimeout(() => {
                        mainGallery.scrollIntoView({ behavior: "smooth" });
                    }, 200);
                }
            },
        };
    }

    connectedCallback() {
        this.updateButtons();
        this.dataset.status = "ready";
        this.unsubscribeResize = subscribe(
            PUB_SUB_EVENTS.windowResizeX,
            this.updateButtons.bind(this)
        );
        this.panel.addEventListener("scroll", this.bindedUpdateButtons);

        this.thumbsZoomIcon.forEach((thumb) => {
            thumb.addEventListener("click", this.handles.onThumbIconClick);
        });

        this.upButton.addEventListener("click", this.handles.onUpButtonClick);
        this.downButton.addEventListener(
            "click",
            this.handles.onDownButtonClick
        );
    }

    updateButtons() {
        const panel = this.panel;

        if (panel.scrollTop == 0) {
            this.upButton.style.setProperty("display", "none", "important");
        } else {
            this.upButton.style.setProperty("display", "");
        }

        if (panel.scrollHeight - panel.scrollTop == panel.clientHeight) {
            this.downButton.style.setProperty("display", "none", "important");
        } else {
            this.downButton.style.setProperty("display", "");
        }
    }

    disconnectedCallback() {
        delete this.dataset.status;
        this.unsubscribeResize?.();
        this.panel.removeEventListener("scroll", this.bindedUpdateButtons);
        this.upButton.removeEventListener(
            "click",
            this.handles.onUpButtonClick
        );
        this.downButton.removeEventListener(
            "click",
            this.handles.onDownButtonClick
        );
    }
}

export { SliderVertical };
