class DragAndDrop {
    constructor(sliderElement) {
        if (!sliderElement || window.innerWidth < 990) return;

        this.slider = sliderElement;
        this.sliderItems = this.slider.querySelectorAll(".slider__slide");
        this.isDragging = false;
        this.startX = 0;
        this.startScrollLeft = 0;
        this.animationFrame = null;

        this.onPointerDown = this.onPointerDown.bind(this);
        this.onPointerMove = this.onPointerMove.bind(this);
        this.onPointerUp = this.onPointerUp.bind(this);

        this.slider.addEventListener("pointerdown", this.onPointerDown);
        this.slider.addEventListener("pointermove", this.onPointerMove);
        this.slider.addEventListener("pointerup", this.onPointerUp);
        this.slider.addEventListener("pointerleave", this.onPointerUp);
    }

    onPointerDown(e) {
        e.preventDefault();
        this.isDragging = true;
        this.startX = e.pageX;
        this.startScrollLeft = this.slider.scrollLeft;
        this.setCursor("grabbing");
    }

    onPointerMove(e) {
        if (!this.isDragging) return;
        e.preventDefault();
        this.disableSliderLink();
        const deltaX = e.pageX - this.startX;

        if (this.animationFrame) cancelAnimationFrame(this.animationFrame);

        this.animationFrame = requestAnimationFrame(() => {
            this.slider.scrollLeft = this.startScrollLeft - deltaX;
        });
    }

    onPointerUp(e) {
        if (!this.isDragging) return;
        this.isDragging = false;
        this.setCursor("grab");

        const itemWidth = this.sliderItems[0]?.clientWidth || 1;
        const scrollLeft = this.slider.scrollLeft;
        const index = Math.round(scrollLeft / itemWidth);
        const options = {
            left: index * itemWidth,
            behavior: "smooth",
        };

        const sliderComponent = this.slider.closest("slider-component");
        const effectModule = sliderComponent?.dataset?.effectModuleSrc || "";

        if (effectModule.includes("fade"))
            window?._sliderFadeEffectScrollTo?.(sliderComponent, options);
        else this.slider.scrollTo(options);

        setTimeout(() => {
            this.enableSliderlink();
        });
    }

    disableSliderLink() {
        this.slider
            .querySelectorAll("a.slider__link")
            .forEach((link) => link.classList.add("link-disabled"));
    }

    enableSliderlink() {
        this.slider
            .querySelectorAll("a.slider__link")
            .forEach((link) => link.classList.remove("link-disabled"));
    }

    setCursor(cursor) {
        this.sliderItems.forEach((el) => {
            el.style.cursor = cursor;
        });
    }
}

export { DragAndDrop };
