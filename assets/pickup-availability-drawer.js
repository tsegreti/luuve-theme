const { trapFocus, removeTrapFocus } = await import(
    window?._importmap?.imports?.["helper"] || "helper"
);

class PickupAvailabilityDrawer extends HTMLElement {
    constructor() {
        super();

        this.onBodyClick = this.handleBodyClick.bind(this);

        this.querySelector("button").addEventListener("click", (evt) => {
            evt.preventDefault();
            this.hide();
        });

        this.addEventListener("keyup", () => {
            if (event.code.toUpperCase() === "ESCAPE") this.hide();
        });
    }

    handleBodyClick(evt) {
        const target = evt.target;
        if (
            target != this &&
            !target.closest("pickup-availability-drawer") &&
            target.id != "ShowPickupAvailabilityDrawer"
        ) {
            this.hide();
        }
    }

    hide() {
        this.removeAttribute("open");
        document.body.removeEventListener("click", this.onBodyClick);
        removeTrapFocus(
            this.contains(document.activeElement) ? this.activeElement : null
        );
        delete this.dataset.dropdownDir;
    }

    show() {
        const possibleTop = this.getBoundingClientRect().top;
        const possibleBottom =
            window.innerHeight -
            (this.getBoundingClientRect().bottom + this.clientHeight);

        this.setAttribute("open", "");
        if (possibleBottom < 0) {
            this.dataset.dropdownDir = "toTop";
            setTimeout(() => {
                if (this.getBoundingClientRect().top < 0)
                    this.scrollIntoView({ behavior: "smooth" });
            }, 300);
        } else {
            this.dataset.dropdownDir = "toBottom";
        }
        document.body.addEventListener("click", this.onBodyClick);
        // add short delay so browser could find element to focus
        // when there is animations it can be tricky for browser
        setTimeout(() => {
            this.activeElement = document.activeElement;
            trapFocus(this, this.querySelector(".modal__close-button"));
        }, 100);
    }
}

export { PickupAvailabilityDrawer };
