const { HTMLElementExt } = await import(
    window._resolveImport?.("html-element-ext") || "html-element-ext"
);

/**
 * Zero line is an imagenary horizontal line on screen where parallax
 * component should centered.
 * For initlially visible element zelo line is its inital position.
 * For elements out of viewport zero line is in the midle of viewport.
 */
const getZeroLine = (el) => {
    const { dataset } = el;
    let zeroLine = parseFloat(dataset.zeroLine);

    if (!zeroLine || isNaN(zeroLine)) {
        const rect = el.getBoundingClientRect();
        const midY = rect.y + rect.height / 2;

        zeroLine =
            midY > 0 && midY < window.innerHeight
                ? midY
                : window.innerHeight / 2;

        dataset.zeroLine = zeroLine;
    }

    return zeroLine;
};

class ParallaxComponent extends HTMLElementExt {
    constructor() {
        super();

        this.handles = {
            "scroll::::document": () => {
                window.requestAnimationFrame(() => this.update());
            },
        };
    }

    connectedCallback() {
        super.connectedCallback();
        this.update();
    }

    getSpeed() {
        const speed = parseFloat(this.dataset.speed || "0.2");
        return isNaN(speed) ? 0.2 : speed;
    }

    getOffsetY(el) {
        const rect = el.getBoundingClientRect();
        const elementCenter = rect.y + rect.height / 2;
        return elementCenter - getZeroLine(el);
    }

    update() {
        const speed = this.getSpeed();

        for (const child of this.children) {
            const tag = child.tagName.toLowerCase();

            switch (tag) {
                case "svg":
                    this.updateSvg(child, speed);
                    break;
                case "img":
                    this.updateImg(child, speed);
                    break;
                default:
                    this.applyTransform(child, speed);
                    break;
            }
        }
    }

    applyTransform(el, speed) {
        const y = this.getOffsetY(el) * -speed;
        Object.assign(el.style, {
            transform: `translateY(${y}px)`,
            transition: "none",
        });
    }

    updateImg(img, speed) {
        const y = this.getOffsetY(img) * speed;
        const { style, dataset } = img;
        const origin = this.dataset.originalObjectPosition;
        const base =
            origin === "top"
                ? "0%"
                : origin === "bottom"
                ? "100%"
                : (
                      dataset.originalObjectPosition ||
                      style.objectPosition ||
                      "50% 50%"
                  ).split(" ")[1];
        const xPos = (
            dataset.originalObjectPosition ||
            style.objectPosition ||
            "50% 50%"
        ).split(" ")[0];

        if (!dataset.originalObjectPosition)
            dataset.originalObjectPosition = `${xPos} ${base}`;

        style.objectPosition = `${xPos} calc(${base} ${
            origin === "bottom" ? "-" : "+"
        } ${y}px)`;
        style.transition = "none";
    }

    updateSvg(svg, speed) {
        const y = this.getOffsetY(svg) * -speed;

        for (const child of svg.children) {
            child.style.transform = `translateY(${y / 2}px)`;
        }
    }
}

export { ParallaxComponent };
