const { trapFocus, removeTrapFocus } = await import(
    window?._importmap?.imports?.["helper"] || "helper"
);

const _activateSliderWithCurrentProduct = (link) => {
    const currentProductId = link.dataset?.productId;
    const productsSlider = document.querySelector("#highlight-products > ul");
    if (!productsSlider) return;

    productsSlider.querySelectorAll("li").forEach((product) => {
        if (
            product
                .querySelector('button[type="submit"]')
                .classList.contains("animate-bounce")
        )
            product
                .querySelector('button[type="submit"]')
                .classList.remove("animate-bounce");

        if (product.dataset.productId === currentProductId) {
            setTimeout(() => {
                productsSlider.scrollLeft = product.offsetLeft;
                trapFocus(productsSlider, product.querySelector("a"));
                product
                    .querySelector('button[type="submit"]')
                    .classList.add("animate-bounce");
            }, 250);
        }
    });
};

const _getSpotLinks = () => {
    return document.querySelectorAll(".hotspot-link");
};

const _hideTooltips = () => {
    const links = _getSpotLinks();

    links.forEach((link) => {
        link.querySelector(".hotspot-tooltip").classList.remove("active");
    });
};

const _handleOnDocumentClick = (e) => {
    const links = _getSpotLinks();
    if (!links.length) return;

    let clickedInside = false;

    links.forEach((link) => {
        if (link.contains(event.target)) clickedInside = true;
    });

    if (!clickedInside) _hideTooltips();
};

const _showTooltip = (currentLink) => {
    _hideTooltips();
    currentLink.querySelector(".hotspot-tooltip").classList.add("active");
};

const _handleClick = (links) => {
    links.forEach((link) => {
        link.addEventListener("click", (e) => {
            e.preventDefault();

            _showTooltip(link);
            _activateSliderWithCurrentProduct(link);
        });
    });
};

const initHotSpot = () => {
    const spotLinks = _getSpotLinks();

    if (!spotLinks.length) return;
    _handleClick(spotLinks);
};

if (Shopify?.designMode) {
    document.addEventListener("shopify:section:load", initHotSpot);
}

document.addEventListener("click", (e) => {
    _handleOnDocumentClick(e);
});
initHotSpot();

export { initHotSpot };
