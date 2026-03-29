document.addEventListener("shopify:block:select", (event) => {
    const popup = event.target.closest("popup-banner");

    if (popup && popup.show) popup.show(true);
});

document.addEventListener("shopify:block:deselect", (event) => {
    document.querySelectorAll("popup-banner[open]").forEach((popup) => {
        popup.hide && popup.hide();
    });
});
