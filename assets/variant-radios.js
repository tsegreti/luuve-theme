const { VariantSelects } = await import(
    window?._importmap?.imports?.["variant-selects"] || "variant-selects"
);

class VariantRadios extends VariantSelects {}

export { VariantRadios };
