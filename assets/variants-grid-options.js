class SelectColorVariants extends HTMLElement {
    connectedCallback() {
        const restoreDelay = 300;
        const imgData = this.getImageData();

        var timeoutId; // time to reduce image flicking.

        if (Object.values(imgData).length < 1) {
            return;
        }

        this.querySelector(".swatch-attribute-options").addEventListener(
            "click",
            (event) => {
                // prevent all clicks on options div other that INPUT and LABEL
                if (
                    event.target.tagName !== "LABEL" &&
                    event.target.tagName !== "INPUT"
                ) {
                    event.preventDefault();
                }
            }
        );

        if (!this.getMedia()?.length < 0) return;

        this.querySelectorAll(".swatch-attribute-options label").forEach(
            (option) => {
                const media = this.getMedia();
                const updateImgSrc = () => {
                    const newImage = (
                        imgData[option.control.value] || ""
                    ).split("?")[0];

                    media.forEach((img) => {
                        const oldImage = img.getAttribute("src")?.split("?")[0];
                        const oldImageSrcset = img
                            .getAttribute("srcset")
                            ?.split("?")[0];

                        // update image src
                        if (newImage && oldImage) {
                            img.setAttribute(
                                "src",
                                img
                                    .getAttribute("src")
                                    .replaceAll(oldImage, newImage)
                            );

                            if (oldImageSrcset) {
                                img.setAttribute(
                                    "srcset",
                                    img
                                        .getAttribute("srcset")
                                        .replaceAll(oldImage, newImage)
                                );
                            }
                        }
                    });

                    if (!newImage) restoreImgSrc();
                };
                const restoreImgSrc = (useFocus = false) => {
                    media.forEach((img) => {
                        img.setAttribute(
                            "src",
                            (useFocus && img.dataset.focusSrc) ||
                                img.dataset.originalSrc
                        );
                        const imgSrcset = parseInt(
                            (useFocus && img.dataset.focusSrcset) ||
                                img.dataset.originalSrcset
                        );
                        if (imgSrcset) img.setAttribute("srcset", imgSrcset);
                    });
                };

                option.addEventListener("mouseenter", () => {
                    clearTimeout(timeoutId);
                    updateImgSrc();
                });

                option.addEventListener("mouseout", () => {
                    // delay image restore to reduce image flicking
                    timeoutId = setTimeout(() => {
                        restoreImgSrc(true);
                    }, restoreDelay);
                });

                // change grid item image on select swatch
                option.control.addEventListener("focusin", () => {
                    clearTimeout(timeoutId);
                    updateImgSrc();
                    media.forEach((img) => {
                        img.dataset.focusSrc = img.getAttribute("src");
                        img.dataset.focusSrcset = img.getAttribute("srcset");
                    });
                });

                option.control.addEventListener("focusout", () => {
                    // Don't restore image when option selected
                    if (option.control.checked) return;

                    timeoutId = setTimeout(() => {
                        restoreImgSrc(false);
                        media.forEach((img) => {
                            delete img.dataset.focusSrc;
                            delete img.dataset.focusSrcset;
                        });
                    }, restoreDelay);
                });
            }
        );
    }

    getMedia() {
        if (!this.media)
            this.media =
                this.closest("squama-item")?.querySelectorAll?.(
                    ".media > img"
                ) || [];

        // backup original values if not set
        this.media.length &&
            this.media.forEach((img) => {
                if (!img.dataset.originalSrc)
                    img.dataset.originalSrc = img.getAttribute("src");
                if (!img.dataset.originalSrcset)
                    img.dataset.originalSrcset = img.getAttribute("srcset");
            });

        return this.media;
    }

    getImageData() {
        if (!this.imageData)
            this.imageData = JSON.parse(
                this.querySelector('[type="application/json"]').textContent
            );

        return this.imageData;
    }
}

export { SelectColorVariants };
