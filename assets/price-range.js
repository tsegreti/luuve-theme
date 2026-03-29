class PriceRange extends HTMLElement {
    constructor() {
        super();

        this.rangeSlider = this.querySelector("range-slider");
        this.handle = {
            onRangeChange: this.onRangeChange.bind(this),
            onRangeSliderInput: this.onRangeSliderInput.bind(this),
        };
    }

    connectedCallback() {
        this.querySelectorAll("input[type=number]").forEach((element) => {
            element.addEventListener("change", this.handle.onRangeChange);
        });

        this.setMinAndMaxValues();
        if (this.rangeSlider) {
            this.rangeSlider.addEventListener(
                "input",
                this.handle.onRangeSliderInput
            );
            this.addRangeSliderStyles();
            this.rangeSlider.insertAdjacentHTML("beforeend", "<div> </div>");
            this.onRangeSliderInput();
        }
    }

    addRangeSliderStyles() {
        if (document.getElementById("price-range-slider-styles")) return;

        const style = document.createElement("style");

        style.id = "price-range-slider-styles";
        style.innerHTML = `
        price-range range-slider {
          --thumb-width: .875rem;
          --thumb-border: 2px solid var(--color-background);
          --thumb-bg: ${getComputedStyle(this)
              .getPropertyValue("--color-base-accent-1-rgb")
              .replaceAll(",", " ")};
        }

        price-range range-slider div {
          background: rgba(var(--thumb-bg) / .9);
          border-radius: var(--track-border-radius);
          height: var(--track-height);
          position: absolute;
          top: calc(50% - var(--track-height) / 2);
        }
      `;

        document.head.append(style);
    }

    onRangeChange(event) {
        this.adjustToValidValues(event.currentTarget);
        this.setMinAndMaxValues();
        this.updateRangeSlider();
    }

    updateRangeSlider() {
        const inputs = this.querySelectorAll("input[type=number]");
        const minInput = inputs[0];
        const maxInput = inputs[1];
        const range = this.querySelector("range-slider");

        if (!range) return;

        range.value = [
            Math.floor(minInput.value || minInput.min),
            Math.ceil(maxInput.value || maxInput.max),
        ];
        this.onRangeSliderInput();
    }

    setMinAndMaxValues() {
        const inputs = this.querySelectorAll("input[type=number]");
        const minInput = inputs[0];
        const maxInput = inputs[1];
        if (maxInput.value) minInput.setAttribute("max", maxInput.value);
        if (minInput.value) maxInput.setAttribute("min", minInput.value);
        if (minInput.value === "") maxInput.setAttribute("min", 0);
        if (maxInput.value === "")
            minInput.setAttribute("max", maxInput.getAttribute("max"));
    }

    adjustToValidValues(input) {
        const value = Number(input.value);
        const min = Number(input.getAttribute("min"));
        const max = Number(input.getAttribute("max"));

        if (value < min) input.value = min;
        if (value > max) input.value = max;
    }

    onRangeSliderInput(event) {
        const range = this.rangeSlider;
        const min = Number(range.getAttribute("min"));
        const max = Number(range.getAttribute("max"));
        const value = range.value || range.getAttribute("value").split("-");
        const between = range.querySelector("div");

        between.style.left = `calc((${value[0]} - ${min})/ (${max} - ${min}) * 100%)`;
        between.style.width = `calc((${value[1]} - ${value[0]}) / (${max} - ${min}) * 100%)`;

        const inputs = this.querySelectorAll("input[type=number]");
        if (value[0] != min) inputs[0].value = value[0];
        else inputs[0].value = "";

        if (value[1] != max) inputs[1].value = value[1];
        else inputs[1].value = "";

        // event?.stopPropagation?.();
    }

    disconnectedCallback() {
        this.querySelectorAll("input[type=number]").forEach((element) => {
            element.removeEventListener("change", this.handle.onRangeChange);
        });

        if (this.rangeSlider) {
            this.rangeSlider.removeEventListener(
                "input",
                this.handle.onRangeSliderInput
            );
        }
    }
}

export { PriceRange };
