class HeaderMenu extends HTMLElement {
    constructor() {
        super();

        this.container = this.querySelector(".header__inline-menu > ul");
        this.itemsDetails = this.querySelectorAll("[data-items-menu] details");
        this.megaMenuOverlay = document.querySelector(
            ".header-menu__overlay-element"
        );

        if (!this.itemsDetails.length) return;

        this.itemsDetails.forEach((detail) => {
            // remove dropdown menu links if config option is checked
            this.removeDropdownMenuLinks(detail);

            // open megamenu dropdown inner
            if (detail.lastElementChild.dataset.typeMenu == "full-width") {
                detail.setAttribute("open", true);
                // set dropdown inner max-height (Fix for Firefox and Safari browsers)
                this.setMaxHeight(detail);
            }
        });

        this.handles = {
            onItemClick: this.activateItemMenuOnClick.bind(this),
            onItemHover: this.activateItemMenuOnHover.bind(this),
            onDetailsToggle: async (event) => {
                const helper = await import(
                    window?._importmap?.imports?.["helper"] || "helper"
                );
                const details = event.target;
                const _getDropdown = (d) =>
                    [...d.children].find((el) => el.tagName !== "SUMMARY");
                const _trapIntoParent = (el) => {
                    let details = el && el.closest("details[open]");
                    details && helper.trapFocus(_getDropdown(details));
                };

                if (details && details.open) {
                    // transition animation
                    this.itemTransition(details);
                } else {
                    helper.removeTrapFocus();
                    _trapIntoParent(details);
                }
            },
        };
    }

    connectedCallback() {
        this.itemsDetails.forEach((detail) => {
            // activate items on click else on hover
            if (this.container.dataset?.activateMenu == "on_click")
                detail.addEventListener("click", this.handles.onItemClick);
            else
                detail.addEventListener("mouseenter", this.handles.onItemHover);

            // trap focus when menu opened
            detail.addEventListener("toggle", this.handles.onDetailsToggle);
        });
    }

    activateItemMenuOnClick(e) {
        let detail = e.target.closest("details");

        if (
            detail.parentElement.nodeName === "DETAILS-DISCLOSURE" &&
            e.target.nodeName !== "A"
        ) {
            e.preventDefault();
            e.stopPropagation();

            this.activateItemMenu(detail);
        }
        // close all opened details except the current one
        this.closeOpenedDetails(detail);
    }

    closeOpenedDetails(currentDetail) {
        let dropdownInner = currentDetail.closest(".header__submenu");
        if (!dropdownInner) return;

        dropdownInner.querySelectorAll("details")?.forEach((detail) => {
            if (detail !== currentDetail) detail.removeAttribute("open");
        });
    }

    activateItemMenuOnHover(e) {
        let detail = e.target.closest("details");

        // megamenu dropdown inner - prevent hiding child menu on leaving parent caterory item
        if (
            detail.lastElementChild.dataset.typeMenu == "full-width" &&
            detail.closest("ul.header__submenu")
        )
            return;

        this.activateItemMenu(detail);
        detail.addEventListener(
            "mouseleave",
            this.diactivateItemMenu.bind(this)
        );
    }

    activateItemMenu(detail) {
        detail.open = true;
        detail.dataset.active = "true";

        // transition animation
        this.itemTransition(detail);

        if (
            this.megaMenuOverlay &&
            detail.closest("li").classList.contains("full-width")
        )
            this.showOverlay();
    }

    itemTransition(detail) {
        const delay = 75;
        const child =
            detail && detail.querySelectorAll(".header__submenu > li");
        if (!child) return;

        child.forEach((li, i) => {
            li.classList.add("item--transition");
            li.style.animationDelay = delay * i + "ms";
        });
    }

    showOverlay() {
        this.megaMenuOverlay.classList.add("active");
    }

    removeOverlay() {
        this.megaMenuOverlay.classList.remove("active");
    }

    diactivateItemMenu(event) {
        const detail = event.target;

        detail.dataset.active = "false";
        setTimeout(() => {
            detail.open = detail.dataset.active === "true";
        }, 150);

        // update dropdown menu animation
        detail
            .querySelectorAll(".header__submenu > li")
            ?.forEach((li) => li.classList.remove("item--transition"));
        this.megaMenuOverlay && this.removeOverlay();
    }

    removeDropdownMenuLinks(detail) {
        let dropdownInner = detail.closest(".dropdown-inner");

        if (
            dropdownInner?.classList.contains("full-width") &&
            dropdownInner?.firstElementChild?.classList.contains("remove-menu")
        ) {
            dropdownInner.querySelector(
                ".col-items"
            ).dataset.menuRemoved = true;
            dropdownInner.querySelector(".col-items").children[0].remove();
        }
    }

    setMaxHeight(detail) {
        let dropdownInner = detail.closest(".dropdown-inner");
        if (!dropdownInner) return;

        let inner_height = window.innerHeight,
            inner_width = window.innerWidth;

        if (inner_width < 980) return;

        let headerSectionHeight = document.querySelectorAll(
                ".shopify-section-group-header-group"
            ),
            sum = 0;

        headerSectionHeight?.forEach((el) => {
            if (el.id.indexOf("_header") > 0) sum += el.offsetHeight; // get all header top sections height
        });

        dropdownInner.style.maxHeight = inner_height - sum + "px";
        dropdownInner.style.overflowX = "auto";
    }

    disconnectedCallback() {
        this.itemsDetails.forEach((detail) => {
            if (this.container.dataset?.activateMenu == "on_click")
                detail.removeEventListener("click", this.handles.onItemClick);
            else {
                detail.removeEventListener(
                    "mouseenter",
                    this.handles.onItemHover
                );
                detail.removeEventListener("focusin", this.handles.onItemFocus);
            }
            detail.removeEventListener("toggle", this.handles.onDetailsToggle);
        });
    }
}

export { HeaderMenu };
