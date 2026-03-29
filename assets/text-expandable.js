const isSafari = () =>
    navigator.userAgent.includes("Instagram") ||
    /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

const computeMaxHeight = (element, textLinesLimit) => {
    let lines = 0;
    let maxHeight = 0;

    [...element.children]
        .filter((child) => child.offsetParent)
        .forEach((child) => {
            let style = window.getComputedStyle(child);

            if (lines >= textLinesLimit) {
                return;
            }

            if (child.textContent) {
                lines += Math.ceil(
                    parseInt(style.height) / parseInt(style.lineHeight)
                );
                maxHeight = child.offsetTop + child.clientHeight;
                if (lines > textLinesLimit) {
                    // number of lines exits the limit
                    // subtract redundent lines
                    maxHeight -=
                        parseInt(style.lineHeight) * (lines - textLinesLimit);
                }
            } else {
                lines++;
                if (textLinesLimit >= lines) {
                    maxHeight = child.offsetTop + child.clientHeight;
                }
            }
        });

    return maxHeight;
};

class TextExpandable extends HTMLElement {
    constructor() {
        super();

        this.handles = {
            onClick: this.onClick.bind(this),
        };
    }

    connectedCallback() {
        isSafari() && this.classList.add("fallback--max-height");
        this.prepareButton();

        this.resizeObserver = new ResizeObserver(() => {
            if (this.classList.contains("fallback--max-height")) {
                // browser doesn't support line-clamps; use fallback logic
                let lineClamp = parseInt(
                    this.style.getPropertyValue("--line-clamp")
                );
                let maxHeight = computeMaxHeight(this, lineClamp);

                this.style.maxHeight = maxHeight === 0 ? "" : maxHeight + "px";
                // fixed description overlap for Safari browser when block uses reveal animation
                this.style.overflow = "auto";
            }

            this.toggleExpand();
        });
        this.resizeObserver.observe(this);
        this.addEventListener("click", this.handles.onClick);
    }

    toggleExpand() {
        this.buttons.expand.hidden = this.scrollHeight === this.clientHeight;
    }

    prepareButton() {
        if (this.buttons) return;

        this.insertAdjacentHTML(
            "beforeend",
            [
                '<a href="#expand" class="btn--expand">',
                this.dataset.buttonTextExpand,
                "</a>",
                '<a href="#collapse" class="btn--collapse" hidden>',
                this.dataset.buttonTextNarrow,
                "</a>",
            ].join("")
        );

        this.buttons = {
            expand: this.querySelector(".btn--expand"),
            collapse: this.querySelector(".btn--collapse"),
        };
    }

    onClick(event) {
        const { expand, collapse } = this.buttons;

        if (
            !expand.contains(event.target) &&
            !collapse.contains(event.target)
        ) {
            return;
        }

        event.preventDefault();
        if (expand.contains(event.target)) {
            this.dataset.expanded = true;
            collapse.hidden = false;
            collapse.focus({ preventScroll: true });
        } else {
            this.dataset.expanded = false;
            collapse.hidden = true;
        }

        window.requestAnimationFrame(() => {
            this.toggleExpand();

            if (collapse.hidden) {
                expand.focus({ preventScroll: true });
                // when collapse button is hidden scroll into viewport if needed
                this.scrollToMeIfNeeded();
            }
        });
    }

    async scrollToMeIfNeeded() {
        const stickyHeader = document.querySelector("sticky-header");
        const topOffset = stickyHeader?.clientHeight || 0;

        if (
            this.getBoundingClientRect().top - topOffset < 10 ||
            this.getBoundingClientRect().top > window.innerHeight
        ) {
            let { getGlobalOffsetTop } = await import(
                window?._importmap?.imports?.["helper"] || "helper"
            );

            window.scroll({
                top: getGlobalOffsetTop(this) - (topOffset + 10),
                behavior: "smooth",
            });
        }
    }

    disconnectedCallback() {
        this.resizeObserver.disconnect();
        this.removeEventListener("click", this.handles.onClick);
    }
}

export { TextExpandable };
