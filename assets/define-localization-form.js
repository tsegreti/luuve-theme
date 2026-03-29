const { trapFocus, removeTrapFocus } = await import(
    window?._importmap?.imports?.["helper"] || "helper"
);

class LocalizationForm extends HTMLElement {
    constructor() {
        super();

        this.elements = {
            input: this.querySelector(
                'input[name="locale_code"], input[name="country_code"], input[name="currency_code"]'
            ),
            button: this.querySelector("button"),
            panel:
                this.querySelector(".localization-panel") ||
                this.querySelector("ul"),
        };
        this.elements_const = 5;
        this.elements.button
            .querySelectorAll("i[data-code]")
            .forEach(this.insertFallbackIcon);

        this.handle = {
            onBodyClick: this.handleBodyClick.bind(this),
            onButtonClick: this.openSelector.bind(this),
            onKeyUp: this.handleKeyup.bind(this),
            onPanelClick: this.onItemClick.bind(this),
            onSearchInput: this.filterSwitcherList.bind(this),
        };
    }

    connectedCallback() {
        this.elements.button.addEventListener(
            "click",
            this.handle.onButtonClick
        );
        this.elements.panel.addEventListener("click", this.handle.onPanelClick);
        this.addEventListener("keyup", this.handle.onKeyUp);
    }

    handleBodyClick(event) {
        if (
            !this.elements.button.contains(event.target) &&
            !this.elements.panel.contains(event.target)
        )
            this.closeSelector(event);
    }

    handleKeyup(event) {
        if (event.code.toUpperCase() === "ESCAPE") {
            this.closeSelector(event);
            event.stopPropagation();
        }
    }

    onItemClick(event) {
        const item = event.target.closest("a");

        if (item) {
            event.preventDefault();
            this.elements.input.value = item.dataset.value;
            this.querySelector("form")?.submit();
        }
    }

    resolvePanel() {
        if (this.elements.panel.innerHTML)
            return new Promise((resolve, reject) => {
                resolve(this.elements.panel);
            });
        else
            return fetchSectionHTML(this.dataset.panelSource, false, "/").then(
                (html) => {
                    this.elements.panel.insertAdjacentHTML("afterbegin", html);

                    return this.elements.panel;
                }
            );
    }

    renderSearchInput(panel) {
        if (parseInt(panel.dataset.localizationSize) < this.elements_const)
            return;

        const input_class = "switcher-search-input";
        if (!panel.querySelector("." + input_class)) {
            const inputLabel = document.createElement("label");
            inputLabel.setAttribute("for", input_class);
            inputLabel.textContent = "Search for...";
            inputLabel.className = "hidden";

            const input = document.createElement("input");
            input.type = "search";
            input.placeholder = panel.dataset.searchPlaceholder;
            input.className = input_class;
            input.id = input_class;
            input.addEventListener("input", this.handle.onSearchInput);

            // insert input at the top of the panel
            panel.prepend(input);
            panel.prepend(inputLabel);
        }
    }

    async openSelector() {
        document.body.addEventListener("click", this.handle.onBodyClick);
        this.elements.panel.toggleAttribute("hidden");
        this.elements.button.setAttribute(
            "aria-expanded",
            (
                this.elements.button.getAttribute("aria-expanded") === "false"
            ).toString()
        );
        const panel = await this.resolvePanel();

        // apply search input
        this.renderSearchInput(panel);

        // scroll to active item
        const link = panel.querySelector(".disclosure__link--active");
        const item = link && link.closest(".disclosure__item");

        if (item) {
            item.parentNode.scrollTop =
                item.offsetTop - item.parentNode.clientHeight / 2;
        }

        panel.querySelectorAll("i[data-code]").forEach(this.insertFallbackIcon);

        setTimeout(() => {
            trapFocus(panel, link);
        }, 100);
    }

    filterSwitcherList(e) {
        const searchTerm = e.target.value.toLowerCase();
        const items = this.elements.panel.querySelectorAll(".disclosure__item");

        if (!items.length) return;
        items.forEach((item) => {
            const text = item.textContent.toLowerCase();
            item.style.display = text.includes(searchTerm) ? "" : "none";
        });
    }

    closeSelector(event) {
        const shouldClose =
            event.relatedTarget && event.relatedTarget.nodeName === "BUTTON";
        if (
            event.relatedTarget === null ||
            typeof event.relatedTarget === "undefined" ||
            shouldClose
        ) {
            this.elements.button.setAttribute("aria-expanded", "false");
            this.elements.panel.setAttribute("hidden", true);
        }

        document.body.removeEventListener("click", this.handle.onBodyClick);
        removeTrapFocus(
            this.contains(document.activeElement) ? this.elements.button : null
        );
    }

    insertFallbackIcon(element) {
        const iconCode = (element.dataset.code || "").toLowerCase();

        if (!element.dataset.hasFallback && iconCode) {
            // as fallback use flag icons from https://github.com/HatScripts/circle-flags
            element.insertAdjacentHTML(
                "afterbegin",
                `<img src="https://hatscripts.github.io/circle-flags/flags/${iconCode}.svg" loading="lazy" />`
            );
            element.dataset.hasFallback = true;
        }
    }

    disconnectedCallback() {
        this.elements.button.removeEventListener(
            "click",
            this.handle.onButtonClick
        );
        this.elements.panel.removeEventListener(
            "click",
            this.handle.onPanelClick
        );
        this.removeEventListener("keyup", this.handle.onKeyUp);
    }
}

export { LocalizationForm };
