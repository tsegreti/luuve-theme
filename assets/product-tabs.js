const { TabsComponent } = await import("tabs");

class ProductTabs extends TabsComponent {
    constructor() {
        super();

        this.handleExternalRatingClick = (event) => {
            const tabReviews = this.querySelector(
                '[role="tabpanel"][id^="tab-reviews"]'
            );

            if (tabReviews) {
                event.preventDefault();
                this.activateTab(
                    tabReviews
                        .closest('[role="tabpanel"]')
                        .id.replace("--content", ""),
                    true
                );
            }
        };
    }

    connectedCallback() {
        super.connectedCallback();
        document
            .querySelectorAll(".product__title--rating")
            .forEach((rating) => {
                rating.addEventListener(
                    "click",
                    this.handleExternalRatingClick
                );
            });
    }

    activateTab(tabId, scrollToTab = false) {
        scrollToTab ? super.activateTab(tabId) : false;
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        document
            .querySelectorAll(".product__title--rating")
            .forEach((rating) => {
                rating.removeEventListener(
                    "click",
                    this.handleExternalRatingClick
                );
            });
    }
}

export { ProductTabs };
