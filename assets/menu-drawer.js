const { trapFocus, removeTrapFocus } = await import(
    window._resolveImport?.("helper") || "helper"
);

const { HTMLElementExt } = await import(
    window._resolveImport?.("html-element-ext") || "html-element-ext"
);

class MenuDrawer extends HTMLElementExt {
    constructor() {
        super();

        this.mainDetailsToggle = this.querySelector("details");
        this.addAccessibilityAttributes(this.querySelectorAll("summary"));

        if (navigator.platform === "iPhone") {
            document.documentElement.style.setProperty(
                "--viewport-height",
                `${window.innerHeight}px`
            );
        }

        this.handles = {
            keyup: this.onKeyUp.bind(this),
            focusout: this.onFocusOut.bind(this),
            "click::summary": this.onSummaryClick.bind(this),
            "click::button:not(.disclosure__button),.menu-drawer__navigation-header .icon-x":
                this.onCloseButtonClick.bind(this),
        };
    }

    addAccessibilityAttributes(summary) {
        summary.forEach((el) => {
            el.setAttribute("role", "button");
            el.setAttribute("aria-expanded", false);
            el.setAttribute("aria-controls", el.nextElementSibling.id);
        });
    }

    onKeyUp(event) {
        if (event.code.toUpperCase() !== "ESCAPE") return;

        const openDetailsElement = event.target.closest("details[open]");
        if (!openDetailsElement) return;

        openDetailsElement === this.mainDetailsToggle
            ? this.closeMenuDrawer(
                  this.mainDetailsToggle.querySelector("summary")
              )
            : this.closeSubmenu(openDetailsElement);
    }

    onSummaryClick(event) {
        const summary = event.currentTarget;
        const details = summary.parentNode;
        const isOpen = details.hasAttribute("open");

        if (details === this.mainDetailsToggle) {
            if (isOpen) event.preventDefault();
            isOpen
                ? this.closeMenuDrawer(summary)
                : this.openMenuDrawer(summary);
        } else {
            trapFocus(
                summary.nextElementSibling,
                details.querySelector("button")
            );

            event.target
                .closest("ul")
                ?.querySelectorAll("details[open]")
                .forEach((detail) => {
                    if (detail !== details) {
                        detail.removeAttribute("open");
                        detail.classList.remove("menu-opening");
                    }
                });

            details.classList.toggle("menu-opening", !isOpen);
        }
    }

    openMenuDrawer(summary) {
        setTimeout(() => {
            this.mainDetailsToggle.classList.add("menu-opening");
            this.mainDetailsToggle.open = true;
        });
        summary.setAttribute("aria-expanded", true);
        trapFocus(this.mainDetailsToggle, summary);
        document.body.classList.add("overflow-hidden-mobile");
    }

    closeMenuDrawer(event, elementToFocus = false) {
        if (event !== undefined) {
            this.mainDetailsToggle.classList.remove("menu-opening");
            this.mainDetailsToggle
                .querySelectorAll("details")
                .forEach((details) => {
                    details.removeAttribute("open");
                    details.classList.remove("menu-opening");
                });
            this.mainDetailsToggle
                .querySelector("summary")
                .setAttribute("aria-expanded", false);
            this.closeAnimation(this.mainDetailsToggle);
            removeTrapFocus(elementToFocus);
        }
    }

    onFocusOut(event) {
        setTimeout(() => {
            if (
                this.mainDetailsToggle.hasAttribute("open") &&
                !this.mainDetailsToggle.contains(document.activeElement)
            ) {
                this.closeMenuDrawer();
                //prevent mobile overflow hidden
                document.body.classList.remove("overflow-hidden-mobile");
            }
        });
    }

    onCloseButtonClick(event) {
        const details = event.currentTarget.closest("details");
        this.closeSubmenu(details);
    }

    closeSubmenu(details) {
        details.classList.remove("menu-opening");
        this.closeAnimation(details);
        removeTrapFocus();
    }

    closeAnimation(details) {
        let animationStart;

        const handleAnimation = (time) => {
            if (animationStart === undefined) {
                animationStart = time;
            }

            const elapsedTime = time - animationStart;

            if (elapsedTime < 150) {
                window.requestAnimationFrame(handleAnimation);
            } else {
                details.removeAttribute("open");
                if (details == this.mainDetailsToggle) {
                    document.body.classList.remove("overflow-hidden-mobile");
                }
                if (details.closest("details[open]")) {
                    trapFocus(
                        details.closest("details[open]"),
                        details.querySelector("summary")
                    );
                }
            }
        };

        window.requestAnimationFrame(handleAnimation);
    }
}

export { MenuDrawer };
