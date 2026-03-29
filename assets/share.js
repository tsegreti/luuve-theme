const { DetailsDisclosure } = await import(
    window?._importmap?.imports?.["details-disclosure"] || "details-disclosure"
);

class ShareButton extends DetailsDisclosure {
    constructor() {
        super();

        this.elements = {
            shareButton: this.querySelector("button"),
            successMessage: this.querySelector('[id^="ShareMessage"]'),
            urlInput: this.querySelector("input"),
        };

        this.handle = {
            onClick: this.onClick.bind(this),
        };
    }

    connectedCallback() {
        super.connectedCallback();
        if (navigator.share) {
            this.mainDetailsToggle.setAttribute("hidden", "");
            this.elements.shareButton.classList.remove("hidden");
        }

        this.addEventListener("click", this.handle.onClick);
    }

    share() {
        navigator.share({
            url: document.location.href,
            title: document.title,
        });
    }

    onClick(event) {
        const summary = event.target.closest("summary");
        const copyButton = event.target.closest("details button");

        if (summary && navigator.share) {
            this.share();
        } else if (summary && !navigator.share) {
            let details = this.mainDetailsToggle;
            let toRightSide = Math.floor(
                document.body.clientWidth -
                    (details.getBoundingClientRect().x + details.clientWidth)
            );

            if (details.open) {
                this.elements.successMessage.classList.add("hidden");
            } else {
                // adjust popup position
                [...details.children]
                    .filter((node) => node.tagName !== "SUMMARY")
                    .map((node) => {
                        node.style.right = "";
                        return node;
                    })
                    .filter((node) => toRightSide < node.clientWidth)
                    .forEach((node) => {
                        node.style.right = `-${
                            toRightSide - details.clientWidth
                        }px`;
                    });
                setTimeout(() => {
                    details.open = true;
                });
            }
        } else if (copyButton) {
            this.copyToClipboard();
        } else if (this.elements.shareButton.contains(event.target)) {
            this.share();
        }
    }

    copyToClipboard() {
        navigator.clipboard.writeText(this.elements.urlInput.value).then(() => {
            this.elements.successMessage.classList.remove("hidden");
            this.elements.successMessage.setAttribute("aria-hidden", false);

            setTimeout(() => {
                this.elements.successMessage.setAttribute("aria-hidden", true);
            }, 6000);
        });
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        if (navigator.share) {
            this.elements.shareButton.removeEventListener("click", this.share);
        } else {
            this.removeEventListener("click", this.handle.onClick);
        }
    }
}

export { ShareButton };
