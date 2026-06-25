import { priceFromYuan, sellingMarkupForYuan, toCharmPrice, DEFAULT_PRICING_CONFIG } from "@/lib/pricing";
import { totalShippingNgn } from "@/lib/product-shipping";

const yuan = 10_500;
const target = 2_579_999;

for (const rate of [207, 208, 210]) {
  for (const china of [0, 10, 30] as const) {
    for (const intl of [25_000, 40_000, 50_000] as const) {
      const config = { ...DEFAULT_PRICING_CONFIG, yuanToNaira: rate };
      const shipping = { chinaShippingYuan: china, internationalShippingNgn: intl };
      const cost = yuan * rate + totalShippingNgn(shipping, rate);
      const markup = sellingMarkupForYuan(yuan, config);
      const raw = Math.round(cost * markup);
      const final = priceFromYuan(yuan, config, shipping);
      if (final === target) {
        console.log("MATCH", { rate, china, intl, cost, markup, raw, final });
      }
    }
  }
}

const laptopShipping = { chinaShippingYuan: 30 as const, internationalShippingNgn: 50_000 as const };
const cost =
  yuan * DEFAULT_PRICING_CONFIG.yuanToNaira +
  totalShippingNgn(laptopShipping, DEFAULT_PRICING_CONFIG.yuanToNaira);
const markup = sellingMarkupForYuan(yuan, DEFAULT_PRICING_CONFIG);
const raw = Math.round(cost * markup);
const final = priceFromYuan(yuan, DEFAULT_PRICING_CONFIG, laptopShipping);

console.log("Expected laptop (30¥ + ₦50k, rate 207):", {
  cost,
  markup,
  raw,
  final,
  target,
  matchesAdmin: final === target,
});
