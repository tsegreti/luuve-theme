class ComparisonSlider extends HTMLElement {
    constructor() {
        super();

        this.comparisonSlider = this;
        this.sliderRange =
            this.comparisonSlider.querySelector("#comparison-range");
        this.togglerPrev = this.comparisonSlider.querySelector(
            ".slider-toggler > svg:first-child"
        );
        this.togglerNext = this.comparisonSlider.querySelector(
            ".slider-toggler > svg:last-child"
        );
        this.previousValue = 0;

        if (!this.comparisonSlider || !this.sliderRange) return;
    }

    connectedCallback() {
        if ("ontouchstart" in window === false)
            this.sliderRange?.addEventListener(
                "mouseup",
                this.setSliderState.bind(this)
            );

        this.sliderRange?.addEventListener(
            "input",
            this.moveSliderRange.bind(this)
        );
        this.sliderRange?.addEventListener(
            "change",
            this.moveSliderRange.bind(this)
        );
    }

    setSliderState(e) {
        if (e.type === "input") {
            let inputValue = parseInt(e.target.value, 10);
            this.sliderRange.classList.add("comparison-range__active");

            //scale toggler icons on moving slider
            if (inputValue > this.previousValue) {
                this.togglerPrev.style.transform = "scale(1)";
                this.togglerNext.style.transform = "scale(1.35)";
            } else {
                this.togglerNext.style.transform = "scale(1)";
                this.togglerPrev.style.transform = "scale(1.35)";
            }
            this.previousValue = inputValue;
            return;
        }

        this.sliderRange.classList.remove("comparison-range__active");
        this.togglerNext.style.transform = "scale(1)";
        this.togglerPrev.style.transform = "scale(1)";
    }

    moveSliderRange(e) {
        let value = e.target.value;
        const slider = this.comparisonSlider.querySelector(
            "[data-comparison-slider]"
        );
        const imageWrapperOverlay = this.comparisonSlider.querySelector(
            "[data-image-overlay]"
        );

        if (window.innerWidth < 1285) {
            // set min and max value to prevent horizontal scrollbar on small screens
            if (value < 2) value = 1.5;
            if (value > 98) value = 98.5;
        }

        slider.style.left = `${value}%`;
        imageWrapperOverlay.setAttribute(
            "style",
            "--cursor-position:" + `${value}%`
        );

        this.setSliderState(e);
    }

    disconnectedCallback() {
        this.sliderRange?.addEventListener(
            "mouseup",
            this.setSliderState.bind(this)
        );
        this.sliderRange?.addEventListener(
            "input",
            this.moveSliderRange.bind(this)
        );
        this.sliderRange?.addEventListener(
            "change",
            this.moveSliderRange.bind(this)
        );
    }
}

export { ComparisonSlider };
