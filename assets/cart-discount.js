const { fetchConfig } = await import(
    window?._importmap?.imports?.["helper"] || "helper"
);

const { onReveal: revealAnimation } = await import(
    window?._importmap?.imports?.["reveal-animation"] || "reveal-animation"
);

const { CartItems } = await import(
    window?._importmap?.imports?.["cart-items"] || "cart-items"
);

class CartDiscountCode extends CartItems {
    constructor() {
        super();

        this.discountForm = this.querySelector("#discount-form");
        if (!this.discountForm) return;

        // Retrieve saved value on page load
        this.retrieveDiscountCode();
    }

    connectedCallback() {
        this.discountForm.addEventListener("submit", this.onSubmit.bind(this));
        const input = document.getElementById("discount-code");
        input.addEventListener("input", this.onInputType.bind(this));
    }

    onInputType(e) {
        const { target } = e;
        const button = this.querySelector("button");
        button.disabled = target.value.trim() === "";
    }

    onSubmit(e) {
        e.preventDefault();

        const discountInput = this.querySelector("#discount-code");
        const discountCode = discountInput?.value?.trim();

        if (!discountCode) return;
        const body = JSON.stringify({
            quantity: undefined, // will preserve current quantity
            discount: discountCode,
            sections: this.getSectionsToRender().map(
                (section) => section.section
            ),
            sections_url: window.location.pathname,
        });

        fetch(`${routes.cart_update_url}`, { ...fetchConfig(), ...{ body } })
            .then((res) => res.json())
            .then((cart) => {
                let codes = cart.discount_codes[0];
                if (!codes.applicable || cart.error) {
                    localStorage.setItem("discountCode", "");
                    const error_message = this.querySelector("#discount-error");
                    error_message?.classList.remove("hidden");
                    setTimeout(() => {
                        error_message?.classList.add("hidden");
                    }, 3500);
                    return;
                }

                //console.log('Discount code is applied:', cart);
                discountInput.value = discountCode;
                localStorage.setItem("discountCode", discountCode);

                this.updateSections?.(cart.sections);
                this.recallRevealAnimation?.();
            })
            .catch((err) => {
                console.error("Failed to apply discount:", err);
                this.recallRevealAnimation?.();
            });
    }

    retrieveDiscountCode() {
        const storedValue = localStorage.getItem("discountCode");
        if (!storedValue) return;

        const discountInput = this.querySelector("#discount-code");
        // discountInput.value = storedValue;
        discountInput.placeholder = storedValue;
    }

    recallRevealAnimation() {
        const revealSection = new Set([
            document.querySelector(".cart__container.reveal-slide-in"),
        ]);
        revealSection && revealAnimation(revealSection);
    }

    disconnectedCallback() {
        this.removeEventListener("input", this.onSubmit.bind(this));
    }
}

export { CartDiscountCode };
